from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.article import Article
from app.models.discovery import Discovery

class TrendingService:
    @staticmethod
    def calculate_scores(db: Session):
        """
        Computes time-decay trend scores for articles and discoveries.
        Formula: (views * 1.0) + (shares * 3.0) + (saves * 4.0) - (age_hours * 0.2)
        """
        now = datetime.now(timezone.utc)
        
        # 1. Update Articles
        articles = db.query(Article).filter(Article.status == "PUBLISHED").all()
        for article in articles:
            pub_time = article.published_at or article.created_at
            if pub_time.tzinfo is None:
                pub_time = pub_time.replace(tzinfo=timezone.utc)
            age_hours = max((now - pub_time).total_seconds() / 3600.0, 0.1)
            
            raw_engagement = (article.views_count * 1.0) + (article.shares_count * 3.0) + (article.saves_count * 4.0)
            # Logarithmic or linear decay
            decay = age_hours * 0.25
            score = max(round(raw_engagement - decay, 2), 0.0)
            article.trend_score = score
        
        db.commit()

    @staticmethod
    def get_trending_items(db: Session, limit: int = 6) -> Dict[str, List[Dict[str, Any]]]:
        TrendingService.calculate_scores(db)

        # Cambodia trending
        kh_articles = db.query(Article).filter(
            Article.status == "PUBLISHED",
            Article.country == "KH"
        ).order_by(desc(Article.trend_score)).limit(limit).all()

        # World trending
        world_articles = db.query(Article).filter(
            Article.status == "PUBLISHED",
            Article.country != "KH"
        ).order_by(desc(Article.trend_score)).limit(limit).all()

        # Editor's picks
        picks = db.query(Article).filter(
            Article.status == "PUBLISHED",
            Article.is_featured == True
        ).order_by(desc(Article.published_at)).limit(limit).all()

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
                "trend_score": a.trend_score,
                "views_count": a.views_count,
                "published_at": a.published_at.isoformat() if a.published_at else None
            }

        return {
            "cambodia": [format_item(a) for a in kh_articles],
            "world": [format_item(a) for a in world_articles],
            "editor_picks": [format_item(a) for a in picks]
        }
