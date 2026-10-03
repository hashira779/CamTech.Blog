import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, JSON
from datetime import datetime, timezone
from app.common.database import Base

def gen_id():
    return uuid.uuid4().hex

def utc_now():
    return datetime.now(timezone.utc)

class StorageProvider(Base):
    __tablename__ = "storage_providers"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    provider_type = Column(String, nullable=False) # e.g., GOOGLE_DRIVE, LOCAL_S3
    status = Column(String, default="CONNECTED") # CONNECTED, ERROR, DISABLED
    is_default = Column(Boolean, default=False)
    configuration = Column(JSON, nullable=True) # e.g., folder_id, endpoint
    credentials = Column(JSON, nullable=True) # encrypted/raw secrets
    created_at = Column(DateTime, default=utc_now)

class StoragePolicy(Base):
    __tablename__ = "storage_policies"

    id = Column(String, primary_key=True, default=gen_id)
    entity_type = Column(String, nullable=False, unique=True) # e.g., ARTICLE, TOURISM, SYSTEM
    provider_id = Column(String, nullable=False) # Foreign key to StorageProvider
    created_at = Column(DateTime, default=utc_now)
