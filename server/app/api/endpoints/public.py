from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from ...database import get_db
from ... import crud, schemas, models

router = APIRouter()

@router.get("/frames", response_model=list[schemas.FramePublic])
def get_frames(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Frame).filter(models.Frame.is_published == True)

    if search:
        s = f"%{search}%"
        query = query.outerjoin(models.Frame.tags).outerjoin(
            models.Creator, models.Frame.creator_id == models.Creator.id
        ).filter(
            or_(
                models.Frame.title.ilike(s),
                models.Frame.description.ilike(s),
                models.Tag.name.ilike(s),
                models.Creator.username.ilike(s),
                models.Creator.first_name.ilike(s),
                models.Creator.last_name.ilike(s),
            )
        ).distinct()
    elif tag:
        query = query.join(models.Frame.tags).filter(models.Tag.name == tag)

    return query.offset(skip).limit(limit).all()

@router.get("/frames/{frame_id}", response_model=schemas.FramePublic)
def get_frame(frame_id: int, db: Session = Depends(get_db)):
    frame = crud.get_frame(db, frame_id)
    if not frame or not frame.is_published:
        raise HTTPException(status_code=404, detail="Frame not found")
    return frame

@router.get("/tags", response_model=list[schemas.Tag])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(models.Tag).all()
    return tags

@router.get("/profiles/search")
def search_creators(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    s = f"%{q}%"
    creators = db.query(models.Creator).filter(
        models.Creator.is_active == True,
        or_(
            models.Creator.username.ilike(s),
            models.Creator.first_name.ilike(s),
            models.Creator.last_name.ilike(s),
        )
    ).limit(10).all()
    return [
        {
            "id": c.id,
            "username": c.username,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "portfolio_url": c.portfolio_url,
            "frames_count": db.query(models.Frame).filter(
                models.Frame.creator_id == c.id,
                models.Frame.is_published == True
            ).count()
        }
        for c in creators
    ]

@router.get("/profiles/{username}")
def get_creator_profile(username: str, db: Session = Depends(get_db)):
    creator = db.query(models.Creator).filter(
        models.Creator.username == username,
        models.Creator.is_active == True
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Креатор не найден")

    frames = db.query(models.Frame).filter(
        models.Frame.creator_id == creator.id,
        models.Frame.is_published == True
    ).order_by(models.Frame.created_at.desc()).all()

    return {
        "id": creator.id,
        "username": creator.username,
        "first_name": creator.first_name,
        "last_name": creator.last_name,
        "portfolio_url": creator.portfolio_url,
        "frames": [
            {
                "id": f.id,
                "title": f.title,
                "layout": f.layout,
                "tags": [{"id": t.id, "name": t.name} for t in f.tags]
            }
            for f in frames
        ]
    }