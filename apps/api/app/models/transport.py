import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class TransportOperator(Base):
    __tablename__ = "transport_operators"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    local_name = Column(String(150), nullable=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    operator_type = Column(String(50), default="BUS", index=True)  # BUS, MINIVAN, TRAIN, FERRY, TAXI, AIRPORT_TRANSFER
    description = Column(Text, nullable=False)
    description_km = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    phone = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    country_code = Column(String(10), default="KH")
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=0)
    amenities_json = Column(Text, default="[]")  # e.g. ["Wi-Fi", "Air Conditioning", "Power Outlets", "Reclining Seats"]
    status = Column(String(30), default="ACTIVE", index=True)  # ACTIVE, SUSPENDED, ARCHIVED
    verification_status = Column(String(30), default="VERIFIED")  # VERIFIED, UNVERIFIED, NEEDS_REVIEW, OUTDATED
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    routes = relationship("TransportRoute", back_populates="operator", cascade="all, delete-orphan")

class TransportHub(Base):
    __tablename__ = "transport_hubs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    local_name = Column(String(200), nullable=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    hub_type = Column(String(50), default="BUS_STATION", index=True)  # BUS_STATION, MINIVAN_STATION, TRAIN_STATION, FERRY_PORT, AIRPORT, TAXI_STAND
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(300), nullable=True)
    phone = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)
    facilities_json = Column(Text, default="[]")  # e.g. ["Waiting Lounge", "Ticketing Counter", "Restrooms", "Luggage Storage", "ATM"]
    status = Column(String(30), default="ACTIVE")
    verification_status = Column(String(30), default="VERIFIED")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination")

class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operator_id = Column(String(36), ForeignKey("transport_operators.id"), nullable=False, index=True)
    origin_destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    origin_hub_id = Column(String(36), ForeignKey("transport_hubs.id"), nullable=True)
    destination_hub_id = Column(String(36), ForeignKey("transport_hubs.id"), nullable=True)
    name = Column(String(250), nullable=False)
    slug = Column(String(250), unique=True, index=True, nullable=False)
    transport_type = Column(String(50), default="BUS")  # BUS, MINIVAN, TRAIN, FERRY, TAXI
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=360)     # e.g. 360 mins (6h)
    distance_km = Column(Float, default=314.0)          # e.g. 314 km
    base_price_usd = Column(Float, default=15.0)
    status = Column(String(30), default="ACTIVE", index=True)  # ACTIVE, SUSPENDED, CANCELLED, ARCHIVED
    verification_status = Column(String(30), default="VERIFIED")
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    operator = relationship("TransportOperator", back_populates="routes")
    origin_destination = relationship("Destination", foreign_keys=[origin_destination_id])
    target_destination = relationship("Destination", foreign_keys=[destination_id])
    origin_hub = relationship("TransportHub", foreign_keys=[origin_hub_id])
    destination_hub = relationship("TransportHub", foreign_keys=[destination_hub_id])
    schedules = relationship("TransportSchedule", back_populates="route", cascade="all, delete-orphan")
    stops = relationship("TransportStop", back_populates="route", cascade="all, delete-orphan", order_by="TransportStop.stop_order")

class TransportStop(Base):
    __tablename__ = "transport_stops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_id = Column(String(36), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    hub_id = Column(String(36), ForeignKey("transport_hubs.id"), nullable=True)
    stop_name = Column(String(150), nullable=False)
    stop_order = Column(Integer, default=1)
    arrival_offset_minutes = Column(Integer, default=0)
    departure_offset_minutes = Column(Integer, default=15)

    route = relationship("TransportRoute", back_populates="stops")
    hub = relationship("TransportHub")

class TransportSchedule(Base):
    __tablename__ = "transport_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    route_id = Column(String(36), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    departure_time = Column(String(20), nullable=False)  # e.g. "08:30 AM" or "22:30 PM"
    arrival_time = Column(String(20), nullable=False)    # e.g. "02:30 PM" or "05:00 AM"
    days_of_week = Column(String(100), default="DAILY") # "DAILY", "MON,WED,FRI", etc.
    price_usd = Column(Float, default=15.0)
    currency = Column(String(10), default="USD")
    vehicle_class = Column(String(50), default="Luxury VIP Sleeper")  # e.g. "Standard AC", "VIP Minivan", "Luxury Night Sleeper"
    service_calendar_type = Column(String(30), default="NORMAL")     # NORMAL, HOLIDAY, SPECIAL, SUSPENDED
    status = Column(String(30), default="ACTIVE")
    source = Column(String(150), default="Official Operator Schedule")
    booking_url = Column(String(500), nullable=True)
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    route = relationship("TransportRoute", back_populates="schedules")
