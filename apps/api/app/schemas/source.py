from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, HttpUrl

class SourceBase(BaseModel):
    name: str
    country: Optional[str] = "KH"
    language: Optional[str] = "en"
    website_url: str
    feed_url: Optional[str] = None
    category: Optional[str] = "General News"
    is_active: Optional[bool] = True
    trust_level: Optional[str] = "VERIFIED_PUBLISHER"
    license_notes: Optional[str] = None
    fetch_interval_mins: Optional[int] = 60
    priority: Optional[int] = 1

class SourceCreate(SourceBase):
    slug: Optional[str] = None

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    website_url: Optional[str] = None
    feed_url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    trust_level: Optional[str] = None
    license_notes: Optional[str] = None
    fetch_interval_mins: Optional[int] = None
    priority: Optional[int] = None

class SourceOut(SourceBase):
    id: str
    slug: str
    last_fetched_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class IngestionResultOut(BaseModel):
    source_id: str
    source_name: str
    status: str
    items_found: int
    items_ingested: int
    duplicates_dropped: int
    duration_ms: int
    error_message: Optional[str] = None
