import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    local_name = Column(String(200), nullable=True)  # Khmer name
    slug = Column(String(200), unique=True, index=True, nullable=False)
    place_type = Column(String(50), nullable=False, index=True)  # ATTRACTION, ACCOMMODATION, RESTAURANT, CAFE, MARKET, TEMPLE, MUSEUM, WATERFALL, ACTIVITY, HIDDEN_GEM
    description = Column(Text, nullable=False)
    description_km = Column(Text, nullable=True)
    
    address = Column(String(300), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    email = Column(String(100), nullable=True)
    opening_hours = Column(String(200), nullable=True)  # e.g., "07:30 AM - 05:30 PM daily"
    price_level = Column(String(10), default="$$")       # $, $$, $$$, $$$$, or FREE
    
    hero_image_url = Column(String(500), nullable=True)
    gallery_json = Column(Text, default="[]")           # JSON array of image URLs
    amenities_json = Column(Text, default="[]")         # JSON array of tags/amenities
    tags_json = Column(Text, default="[]")              # JSON array e.g. ["UNESCO", "Family Friendly", "Photography"]
    
    verification_status = Column(String(30), default="VERIFIED")  # VERIFIED, UNVERIFIED, NEEDS_REVIEW, OUTDATED
    last_verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(30), default="ACTIVE", index=True)     # ACTIVE, CLOSED, TEMPORARILY_CLOSED, ARCHIVED, MERGED
    merged_into_id = Column(String(36), nullable=True)
    
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    destination = relationship("Destination", back_populates="places")
    accommodation = relationship("Accommodation", back_populates="place", uselist=False, cascade="all, delete-orphan")
    revisions = relationship("PlaceRevision", back_populates="place", cascade="all, delete-orphan")

class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    place_id = Column(String(36), ForeignKey("places.id", ondelete="CASCADE"), unique=True, nullable=False)
    property_type = Column(String(50), default="HOTEL")  # HOTEL, RESORT, GUESTHOUSE, HOSTEL, VILLA
    star_rating = Column(Integer, default=4)
    price_range = Column(String(100), default="$45 - $120 / night")
    check_in_time = Column(String(50), default="02:00 PM")
    check_out_time = Column(String(50), default="12:00 PM")
    room_types_json = Column(Text, default="[]")
    has_swimming_pool = Column(Boolean, default=True)
    has_free_wifi = Column(Boolean, default=True)
    has_breakfast = Column(Boolean, default=True)
    booking_url = Column(String(500), nullable=True)
    
    place = relationship("Place", back_populates="accommodation")

class PlaceRevision(Base):
    __tablename__ = "place_revisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    place_id = Column(String(36), ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    revision_num = Column(Integer, default=1)
    proposed_by = Column(String(100), default="Editor")
    changes_summary = Column(String(300), nullable=True)
    previous_data_json = Column(Text, nullable=True)
    new_data_json = Column(Text, nullable=False)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    place = relationship("Place", back_populates="revisions")

class PlaceSuggestion(Base):
    __tablename__ = "place_suggestions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    suggestion_type = Column(String(50), nullable=False)  # NEW_PLACE, UPDATE_INFO, REPORT_CLOSED, INACCURACY
    place_id = Column(String(36), nullable=True)          # Set if updating an existing place
    place_name = Column(String(200), nullable=False)
    destination_slug = Column(String(150), nullable=False)
    place_type = Column(String(50), default="ATTRACTION")
    details = Column(Text, nullable=False)
    submitter_name = Column(String(100), nullable=True)
    submitter_contact = Column(String(150), nullable=True)
    source_notes = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED
    moderation_notes = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
