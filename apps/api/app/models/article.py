import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.common.database import Base

article_tag_association = Table(
    "article_tags",
    Base.metadata,
    Column("article_id", String(36), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Article(Base):
    __tablename__ = "articles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    title_km = Column(String(255), nullable=True)
    subheadline = Column(String(350), nullable=True)
    
    # Original editorial value (Section 2 & 7)
    summary = Column(Text, nullable=False)  # "What happened?" original summary
    summary_km = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON array of bullet points
    why_it_matters = Column(Text, nullable=True)  # Context & editorial explanation
    content = Column(Text, nullable=False)  # Full editorial text
    timeline = Column(Text, nullable=True)  # JSON array of {time, event}
    
    # Neutral political/electoral fields (Section 11)
    who_said_what = Column(Text, nullable=True)
    what_is_documented = Column(Text, nullable=True)
    what_remains_disputed = Column(Text, nullable=True)

    # Classification & Geo
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    author_id = Column(String(36), ForeignKey("authors.id", ondelete="RESTRICT"), nullable=False)
    country = Column(String(50), default="KH")  # KH, WORLD, US, etc.
    province_or_city = Column(String(100), nullable=True)  # Phnom Penh, Siem Reap, etc.
    language = Column(String(10), default="en")

    # Source attribution (Section 2 & 8)
    primary_source_id = Column(String(36), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    primary_source_url = Column(String(500), nullable=False)
    source_attribution_text = Column(String(255), nullable=True)

    # Media & Rights (Section 23 & 36)
    hero_image_url = Column(String(500), nullable=True)
    hero_image_credit = Column(String(255), nullable=True)
    hero_image_license = Column(String(100), default="EDITORIAL_USE")
    hero_image_alt = Column(String(255), nullable=True)

    # Status workflow (Section 12)
    # DRAFT, AI_DRAFT, IN_REVIEW, NEEDS_REVISION, APPROVED, SCHEDULED, PUBLISHED, UPDATED, ARCHIVED, REJECTED
    status = Column(String(50), default="DRAFT", index=True)
    quality_checklist_passed = Column(Boolean, default=False)
    ai_draft_metadata = Column(Text, nullable=True)  # JSON info from AI assistant

    # Flags & SEO
    is_featured = Column(Boolean, default=False)
    is_breaking = Column(Boolean, default=False)
    canonical_url = Column(String(500), nullable=True)
    seo_title = Column(String(150), nullable=True)
    seo_description = Column(String(255), nullable=True)

    # Metrics & Trending (Section 18)
    views_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    saves_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    trend_score = Column(Float, default=0.0, index=True)

    # Timestamps
    published_at = Column(DateTime, nullable=True, index=True)
    updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("Category", back_populates="articles")
    author = relationship("Author", back_populates="articles")
    primary_source = relationship("Source", back_populates="primary_articles")
    tags = relationship("Tag", secondary=article_tag_association)
    sources = relationship("ArticleSource", back_populates="article", cascade="all, delete-orphan")
    revisions = relationship("ArticleRevision", back_populates="article", cascade="all, delete-orphan")

class ArticleSource(Base):
    __tablename__ = "article_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id = Column(String(36), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    source_name = Column(String(150), nullable=False)
    source_url = Column(String(500), nullable=False)
    attribution_quote = Column(String(500), nullable=True)
    coverage_type = Column(String(50), default="REPORTING")  # REPORTING, OFFICIAL_STATEMENT, ANALYSIS

    article = relationship("Article", back_populates="sources")

class ArticleRevision(Base):
    __tablename__ = "article_revisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id = Column(String(36), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    editor_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    change_summary = Column(String(255), nullable=True)
    diff_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    article = relationship("Article", back_populates="revisions")
    editor = relationship("User", back_populates="revisions")
