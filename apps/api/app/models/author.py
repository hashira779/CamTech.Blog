import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.common.database import Base

class Author(Base):
    __tablename__ = "authors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String(100), default="Staff Journalist")
    expertise = Column(String(255), nullable=True)  # e.g., Technology & AI, Southeast Asian Economy
    email = Column(String(255), nullable=True)
    twitter_handle = Column(String(100), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    articles = relationship("Article", back_populates="author")
