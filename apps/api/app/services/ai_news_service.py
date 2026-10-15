"""
AI News Service — Multi-category automated news generation with web-grounded research.
Generates 2-3 articles per category per run, uses deduplication, and sends to AI_DRAFT
status for editorial review before publishing. All AI calls go through the pluggable
multi-provider gateway (see ai_gateway), so any enabled vendor can back generation.
"""
import asyncio
import json
import uuid
import re
import logging
from datetime import datetime, timezone
from typing import Optional, List

from app.common.database import SessionLocal
from app.models.article import Article
from app.models.category import Category
from app.models.author import Author
from app.deduplication.detector import detect_duplicates
from app.services.image_search_service import image_search_service
from app.services import ai_gateway
from app.services.filing import strip_brand_suffix

logger = logging.getLogger(__name__)

# Category definitions with tailored prompts for high-quality, diverse content
CATEGORY_PROMPTS = {
    "technology": {
        "scope": "WORLD",
        "country": "WORLD",
        "prompt": (
            "You are a senior technology journalist. Search for today's most important global "
            "technology news — AI breakthroughs, semiconductor developments, cybersecurity events, "
            "major product launches, or regulatory changes affecting tech companies. "
            "Write {count} distinct, professional news articles about DIFFERENT topics."
        ),
        "articles_per_run": 3,
    },
    "cambodia": {
        "scope": "CAMBODIA",
        "country": "KH",
        "prompt": (
            "You are an expert senior Cambodia affairs investigative journalist and news researcher. "
            "Search for today's most vital, breaking, and verified news covering Cambodia across major international "
            "and national news organizations: "
            "1. Major International Outlets covering Cambodia: Al Jazeera (Al Jazeera English / Asia), Reuters, BBC News, CNA (Channel News Asia), Nikkei Asia, AP News, The Diplomat. "
            "2. Major Cambodia National & Business Outlets: Phnom Penh Post, Khmer Times, Kiripost (Tech & Business), Agence Kampuchea Presse (AKP), Fresh News Asia, CamboJA News, ThmeyThmey, National Bank of Cambodia. "
            "Search across politics, economy, mega-infrastructure (bridges, canals, airports, expressways), technology, trade agreements, tourism, education, and cultural milestones. "
            "Thoroughly cross-check facts, dates, names, and statistics. Provide clear attribution with original source publication name and source URL. "
            "Write {count} distinct, professional, well-researched news articles about DIFFERENT topics happening in or concerning Cambodia."
        ),
        "articles_per_run": 3,
    },
    "world": {
        "scope": "WORLD",
        "country": "WORLD",
        "prompt": (
            "You are an international world news correspondent. Search for today's most significant global "
            "news across trusted global wire services and agencies including Al Jazeera, Reuters, BBC News, AP News, "
            "and AFP — covering geopolitics, diplomacy, international relations, regional developments, climate summits, "
            "and major global economic shifts. Exclude pure technology topics. "
            "Write {count} distinct, professional news articles about DIFFERENT world events with verified attribution."
        ),
        "articles_per_run": 2,
    },
    "business": {
        "scope": "BOTH",
        "country": "WORLD",
        "prompt": (
            "You are a financial journalist. Search for today's most important business and economic "
            "news — stock markets, corporate earnings, trade deals, startup funding, economic indicators, "
            "central bank decisions, or major mergers and acquisitions. "
            "Write {count} distinct, professional business news articles about DIFFERENT topics."
        ),
        "articles_per_run": 2,
    },
    "science": {
        "scope": "WORLD",
        "country": "WORLD",
        "prompt": (
            "You are a science correspondent. Search for today's most fascinating scientific developments — "
            "space exploration, medical breakthroughs, climate research, physics discoveries, biology, "
            "or environmental science. "
            "Write {count} distinct, professional science news articles about DIFFERENT discoveries."
        ),
        "articles_per_run": 2,
    },
    "travel": {
        "scope": "BOTH",
        "country": "WORLD",
        "prompt": (
            "You are a travel and tourism journalist focused on Southeast Asia and Cambodia. "
            "Search for today's travel industry news — new flight routes, hotel openings, tourism statistics, "
            "travel advisories, festival announcements, or destination developments in Cambodia and the region. "
            "Write {count} distinct, professional travel news articles about DIFFERENT topics."
        ),
        "articles_per_run": 2,
    },
}


