import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from app.common.database import Base

class Tool(Base):
    __tablename__ = "tools"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    name_km = Column(String(150), nullable=True)
    category = Column(String(50), nullable=False, index=True)  # CALCULATOR, DEVELOPER, IMAGE, TEXT
    description = Column(Text, nullable=False)
    description_km = Column(Text, nullable=True)
    icon = Column(String(50), default="Calculator")  # Lucide icon name
    is_active = Column(Boolean, default=True)
    is_popular = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    version = Column(String(20), default="1.0.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
