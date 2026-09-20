import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class Country(Base):
    __tablename__ = "countries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(10), unique=True, nullable=False, index=True)  # KH, TH, VN, US, etc.
    name = Column(String(100), nullable=False)
    name_km = Column(String(100), nullable=True)
    currency_code = Column(String(10), default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destinations = relationship("Destination", back_populates="country")

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False)
    name = Column(String(150), nullable=False)
    name_km = Column(String(150), nullable=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    overview = Column(Text, nullable=False)
    overview_km = Column(Text, nullable=True)
    hero_image_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    best_time_to_visit = Column(String(200), nullable=True)
    practical_info = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False)
    views_count = Column(Float, default=0)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, ARCHIVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    country = relationship("Country", back_populates="destinations")
    places = relationship("Place", back_populates="destination")
    trips = relationship("Trip", back_populates="destination")
