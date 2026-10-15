from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field, field_validator

from app.services.filing import STOCK_IMAGE_HOSTS

class ArticleSourceBase(BaseModel):
    source_name: str
    source_url: str
    attribution_quote: Optional[str] = None
    coverage_type: Optional[str] = "REPORTING"

class ArticleSourceOut(ArticleSourceBase):
    id: str
    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Nested references for public read responses.
#
# ArticleOut used to expose only category_id / author_id / primary_source_id,
# so every public page received nulls where a byline, a category label and a
# publisher name should be, and the frontend fell back to slug-ish placeholders
# or blank bylines. These refs carry only the fields the reader UI renders —
# email, twitter_handle, feed_url and license internals stay admin-only.
# ---------------------------------------------------------------------------

class ArticleAuthorRef(BaseModel):
    id: str
    name: str
    slug: str
    role: Optional[str] = None
    expertise: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("avatar_url", mode="before")
    @classmethod
    def _never_ship_a_stock_face(cls, value):
        """A library portrait cannot stand in for a named person's face.

        Three of the four author rows carry an Unsplash headshot seeded with them. Serving
        those would put a stranger's photograph next to a byline, which is the same
        provenance failure as a stock news photograph, so the field reads back empty.
        """
        if value and any(host in str(value) for host in STOCK_IMAGE_HOSTS):
            return None
        return value

    class Config:
        from_attributes = True


class ArticleCategoryRef(BaseModel):
    id: str
    name: str
    slug: str
    name_km: Optional[str] = None
    scope: Optional[str] = None
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class ArticleSourceRef(BaseModel):
    id: str
    name: str
    slug: str
    country: Optional[str] = None
    website_url: Optional[str] = None
    trust_level: Optional[str] = None

    class Config:
        from_attributes = True

class ArticleBase(BaseModel):
    title: str
    title_km: Optional[str] = None
    subheadline: Optional[str] = None
    summary: str  # Original editorial summary
    summary_km: Optional[str] = None
    content: str  # Full structured editorial text
    key_points: Optional[str] = "[]"  # JSON string of bullets
    why_it_matters: Optional[str] = None
    timeline: Optional[str] = "[]"
    
    who_said_what: Optional[str] = None
    what_is_documented: Optional[str] = None
    what_remains_disputed: Optional[str] = None

    category_id: str
    author_id: str
    country: Optional[str] = "KH"
    province_or_city: Optional[str] = None
    language: Optional[str] = "en"

    primary_source_id: Optional[str] = None
    primary_source_url: str
    source_attribution_text: Optional[str] = None

    hero_image_url: Optional[str] = None
    hero_image_credit: Optional[str] = None
    hero_image_license: Optional[str] = "EDITORIAL_USE"
    hero_image_alt: Optional[str] = None

    is_featured: Optional[bool] = False
    is_breaking: Optional[bool] = False
    canonical_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class ArticleCreate(ArticleBase):
    slug: Optional[str] = None
    status: Optional[str] = "DRAFT"
    sources: Optional[List[ArticleSourceBase]] = []
    tag_ids: Optional[List[str]] = []

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    title_km: Optional[str] = None
    subheadline: Optional[str] = None
    summary: Optional[str] = None
    summary_km: Optional[str] = None
    content: Optional[str] = None
    key_points: Optional[str] = None
    why_it_matters: Optional[str] = None
    timeline: Optional[str] = None
    who_said_what: Optional[str] = None
    what_is_documented: Optional[str] = None
    what_remains_disputed: Optional[str] = None
    category_id: Optional[str] = None
    author_id: Optional[str] = None
    country: Optional[str] = None
    province_or_city: Optional[str] = None
    primary_source_url: Optional[str] = None
    source_attribution_text: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_image_credit: Optional[str] = None
    hero_image_license: Optional[str] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_breaking: Optional[bool] = None

class QualityChecklist(BaseModel):
    has_headline: bool
    has_summary: bool
    has_body: bool
    has_author: bool
    has_category: bool
    has_source_attribution: bool
    has_source_url: bool
    has_image_with_credit: bool
    # Image + desk placement are editorial integrity checks, not nice-to-haves: a story
    # wearing someone else's photograph or filed on the wrong desk must not ship.
    hero_provenance_verified: bool = True
    filing_consistent: bool = True
    no_duplicate_detected: bool
    no_unsupported_claims: bool
    editorial_reviewed: bool
    seo_metadata_complete: bool
    canonical_valid: bool
    can_publish: bool
    missing_items: List[str]

class ArticleOut(ArticleBase):
    id: str
    slug: str
    status: str
    quality_checklist_passed: bool
    views_count: int
    shares_count: int
    saves_count: int
    trend_score: float
    published_at: Optional[datetime]
    updated_at: Optional[datetime]
    created_at: datetime
    sources: List[ArticleSourceOut] = []
    author: Optional[ArticleAuthorRef] = None
    category: Optional[ArticleCategoryRef] = None
    primary_source: Optional[ArticleSourceRef] = None

    class Config:
        from_attributes = True

class ArticleListResponse(BaseModel):
    items: List[ArticleOut]
    total: int
    page: int
    limit: int
