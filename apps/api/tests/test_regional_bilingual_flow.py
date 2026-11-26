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
    # Story without Cambodia stays WORLD when World-classified even if headline says Bangkok
    assert filing.resolve_country(
        "World", "KH",
        "Global shipping lanes shift after Red Sea delays",
        "European ports adjusted schedules following maritime disruptions.",
    ) == "WORLD"
    # Syndicated global story ending in " - Kiripost" stays WORLD when Cambodia is never mentioned
    assert filing.resolve_country(
        "World", "KH",
        "After a 13-Year Wait, Grand Theft Auto VI Arrives - Kiripost",
        "Gamers queued overnight in North America and Europe for the launch.",
        source_name="Kiripost",
    ) == "WORLD"
    # Bilateral Thai military/defense story affecting Cambodia routes to TH
    assert filing.resolve_country(
        "World", "KH",
        "Thailand to Purchase $123 Million Rocket Launcher, Sparking Cambodia Concerns",
        "Cambodian officials monitored Thai military procurement near the border.",
    ) == "TH"
    # Southeast Asia reporting routes to ASEAN
    assert filing.resolve_country(
        "Business", "SG",
        "Vietnam expands semiconductor packaging parks in Ho Chi Minh City",
        "Regional ASEAN electronics exporters reported higher demand.",
        source_name="Channel News Asia",
    ) == "ASEAN"
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

    # Leaked Thai/Lao glyphs inside Khmer text are caught for re-translation
    partial.title_km = "ជនខិលខូចត្រូវបានឃាត់ខ្លួន ຜ່ານការបោកប្រាស់ปลอม"
    assert bilingual_service.article_needs_khmer(partial) is True


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


def test_prepublish_quality_gate_blocks_mixed_scripts_and_partial_khmer():
    from app.common.database import Base
    from app.services.article_service import ArticleService

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            author = Author(id="au-q1", name="Editor", slug="editor-q1")
            cat = Category(id="cat-q1", name="World News", slug="world", scope="WORLD")
            db.add_all([author, cat])
            db.commit()

            clean_body = ("Investigators published verifiable court filings and financial ledgers detailing the $500 fraud scheme. " * 14).strip()
            clean_km_body = ("អត្ថបទព័ត៌មានពេញលេញជាភាសាខ្មែរ ដែលបញ្ជាក់ការពិត និងទិន្នន័យផ្លូវការយ៉ាងច្បាស់លាស់។ " * 3).strip()

            base_kwargs = dict(
                id="art-q1",
                slug="quality-check-1",
                title="Court filings outline $500 online fundraising fraud case",
                summary="Prosecutors presented verified court records showing how $500 was solicited under a false charity name.",
                content=clean_body,
                country="WORLD",
                category_id=cat.id,
                author_id=author.id,
                primary_source_url="https://example.com/news/court-filings-1",
                source_attribution_text="Source: Example Wire",
                status="AI_DRAFT",
                seo_title="Court filings outline fraud case",
                seo_description="Verified court filings detail $500 fraud case.",
            )

            # 1. Mixed Thai/Lao glyphs inside Khmer headline must be blocked before publish
            corrupt = Article(
                **base_kwargs,
                title_km="ជនខិលខូចត្រូវបានឃាត់ខ្លួន ក្រោយបោកប្រាស់ ຜ່ານការរៃអង្គាសមូលនិធិปลอม (AI)",
                summary_km="សមត្ថកិច្ចបានឃាត់ខ្លួនជនសង្ស័យពីបទឆបោកប្រាក់។",
                content_km=clean_km_body,
            )
            gate_corrupt = ArticleService.validate_quality_gate(corrupt, db)
            assert gate_corrupt.can_publish is False
            assert any("Thai or Lao" in m for m in gate_corrupt.missing_items)

            # 2. Partial Khmer (summary_km present without full content_km) must be blocked before publish
            partial = Article(
                **base_kwargs,
                title_km="សំណុំរឿងឆបោកតាមអ៊ីនធឺណិតចំនួន ៥០០ ដុល្លារ",
                summary_km="តុលាការបានបង្ហាញឯកសារផ្លូវការនៃការស៊ើបអង្កេតករណីឆបោកនេះ។",
                content_km=None,
            )
            gate_partial = ArticleService.validate_quality_gate(partial, db)
            assert gate_partial.can_publish is False
            assert any("Partial Khmer translation" in m for m in gate_partial.missing_items)

            # 3. Clean complete bilingual article passes quality gate AND autopilot bilingual gate
            complete = Article(
                **base_kwargs,
                title_km="សំណុំរឿងឆបោកតាមអ៊ីនធឺណិតចំនួន ៥០០ ដុល្លារ",
                summary_km="តុលាការបានបង្ហាញឯកសារផ្លូវការនៃការស៊ើបអង្កេតករណីឆបោកនេះ។",
                content_km=clean_km_body,
                ai_draft_metadata=json.dumps({"engine": "gemini:gemini-2.5-flash"}),
            )
            gate_ok = ArticleService.validate_quality_gate(complete, db)
            assert gate_ok.can_publish is True

            news_autopilot.set_setting(db, "AUTOPILOT_REQUIRE_EDITOR_REVIEW", "false")
            news_autopilot.set_setting(db, "AUTOPILOT_AUTO_PUBLISH_ENABLED", "true")
            verdict_ok = news_autopilot.evaluate_draft(db, complete, run_quality_gate=True)
            assert verdict_ok.eligible is True

            # Incomplete Khmer cannot auto-publish even with editor review disabled
            english_only = Article(**base_kwargs, ai_draft_metadata=json.dumps({"engine": "gemini:gemini-2.5-flash"}))
            verdict_no_km = news_autopilot.evaluate_draft(db, english_only, run_quality_gate=True)
            assert verdict_no_km.eligible is False
            assert "Khmer" in verdict_no_km.reason
    finally:
        engine.dispose()


