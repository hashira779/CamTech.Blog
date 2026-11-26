"""Regression tests for 4-desk filing (KH, TH, ASEAN, WORLD), Khmer validation, and source seeding."""
import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.audit import AuditLog
from app.models.author import Author
from app.models.category import Category
from app.models.source import Source
from app.services import bilingual_service, filing, news_autopilot, seed_sources


def test_resolve_country_routes_thai_news_about_cambodia_to_th():
    assert filing.resolve_country(
        "World", "TH",
        "Bangkok Post: Thai-Cambodia border checkpoint hours expanded at Poipet",
        "Thai trade officials in Sa Kaeo met Cambodian provincial authorities.",
        source_name="Bangkok Post",
    ) == "TH"
    assert filing.resolve_country(
        "thailand-cambodia", "WORLD",
        "Cross-border labor accord reviewed",
        "Ministers discuss migrant workers between Thailand and Cambodia.",
    ) == "TH"
    assert filing.resolve_country(
        "Business", "WORLD",
        "Khaosod English reports on Cambodia border commerce",
        "Commerce through Aranyaprathet and Poipet increased this quarter.",
        source_name="Khaosod English",
    ) == "TH"


def test_resolve_country_routes_asean_without_breaking_cambodia_or_world():
    assert filing.resolve_country(
        "asean", "ASEAN",
        "ASEAN digital economy ministers agree on cross-border QR standards",
        "Regional central banks align instant payment rails across Southeast Asia.",
    ) == "ASEAN"
    # Story without Cambodia stays WORLD when World-classified
    assert filing.resolve_country(
        "World", "KH",
        "Hundreds protest in Bangkok over global energy prices",
        "Demonstrators gathered outside parliament calling for fuel subsidies.",
    ) == "WORLD"
    assert filing.resolve_country(
        "Business", "WORLD",
        "Bakong cross-border QR volume climbs",
        "The National Bank of Cambodia released quarterly data in Phnom Penh.",
    ) == "KH"


def test_bilingual_khmer_validator_catches_english_body_with_khmer_summary():
    partial = Article(
        id=str(uuid.uuid4()),
        slug="partial-km",
        title="Wealth disparities policy debate",
        title_km="ការពិភាក្សាអំពីគម្លាតទ្រព្យសម្បត្តិ",
        summary="Economic analysts debate wealth distribution.",
        summary_km="អ្នកជំនាញសេដ្ឋកិច្ចបានពិភាក្សាអំពីគម្លាតទ្រព្យសម្បត្តិ និងគោលនយោបាយពន្ធដារ។",
        content="Rethinking the Roots of Wealth Disparities. " * 20,
        content_km=None,
        category_id="c1",
        author_id="a1",
        primary_source_url="https://example.com/1",
    )
    assert bilingual_service.article_needs_khmer(partial) is True

    # ASCII string pasted into content_km is also caught
    partial.content_km = "English text stored in content_km column by mistake."
    assert bilingual_service.article_needs_khmer(partial) is True

    partial.content_km = "អត្ថបទពេញលេញជាភាសាខ្មែរ អំពីគោលនយោបាយសេដ្ឋកិច្ច និងការអភិវឌ្ឍសង្គមនៅកម្ពុជា។ " * 3
    assert bilingual_service.article_needs_khmer(partial) is False


def test_redraft_preserves_content_km():
    class BilingualStubDrafter:
        async def generate_draft_editorial(self, title, source_content, source_name):
            return {
                "summary": "Summary in English from publisher.",
                "title_km": "ចំណងជើងព័ត៌មានជាភាសាខ្មែរ",
                "summary_km": "សេចក្តីសង្ខេបព័ត៌មានជាភាសាខ្មែរច្បាស់លាស់។",
                "content": "Full substantive English reporting paragraph. " * 10,
                "content_km": "ខ្លឹមសារព័ត៌មានពេញលេញជាភាសាខ្មែរសម្រាប់អ្នកអានកម្ពុជា។ " * 3,
                "key_points": ["Fact one verified by reporting"],
                "why_it_matters": "Important context.",
                "seo_title": "Short SEO title",
                "seo_description": "Short SEO description",
                "engine": "gemini:gemini-2.5-flash",
            }

    from app.common.database import SessionLocal
    from app.services import ai_gateway

    db = SessionLocal()
    cat = db.query(Category).first()
    author = db.query(Author).first()
    if not (cat and author):
        db.close()
        pytest.skip("needs seeded category and author")

    art_id = str(uuid.uuid4())
    art = Article(
        id=art_id,
        slug=f"bilingual-redraft-{uuid.uuid4().hex[:8]}",
        title="Test bilingual redraft article",
        summary="Initial extract",
        content="Initial extract content",
        country="KH",
        language="en",
        status="AI_DRAFT",
        category_id=cat.id,
        author_id=author.id,
        primary_source_url="https://example.com/story-1",
        source_attribution_text="Source: Example",
        created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=3),
        ai_draft_metadata=json.dumps({"engine": "local", "source": "Example"}),
    )
    db.add(art)
    db.commit()

    original_query = db.query
    original_has_provider = ai_gateway.has_any_configured_provider
    try:
        ai_gateway.has_any_configured_provider = lambda: True
        db.query = lambda *entities: original_query(*entities).filter(Article.id == art_id) if entities and entities[0] is Article else original_query(*entities)
        result = asyncio.run(news_autopilot.redraft_held_drafts(db, BilingualStubDrafter()))
        assert result["redrafted"] == 1
        db.refresh(art)
        assert bilingual_service.has_khmer_script(art.content_km, min_chars=20)
        assert bilingual_service.has_khmer_script(art.summary_km, min_chars=10)
    finally:
        db.query = original_query
        ai_gateway.has_any_configured_provider = original_has_provider
        db.rollback()
        db.query(AuditLog).filter(AuditLog.entity_id == art_id).delete(synchronize_session=False)
        from app.models.article import ArticleRevision
        db.query(ArticleRevision).filter(ArticleRevision.article_id == art_id).delete(synchronize_session=False)
        db.query(Article).filter(Article.id == art_id).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_seed_recommended_sources_is_idempotent():
    engine = create_engine("sqlite:///:memory:")
    Source.__table__.create(engine)
    with Session(engine) as db:
        first = seed_sources.seed_recommended_sources(db)
        assert first["added"] == len(seed_sources.RECOMMENDED_SOURCES)
        slugs = {s.slug for s in db.query(Source).all()}
        assert {"cambodia-press-wire", "thai-media-on-cambodia", "asean-regional-wire"}.issubset(slugs)

        second = seed_sources.seed_recommended_sources(db)
        assert second["added"] == 0
        assert second["existing"] == len(seed_sources.RECOMMENDED_SOURCES)
    engine.dispose()
