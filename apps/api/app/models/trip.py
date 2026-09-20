import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    title_km = Column(String(200), nullable=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    description_km = Column(Text, nullable=True)
    duration_days = Column(Integer, default=3)
    travel_style = Column(String(50), default="CULTURAL")  # CULTURAL, RELAXED, ADVENTURE, LUXURY, FAMILY
    budget_level = Column(String(20), default="$$")
    hero_image_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    is_curated = Column(Boolean, default=True)
    user_id = Column(String(36), nullable=True)
    status = Column(String(30), default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination", back_populates="trips")
    days = relationship("TripDay", back_populates="trip", cascade="all, delete-orphan", order_by="TripDay.day_number")

class TripDay(Base):
    __tablename__ = "trip_days"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=True)

    trip = relationship("Trip", back_populates="days")
    items = relationship("TripDayItem", back_populates="trip_day", cascade="all, delete-orphan", order_by="TripDayItem.order_index")

class TripDayItem(Base):
    __tablename__ = "trip_day_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_day_id = Column(String(36), ForeignKey("trip_days.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(String(36), ForeignKey("places.id"), nullable=True)
    time_of_day = Column(String(30), default="MORNING")  # MORNING, AFTERNOON, EVENING, NIGHT
    start_time = Column(String(30), nullable=True)       # e.g., "05:00 AM"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=120)
    order_index = Column(Integer, default=0)

    trip_day = relationship("TripDay", back_populates="items")
    place = relationship("Place")
