import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.models.article import Article
from app.models.discovery import Discovery

# In-memory cache for trending response to ensure sub-millisecond responses
_trending_cache: Dict[str, Any] = {
    "timestamp": 0,
    "limit": 0,
    "data": None
}
CACHE_TTL_SECONDS = 60


class TrendingService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def recalculate_all_scores(self) -> Dict[str, Any]:
        """Called by background worker to update scores periodically."""
        if not self.db:
            return {"updated_count": 0}
        return self.calculate_scores(self.db)

    @staticmethod
    def calculate_scores(db: Session) -> Dict[str, Any]:
        """
        Computes time-decay trend scores for published articles.
        Formula: (views * 1.0) + (shares * 3.0) + (saves * 4.0) - (age_hours * 0.25)
        Executed asynchronously by worker, NOT on user read requests.
        """
        now = datetime.now(timezone.utc)
        
        articles = db.query(Article).filter(Article.status == "PUBLISHED").all()
        updated_count = 0
        for article in articles:
            pub_time = article.published_at or article.created_at
            if pub_time:
                if pub_time.tzinfo is None:
                    pub_time = pub_time.replace(tzinfo=timezone.utc)
                age_hours = max((now - pub_time).total_seconds() / 3600.0, 0.1)
            else:
                age_hours = 24.0

            raw_engagement = (
                ((article.views_count or 0) * 1.0) +
                ((article.shares_count or 0) * 3.0) +
                ((article.saves_count or 0) * 4.0)
            )
            decay = age_hours * 0.25
            score = max(round(raw_engagement - decay, 2), 0.0)
            article.trend_score = score
            updated_count += 1
        
        db.commit()
        return {"updated_count": updated_count}

    @classmethod
    def get_trending_items(cls, db: Session, limit: int = 6) -> Dict[str, List[Dict[str, Any]]]:
        global _trending_cache
        now = time.time()

        # Return cached response if valid and limit matches
        if _trending_cache["data"] and _trending_cache["limit"] == limit and (now - _trending_cache["timestamp"] < CACHE_TTL_SECONDS):
            return _trending_cache["data"]

        # Cambodia trending - fast indexed query with joinedload for category
        kh_articles = (
            db.query(Article)
            .options(joinedload(Article.category))
            .filter(Article.status == "PUBLISHED", Article.country == "KH")
            .order_by(desc(Article.trend_score), desc(Article.published_at))
            .limit(limit)
            .all()
        )

        # World trending - fast indexed query with joinedload for category
        world_articles = (
            db.query(Article)
            .options(joinedload(Article.category))
            .filter(Article.status == "PUBLISHED", Article.country != "KH")
            .order_by(desc(Article.trend_score), desc(Article.published_at))
            .limit(limit)
            .all()
        )

        # Editor's picks
        picks = (
            db.query(Article)
            .options(joinedload(Article.category))
            .filter(Article.status == "PUBLISHED", Article.is_featured == True)
            .order_by(desc(Article.published_at))
            .limit(limit)
            .all()
        )

        def format_item(a: Article):
            return {
                "id": a.id,
                "type": "ARTICLE",
                "title": a.title,
                "title_km": a.title_km,
                "slug": a.slug,
                "url": f"/cambodia/news/{a.slug}" if a.country == "KH" else f"/world/news/{a.slug}",
                "category": a.category.name if a.category else "News",
                "country": a.country,
                "hero_image_url": a.hero_image_url,
                "trend_score": a.trend_score or 0.0,
                "views_count": a.views_count or 0,
                "published_at": a.published_at.isoformat() if a.published_at else None
            }

        result = {
            "cambodia": [format_item(a) for a in kh_articles],
            "world": [format_item(a) for a in world_articles],
            "editor_picks": [format_item(a) for a in picks]
        }

        # Store in fast in-memory cache
        _trending_cache = {
            "timestamp": now,
            "limit": limit,
            "data": result
        }

        return result

