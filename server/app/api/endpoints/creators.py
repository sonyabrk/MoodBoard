from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from ...database import get_db
from ... import models

router = APIRouter()

# Модель для проверки юзернейма
class UsernameCheck(BaseModel):
    username: str

# Модель для создания заявки
class CreatorApplicationCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    portfolio_url: HttpUrl

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
    # Проверяем, не существует ли уже такой юзернейм
    existing = db.query(models.CreatorApplication).filter(
        models.CreatorApplication.username == application.username
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Такой юзернейм уже существует"
        )
    
    # Создаём новую заявку
    db_application = models.CreatorApplication(
        first_name=application.first_name,
        last_name=application.last_name,
        email=application.email,
        username=application.username,
        portfolio_url=str(application.portfolio_url)
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    return {
        "message": "Заявка успешно отправлена!",
        "application_id": db_application.id
    }