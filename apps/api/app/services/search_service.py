from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.article import Article
from app.models.discovery import Discovery
from app.models.quiz import Quiz
from app.models.tool import Tool
from app.models.location import Destination
from app.models.place import Place
from app.models.guide_event import Event, TravelGuide
from app.models.author import Author

class SearchService:
    @staticmethod
    def search(
        db: Session,
        query_text: str,
        category: Optional[str] = None,
        country: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        results = []
        if not query_text or len(query_text.strip()) < 1:
            return results

        clean_q = query_text.strip()
        search_pattern = f"%{clean_q}%"

        # 1. Search Articles
        if not entity_type or entity_type.upper() in ["ARTICLE", "NEWS"]:
            article_query = db.query(Article).filter(
                Article.status == "PUBLISHED",
                or_(
                    Article.title.ilike(search_pattern),
                    Article.title_km.ilike(search_pattern),
                    Article.summary.ilike(search_pattern),
                    Article.content.ilike(search_pattern)
                )
            )
            if country:
                article_query = article_query.filter(Article.country == country)
            
            articles = article_query.order_by(desc(Article.published_at)).limit(limit).all()
            for a in articles:
                results.append({
                    "id": a.id,
                    "type": "ARTICLE",
                    "title": a.title,
                    "title_km": a.title_km,
                    "summary": a.summary,
                    "slug": a.slug,
                    "url": f"/cambodia/news/{a.slug}" if a.country == "KH" else f"/world/news/{a.slug}",
                    "category": a.category.name if a.category else "News",
                    "country": a.country,
                    "image_url": a.hero_image_url,
                    "published_at": a.published_at.isoformat() if a.published_at else None
                })

        # 2. Search Discoveries
        if not entity_type or entity_type.upper() == "DISCOVER":
            discoveries = db.query(Discovery).filter(
                Discovery.is_published == 1,
                or_(
                    Discovery.title.ilike(search_pattern),
                    Discovery.title_km.ilike(search_pattern),
                    Discovery.intro.ilike(search_pattern),
                    Discovery.main_explanation.ilike(search_pattern)
                )
            ).limit(limit).all()
            for d in discoveries:
                results.append({
                    "id": d.id,
                    "type": "DISCOVERY",
                    "title": d.title,
                    "title_km": d.title_km,
                    "summary": d.intro,
                    "slug": d.slug,
                    "url": f"/discover/{d.slug}",
                    "category": d.category,
                    "country": "GLOBAL",
                    "image_url": d.hero_image_url,
                    "published_at": d.published_at.isoformat() if d.published_at else None
                })

        # 3. Search Quizzes
        if not entity_type or entity_type.upper() == "QUIZ":
            quizzes = db.query(Quiz).filter(
                or_(
                    Quiz.title.ilike(search_pattern),
                    Quiz.description.ilike(search_pattern)
                )
            ).limit(limit).all()
            for q in quizzes:
                results.append({
                    "id": q.id,
                    "type": "QUIZ",
                    "title": q.title,
                    "title_km": q.title_km,
                    "summary": q.description,
                    "slug": q.slug,
                    "url": f"/quiz/{q.slug}",
                    "category": q.category,
                    "country": "GLOBAL",
                    "image_url": None,
                    "published_at": None
                })

        # 4. Search Tools
        if not entity_type or entity_type.upper() == "TOOL":
            tools = db.query(Tool).filter(
                Tool.is_active == True,
                or_(
                    Tool.name.ilike(search_pattern),
                    Tool.description.ilike(search_pattern)
                )
            ).limit(limit).all()
            for t in tools:
                results.append({
                    "id": t.id,
                    "type": "TOOL",
                    "title": t.name,
                    "title_km": t.name_km,
                    "summary": t.description,
                    "slug": t.slug,
                    "url": f"/tools/{t.slug}",
                    "category": t.category,
                    "country": "GLOBAL",
                    "image_url": None,
                    "published_at": None
                })

        # 5. Search Travel Destinations (25 Provinces & Hubs)
        if not entity_type or entity_type.upper() in ["DESTINATION", "TRAVEL", "PROVINCE"]:
            destinations = db.query(Destination).filter(
                Destination.status == "ACTIVE",
                or_(
                    Destination.name.ilike(search_pattern),
                    Destination.name_km.ilike(search_pattern),
                    Destination.overview.ilike(search_pattern),
                    Destination.symbol_name.ilike(search_pattern)
                )
            ).limit(limit).all()
            for dest in destinations:
                results.append({
                    "id": dest.id,
                    "type": "DESTINATION",
                    "title": dest.name,
                    "title_km": dest.name_km,
                    "summary": dest.overview[:180] + "..." if len(dest.overview or "") > 180 else (dest.overview or ""),
                    "slug": dest.slug,
                    "url": f"/travel/{dest.slug}",
                    "category": "Province Hub",
                    "country": "KH",
                    "image_url": dest.hero_image_url,
                    "published_at": None
                })

        # 6. Search Travel Places (Attractions, Temples, Waterfalls, Food, Hotels)
        if not entity_type or entity_type.upper() in ["PLACE", "ATTRACTION", "TRAVEL", "TEMPLE"]:
            places = db.query(Place).filter(
                Place.status == "ACTIVE",
                or_(
                    Place.name.ilike(search_pattern),
                    Place.local_name.ilike(search_pattern),
                    Place.description.ilike(search_pattern),
                    Place.address.ilike(search_pattern)
                )
            ).limit(limit).all()
            for p in places:
                results.append({
                    "id": p.id,
                    "type": "PLACE",
                    "title": p.name,
                    "title_km": p.local_name,
                    "summary": p.description[:180] + "..." if len(p.description or "") > 180 else (p.description or ""),
                    "slug": p.slug,
                    "url": f"/travel/place/{p.slug}",
                    "category": p.place_type,
                    "country": "KH",
                    "image_url": p.hero_image_url,
                    "published_at": None
                })

        # 7. Search Travel Guides
        if not entity_type or entity_type.upper() in ["GUIDE", "TRAVEL"]:
            guides = db.query(TravelGuide).filter(
                TravelGuide.status == "PUBLISHED",
                or_(
                    TravelGuide.title.ilike(search_pattern),
                    TravelGuide.summary.ilike(search_pattern),
                    TravelGuide.content.ilike(search_pattern)
                )
            ).limit(limit).all()
            for g in guides:
                results.append({
                    "id": g.id,
                    "type": "GUIDE",
                    "title": g.title,
                    "title_km": g.title_km,
                    "summary": g.summary[:180] + "..." if len(g.summary or "") > 180 else (g.summary or ""),
                    "slug": g.slug,
                    "url": f"/travel/guides/{g.slug}",
                    "category": g.destination.name if g.destination else "Travel Guide",
                    "country": "KH",
                    "image_url": g.hero_image_url,
                    "published_at": g.published_at.isoformat() if g.published_at else None
                })

        # 8. Search Events
        if not entity_type or entity_type.upper() in ["EVENT", "TRAVEL", "FESTIVAL"]:
            events = db.query(Event).filter(
                Event.status == "ACTIVE",
                or_(
                    Event.name.ilike(search_pattern),
                    Event.description.ilike(search_pattern),
                    Event.venue.ilike(search_pattern)
                )
            ).limit(limit).all()
            for e in events:
                results.append({
                    "id": e.id,
                    "type": "EVENT",
                    "title": e.name,
                    "title_km": e.name_km,
                    "summary": e.description[:180] + "..." if len(e.description or "") > 180 else (e.description or ""),
                    "slug": e.slug,
                    "url": f"/travel/{e.destination.slug}" if e.destination else "/travel",
                    "category": e.event_type,
                    "country": "KH",
                    "image_url": e.hero_image_url,
                    "published_at": None
                })

        # 9. Search Authors
        if not entity_type or entity_type.upper() == "AUTHOR":
            authors = db.query(Author).filter(
                Author.is_active == True,
                or_(
                    Author.name.ilike(search_pattern),
                    Author.bio.ilike(search_pattern),
                    Author.expertise.ilike(search_pattern)
                )
            ).limit(limit).all()
            for a in authors:
                results.append({
                    "id": a.id,
                    "type": "AUTHOR",
                    "title": a.name,
                    "title_km": None,
                    "summary": (a.bio or "")[:180] + "..." if len(a.bio or "") > 180 else (a.bio or ""),
                    "slug": a.slug,
                    "url": f"/author/{a.slug}",
                    "category": a.role or "Author",
                    "country": "GLOBAL",
                    "image_url": getattr(a, "avatar_url", None),
                    "published_at": None
                })

        return results
