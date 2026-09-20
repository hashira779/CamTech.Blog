from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class DiscoveryBase(BaseModel):
    title: str
    title_km: Optional[str] = None
    hero_image_url: str
    hero_image_credit: Optional[str] = None
    hero_image_alt: Optional[str] = None
    category: str
    intro: str
    intro_km: Optional[str] = None
    main_explanation: str
    main_explanation_km: Optional[str] = None
    visual_sections: Optional[str] = "[]"
    important_facts: Optional[str] = "[]"
    timeline: Optional[str] = "[]"
    diagram_data: Optional[str] = "{}"
    interactive_type: Optional[str] = "step_breakdown"
    sources: Optional[str] = "[]"

class DiscoveryCreate(DiscoveryBase):
    slug: Optional[str] = None

class DiscoveryOut(DiscoveryBase):
    id: str
    slug: str
    views_count: int
    shares_count: int
    saves_count: int
    published_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class DiscoveryListResponse(BaseModel):
    items: List[DiscoveryOut]
    total: int
