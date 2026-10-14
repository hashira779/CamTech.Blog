"""
Daily Discovery Background Worker — Production-grade asynchronous worker that handles:
1. RSS Feed Ingestion: Fetches, deduplicates, and creates AI editorial drafts from registered sources
2. Trending Score Recalculation: Updates popularity scores across all content types
3. Source Health Monitoring: Periodic feed health checks and logging
4. Multi-Category AI News Generation: Generates fresh news across 6 categories (daily at 7AM)
"""
import sys
import time
import signal
import asyncio
import logging
import json
import re
import uuid
from datetime import datetime, timezone, timedelta

from app.common.database import SessionLocal
from app.services.trending_service import TrendingService
from app.services.article_service import ArticleService
from app.models.source import Source, SourceFetchLog
from app.models.article import Article
from app.models.category import Category
from app.models.author import Author
from app.ingestion.rss_fetcher import fetch_rss_feed
from app.deduplication.detector import detect_duplicates
from app.ai.provider import get_ai_provider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker] %(message)s"
)
logger = logging.getLogger("DailyDiscoveryWorker")

shutdown_event = asyncio.Event()

def signal_handler(signum, frame):
    logger.info(f"Shutdown signal received ({signum}). Gracefully stopping worker loops...")
    shutdown_event.set()


async def recalculate_trending_job():
    """Recalculate trending scores across news, discoveries, places, and tools."""
    db = SessionLocal()
    try:
        service = TrendingService(db)
        scores = service.recalculate_all_scores()
        logger.info(f"✓ Trending scores updated: {scores.get('updated_count', 0)} items scored.")
    except Exception as e:
        logger.error(f"Error recalculating trending scores: {e}")
    finally:
        db.close()


async def ingest_rss_feeds_job():
    """
    Core ingestion pipeline:
    1. Fetch all active RSS sources from the database
    2. For each source, fetch the RSS feed using the SSRF-protected fetcher
    3. Deduplicate against existing articles (Jaccard similarity)
    4. Generate AI editorial drafts for new articles
    5. Insert as AI_DRAFT status for editorial review
    """
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(
            Source.is_active == True,
            Source.feed_url != None,
            Source.feed_url != ""
        ).order_by(Source.priority.desc()).all()

        if not sources:
            logger.info("No active RSS sources configured. Skipping feed ingestion.")
            return

        logger.info(f"📡 Starting RSS ingestion for {len(sources)} active sources...")

        ai_provider = get_ai_provider()
        total_ingested = 0
        total_duplicates = 0
        total_errors = 0

        for source in sources:
            source_id = source.id
            source_name = source.name
            feed_url = source.feed_url
            source_country = source.country or "WORLD"
            source_category_name = source.category or "General News"

            # Check fetch interval — skip if recently fetched
            if source.last_fetched_at:
                interval_mins = source.fetch_interval_mins or 60
                last_fetched = source.last_fetched_at
                now_utc = datetime.now(timezone.utc)
                if last_fetched.tzinfo is None:
                    last_fetched = last_fetched.replace(tzinfo=timezone.utc)
                next_fetch_time = last_fetched + timedelta(minutes=interval_mins)
                if now_utc < next_fetch_time:
                    logger.info(f"  ⏳ Skipping {source_name}: next fetch at {next_fetch_time.isoformat()}")
                    continue

            start_time = time.time()
            items_found = 0
            items_ingested = 0
            duplicates_dropped = 0
            error_message = None

            try:
                # 1. Fetch the RSS feed
                logger.info(f"  📥 Fetching: {source_name} ({feed_url})")
                feed_items = await fetch_rss_feed(feed_url, timeout_seconds=15)
                items_found = len(feed_items)
                logger.info(f"  Found {items_found} entries from {source_name}")

                if not feed_items:
                    continue

                # 2. Get existing articles for deduplication (timezone-safe)
                cutoff_aware = datetime.now(timezone.utc) - timedelta(days=7)
                cutoff_naive = datetime.utcnow() - timedelta(days=7)
                try:
                    existing_articles = db.query(Article.id, Article.title, Article.primary_source_url).filter(
                        Article.created_at >= cutoff_aware
                    ).all()
                except Exception:
                    existing_articles = db.query(Article.id, Article.title, Article.primary_source_url).filter(
                        Article.created_at >= cutoff_naive
                    ).all()

                existing_items = [
                    {"id": a.id, "title": a.title, "url": a.primary_source_url or ""}
                    for a in existing_articles
                ]

                # 3. Resolve category
                category = db.query(Category).filter(
                    Category.name.ilike(f"%{source_category_name}%")
                ).first()
                if not category:
                    category = db.query(Category).filter(Category.slug == "world").first()
                if not category:
                    # Create a fallback category
                    category = Category(
                        name="World",
                        slug="world",
                        scope="WORLD",
                        description="World news and events"
                    )
                    db.add(category)
                    db.commit()
                    db.refresh(category)

                # 4. Resolve system author
                author = db.query(Author).filter(Author.slug == "ai-editorial-desk").first()
                if not author:
                    author = Author(
                        name="AI Editorial Desk",
                        slug="ai-editorial-desk",
                        bio="Automated editorial drafts from verified RSS sources.",
                        role="AI Correspondent",
                        is_active=True
                    )
                    db.add(author)
                    db.commit()
                    db.refresh(author)

                # 5. Process each feed item
                for item in feed_items:
                    title = item.get("title", "").strip()
                    url = item.get("url", "").strip()
                    raw_summary = item.get("raw_summary", "")
                    item_author = item.get("author", "")

                    if not title or not url:
                        continue

                    # 5a. Deduplication check
                    dupes = detect_duplicates(title, url, existing_items, similarity_threshold=0.55)
                    if dupes:
                        duplicates_dropped += 1
                        continue

                    # 5b. Use AI provider to classify category and generate editorial draft
                    try:
                        detected_category = await ai_provider.classify_category(title, raw_summary)
                        # Try to find matching category in DB
                        matched_cat = db.query(Category).filter(
                            Category.name.ilike(f"%{detected_category}%")
                        ).first()
                        if matched_cat:
                            article_category_id = matched_cat.id
                        else:
                            article_category_id = category.id

                        # Generate AI editorial draft
                        draft = await ai_provider.generate_draft_editorial(title, raw_summary, source_name)
                    except Exception as ai_err:
                        logger.warning(f"AI processing failed for '{title}': {ai_err}")
                        draft = {
                            "summary": f"According to {source_name}, {title.lower()}.",
                            "key_points": [],
                            "why_it_matters": "",
                            "seo_title": title[:150],
                            "seo_description": f"Latest news: {title[:120]}",
                        }
                        article_category_id = category.id

                    # 5c. Create the article
                    country = source_country if source_country in ["KH", "US", "UK", "JP", "CN"] else "WORLD"
                    base_slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]
                    slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"

                    new_article = Article(
                        title=title,
                        slug=slug,
                        summary=draft.get("summary", title),
                        content=draft.get("summary", "") + "\n\n" + "\n".join(
                            f"- {kp}" for kp in draft.get("key_points", [])
                        ),
                        key_points=json.dumps(draft.get("key_points", [])),
                        why_it_matters=draft.get("why_it_matters", ""),
                        country=country,
                        primary_source_id=source_id,
                        primary_source_url=url,
                        source_attribution_text=f"Source: {source_name}",
                        category_id=article_category_id,
                        author_id=author.id,
                        language="en",
                        status="AI_DRAFT",  # NEVER auto-publish — requires editorial review
                        seo_title=draft.get("seo_title", title[:150]),
                        seo_description=draft.get("seo_description", draft.get("summary", "")[:155]),
                        ai_draft_metadata=json.dumps({
                            "source": source_name,
                            "feed_url": feed_url,
                            "original_author": item_author,
                            "ingested_at": datetime.now(timezone.utc).isoformat(),
                            "pipeline": "rss_ingestion",
                        })
                    )
                    db.add(new_article)
                    items_ingested += 1

                    # Track for intra-batch dedup
                    existing_items.append({"id": new_article.id, "title": title, "url": url})

                # 6. Update source metadata
                source.last_fetched_at = datetime.now(timezone.utc)
                db.commit()

                total_ingested += items_ingested
                total_duplicates += duplicates_dropped

                logger.info(
                    f"  ✅ {source_name}: {items_ingested} ingested, "
                    f"{duplicates_dropped} duplicates dropped, {items_found} total found"
                )

            except Exception as fetch_err:
                error_message = str(fetch_err)
                total_errors += 1
                logger.error(f"  ❌ {source_name}: {error_message}")
                # Don't let one source failure kill the entire pipeline
                db.rollback()

            finally:
                # Log fetch result
                duration_ms = int((time.time() - start_time) * 1000)
                try:
                    fetch_log = SourceFetchLog(
                        source_id=source_id,
                        status="SUCCESS" if not error_message else "FAILED",
                        items_found=items_found,
                        items_ingested=items_ingested,
                        duplicates_dropped=duplicates_dropped,
                        error_message=error_message,
                        duration_ms=duration_ms,
                    )
                    db.add(fetch_log)
                    db.commit()
                except Exception as log_err:
                    logger.warning(f"Failed to log fetch result: {log_err}")
                    db.rollback()

        logger.info(
            f"📊 RSS Ingestion Complete: {total_ingested} articles ingested, "
            f"{total_duplicates} duplicates dropped, {total_errors} source errors"
        )

    except Exception as e:
        logger.error(f"RSS Ingestion pipeline error: {e}")
    finally:
        db.close()


