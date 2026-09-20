import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from app.common.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String(100), nullable=True, index=True)
    item_type = Column(String(50), nullable=False)  # ARTICLE, DISCOVERY, QUIZ, TOOL
    item_id = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_bookmark_user_item", "user_id", "item_type", "item_id"),
        Index("idx_bookmark_session_item", "session_id", "item_type", "item_id"),
    )
