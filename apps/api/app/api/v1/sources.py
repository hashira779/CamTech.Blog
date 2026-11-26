import time
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.common.html_hygiene import sanitize_stored_html
from app.models.source import Source, SourceFetchLog
from app.models.article import Article
from app.schemas.source import SourceOut, SourceCreate, SourceUpdate, IngestionResultOut
from app.ingestion.rss_fetcher import fetch_rss_feed
from app.deduplication.detector import detect_duplicates
from app.ai.provider import get_ai_provider
from app.services.auth_service import require_admin
from app.services.filing import strip_brand_suffix
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

        from app.models.author import Author
        from app.models.category import Category
        from app.services.filing import resolve_country
        from app.services.news_autopilot import is_trusted_engine
        from app.services.bilingual_service import ensure_article_khmer_fields, has_khmer_script
        from app.services.image_search_service import image_search_service
        import json
        import re
        import uuid

        default_author = db.query(Author).filter(Author.slug == "ai-editorial-desk").first() or db.query(Author).first()
        default_category = (
            db.query(Category).filter(Category.name.ilike(f"%{source.category or ''}%")).first()
            or db.query(Category).first()
        )

        for item in raw_items[:10]:  # Batch limit per manual fetch
            dups = detect_duplicates(item["title"], item["url"], candidates)
            if dups and dups[0]["similarity"] >= 0.55:
                duplicates += 1
                continue

            effective_source_name = (item.get("source_name") or source.name or "").strip() or source.name
            detected_category = None
            try:
                detected_category = await ai.classify_category(item["title"], item["raw_summary"])
                draft = await ai.generate_draft_editorial(item["title"], item["raw_summary"], effective_source_name)
                if is_trusted_engine(draft.get("engine", "")):
                    draft = await ensure_article_khmer_fields(draft, item["title"], effective_source_name)
            except Exception:
                draft = {
                    "summary": item["title"],
                    "key_points": [],
                    "why_it_matters": "",
                    "seo_title": item["title"][:150],
                    "seo_description": item["title"][:155],
                    "engine": "fallback",
                }

            matched_cat = (
                db.query(Category).filter(Category.name.ilike(f"%{detected_category}%")).first()
                if detected_category else None
            )
            cat_id = matched_cat.id if matched_cat else (default_category.id if default_category else None)
            story_country = resolve_country(
                detected_category,
                source.country,
                item["title"],
                item["raw_summary"],
                source_name=effective_source_name,
            )

            base_slug = re.sub(r"[^a-z0-9]+", "-", item["title"].lower()).strip("-")[:80] or "story"
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"

            hero_img_url = item.get("image_url")
            hero_img_credit = f"Image: {effective_source_name}" if hero_img_url else None
            hero_img_alt = item["title"][:255] if hero_img_url else None
            if not hero_img_url:
                try:
                    hero_img_url, hero_img_credit, hero_img_alt = await image_search_service.search_news_image(
                        title=item["title"],
                        category=(matched_cat.slug if matched_cat else (source.category or "world").lower()),
                        country=story_country,
                    )
                except Exception:
                    hero_img_url, hero_img_credit, hero_img_alt = None, None, None

            body_text = draft.get("content") or (
                (draft.get("summary") or item["title"])
                + "\n\n"
                + "\n".join(f"- {kp}" for kp in (draft.get("key_points") or []))
            )

            new_article = Article(
                slug=slug,
                title=item["title"],
                title_km=str(draft["title_km"]).strip()[:255] if has_khmer_script(draft.get("title_km"), 3) else None,
                summary=draft.get("summary") or item["title"],
                summary_km=str(draft["summary_km"]).strip() if has_khmer_script(draft.get("summary_km"), 10) else None,
                key_points=json.dumps(draft.get("key_points", [])),
                why_it_matters=draft.get("why_it_matters", ""),
                content=sanitize_stored_html(body_text),
                content_km=sanitize_stored_html(str(draft["content_km"]).strip()) if has_khmer_script(draft.get("content_km"), 25) else None,
                category_id=cat_id,
                author_id=default_author.id if default_author else None,
                country=story_country,
                primary_source_id=source.id,
                primary_source_url=item["url"],
                source_attribution_text=f"Source: {effective_source_name}",
                hero_image_url=hero_img_url,
                hero_image_credit=hero_img_credit,
                hero_image_alt=hero_img_alt,
                hero_image_license="EDITORIAL_USE",
                status="AI_DRAFT",  # Lands strictly in editorial review queue!
                seo_title=strip_brand_suffix(draft.get("seo_title") or item["title"][:150]),
                seo_description=draft.get("seo_description") or (draft.get("summary") or item["title"])[:155],
                ai_draft_metadata=json.dumps({
                    "source": effective_source_name,
                    "feed_url": source.feed_url,
                    "pipeline": "manual_source_sync",
                    "engine": draft.get("engine", "unknown"),
                }),
            )
            db.add(new_article)
            candidates.append({"id": slug, "title": item["title"], "url": item["url"]})
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

@router.post("/fetch-all")
async def fetch_all_active_sources(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    """Trigger on-demand dynamic live RSS feed ingestion across all active news sources."""
    sources = db.query(Source).filter(Source.is_active == True, Source.feed_url.isnot(None)).all()
    results = []
    for s in sources:
        try:
            res = await fetch_source_now(s.id, db, user)
            results.append(res.dict() if hasattr(res, "dict") else res)
        except Exception as e:
            results.append({
                "source_id": s.id,
                "source_name": s.name,
                "status": "FAILED",
                "items_found": 0,
                "items_ingested": 0,
                "duplicates_dropped": 0,
                "duration_ms": 0,
                "error_message": str(e)
            })
    return {
        "status": "success",
        "total_sources_polled": len(sources),
        "results": results
    }
