import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean
from app.common.database import Base

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(50), nullable=False, index=True)  # PAGE_VIEW, READING_TIME, TOOL_USE, QUIZ_START, QUIZ_COMPLETE, SHARE, SAVE
    entity_type = Column(String(50), nullable=True)  # ARTICLE, DISCOVERY, QUIZ, TOOL
    entity_id = Column(String(100), nullable=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    country = Column(String(10), nullable=True)
    user_agent = Column(String(255), nullable=True)
    referrer = Column(String(500), nullable=True)
    reading_seconds = Column(Integer, default=0)
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class TrendingScore(Base):
    __tablename__ = "trending_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)  # ARTICLE, DISCOVERY
    entity_id = Column(String(100), nullable=False, index=True)
    country_scope = Column(String(50), default="ALL")  # KH, WORLD, ALL
    views_recent = Column(Integer, default=0)
    shares_recent = Column(Integer, default=0)
    saves_recent = Column(Integer, default=0)
    score = Column(Float, default=0.0, index=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
