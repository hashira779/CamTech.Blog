"""Regression tests for the article content pipeline: what a reader is actually shown.

Covers the four defects that made published stories look broken:

1. `/articles` returned `author_id`/`category_id`/`primary_source_id` only, so every public
   page had a blank byline and a placeholder category label.
2. Hero images fell back to a generic Unsplash pool (26 of 81 stored heroes, 4 of the 5
   published ones) or to an unchecked Wikimedia keyword hit — a Bruegel painting of children
   playing on a Google Play article, a Gaza aid convoy photo on a Starlink/Ukraine article.
3. The local engine wrote "According to reporting from {source}," + the publisher's first
   sentence force-lowercased + a filler sentence nobody printed (77 of 81 stored summaries).
4. `country` was copied from the publisher and `category` from the classifier, so a
   Cambodia-scope category could sit on a WORLD article and vice versa.
"""
import asyncio

import pytest

from app.schemas.article import ArticleOut
from app.services import filing
from app.services.image_search_service import ImageSearchService, image_search_service
from app.ai.provider import LocalAIProvider, _has_word, _match_text


STOCK_HERO = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80"
POOL_HERO = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/1600px-Angkor_Wat.jpg"
MATCHED_HERO = "https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Play_console_logo.jpg"
UKRAINE_NEWS_TITLE = "Starlink restrictions affecting Ukraine's front line operations, Kyiv says"
IRRELEVANT_HERO = (
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/"
    "Pieter_Bruegel_the_Elder_-_Children%E2%80%99s_Games_-_File_2.jpg/1600px-x.jpg"
)
GAID_HERO = "https://upload.wikimedia.org/wikipedia/commons/8/8a/4-Sending_humanitarian_cargo_to_Gaza.jpg"


# --- 1. nested author / category / publisher on the public response -------------------

def _article(**overrides):
    """An Article with every column the response schema requires filled in.

    Column defaults only land on flush, and these tests validate an in-memory object.
    """
    from datetime import datetime, timezone

    from app.models.article import Article

    kwargs = dict(
        id="a1", slug="s", title="t", summary="sum", content="body",
        category_id="ca1", author_id="au1", country="KH", language="en",
        primary_source_url="https://example.com/x", status="PUBLISHED",
        quality_checklist_passed=True, views_count=0, shares_count=0, saves_count=0,
        trend_score=0.0, created_at=datetime.now(timezone.utc),
    )
    kwargs.update(overrides)
    return Article(**kwargs)


def test_article_out_serializes_real_author_category_and_source():
    """A reader page must be able to print a byline, not just a foreign key."""
    from app.models.author import Author
    from app.models.category import Category
    from app.models.source import Source

    art = _article()
    art.author = Author(id="au1", name="Dara Vorn", slug="dara-vorn", role="Senior Correspondent")
    art.category = Category(id="ca1", name="Economy & Business", slug="economy", scope="BOTH")
    art.primary_source = Source(
        id="so1", name="National Bank of Cambodia", slug="nbc", country="KH",
        language="en", website_url="https://www.nbc.org.kh", category="Official",
        trust_level="OFFICIAL",
    )

    out = ArticleOut.model_validate(art) if hasattr(ArticleOut, "model_validate") else ArticleOut.from_orm(art)
    data = out.model_dump() if hasattr(out, "model_dump") else out.dict()

    assert data["author"]["name"] == "Dara Vorn"
    assert data["author"]["role"] == "Senior Correspondent"
    assert data["category"]["name"] == "Economy & Business"
    assert data["category"]["slug"] == "economy"
    assert data["primary_source"]["name"] == "National Bank of Cambodia"


def test_article_out_tolerates_missing_relationships():
    """No byline is honest; a fabricated one is not. Optional refs must default to None."""
    # Ids are NOT NULL columns, so this is the realistic blank state: the keys are there
    # but the relationships were never loaded (or the row they point at is gone).
    art = _article(id="a2", slug="s2", country="WORLD")
    obj = (ArticleOut.model_validate(art) if hasattr(ArticleOut, "model_validate")
           else ArticleOut.from_orm(art))
    data = obj.model_dump() if hasattr(obj, "model_dump") else obj.dict()
    assert data["author"] is None and data["category"] is None and data["primary_source"] is None
    assert data["author_id"] == "au1"




