from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# связь многие-ко-многим для тегов
frame_tag = Table(
    'frame_tag', Base.metadata,
    Column('frame_id', Integer, ForeignKey('frames.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    frames = relationship("Frame", back_populates="admin", cascade="all, delete-orphan")

class Frame(Base):
    __tablename__ = "frames"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    layout = Column(String)  # JSON string
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    admin_id = Column(Integer, ForeignKey('admins.id'))
    
    admin = relationship("Admin", back_populates="frames")
    tags = relationship("Tag", secondary=frame_tag, back_populates="frames")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    frames = relationship("Frame", secondary=frame_tag, back_populates="tags")

class CreatorApplication(Base):
    __tablename__ = "creator_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    username = Column(String, unique=True, index=True)
    portfolio_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="pending")