from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.common.config import settings
from app.common.database import Base, engine
from app.middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestLoggerMiddleware,
    get_cors_origins,
)
import app.models  # Ensure all models are registered

# Eager schema init at import time: keeps SQLite columns in sync for every entrypoint
# (API, worker, tests) even when the ASGI lifespan never runs (e.g. TestClient).
try:
    Base.metadata.create_all(bind=engine)
    # TODO: Remove schema_migration after Alembic is verified working
    from app.common.schema_migration import ensure_database_schema
    ensure_database_schema()
except Exception:  # non-fatal: lifespan retries at real startup
    pass

# Import routers
from app.api.v1.articles import router as articles_router
from app.api.v1.authors import router as authors_router
from app.api.v1.discoveries import router as discoveries_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.tools import router as tools_router
from app.api.v1.sources import router as sources_router
from app.api.v1.search import router as search_router
from app.api.v1.trending import router as trending_router
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.system import router as system_router
from app.api.v1.security_admin import router as security_admin_router
from app.api.v1.travel import router as travel_router
from app.api.v1.transport import router as transport_router
from app.api.v1.config import router as config_router
from app.api.v1.storage_config import router as storage_config_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger("startup")

    # 1. Initialize database tables & migrations safely
    try:
        Base.metadata.create_all(bind=engine)
        # TODO: Remove schema_migration after Alembic is verified working
        from app.common.schema_migration import ensure_database_schema
        ensure_database_schema()
        logger.info("Database schema verified.")
    except Exception as e:
        logger.error(f"Non-critical database initialization notice: {e}")

    # 2. Start background schedulers (isolated from API serving)
    scheduler = None
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger

        scheduler = AsyncIOScheduler()

        async def weekly_tourism_scan():
            """Run AI Tourism Engine every Sunday at 03:00 AM."""
            try:
                from app.services.ai_tourism_engine import ai_tourism_engine
                logger.info("Weekly AI Tourism Scan started...")
                result = await ai_tourism_engine.run_full_scan()
                if result.get("status") == "already_running":
                    logger.info("Weekly tourism scan skipped: another scan is already running.")
                else:
                    logger.info(
                        "Weekly scan complete: %s new place(s) from %s candidate(s) across %s provinces "
                        "(%s duplicate spelling(s) skipped, %s generic placeholder(s) withheld, source=%s, errors=%s).",
                        result.get("total_new_places", 0),
                        result.get("total_candidates", 0),
                        result.get("total_provinces_scanned", 0),
                        result.get("duplicates_skipped", 0),
                        result.get("generic_withheld", 0),
                        result.get("discovery_source"),
                        len(result.get("errors") or []),
                    )
            except Exception as e:
                logger.error(f"Weekly tourism scan failed: {e}")

        # Weekly tourism scan: Every Sunday at 03:00 AM (server time)
        scheduler.add_job(weekly_tourism_scan, CronTrigger(day_of_week='sun', hour=3, minute=0), id='weekly_tourism_scan')
        # Daily AI news generation + News Autopilot now run in the worker container
        # (app/workers/runner.py) so they fire exactly once, independent of API restarts/replicas.

        scheduler.start()
        logger.info("Background schedulers active.")
    except Exception as sched_err:
        logger.warning(f"Background scheduler initialization skipped: {sched_err}")

    yield

    if scheduler:
        try:
            scheduler.shutdown()
        except Exception:
            pass

app = FastAPI(
    title="Daily Discovery API",
    description="Production-grade News, Discovery, and Utility Platform API with Zero-Trust Security",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Rate Limiting Middleware (innermost security middleware)
app.add_middleware(RateLimitMiddleware)

# 2. Security Headers & Correlation ID Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 3. Structured JSON Request Logger Middleware
app.add_middleware(RequestLoggerMiddleware)

# 4. CORS configuration (outermost so preflight OPTIONS requests are handled cleanly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization", "Content-Type", "Accept", "Origin", "User-Agent",
        "X-Requested-With", "X-Request-ID", "X-Correlation-ID"
    ],
    expose_headers=[
        "X-Request-ID", "X-Correlation-ID", "X-Response-Time",
        "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"
    ]
)

# 3. Mount Observability & Health Probes (/health, /ready, /live)
app.include_router(system_router)

# 4. Mount API v1 Domain Routers
app.include_router(articles_router, prefix="/api/v1")
app.include_router(authors_router, prefix="/api/v1")
app.include_router(discoveries_router, prefix="/api/v1")
app.include_router(quizzes_router, prefix="/api/v1")
app.include_router(tools_router, prefix="/api/v1")
app.include_router(sources_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(trending_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(security_admin_router, prefix="/api/v1")
app.include_router(travel_router, prefix="/api/v1")
app.include_router(transport_router, prefix="/api/v1")
app.include_router(config_router, prefix="/api/v1")
app.include_router(storage_config_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
