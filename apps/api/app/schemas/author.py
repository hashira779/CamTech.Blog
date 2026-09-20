from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuthorBase(BaseModel):
    name: str
    slug: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = "Staff Journalist"
    expertise: Optional[str] = None
    email: Optional[str] = None
    twitter_handle: Optional[str] = None
    linkedin_url: Optional[str] = None
    is_active: Optional[bool] = True

class AuthorCreate(AuthorBase):
    pass

class AuthorUpdate(AuthorBase):
    name: Optional[str] = None

class AuthorOut(AuthorBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
