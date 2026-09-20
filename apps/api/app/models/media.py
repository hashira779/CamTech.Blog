import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from app.common.database import Base

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    alt_text = Column(String(255), nullable=True)

    # Rights Metadata (Section 36)
    source_url = Column(String(500), nullable=True)
    source_name = Column(String(150), nullable=True)
    creator = Column(String(150), nullable=True)
    license = Column(String(100), default="CC_BY_SA")  # OWNED, LICENSED, PUBLIC_DOMAIN, CC_LICENSE, EMBED_PERMITTED, PENDING_REVIEW, REJECTED
    credit_required = Column(Boolean, default=True)
    credit_text = Column(String(255), nullable=True)
    commercial_use_allowed = Column(Boolean, default=True)
    reviewed_by = Column(String(150), nullable=True)
    review_status = Column(String(50), default="APPROVED")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
