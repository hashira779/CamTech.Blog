"""
Daily Discovery Background Worker — Production-grade asynchronous worker that handles:
1. RSS Feed Ingestion: Fetches, deduplicates, and creates AI editorial drafts from registered sources
2. Trending Score Recalculation: Updates popularity scores across all content types
3. Source Health Monitoring: Periodic feed health checks and logging
4. Multi-Category AI News Generation: Generates fresh news across 6 categories (daily, Cambodia time)
5. News Autopilot: hybrid auto-publish of AI drafts, archive stale drafts, purge old archives
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
from app.services.image_search_service import image_search_service
from app.services.filing import strip_brand_suffix

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

                    # 5b. Draft the story. The local fallback engine quotes the publisher;
                    # it does not write editorial prose, so nothing here is invented.
                    matched_cat = None
                    detected_category = None
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
                        # No summary is invented here. The headline is the publisher's own
                        # sentence; anything else would be us writing the news.
                        draft = {
                            "summary": title,
                            "key_points": [],
                            "why_it_matters": "",
                            "seo_title": title[:150],
                            "seo_description": title[:155],
                            "engine": "fallback",
                        }
                        article_category_id = category.id

                    # 5c. File it on the desk the story is about, not the desk that printed it.
                    from app.services.filing import resolve_country, category_is_cambodia
                    country = resolve_country(detected_category, source_country, title, raw_summary)
                    if matched_cat is not None and category_is_cambodia(matched_cat.slug, matched_cat.scope):
                        country = "KH"

                    base_slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]
                    slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
                    image_url = item.get("image_url")

                    # 5c. Hero image: the story's own picture from the feed, credited to the
                    # publisher. Otherwise only a photograph that names this story is kept;
                    # when nothing qualifies the article ships with no image at all.
                    if image_url:
                        from app.services.ai_tourism_engine import filter_live_images
                        live = await filter_live_images([image_url])
                        if live:
                            hero_img_url = image_url
                            hero_img_credit = f"Image: {source_name}"
                        else:
                            hero_img_url, hero_img_credit = None, None
                            logger.info(f"[RSS] Dropped dead feed image for '{title[:60]}': {image_url}")
                        hero_img_alt = title[:255]
                    else:
                        category_name_for_img = matched_cat.slug if matched_cat else (source_category_name or "world")
                        hero_img_url, hero_img_credit, hero_img_alt = await image_search_service.search_news_image(
                            title=title,
                            category=category_name_for_img,
                            country=country
                        )

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
                        hero_image_url=hero_img_url,
                        hero_image_credit=hero_img_credit,
                        hero_image_alt=hero_img_alt,
                        hero_image_license="EDITORIAL_USE",
                        category_id=article_category_id,
                        author_id=author.id,
                        language="en",
                        status="AI_DRAFT",  # Hybrid: News Autopilot publishes after the review window
                        seo_title=strip_brand_suffix(draft.get("seo_title", title[:150])),
                        seo_description=draft.get("seo_description", draft.get("summary", "")[:155]),
                        ai_draft_metadata=json.dumps({
                            "source": source_name,
                            "feed_url": feed_url,
                            "original_author": item_author,
                            "ingested_at": datetime.now(timezone.utc).isoformat(),
                            "pipeline": "rss_ingestion",
                            "engine": draft.get("engine", "unknown"),
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


async def daily_ai_news_job():
    """Generate multi-category AI news once per day (Cambodia time), controlled from Admin Settings.
    Runs in the worker (single process) so it never fires twice or gets lost on API restarts."""
    from app.services import news_autopilot
    db = SessionLocal()
    try:
        if not news_autopilot.daily_news_is_due(db):
            return
        # Mark first: a failing Gemini call must not retry every 5 minutes and burn quota.
        news_autopilot.mark_daily_news_ran(db)
    except Exception as e:
        logger.error(f"Daily AI news scheduling check failed: {e}")
        return
    finally:
        db.close()

    try:
        from app.services.ai_news_service import ai_news_service
        logger.info("📰 Daily multi-category AI news generation started...")
        result = await ai_news_service.generate_all_categories()
        logger.info(
            f"📰 Daily news done: {result.get('total_saved', 0)} drafts saved, "
            f"{result.get('total_skipped', 0)} duplicates skipped, errors: {result.get('errors') or 'none'}"
        )
    except Exception as e:
        logger.error(f"Daily AI news generation failed: {e}")


async def news_autopilot_job():
    """Hybrid auto-publish, archive stale AI drafts, purge old archives."""
    from app.services import news_autopilot
    db = SessionLocal()
    try:
        result = news_autopilot.run_lifecycle(db)
        logger.info(
            f"🤖 News Autopilot: published={result['publish'].get('published', 0)} "
            f"held={result['publish'].get('skipped', 0)} "
            f"archived={result['archive'].get('archived', 0)} purged={result['purge'].get('purged', 0)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"News Autopilot error: {e}")
    finally:
        db.close()


async def content_autopilot_job():
    """Draft new AI content for Discover, Daily Quiz and Travel (guides & events).

    Each section runs on its own interval from Admin Settings; the run is marked
    BEFORE generation so a failing AI call cannot retry every cycle and burn quota.
    Generated rows start unpublished — the News Autopilot lifecycle publishes them.
    """
    from app.services import news_autopilot
    from app.services.ai_content_service import ai_content_service

    db = SessionLocal()
    try:
        discovery_due = news_autopilot.section_is_due(
            db, "AUTOPILOT_DISCOVERY_ENABLED", news_autopilot.LAST_DISCOVERY_RUN_KEY,
            news_autopilot.get_int(db, "AUTOPILOT_DISCOVERY_INTERVAL_HOURS"),
        )
        travel_due = news_autopilot.section_is_due(
            db, "AUTOPILOT_TRAVEL_ENABLED", news_autopilot.LAST_TRAVEL_RUN_KEY,
            news_autopilot.get_int(db, "AUTOPILOT_TRAVEL_INTERVAL_HOURS"),
        )
        today_km = datetime.now(timezone(timedelta(hours=7))).date().isoformat()
        quiz_due = (
            news_autopilot.get_bool(db, "AUTOPILOT_NEWS_ENABLED")
            and news_autopilot.get_bool(db, "AUTOPILOT_QUIZ_ENABLED")
            and news_autopilot.get_setting(db, news_autopilot.LAST_QUIZ_RUN_KEY) != today_km
        )
        if discovery_due:
            news_autopilot.mark_section_ran(db, news_autopilot.LAST_DISCOVERY_RUN_KEY,
                                            "UTC timestamp of last AI discovery generation")
        if travel_due:
            news_autopilot.mark_section_ran(db, news_autopilot.LAST_TRAVEL_RUN_KEY,
                                            "UTC timestamp of last AI travel guide/event generation")
        if quiz_due:
            news_autopilot.set_setting(db, news_autopilot.LAST_QUIZ_RUN_KEY, today_km,
                                       "Date (Cambodia time) the daily AI quiz last ran")
    except Exception as e:
        logger.error(f"Content autopilot scheduling check failed: {e}")
        return
    finally:
        db.close()

    if discovery_due:
        try:
            logger.info("🔭 AI discovery generation started...")
            res = await ai_content_service.generate_discoveries()
            logger.info(f"🔭 Discoveries: {res}")
        except Exception as e:
            logger.error(f"Discovery generation failed: {e}")

    if quiz_due:
        try:
            logger.info("🧠 Daily AI quiz generation started...")
            res = await ai_content_service.generate_daily_quiz()
            logger.info(f"🧠 Daily quiz: {res}")
        except Exception as e:
            logger.error(f"Daily quiz generation failed: {e}")

    if travel_due:
        try:
            logger.info("🗺️ AI travel guide/event generation started...")
            res = await ai_content_service.generate_travel_content()
            logger.info(f"🗺️ Travel content: {res}")
        except Exception as e:
            logger.error(f"Travel content generation failed: {e}")


async def worker_main():
    # Ensure schema (tables + AI metadata columns) exists before any job touches them.
    try:
        from app.common.database import Base, engine
        Base.metadata.create_all(bind=engine)
        from app.common.schema_migration import ensure_database_schema
        ensure_database_schema()
    except Exception as e:
        logger.warning(f"Worker schema init notice: {e}")

    logger.info("==================================================")
    logger.info("🚀 Daily Discovery Asynchronous Worker Started")
    logger.info("Handles: RSS Ingestion, Daily AI News, Content Autopilot, News Autopilot, Trending, Sources")
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

        # 2. Daily AI news (once per day at the configured Cambodia-time hour)
        await daily_ai_news_job()

        # 3. Content Autopilot: draft discoveries, daily quiz, travel guides & events
        await content_autopilot_job()

        # 4. News Autopilot: auto-publish reviewed-window drafts, archive & purge stale ones
        await news_autopilot_job()

        # 5. Recalculate trending popularity
        await recalculate_trending_job()

        # 6. Check source feeds periodically (every 3 cycles for health monitoring)
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