def test_hygiene_v3_reconciles_cambodia_category_and_holds_defective_published():
    from app.common.database import Base

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            author = Author(id="au-h1", name="AI Desk", slug="ai-desk-h1")
            kh_cat = Category(id="cat-kh", name="Cambodia", slug="cambodia", scope="CAMBODIA")
            world_cat = Category(id="cat-world", name="World News", slug="world", scope="WORLD")
            db.add_all([author, kh_cat, world_cat])
            db.commit()

            # World story wrongly put in KH / Cambodia category
            misfiled = Article(
                id="art-mis",
                slug="seattle-ice-detention",
                title="ICE agents detain two people at Seattle airport",
                summary="US federal immigration officers detained two travelers at Seattle airport.",
                content=("US immigration officials confirmed two detentions in Seattle after routine screening. " * 14).strip(),
                country="KH",
                category_id=kh_cat.id,
                author_id=author.id,
                primary_source_url="https://example.com/news/seattle",
                source_attribution_text="Source: Kiripost",
                status="PUBLISHED",
            )
            # Corrupt Lao/Thai title_km + boilerplate filler body
            corrupt = Article(
                id="art-bad",
                slug="false-ai-generator-arrested",
                title="False AI Generator Arrested After Scamming About $500",
                title_km="ជនខិលខូចម្នាក់ត្រូវបានឃាត់ខ្លួន ក្រោយបោកប្រាស់ ຜ່ານការរៃអង្គាសមូលនិធិปลอม (AI)",
                summary="Fraud case reported.",
                content=(
                    "While the exact technical specifications of the fake AI generator remain under administrative review, "
                    "the operation highlights an evolving vector in cybercrime. " * 12
                ),
                country="WORLD",
                category_id=world_cat.id,
                author_id=author.id,
                primary_source_url="https://example.com/news/fake-ai",
                source_attribution_text="Source: Kiripost",
                status="PUBLISHED",
            )
            db.add_all([misfiled, corrupt])
            db.commit()

            res = seed_sources.ensure_regional_hygiene_v3(db)
            assert res["desks"]["updated"] >= 1
            assert res["scrub"]["scrubbed_fields"] >= 1
            assert res["scrub"]["held_articles"] == 1

            db.refresh(misfiled)
            db.refresh(corrupt)
            assert misfiled.country == "WORLD"
            assert misfiled.category_id == world_cat.id
            assert corrupt.title_km is None
            assert corrupt.status == "IN_REVIEW"
    finally:
        engine.dispose()
