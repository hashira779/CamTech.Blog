import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class TravelGuide(Base):
    __tablename__ = "travel_guides"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("authors.id"), nullable=True)
    title = Column(String(200), nullable=False)
    title_km = Column(String(200), nullable=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    hero_image_url = Column(String(500), nullable=True)
    read_time_minutes = Column(String(20), default="6 min")
    status = Column(String(30), default="PUBLISHED", index=True)
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination")
    author = relationship("Author")

class Event(Base):
    __tablename__ = "travel_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    name_km = Column(String(200), nullable=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(String(50), default="FESTIVAL")  # FESTIVAL, CULTURAL, EXHIBITION, CONCERT, SPORTS
    venue = Column(String(200), nullable=True)
    start_date = Column(String(50), nullable=False)      # e.g. "2026-11-23" or "Late November"
    end_date = Column(String(50), nullable=True)
    hero_image_url = Column(String(500), nullable=True)
    status = Column(String(30), default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination")
