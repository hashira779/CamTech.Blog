import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer
from app.common.database import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    event_type = Column(String(50), nullable=False, index=True)  # SSRF_ATTEMPT, RATE_LIMIT_EXCEEDED, AUTH_FAILURE, etc.
    severity = Column(String(20), default="WARNING", index=True) # INFO, WARNING, HIGH, CRITICAL
    source_ip = Column(String(50), nullable=False, index=True)
    country = Column(String(10), default="UNKNOWN")             # Approximate country code
    path = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    status = Column(Integer, default=400)
    user_agent = Column(String(300), nullable=True)
    request_id = Column(String(50), nullable=True, index=True)
    user_id = Column(String(36), nullable=True)
    rule_id = Column(String(50), nullable=True)
    action = Column(String(30), default="BLOCKED")              # OBSERVED, RATE_LIMITED, BLOCKED, ALLOWED, ESCALATED
    metadata_json = Column(Text, nullable=True)
