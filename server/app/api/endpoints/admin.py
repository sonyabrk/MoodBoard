from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
from ...database import get_db
from ... import crud, schemas, models
from ...auth import get_current_admin, authenticate_admin  
import shutil
from datetime import datetime, timedelta
import secrets

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/login", response_model=schemas.Token)
def login(
    admin: schemas.AdminLogin,
    db: Session = Depends(get_db)
):
    """
    Вход в систему для админа
    """
    db_admin = authenticate_admin(db, admin.username, admin.password)
    if not db_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    from ...auth import create_access_token
    access_token = create_access_token(
        data={"sub": db_admin.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/frames", response_model=schemas.Frame)
async def create_frame(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    layout: str = Form(...),
    tag_names: Optional[str] = Form(None),
    is_published: bool = Form(True),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Создать новый мудборд
    """
    layout_data = layout
    tag_list = json.loads(tag_names) if tag_names else []
    
    frame_data = schemas.FrameCreate(
        title=title,
        description=description,
        layout=layout_data,
        tag_names=tag_list
    )
    
    return crud.create_frame(db, frame_data, current_admin.id)

@router.get("/frames", response_model=list[schemas.Frame])
def get_my_frames(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Получить все мудборды текущего админа
    """
    return crud.get_admin_frames(db, current_admin.id, skip=skip, limit=limit)

@router.get("/frames/{frame_id}", response_model=schemas.Frame)
def get_my_frame(
    frame_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Получить мудборд по ID (только свои)
    """
    frame = crud.get_frame(db, frame_id)
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")
    if frame.admin_id != current_admin.id:
        raise HTTPException(status_code=403, detail="Not your frame")
    return frame

@router.put("/frames/{frame_id}", response_model=schemas.Frame)
async def update_frame(
    frame_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    layout: Optional[str] = Form(None),
    tag_names: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Обновить мудборд
    """
    frame = crud.get_frame(db, frame_id)
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")
    if frame.admin_id != current_admin.id:
        raise HTTPException(status_code=403, detail="Not your frame")
    
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if layout is not None:
        update_data["layout"] = layout
    if tag_names is not None:
        update_data["tag_names"] = json.loads(tag_names)
    if is_published is not None:
        update_data["is_published"] = is_published
    
    frame_update = schemas.FrameUpdate(**update_data)
    return crud.update_frame(db, frame_id, frame_update)

@router.delete("/frames/{frame_id}")
def delete_frame(
    frame_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Удалить мудборд
    """
    frame = crud.get_frame(db, frame_id)
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")
    if frame.admin_id != current_admin.id:
        raise HTTPException(status_code=403, detail="Not your frame")
    
    crud.delete_frame(db, frame_id)
    return {"message": "Frame deleted successfully"}

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Загрузить изображение
    """
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/uploads/{filename}"}

@router.get("/creators/applications", response_model=List[schemas.CreatorApplicationResponse])
async def get_creator_applications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Получить список заявок креаторов (только для админа)
    """
    query = db.query(models.CreatorApplication)
    
    if status_filter:
        query = query.filter(models.CreatorApplication.status == status_filter)
    
    applications = query.order_by(models.CreatorApplication.created_at.desc()).all()
    return applications

@router.post("/creators/applications/{application_id}/approve")
async def approve_creator_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Одобрить заявку креатора и сгенерировать ссылку активации
    """
    application = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    if application.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка уже одобрена"
        )
    
    activation_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    
    application.status = "approved"
    application.activation_token = activation_token
    application.token_expires_at = token_expires_at
    
    db.commit()
    
    activation_link = f"http://localhost:5173/set-password?token={activation_token}"
    
    return {
        "message": "Заявка одобрена",
        "activation_link": activation_link,
        "email": application.email,
        "username": application.username
    }

@router.post("/creators/applications/{application_id}/reject")
async def reject_creator_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(get_current_admin)
):
    """
    Отклонить заявку креатора
    """
    application = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    application.status = "rejected"
    db.commit()
    
    return {"message": "Заявка отклонена", "application_id": application_id}