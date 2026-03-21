from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Аутентификация 
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Админ 
class AdminBase(BaseModel):
    username: str
    email: EmailStr

class AdminCreate(AdminBase):
    password: str

class Admin(AdminBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# Теги 
class TagBase(BaseModel):
    name: str

class Tag(TagBase):
    id: int
    
    class Config:
        from_attributes = True

# Мудборды 
class FrameBase(BaseModel):
    title: str
    description: Optional[str] = None
    layout: str  # JSON string

class FrameCreate(FrameBase):
    tag_names: List[str] = []

class FrameUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[str] = None
    tag_names: Optional[List[str]] = None
    is_published: Optional[bool] = None

class Frame(FrameBase):
    id: int
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    admin_id: int
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

class FramePublic(FrameBase):
    id: int
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

class CreatorApplicationResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    username: str
    portfolio_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True