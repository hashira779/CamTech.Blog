import time
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.models.source import Source, SourceFetchLog
from app.models.article import Article
from app.schemas.source import SourceOut, SourceCreate, SourceUpdate, IngestionResultOut
from app.ingestion.rss_fetcher import fetch_rss_feed
from app.deduplication.detector import detect_duplicates
from app.ai.provider import get_ai_provider
from app.services.auth_service import require_admin
from app.models.user import User

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.get("", response_model=List[SourceOut])
def list_sources(db: Session = Depends(get_db)):
    return db.query(Source).order_by(Source.priority.desc(), Source.name).all()

@router.get("/{slug_or_id}", response_model=SourceOut)
def get_source(slug_or_id: str, db: Session = Depends(get_db)):
    source = db.query(Source).filter((Source.slug == slug_or_id) | (Source.id == slug_or_id)).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source

@router.post("", response_model=SourceOut, status_code=status.HTTP_201_CREATED)
def create_source(source_in: SourceCreate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    import re
    slug = source_in.slug or re.sub(r"[^\w-]", "", source_in.name.lower().replace(" ", "-"))
    source = Source(
        name=source_in.name,
        slug=slug,
        country=source_in.country or "KH",
        language=source_in.language or "en",
        website_url=str(source_in.website_url),
        feed_url=str(source_in.feed_url) if source_in.feed_url else None,
        category=source_in.category or "General News",
        is_active=source_in.is_active,
        trust_level=source_in.trust_level or "VERIFIED_PUBLISHER",
        license_notes=source_in.license_notes,
        fetch_interval_mins=source_in.fetch_interval_mins or 60,
        priority=source_in.priority or 1
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.post("/{source_id}/fetch", response_model=IngestionResultOut)
async def fetch_source_now(source_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if not source.feed_url:
        raise HTTPException(status_code=400, detail="Source has no RSS/Atom feed URL configured")

    start_time = time.time()
    try:
        raw_items = await fetch_rss_feed(source.feed_url)
        items_found = len(raw_items)
        
        # Existing candidate articles for duplicate detection
        existing_articles = db.query(Article).limit(150).all()
        candidates = [{"id": a.id, "title": a.title, "url": a.primary_source_url} for a in existing_articles]

        ingested = 0
        duplicates = 0
        ai = get_ai_provider()

        for item in raw_items[:10]:  # Batch limit per manual fetch
            dups = detect_duplicates(item["title"], item["url"], candidates)
            if dups and dups[0]["similarity"] > 0.8:
                duplicates += 1
                continue

            # Generate AI draft assistance (Section 10)
            draft = await ai.generate_draft_editorial(item["title"], item["raw_summary"], source.name)
            
            # Find default author
            from app.models.author import Author
            from app.models.category import Category
            author = db.query(Author).first()
            category = db.query(Category).first()

            import json
            import re
            slug = re.sub(r"[^\w-]", "", item["title"].lower().replace(" ", "-"))[:80]

            new_article = Article(
                slug=f"{slug}-{int(time.time())}",
                title=item["title"],
                summary=draft["summary"],
                key_points=json.dumps(draft["key_points"]),
                why_it_matters=draft["why_it_matters"],
                content=f"{item['raw_summary']}\n\n*Original editorial summary compiled by Daily Discovery Newsroom.*",
                category_id=category.id if category else None,
                author_id=author.id if author else None,
                country=source.country,
                primary_source_id=source.id,
                primary_source_url=item["url"],
                source_attribution_text=source.name,
                status="AI_DRAFT",  # Lands strictly in editorial review queue!
                seo_title=draft["seo_title"],
                seo_description=draft["seo_description"]
            )
            db.add(new_article)
            ingested += 1

        duration_ms = int((time.time() - start_time) * 1000)
        source.last_fetched_at = datetime.now(timezone.utc)

        log = SourceFetchLog(
            source_id=source.id,
            status="SUCCESS",
            items_found=items_found,
            items_ingested=ingested,
            duplicates_dropped=duplicates,
            duration_ms=duration_ms
        )
        db.add(log)
        db.commit()

        return IngestionResultOut(
            source_id=source.id,
            source_name=source.name,
            status="SUCCESS",
            items_found=items_found,
            items_ingested=ingested,
            duplicates_dropped=duplicates,
            duration_ms=duration_ms
        )
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log = SourceFetchLog(
            source_id=source.id,
            status="FAILED",
            items_found=0,
            items_ingested=0,
            duplicates_dropped=0,
            duration_ms=duration_ms,
            error_message=str(e)
        )
        db.add(log)
        db.commit()
        return IngestionResultOut(
            source_id=source.id,
            source_name=source.name,
            status="FAILED",
            items_found=0,
            items_ingested=0,
            duplicates_dropped=0,
            duration_ms=duration_ms,
            error_message=str(e)
        )
