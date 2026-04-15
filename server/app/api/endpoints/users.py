from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta, datetime
import re
from ...database import get_db
from ... import models
from ...auth import verify_password, create_access_token, get_password_hash
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/creators/login")


def validate_password(password: str):
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Пароль не менее 6 символов")
    if not re.search(r'[a-zA-Zа-яА-Я]', password):
        raise HTTPException(status_code=400, detail="Пароль должен содержать хотя бы одну букву")


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Returns (user_or_none, creator_or_none) from token, raises 401 if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username:
            raise HTTPException(status_code=401, detail="Невалидный токен")
        if role == "user":
            user = db.query(models.User).filter(models.User.username == username).first()
            if not user or not user.is_active:
                raise HTTPException(status_code=401, detail="Пользователь не найден")
            return user, None
        elif role == "creator":
            creator = db.query(models.Creator).filter(models.Creator.username == username).first()
            if not creator or not creator.is_active:
                raise HTTPException(status_code=401, detail="Креатор не найден")
            return None, creator
        else:
            raise HTTPException(status_code=403, detail="Только пользователи и креаторы могут лайкать/комментировать")
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Returns User model, raises 401/403 otherwise."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username or role != "user":
            raise HTTPException(status_code=403, detail="Только обычные пользователи")
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен")



class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class CommentCreate(BaseModel):
    text: str


@router.post("/register")
async def register_user(data: UserRegister, db: Session = Depends(get_db)):
    if len(data.username) < 3:
        raise HTTPException(status_code=400, detail="Юзернейм минимум 3 символа")
    validate_password(data.password)

    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Юзернейм уже занят")
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    if db.query(models.Creator).filter(models.Creator.username == data.username).first():
        raise HTTPException(status_code=400, detail="Юзернейм уже занят")

    user = models.User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(
        data={"sub": user.username, "role": "user"},
        expires_delta=timedelta(hours=24)
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": "user",
    }


@router.get("/me")
async def get_user_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at,
    }


@router.get("/me/likes")
async def get_user_likes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    likes = db.query(models.Like).filter(models.Like.user_id == current_user.id).all()
    result = []
    for like in likes:
        frame = like.frame
        if frame and frame.is_published:
            result.append({
                "like_id": like.id,
                "frame_id": frame.id,
                "frame_title": frame.title,
                "liked_at": like.created_at,
            })
    return result


@router.post("/frames/{frame_id}/like")
async def toggle_like(
    frame_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    user, creator = await get_current_user_optional(token, db)

    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.is_published == True
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")

    if user:
        existing = db.query(models.Like).filter(
            models.Like.user_id == user.id,
            models.Like.frame_id == frame_id
        ).first()
    else:
        existing = db.query(models.Like).filter(
            models.Like.creator_id == creator.id,
            models.Like.frame_id == frame_id
        ).first()

    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        like = models.Like(
            user_id=user.id if user else None,
            creator_id=creator.id if creator else None,
            frame_id=frame_id,
        )
        db.add(like)
        db.commit()
        liked = True

    count = db.query(models.Like).filter(models.Like.frame_id == frame_id).count()
    return {"liked": liked, "likes_count": count}


@router.get("/frames/{frame_id}/likes")
async def get_likes(frame_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Like).filter(models.Like.frame_id == frame_id).count()
    return {"frame_id": frame_id, "likes_count": count}


@router.get("/frames/{frame_id}/my-like")
async def get_my_like(
    frame_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    try:
        user, creator = await get_current_user_optional(token, db)
    except HTTPException:
        return {"liked": False}

    if user:
        existing = db.query(models.Like).filter(
            models.Like.user_id == user.id,
            models.Like.frame_id == frame_id
        ).first()
    else:
        existing = db.query(models.Like).filter(
            models.Like.creator_id == creator.id,
            models.Like.frame_id == frame_id
        ).first()

    return {"liked": bool(existing)}


@router.get("/frames/{frame_id}/comments")
async def get_comments(frame_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(
        models.Comment.frame_id == frame_id
    ).order_by(models.Comment.created_at.asc()).all()

    result = []
    for c in comments:
        if c.user:
            author = c.user.username
            author_type = "user"
        elif c.creator:
            author = c.creator.username
            author_type = "creator"
        else:
            author = "unknown"
            author_type = "user"
        result.append({
            "id": c.id,
            "text": c.text,
            "author": author,
            "author_type": author_type,
            "created_at": c.created_at,
        })
    return result


@router.post("/frames/{frame_id}/comments")
async def add_comment(
    frame_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    user, creator = await get_current_user_optional(token, db)

    frame = db.query(models.Frame).filter(
        models.Frame.id == frame_id,
        models.Frame.is_published == True
    ).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Мудборд не найден")

    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Комментарий не может быть пустым")

    comment = models.Comment(
        user_id=user.id if user else None,
        creator_id=creator.id if creator else None,
        frame_id=frame_id,
        text=body.text.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "text": comment.text,
        "author": user.username if user else creator.username,
        "author_type": "user" if user else "creator",
        "created_at": comment.created_at,
    }


@router.delete("/frames/{frame_id}/comments/{comment_id}")
async def delete_comment(
    frame_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    user, creator = await get_current_user_optional(token, db)

    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.frame_id == frame_id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")

    # only owner can delete
    if user and comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав")
    if creator and comment.creator_id != creator.id:
        raise HTTPException(status_code=403, detail="Нет прав")

    db.delete(comment)
    db.commit()
    return {"message": "Удалено"}


# ── creator likes cabinet ─────────────────────────────────────────────────────

@router.get("/creator-likes")
async def get_creator_likes(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Endpoint for creator to see all their liked boards."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if role != "creator":
            raise HTTPException(status_code=403, detail="Только для креаторов")
        creator = db.query(models.Creator).filter(models.Creator.username == username).first()
        if not creator:
            raise HTTPException(status_code=404, detail="Не найден")
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный токен")

    likes = db.query(models.Like).filter(models.Like.creator_id == creator.id).all()
    result = []
    for like in likes:
        frame = like.frame
        if frame and frame.is_published:
            result.append({
                "like_id": like.id,
                "frame_id": frame.id,
                "frame_title": frame.title,
                "liked_at": like.created_at,
            })
    return result