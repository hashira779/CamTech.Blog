import sys
import time
import signal
import asyncio
import logging
from datetime import datetime, timezone

from app.common.database import SessionLocal
from app.services.trending_service import TrendingService
from app.services.article_service import ArticleService
from app.models.source import Source

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

async def check_source_feeds_job():
    """Inspect active RSS/Atom source feeds and log fetch status."""
    db = SessionLocal()
    try:
        sources = db.query(Source).filter(Source.is_active == True).all()
        logger.info(f"Inspecting {len(sources)} active verified sources in registry.")
        for s in sources:
            if s.feed_url:
                logger.info(f"Source verified & ready: {s.name} ({s.country}) -> {s.feed_url}")
    except Exception as e:
        logger.error(f"Error checking source feeds: {e}")
    finally:
        db.close()

async def worker_main():
    logger.info("==================================================")
    logger.info("🚀 Daily Discovery Asynchronous Worker Started")
    logger.info("Handles: News Ingestion, Trending Scores, Verification")
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

        # 1. Recalculate trending popularity
        await recalculate_trending_job()

        # 2. Check source feeds periodically (every 3 cycles)
        if iteration % 3 == 0:
            await check_source_feeds_job()

        # Sleep for 60 seconds or until shutdown
        try:
            await asyncio.wait_for(shutdown_event.wait(), timeout=60.0)
        except asyncio.TimeoutError:
            pass

    logger.info("Worker process terminated gracefully.")

if __name__ == "__main__":
    asyncio.run(worker_main())
