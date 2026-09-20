import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Float, ForeignKey
from app.common.database import Base

class Discovery(Base):
    __tablename__ = "discoveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    title_km = Column(String(255), nullable=True)
    hero_image_url = Column(String(500), nullable=False)
    hero_image_credit = Column(String(255), nullable=True)
    hero_image_alt = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False, index=True)  # Science, Tech, AI, Space, How Things Work, etc.
    
    # Section 3 content structure
    intro = Column(Text, nullable=False)
    intro_km = Column(Text, nullable=True)
    main_explanation = Column(Text, nullable=False)
    main_explanation_km = Column(Text, nullable=True)
    visual_sections = Column(Text, nullable=True)  # JSON array of {title, description, image_url, caption}
    important_facts = Column(Text, nullable=True)  # JSON array of key scientific/historical facts
    timeline = Column(Text, nullable=True)  # JSON array of chronological milestones
    diagram_data = Column(Text, nullable=True)  # JSON data for visual interactive diagram
    interactive_type = Column(String(100), default="step_breakdown")  # step_breakdown, comparison, simulator, interactive_diagram
    sources = Column(Text, nullable=True)  # JSON array of scientific/authoritative references

    views_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    saves_count = Column(Integer, default=0)
    trend_score = Column(Float, default=0.0)

    is_published = Column(Integer, default=1)  # 1 = published
    published_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
