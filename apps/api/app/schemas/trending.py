from typing import Optional, List
from pydantic import BaseModel

class TrendingItem(BaseModel):
    id: str
    type: str  # ARTICLE, DISCOVERY
    title: str
    title_km: Optional[str] = None
    slug: str
    url: str
    category: str
    country: Optional[str] = None
    hero_image_url: Optional[str] = None
    trend_score: float
    views_count: int
    published_at: Optional[str] = None

class TrendingResponse(BaseModel):
    cambodia: List[TrendingItem]
    world: List[TrendingItem]
    editor_picks: List[TrendingItem]