class AINewsService:
    def __init__(self):
        pass

    def _resolve_category_id(self, db, category_slug: str) -> Optional[str]:
        """Find or create a category by slug."""
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if cat:
            return cat.id
        # Auto-create category if missing
        cat_info = CATEGORY_PROMPTS.get(category_slug, {})
        new_cat = Category(
            name=category_slug.title(),
            slug=category_slug,
            scope=cat_info.get("scope", "BOTH"),
            description=f"Auto-created category for {category_slug} news."
        )
        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)
        return new_cat.id

    def _resolve_system_author(self, db) -> str:
        """Find or create the AI system author."""
        author = db.query(Author).filter(Author.slug == "ai-editorial-desk").first()
        if author:
            return author.id
        new_author = Author(
            name="AI Editorial Desk",
            slug="ai-editorial-desk",
            bio="Automated news generation powered by Google Gemini AI with Google Search grounding for factual accuracy.",
            role="AI Correspondent",
            expertise="Multi-domain automated journalism",
            is_active=True
        )
        db.add(new_author)
        db.commit()
        db.refresh(new_author)
        return new_author.id

    def _get_existing_titles(self, db, hours_back: int = 48) -> list[dict]:
        """Get recent article titles for deduplication."""
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        recent = db.query(Article.id, Article.title, Article.primary_source_url).filter(
            Article.created_at >= cutoff
        ).all()
        return [{"id": r.id, "title": r.title, "url": r.primary_source_url or ""} for r in recent]

    async def generate_news_for_category(
        self,
        category_slug: str,
        count: Optional[int] = None,
        override_author_id: Optional[str] = None,
        override_category_id: Optional[str] = None,
        **kwargs
    ) -> dict:
        """
        Generate multiple news articles for a specific category using the pluggable AI
        gateway (web-grounded research when the provider supports it) for real-time accuracy.
        """
        cat_config = CATEGORY_PROMPTS.get(category_slug)
        if not cat_config:
            return {"status": "failed", "error": f"Unknown category: {category_slug}"}

        if not ai_gateway.has_any_configured_provider():
            return {"status": "failed", "error": "No AI provider is configured. Add a provider key in Settings."}

        db = SessionLocal()
        try:
            category_id = override_category_id or self._resolve_category_id(db, category_slug)
            author_id = override_author_id or self._resolve_system_author(db)
            existing_titles = self._get_existing_titles(db)

        finally:
            db.close()

        articles_count = count if count is not None and count > 0 else cat_config["articles_per_run"]
        country = cat_config["country"]
        base_prompt = cat_config["prompt"].format(count=articles_count)

        prompt = f"""{base_prompt}

CRITICAL RULES:
1. Each article MUST be about a DIFFERENT topic — no duplicates.
2. Content must be factual and based on real, verifiable events from today or this week.
3. Write in professional journalistic style with proper attribution.
4. Each article should be 400-600 words with clear structure.
5. SOURCE DIVERSITY MANDATE: You MUST vary your sources. Do NOT attribute all articles to the same outlet. Each article in the returned array MUST come from a DIFFERENT credible publication (e.g. Article 1 from Khmer Times, Article 2 from Phnom Penh Post or Al Jazeera, Article 3 from Kiripost, Fresh News, CNA, or AKP).
6. REAL SOURCE METADATA: 'source_url' must be an authentic article URL or domain URL on that outlet's domain (e.g. https://www.khmertimeskh.com, https://kiripost.com, https://www.aljazeera.com, https://en.freshnewsasia.com, https://phnompenhpost.com) and 'source_name' must be the exact publication name.

Return a JSON array of {articles_count} article objects. Each object must have:
- title: Compelling headline (50-100 chars)
- summary: 1-2 sentence summary (100-200 chars)
- content: Full article body in Markdown (400-600 words, with ## subheadings)
- source_url: A relevant source URL for attribution
- source_name: Name of the source publication
- tags: Array of 3-5 relevant tags
- seo_title: SEO-optimized title (max 60 chars)
- seo_description: SEO meta description (max 155 chars)
"""
        # Generate via the pluggable gateway: tries every enabled provider in fallback order,
        # uses web-grounded research when the provider supports it, and extracts JSON from text.
        data, meta = await asyncio.to_thread(
            ai_gateway.generate_json, prompt, use_search=True, timeout=90.0
        )
        if data is None:
            details = (meta or {}).get("details", [])
            logger.warning(f"[AINews:{category_slug}] gateway failed: {details}")
            return {"status": "failed", "error": "No AI provider produced a response. " + "; ".join(details)[:300]}

        articles_data = data if isinstance(data, list) else ([data] if isinstance(data, dict) else [])
        articles_data = [a for a in articles_data if isinstance(a, dict)]
        engine = (meta or {}).get("engine", "unknown")
        if not articles_data:
            return {"status": "failed", "error": "Failed to parse AI response JSON"}

        # Save articles with deduplication
        saved = []
        skipped = []

        db = SessionLocal()
        try:
            for data in articles_data:
                title = data.get("title", "").strip()
                if not title:
                    continue

                # Deduplication check
                source_url = data.get("source_url", "https://news.google.com")
                dupes = detect_duplicates(title, source_url, existing_titles, similarity_threshold=0.55)
                if dupes:
                    skipped.append({"title": title, "reason": f"Duplicate of: {dupes[0]['title']}"})
                    logger.info(f"[AINews:{category_slug}] Skipped duplicate: {title}")
                    continue

                # Generate unique slug
                base_slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:80]
                slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"

                # Discover high-resolution, relevant imagery for this news story
                hero_img_url, hero_img_credit, hero_img_alt = await image_search_service.search_news_image(
                    title=title,
                    category=category_slug,
                    country=country,
                    tags=data.get("tags", [])
                )

                # File on the desk the story is actually about. The per-category constant
                # put every "technology" piece on WORLD even when it was about Bakong, and
                # every "cambodia" piece on KH even when the model wrote about Ukraine.
                from app.services.filing import resolve_country
                story_country = resolve_country(
                    category_slug if category_slug == "cambodia" else None,
                    country,
                    title,
                    data.get("content", ""),
                    data.get("summary", ""),
                )
                if category_slug == "cambodia" and story_country != "KH":
                    # Category and desk must agree or the quality gate holds the draft.
                    story_country = "KH"

                # Try to link to a registered publisher source
                matched_source_id = None
                source_name_val = data.get("source_name", "")
                if source_name_val:
                    from app.models.source import Source
                    m_src = db.query(Source).filter(Source.name.ilike(f"%{source_name_val}%")).first()
                    if m_src:
                        matched_source_id = m_src.id

                new_article = Article(
                    title=title,
                    slug=slug,
                    summary=data.get("summary", title),
                    content=data.get("content", ""),
                    country=story_country,
                    primary_source_id=matched_source_id,
                    primary_source_url=source_url,
                    source_attribution_text=data.get("source_name", "AI Research via Google Search"),
                    hero_image_url=hero_img_url,
                    hero_image_credit=hero_img_credit,
                    hero_image_alt=hero_img_alt,
                    hero_image_license="EDITORIAL_USE",
                    category_id=category_id,
                    author_id=author_id,
                    status="AI_DRAFT",  # Goes to editorial review, NOT directly published
                    language="en",
                    seo_title=strip_brand_suffix(data.get("seo_title")),
                    seo_description=data.get("seo_description"),
                    ai_draft_metadata=json.dumps({
                        "generator": engine,
                        "category": category_slug,
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                        "tags": data.get("tags", []),
                    }),
                )
                db.add(new_article)
                saved.append({"title": title, "slug": slug})

                # Add to existing titles for intra-batch dedup
                existing_titles.append({"id": new_article.id, "title": title, "url": source_url})

            db.commit()

            return {
                "status": "success",
                "category": category_slug,
                "saved": len(saved),
                "skipped": len(skipped),
                "articles": saved,
                "skipped_details": skipped,
            }

        except Exception as e:
            db.rollback()
            logger.error(f"[AINews:{category_slug}] DB error: {e}")
            return {"status": "failed", "error": str(e)}
        finally:
            db.close()

    async def generate_and_publish_news(self, category_id: str, author_id: str) -> dict:
        """
        Legacy compatibility method. Now generates AI_DRAFT articles (not published).
        Called by the admin UI for single-category generation.
        """
        db = SessionLocal()
        try:
            # Resolve category slug from id
            cat = db.query(Category).filter(Category.id == category_id).first()
            category_slug = cat.slug if cat else "technology"
        finally:
            db.close()

        return await self.generate_news_for_category(
            category_slug=category_slug,
            override_author_id=author_id,
            override_category_id=category_id,
        )

    async def generate_all_categories(self) -> dict:
        """
        Generate news for ALL categories. This is the main entry point for the
        daily cron job — produces 15-20 articles across all categories.
        """
        results = {}
        total_saved = 0
        total_skipped = 0
        errors = []

        for category_slug in CATEGORY_PROMPTS:
            try:
                logger.info(f"📰 Generating news for category: {category_slug}")
                result = await self.generate_news_for_category(category_slug)
                results[category_slug] = result
                if result.get("status") == "success":
                    total_saved += result.get("saved", 0)
                    total_skipped += result.get("skipped", 0)
                else:
                    errors.append(f"{category_slug}: {result.get('error', 'Unknown error')}")
            except Exception as e:
                errors.append(f"{category_slug}: {str(e)}")
                logger.error(f"[AINews] Category {category_slug} failed: {e}")

        return {
            "status": "completed",
            "total_saved": total_saved,
            "total_skipped": total_skipped,
            "categories_processed": len(results),
            "results": results,
            "errors": errors,
        }


ai_news_service = AINewsService()
