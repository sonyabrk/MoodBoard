from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ...database import get_db
from ... import crud, schemas, models

router = APIRouter()

@router.get("/frames", response_model=list[schemas.FramePublic])
def get_frames(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Поиск по названию"),
    tag: Optional[str] = Query(None, description="Фильтр по тегу"),
    skip: int = 0,
    limit: int = 100
):
    """
    Получить список всех опубликованных мудбордов
    """
    frames = crud.get_frames(db, skip=skip, limit=limit, search=search, tag=tag)
    return frames

@router.get("/frames/{frame_id}", response_model=schemas.FramePublic)
def get_frame(frame_id: int, db: Session = Depends(get_db)):
    """
    Получить мудборд по ID
    """
    frame = crud.get_frame(db, frame_id)
    if not frame or not frame.is_published:
        raise HTTPException(status_code=404, detail="Frame not found")
    return frame

@router.get("/tags", response_model=list[schemas.Tag])
def get_tags(db: Session = Depends(get_db)):
    """
    Получить все теги
    """
    tags = db.query(models.Tag).all()
    return tags