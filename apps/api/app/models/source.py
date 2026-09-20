import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    country = Column(String(50), default="KH")  # KH, US, UK, JP, etc.
    language = Column(String(10), default="en")  # en, km
    website_url = Column(String(500), nullable=False)
    feed_url = Column(String(500), nullable=True)
    api_config = Column(Text, nullable=True)  # JSON config if licensed API
    category = Column(String(100), default="General News")
    is_active = Column(Boolean, default=True)
    trust_level = Column(String(50), default="VERIFIED_PUBLISHER")  # OFFICIAL, VERIFIED_PUBLISHER, WIRE_SERVICE, COMMUNITY
    license_notes = Column(Text, nullable=True)
    last_fetched_at = Column(DateTime, nullable=True)
    fetch_interval_mins = Column(Integer, default=60)
    priority = Column(Integer, default=1)  # 1 = normal, 10 = high
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    fetch_logs = relationship("SourceFetchLog", back_populates="source", cascade="all, delete-orphan")
    primary_articles = relationship("Article", back_populates="primary_source")

class SourceFetchLog(Base):
    __tablename__ = "source_fetch_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)  # SUCCESS, PARTIAL, FAILED
    items_found = Column(Integer, default=0)
    items_ingested = Column(Integer, default=0)
    duplicates_dropped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source = relationship("Source", back_populates="fetch_logs")
