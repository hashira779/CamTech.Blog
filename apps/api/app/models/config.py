import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer
from app.common.database import Base

class NavigationItem(Base):
    __tablename__ = "navigation_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    label = Column(String(100), nullable=False)
    label_key = Column(String(100), nullable=False)
    route = Column(String(200), nullable=False)
    icon = Column(String(50), nullable=True)
    parent_id = Column(String(36), nullable=True)
    position = Column(Integer, default=0)
    enabled = Column(Boolean, default=True)
    visibility = Column(String(50), default="PUBLIC")  # PUBLIC, AUTH, ADMIN
    language = Column(String(20), default="all")
    required_permission = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class HomepageSection(Base):
    __tablename__ = "homepage_sections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    section_type = Column(String(50), nullable=False)  # HERO, LATEST_NEWS, CAMBODIA, WORLD, DISCOVER, TRAVEL, POPULAR_PLACES, POPULAR_HOTELS, QUIZ, TOOLS, TRENDING
    title = Column(String(150), nullable=False)
    title_key = Column(String(100), nullable=True)
    position = Column(Integer, default=0)
    layout = Column(String(50), default="GRID")        # GRID, CAROUSEL, FEATURED_SPLIT, LIST
    query_config = Column(Text, default="{}")          # JSON parameters for dynamic query
    max_items = Column(Integer, default=6)
    enabled = Column(Boolean, default=True)
    device_visibility = Column(String(50), default="ALL")  # ALL, DESKTOP, MOBILE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=True)
    environment = Column(String(50), default="production")
    rollout_percentage = Column(Integer, default=100)
    conditions_json = Column(Text, default="{}")
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