def test_published_feed_serves_nested_names():
    """The live endpoint the site calls must carry the names, not only the ids."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    res = client.get("/api/v1/articles", params={"status": "PUBLISHED", "limit": 5})
    assert res.status_code == 200
    items = res.json()["items"]
    if not items:
        pytest.skip("no published articles in this database")
    for item in items:
        assert "author" in item and "category" in item
        if item.get("author_id"):
            assert (item.get("author") or {}).get("name")
        if item.get("category_id"):
            assert (item.get("category") or {}).get("name")


# --- 2. hero image provenance ----------------------------------------------------------

def test_stock_pool_hero_is_rejected():
    assert filing.hero_provenance_ok(STOCK_HERO, "Photo via Unsplash / Financial Tech Collection")[0] is False
    assert filing.hero_provenance_ok(POOL_HERO, "Wikimedia Commons")[0] is False


def test_credit_must_belong_to_the_file_host():
    # The exact defect stored in the database: a Wikimedia file captioned as if NASA supplied it.
    ok, reason = filing.hero_provenance_ok(
        "https://upload.wikimedia.org/wikipedia/commons/7/7e/Example.jpg",
        "NASA / ESA / CSA Scientific Archive",
    )
    assert ok is False and "does not match" in reason
    assert filing.hero_provenance_ok(
        "https://upload.wikimedia.org/wikipedia/commons/7/7e/Example.jpg", "Wikimedia Commons"
    )[0] is True
    # A feed picture is credited to the publisher that shipped it.
    assert filing.hero_provenance_ok("https://ichef.bbci.co.uk/lead.jpg", "Image: BBC World News")[0] is True
    # No image at all is a valid state.
    assert filing.hero_provenance_ok(None, None)[0] is True


def test_search_news_image_returns_nothing_instead_of_stock(monkeypatch):
    """The old third step handed back a curated Unsplash photo; now the hero stays empty."""
    async def commons(*a, **k):
        return [IRRELEVANT_HERO]

    async def wiki(*a, **k):
        return GAID_HERO

    monkeypatch.setattr(ImageSearchService, "search_commons_high_res", classmethod(lambda cls, *a, **k: commons()))
    monkeypatch.setattr(ImageSearchService, "search_wikipedia_original", classmethod(lambda cls, *a, **k: wiki()))

    url, credit, alt = asyncio.run(
        image_search_service.search_news_image(title=UKRAINE_NEWS_TITLE, category="world", country="WORLD")
    )
    assert url is None, f"unrelated photographs must not be stored: {url}"
    assert credit is None
    assert alt == UKRAINE_NEWS_TITLE[:150]


def test_search_news_image_keeps_a_matching_file_with_host_credit(monkeypatch):
    async def commons(*a, **k):
        return [MATCHED_HERO]

    monkeypatch.setattr(ImageSearchService, "search_commons_high_res", classmethod(lambda cls, *a, **k: commons()))

    url, credit, _alt = asyncio.run(
        image_search_service.search_news_image(title="Google Play opens private app sharing", category="technology")
    )
    assert url == MATCHED_HERO
    assert credit == "Wikimedia Commons"


# --- 3. honest summaries ---------------------------------------------------------------

FEED_BODY = (
    "Elon Musk&#8217;s&nbsp;Starlink system allows Kyiv to protect Ukrainian skies and "
    "effectively guide drones to Russian targets, Ukrainian officials said. The programme "
    "had been suspended after talks collapsed in Riyadh. &lt;div&gt;Read more on the "
    "full story&lt;/div&gt; Sign up to our newsletter for daily updates."
)


def test_local_extract_quotes_the_publisher_verbatim():
    draft = asyncio.run(LocalAIProvider().generate_draft_editorial(UKRAINE_NEWS_TITLE, FEED_BODY, "BBC World News"))
    assert not draft["summary"].lower().startswith("according to")
    assert draft["summary"].startswith("Elon Musk")
    assert "Ukrainian skies" in draft["summary"]
    assert draft["summary"] != draft["summary"].lower()
    assert "highlights key ongoing shifts" not in draft["summary"]
    assert draft["why_it_matters"] == ""
    assert draft["engine"] == "local"


def test_local_extract_untangles_entities_and_drops_boilerplate():
    draft = asyncio.run(LocalAIProvider().generate_draft_editorial("X", FEED_BODY, "BBC World News"))
    assert "&" not in draft["summary"] and "<div>" not in draft["summary"]
    assert "nbsp" not in draft["summary"]
    for point in draft["key_points"]:
        assert not point.lower().startswith(("read more", "sign up", "click"))
    assert all("Read more" not in p and "Sign up" not in p for p in draft["key_points"])


def test_local_extract_leaves_the_summary_empty_when_nothing_is_quotable():
    draft = asyncio.run(LocalAIProvider().generate_draft_editorial("Some headline", "Too short.", "TechCrunch"))
    assert draft["summary"] == "" and draft["key_points"] == [] and draft["extracted"] is False
    # The quality gate then holds the draft instead of shipping an invented lead.
    assert len(draft["summary"]) < 10


# --- 4. classification and desk filing -------------------------------------------------

def test_word_boundary_matching_stops_said_becoming_ai():
    text = _match_text("He said the email campaign would maintain the domain and explain it.")
    assert not _has_word(text, "ai")
    assert _has_word(_match_text("New AI chips from Nvidia"), "ai")


def test_classifier_no_longer_piles_everything_into_technology():
    local = LocalAIProvider()
    assert asyncio.run(local.classify_category(
        "He said the email campaign would maintain the domain", "Officials will explain the matter to parliament."
    )) == "World"
    assert asyncio.run(local.classify_category(
        "Bakong cross-border QR expansion announced by the National Bank of Cambodia",
        "The National Bank of Cambodia said cross-border QR payments grew across ASEAN.",
    )) == "Cambodia"


def test_a_story_that_never_names_cambodia_is_not_filed_there():
    # Live misfilings from Channel News Asia: one stray body word elsewhere scored 1, and a
    # Cambodia score of 0 counted as "within one point" of it.
    local = LocalAIProvider()
    for title, summary in (
        ("'Two bad options': Hundreds protest in Bangkok, decrying IMF austerity",
         "Protest organisers called on institutions like the International Monetary Fund to focus on climate financing."),
        ("PM Wong to visit Qatar, UAE in first trip to Middle East since taking office",
         "The visits will provide an opportunity for Singapore to strengthen economic cooperation."),
    ):
        category = asyncio.run(local.classify_category(title, summary))
        assert category != "Cambodia", title
        assert filing.resolve_country(category, "KH", title, summary) == "WORLD", title


def test_country_follows_the_story_not_the_publisher():
    assert filing.resolve_country("World", "KH", "US election results", "Donald Trump wins Iowa.") == "WORLD"
    assert filing.resolve_country("Business", "WORLD", "Bakong QR growth", "The National Bank of Cambodia said") == "KH"
    assert filing.resolve_country("Cambodia", "WORLD", "Anything", "") == "KH"


def test_cambodia_category_and_world_desk_are_inconsistent():
    assert filing.filing_is_consistent("WORLD", "cambodia", "CAMBODIA") is False
    assert filing.filing_is_consistent("KH", "cambodia", "CAMBODIA") is True
    # Normal case: the Cambodia desk carries a technology story.
    assert filing.filing_is_consistent("KH", "technology", "WORLD") is True


# --- 5. the publish gate refuses the artifacts ------------------------------------------

def test_quality_gate_blocks_stock_hero_and_wrong_desk():
    from app.common.database import SessionLocal
    from app.models.article import Article
    from app.services.article_service import ArticleService

    db = SessionLocal()
    try:
        art = Article(
            id="gate-1", slug="gate-1", title="A headline long enough to pass",
            summary="The publisher's own sentence about what happened.",
            content="A body of real reporting, long enough for the gate.",
            country="WORLD", category_id=None, author_id=None, language="en",
            primary_source_url="https://example.com/story", hero_image_url=STOCK_HERO,
            hero_image_credit="Photo via Unsplash / Financial Tech Collection",
            source_attribution_text="Source: Example", status="AI_DRAFT",
            seo_title="A headline", seo_description="The publisher's own sentence.",
        )
        checklist = ArticleService.validate_quality_gate(art, db)
        assert checklist.hero_provenance_verified is False
        assert any("stock photograph" in m for m in checklist.missing_items)
        assert checklist.can_publish is False
    finally:
        db.rollback()
        db.close()


def test_stored_seo_title_never_carries_the_site_brand():
    """The metadata template appends the brand once, so a stored suffix doubles it."""
    assert filing.strip_brand_suffix(
        "Cambodia Bakong Expands ASEAN QR Payments | Daily Discovery"
    ) == "Cambodia Bakong Expands ASEAN QR Payments"
    assert filing.strip_brand_suffix("Some story - CamTech.Blog") == "Some story"
    # A hyphen inside the headline is not a brand suffix, and neither is a publisher's.
    kept = "Phnom Penh - Sihanoukville expressway opens"
    assert filing.strip_brand_suffix(kept) == kept
    assert filing.strip_brand_suffix(None) is None


def test_author_serializer_drops_stock_library_portraits():
    from app.schemas.article import ArticleAuthorRef

    ref = ArticleAuthorRef.model_validate({
        "id": "a1", "name": "Dara Vorn", "slug": "dara-vorn",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775?auto=format",
    })
    assert ref.avatar_url is None

    kept = ArticleAuthorRef.model_validate({
        "id": "a2", "name": "Dara Vorn", "slug": "dara-vorn",
        "avatar_url": "https://upload.wikimedia.org/wikipedia/commons/dara-vorn.jpg",
    })
    assert kept.avatar_url.endswith("dara-vorn.jpg")
