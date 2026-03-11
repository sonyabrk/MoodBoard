from fastapi import APIRouter, Depends, HTTPException, status, Form, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
from ...database import get_db
from ... import models
from ...auth import verify_password, create_access_token, get_password_hash
from ... import schemas

router = APIRouter()

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


@router.post("/check-username")
async def check_username(
    data: UsernameCheck,
    db: Session = Depends(get_db)
):
    existing = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.username == data.username
    ).first()
    
    if existing:
        return {"available": False, "message": "Этот юзернейм уже занят"}
    
    if len(data.username) < 3:
        return {"available": False, "message": "Минимум 3 символа"}
    
    return {"available": True, "message": "Юзернейм доступен"}

@router.post("/applications")
async def create_application(
    application: CreatorApplicationCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.username == application.username
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Такой юзернейм уже существует"
        )
    
    # Генерация токена активации при создании заявки
    activation_token = secrets.token_urlsafe(32)
    token_expires_at = datetime.utcnow() + timedelta(days=7)
    
    db_application = models.CreatorApplication(
        first_name=application.first_name,
        last_name=application.last_name,
        email=application.email,
        username=application.username,
        portfolio_url=str(application.portfolio_url),
        activation_token=activation_token,
        token_expires_at=token_expires_at
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    return {
        "message": "Заявка успешно отправлена! Ожидайте одобрения администратора.",
        "application_id": db_application.id
    }

@router.post("/set-password")
async def set_password(
    request: SetPasswordRequest,
    db: Session = Depends(get_db)
):
    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Пароль должен быть не менее 6 символов"
        )
    
    application = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.activation_token == request.token
    ).first()
    
    if not application:
        raise HTTPException(404, "Неверная ссылка активации")
    
    if application.token_expires_at < datetime.utcnow():
        raise HTTPException(400, "Срок действия ссылки истёк")
    
    if application.password_set:
        raise HTTPException(400, "Пароль уже установлен")
    
    hashed_password = get_password_hash(request.password)
    
    creator = models.Creator(
        username=application.username,
        email=application.email,
        password_hash=hashed_password,
        first_name=application.first_name,
        last_name=application.last_name,
        portfolio_url=application.portfolio_url,
        is_active=True
    )
    
    db.add(creator)
    application.password_set = True
    db.commit()
    
    return {
        "message": "Пароль успешно установлен! Теперь вы можете войти в систему.",
        "username": application.username
    }

@router.post("/login")
async def unified_login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Единый вход для админов и креаторов
    Проверяет сначала в таблице админов, затем в таблице креаторов
    """
    admin = db.query(models.Admin).filter(models.Admin.username == username).first()
    if admin and verify_password(password, admin.password_hash):
        access_token = create_access_token(
            data={"sub": admin.username, "role": "admin"},
            expires_delta=timedelta(hours=24)
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": admin.username,
            "role": "admin",
            "message": "Добро пожаловать, админ!"
        }
    
    creator = db.query(models.Creator).filter(models.Creator.username == username).first()
    if creator and verify_password(password, creator.password_hash):
        access_token = create_access_token(
            data={"sub": creator.username, "role": "creator"},
            expires_delta=timedelta(hours=24)
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "username": creator.username,
            "role": "creator",
            "first_name": creator.first_name,
            "message": f"Добро пожаловать, {creator.first_name}!"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверный логин или пароль"
    )