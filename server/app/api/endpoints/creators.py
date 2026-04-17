from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional
from datetime import datetime, timedelta
import secrets, os, uuid, shutil, json
import logging
from ...database import get_db
from ... import models
from ...auth import verify_password, create_access_token, get_password_hash, get_current_creator

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UsernameCheck(BaseModel):
    username: str

class CreatorApplicationCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    portfolio_url: HttpUrl

class SetPasswordRequest(BaseModel):
    token: str
    password: str

class CreatorProfile(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    portfolio_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/check-username")
async def check_username(data: UsernameCheck, db: Session = Depends(get_db)):
    existing = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.username == data.username
    ).first()
    if existing:
        return {"available": False, "message": "Этот юзернейм уже занят"}
    if len(data.username) < 3:
        return {"available": False, "message": "Минимум 3 символа"}
    return {"available": True, "message": "Юзернейм доступен"}

@router.post("/applications")
async def create_application(application: CreatorApplicationCreate, db: Session = Depends(get_db)):
    existing = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.username == application.username
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Такой юзернейм уже существует")
    activation_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    db_app = models.CreatorApplication(
        first_name=application.first_name,
        last_name=application.last_name,
        email=application.email,
        username=application.username,
        portfolio_url=str(application.portfolio_url),
        activation_token=activation_token,
        token_expires_at=token_expires_at
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return {"message": "Заявка отправлена! Ожидайте одобрения.", "application_id": db_app.id}

@router.post("/set-password")
async def set_password(request: SetPasswordRequest, db: Session = Depends(get_db)):
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль не менее 6 символов")
    application = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.activation_token == request.token
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Неверная ссылка активации")
    if application.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Срок действия ссылки истёк")
    if application.password_set:
        raise HTTPException(status_code=400, detail="Пароль уже установлен")
    creator = models.Creator(
        username=application.username,
        email=application.email,
        password_hash=get_password_hash(request.password),
        first_name=application.first_name,
        last_name=application.last_name,
        portfolio_url=application.portfolio_url,
        is_active=True
    )
    db.add(creator)
    application.password_set = True
    db.commit()
    return {"message": "Пароль установлен!", "username": application.username}

@router.post("/login")
async def unified_login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == username).first()
    if admin and verify_password(password, admin.password_hash):
        token = create_access_token(data={"sub": admin.username, "role": "admin"}, expires_delta=timedelta(hours=24))
        return {"access_token": token, "token_type": "bearer", "username": admin.username, "role": "admin"}
    creator = db.query(models.Creator).filter(models.Creator.username == username).first()
    if creator and verify_password(password, creator.password_hash):
        token = create_access_token(data={"sub": creator.username, "role": "creator"}, expires_delta=timedelta(hours=24))
        return {"access_token": token, "token_type": "bearer", "username": creator.username, "role": "creator", "first_name": creator.first_name}
    raise HTTPException(status_code=401, detail="Неверный логин или пароль")

@router.get("/boards/{frame_id}")
async def get_board_public(frame_id: int, db: Session = Depends(get_db)):
    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.is_published == True
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")
    creator = None
    if frame.creator_id:
        c = db.query(models.Creator).filter(models.Creator.id == frame.creator_id).first()
        if c:
            creator = {"username": c.username, "first_name": c.first_name, "last_name": c.last_name}
    return {
        "id": frame.id,
        "title": frame.title,
        "description": frame.description,
        "layout": frame.layout,
        "tags": [{"id": t.id, "name": t.name} for t in frame.tags],
        "creator": creator,
        "created_at": frame.created_at,
        "mood_x": frame.mood_x,
        "mood_y": frame.mood_y,
    }

@router.get("/me", response_model=CreatorProfile)
async def get_me(current_creator: models.Creator = Depends(get_current_creator)):
    return current_creator

@router.post("/me/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_creator: models.Creator = Depends(get_current_creator)
):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Только изображения jpg/png/webp/gif")
    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"http://localhost:8000/uploads/{filename}"}


@router.get("/me/frames")
async def get_my_frames(db: Session = Depends(get_db), current_creator: models.Creator = Depends(get_current_creator)):
    try:
        frames = db.query(models.Frame).filter(
            models.Frame.creator_id == current_creator.id
        ).order_by(models.Frame.created_at.desc()).all()
        result = []
        for f in frames:
            result.append({
                "id": f.id,
                "title": f.title,
                "description": f.description,
                "is_published": f.is_published,
                "layout": f.layout,
                "created_at": f.created_at,
                "mood_x": f.mood_x,
                "mood_y": f.mood_y,
                "tags": [{"id": t.id, "name": t.name} for t in f.tags]
            })
        return result
    except Exception as e:
        logging.exception("Error in /me/frames")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/me/frames")
async def create_my_frame(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    layout: str = Form('{"items":[], "description": " "}'),
    tag_names: Optional[str] = Form(None),
    is_published: bool = Form(False),
    mood_x: Optional[float] = Form(None),
    mood_y: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(get_current_creator)
):
    tag_list = json.loads(tag_names) if tag_names else []
    frame = models.Frame(
        title=title,
        description=description,
        layout=layout,
        is_published=is_published,
        creator_id=current_creator.id,
        mood_x=mood_x,
        mood_y=mood_y,
    )
    db.add(frame)
    db.flush()
    for tag_name in tag_list:
        tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
        if not tag:
            tag = models.Tag(name=tag_name)
            db.add(tag)
            db.flush()
        frame.tags.append(tag)
    db.commit()
    db.refresh(frame)
    return {"id": frame.id, "title": frame.title, "message": "Мудборд создан"}

@router.put("/me/frames/{frame_id}")
async def update_my_frame(
    frame_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    layout: Optional[str] = Form(None),
    tag_names: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    mood_x: Optional[float] = Form(None),
    mood_y: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_creator: models.Creator = Depends(get_current_creator)
):
    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.creator_id == current_creator.id
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")
    if title is not None: frame.title = title
    if description is not None: frame.description = description
    if layout is not None: frame.layout = layout
    if is_published is not None: frame.is_published = is_published
    if mood_x is not None: frame.mood_x = mood_x
    if mood_y is not None: frame.mood_y = mood_y
    if tag_names is not None:
        tag_list = json.loads(tag_names)
        frame.tags = []
        for tag_name in tag_list:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
                db.flush()
            frame.tags.append(tag)
    db.commit()
    db.refresh(frame)
    return {"id": frame.id, "title": frame.title, "is_published": frame.is_published, "mood_x": frame.mood_x, "mood_y": frame.mood_y, "message": "Сохранено"}

@router.delete("/me/frames/{frame_id}")
async def delete_my_frame(frame_id: int, db: Session = Depends(get_db), current_creator: models.Creator = Depends(get_current_creator)):
    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.creator_id == current_creator.id
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")
    db.delete(frame)
    db.commit()
    return {"message": "Мудборд удалён"}

@router.patch("/me/frames/{frame_id}/toggle")
async def toggle_publish(frame_id: int, db: Session = Depends(get_db), current_creator: models.Creator = Depends(get_current_creator)):
    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.creator_id == current_creator.id
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")
    frame.is_published = not frame.is_published
    db.commit()
    return {"id": frame.id, "is_published": frame.is_published}