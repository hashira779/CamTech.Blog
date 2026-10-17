import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.common.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class WeddingUser(Base):
    __tablename__ = "wedding_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cards = relationship("WeddingCard", back_populates="owner", cascade="all, delete-orphan")


class WeddingCard(Base):
    __tablename__ = "wedding_cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("wedding_users.id"), nullable=False, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    theme = Column(String(50), default="royal_khmer_gold")
    title = Column(String(255), default="សិរីសួស្តី អាពាហ៍ពិពាហ៍")

    # Groom
    groom_name = Column(String(100), default="ជា វិសាល")
    groom_title = Column(String(100), default="កូនប្រុសច្បង")
    groom_parents = Column(String(255), default="លោក ជា សុខុម & លោកស្រី គង់ ផល្លា")
    groom_image_url = Column(String(500), nullable=True)

    # Bride
    bride_name = Column(String(100), default="សុខ សុវណ្ណារី")
    bride_title = Column(String(100), default="កូនស្រីពៅ")
    bride_parents = Column(String(255), default="លោក សុខ ចន្ថា & លោកស្រី ម៉ៅ សុភ័ក្ត្រ")
    bride_image_url = Column(String(500), nullable=True)

    # Dates
    khmer_date = Column(String(255), default="ថ្ងៃអាទិត្យ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៩")
    solar_date = Column(String(50), default="2026-11-28")
    solar_time = Column(String(50), default="17:00")

    # Details
    morning_agenda = Column(Text, nullable=True)
    evening_reception = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    gallery_images = Column(Text, nullable=True)
    music_url = Column(String(500), nullable=True)

    # Gift / KHQR
    khqr_image_url = Column(String(500), nullable=True)
    khqr_account_name = Column(String(100), nullable=True)
    khqr_account_number = Column(String(100), nullable=True)

    # Settings
    enable_rsvp = Column(Boolean, default=True)
    enable_wishes = Column(Boolean, default=True)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("WeddingUser", back_populates="cards")
    wishes = relationship("WeddingWish", back_populates="card", cascade="all, delete-orphan", order_by="desc(WeddingWish.created_at)")


class WeddingWish(Base):
    __tablename__ = "wedding_wishes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    card_id = Column(String(36), ForeignKey("wedding_cards.id"), nullable=False, index=True)
    guest_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    attendance = Column(String(50), default="attending")
    guest_count = Column(Integer, default=1)
    blessing_message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    card = relationship("WeddingCard", back_populates="wishes")
