from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.common.config import settings
from app.common.database import Base, engine
from app.common.security_middleware import SecurityHeadersAndCorrelationMiddleware
import app.models  # Ensure all models are registered

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Start background schedulers
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    import logging
    
    logger = logging.getLogger("scheduler")
    scheduler = AsyncIOScheduler()
    
    async def weekly_tourism_scan():
        """Run AI Tourism Engine every Sunday at 03:00 AM."""
        try:
            from app.services.ai_tourism_engine import ai_tourism_engine
            logger.info("🌍 Weekly AI Tourism Scan started...")
            result = await ai_tourism_engine.run_full_scan()
            logger.info(f"✅ Weekly scan complete: {result['total_new_places']} new places added.")
        except Exception as e:
            logger.error(f"❌ Weekly tourism scan failed: {e}")

    async def daily_news_generation():
        """Run AI News Generation every day at 07:00 AM."""
        try:
            from app.services.ai_news_service import ai_news_service
            logger.info("📰 Daily AI News generation started...")
            result = await ai_news_service.generate_and_publish_news(
                category_id='ca82761b-c4b3-43a0-82fd-75188f694e2e',
                author_id='system'
            )
            logger.info(f"✅ Daily news generated: {result.get('title', 'Unknown')}")
        except Exception as e:
            logger.error(f"❌ Daily news generation failed: {e}")

    # Weekly tourism scan: Every Sunday at 03:00 AM (server time)
    scheduler.add_job(weekly_tourism_scan, CronTrigger(day_of_week='sun', hour=3, minute=0), id='weekly_tourism_scan')
    # Daily news: Every day at 07:00 AM (server time)  
    scheduler.add_job(daily_news_generation, CronTrigger(hour=7, minute=0), id='daily_news_generation')
    
    scheduler.start()
    logger.info("⏰ Background schedulers started (Tourism: Sunday 3AM, News: Daily 7AM)")
    
    yield
    
    scheduler.shutdown()
    logger.info("⏰ Background schedulers stopped.")

app = FastAPI(
    title="Daily Discovery API",
    description="Production-grade News, Discovery, and Utility Platform API with Zero-Trust Security",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Security Headers, Correlation ID & Rate Limiting Middleware
app.add_middleware(SecurityHeadersAndCorrelationMiddleware)

# 2. CORS configuration (Section 35)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://blog.camtech.cam",
        "https://cms.camtech.cam",
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Correlation-ID", "X-Response-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining"]
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
