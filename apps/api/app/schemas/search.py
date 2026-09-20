from typing import Optional, List
from pydantic import BaseModel

class SearchResultItem(BaseModel):
    id: str
    type: str  # ARTICLE, DISCOVERY, QUIZ, TOOL
    title: str
    title_km: Optional[str] = None
    summary: str
    slug: str
    url: str
    category: Optional[str] = None
    country: Optional[str] = None
    image_url: Optional[str] = None
    published_at: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]
