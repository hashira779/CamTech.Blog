import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, Text
from app.common.database import Base


class FeedbackReport(Base):
    __tablename__ = "feedback_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String(40), nullable=False, default="other", index=True)
    name = Column(String(100), nullable=True)
    reply_email = Column(String(150), nullable=True)
    page_path = Column(String(200), nullable=False, default="/")
    message = Column(Text, nullable=False)
    ip_address = Column(String(64), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="NEW", index=True)  # NEW, REVIEWED, RESOLVED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