async def check_source_feeds_job():
    """Inspect active RSS/Atom source feeds and log fetch status."""
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.is_active == True).all()
        logger.info(f"Inspecting {len(sources)} active verified sources in registry.")
        for s in sources:
            if s.feed_url:
                last_fetched = s.last_fetched_at.isoformat() if s.last_fetched_at else "Never"
                logger.info(f"Source: {s.name} ({s.country}) -> {s.feed_url} [Last: {last_fetched}]")
    except Exception as e:
        logger.error(f"Error checking source feeds: {e}")
    finally:
        db.close()


async def worker_main():
    logger.info("==================================================")
    logger.info("🚀 Daily Discovery Asynchronous Worker Started")
    logger.info("Handles: RSS Ingestion, AI News, Trending Scores, Source Monitoring")
    logger.info("==================================================")

    # Register OS signals for graceful termination
    try:
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    except (ValueError, AttributeError):
        pass  # On Windows, some signals might not be available in threads

    iteration = 0
    while not shutdown_event.is_set():
        iteration += 1
        logger.info(f"Starting worker cycle #{iteration} at {datetime.now(timezone.utc).isoformat()}")

        # 1. RSS Feed Ingestion — every cycle (respects per-source fetch intervals)
        await ingest_rss_feeds_job()

        # 2. Recalculate trending popularity
        await recalculate_trending_job()

        # 3. Check source feeds periodically (every 3 cycles for health monitoring)
        if iteration % 3 == 0:
            await check_source_feeds_job()

        # Sleep for 5 minutes or until shutdown (was 60 seconds — too aggressive for RSS)
        try:
            await asyncio.wait_for(shutdown_event.wait(), timeout=300.0)
        except asyncio.TimeoutError:
            pass

    logger.info("Worker process terminated gracefully.")

if __name__ == "__main__":
    asyncio.run(worker_main())
