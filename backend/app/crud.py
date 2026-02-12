from sqlalchemy.orm import Session
from app import models, schemas
from typing import List, Optional

# Админы 
def get_admin_by_username(db: Session, username: str):
    return db.query(models.Admin).filter(models.Admin.username == username).first()

def get_admin_by_id(db: Session, admin_id: int):
    return db.query(models.Admin).filter(models.Admin.id == admin_id).first()

def create_admin(db: Session, admin: schemas.AdminCreate):
    from .auth import get_password_hash
    
    db_admin = models.Admin(
        username=admin.username,
        email=admin.email,
        password_hash=get_password_hash(admin.password)
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# Теги 
def get_or_create_tag(db: Session, tag_name: str):
    tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
    if not tag:
        tag = models.Tag(name=tag_name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag

def get_tags_by_names(db: Session, tag_names: List[str]):
    return [get_or_create_tag(db, name) for name in tag_names]

# Мудборды 
def get_frames(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    is_published: bool = True
):
    query = db.query(models.Frame).filter(models.Frame.is_published == is_published)
    
    if search:
        query = query.filter(models.Frame.title.contains(search))
    
    if tag:
        query = query.join(models.Frame.tags).filter(models.Tag.name == tag)
    
    return query.offset(skip).limit(limit).all()

def get_frame(db: Session, frame_id: int):
    return db.query(models.Frame).filter(models.Frame.id == frame_id).first()

def create_frame(db: Session, frame: schemas.FrameCreate, admin_id: int):
    db_frame = models.Frame(
        title=frame.title,
        description=frame.description,
        layout=frame.layout,
        admin_id=admin_id
    )
    db.add(db_frame)
    db.commit()
    db.refresh(db_frame)
    
    # Добавление тегов
    if frame.tag_names:
        tags = get_tags_by_names(db, frame.tag_names)
        db_frame.tags = tags
        db.commit()
    
    return db_frame

def update_frame(db: Session, frame_id: int, frame_update: schemas.FrameUpdate):
    db_frame = get_frame(db, frame_id)
    if not db_frame:
        return None
    
    update_data = frame_update.dict(exclude_unset=True)
    
    if "title" in update_data:
        db_frame.title = update_data["title"]
    if "description" in update_data:
        db_frame.description = update_data["description"]
    if "layout" in update_data:
        db_frame.layout = update_data["layout"]
    if "is_published" in update_data:
        db_frame.is_published = update_data["is_published"]

    # Обновление тегов
    if "tag_names" in update_data and update_data["tag_names"] is not None:
        tags = get_tags_by_names(db, update_data["tag_names"])
        db_frame.tags = tags
    
    db.commit()
    db.refresh(db_frame)
    return db_frame

def delete_frame(db: Session, frame_id: int):
    db_frame = get_frame(db, frame_id)
    if db_frame:
        db.delete(db_frame)
        db.commit()
    return db_frame

def get_admin_frames(db: Session, admin_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Frame).filter(models.Frame.admin_id == admin_id).offset(skip).limit(limit).all()