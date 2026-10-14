"""
End-to-end integration test for the pluggable AI pipeline.

Drives the REAL production code path — gateway -> AINewsService -> Article rows ->
News Autopilot publish decision — with the network call stubbed at the single
`ai_gateway.call_provider` seam. This proves, offline and deterministically, that:

  1. a configured provider is picked up (has_any_configured_provider),
  2. the news generator writes and persists real AI_DRAFT articles by itself,
  3. those drafts are stamped with a trusted provider engine, and
  4. the autopilot marks a provider draft as publishable (the original bug was that
     drafts were tagged 'local' and held forever).

Run:  python -m pytest tests/test_ai_pipeline_e2e.py -q
"""
import sys, os, json, asyncio, uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

from app.services import ai_gateway, news_autopilot
from app.services.ai_news_service import ai_news_service
from app.services.image_search_service import image_search_service
from app.common.database import SessionLocal
from app.models.article import Article
from app.models.category import Category
from app.models.author import Author

_TAG = uuid.uuid4().hex[:8]


def _fake_articles():
    # Two deliberately unrelated stories so the deduplicator does not merge them.
    return json.dumps([
        {
            "title": f"Coastal shipping lane {_TAG} reopens after dredging",
            "summary": "A dredged shipping lane has reopened, shortening coastal freight routes.",
            "content": ("## Shipping\n\nThe reopened coastal corridor trims days off freight "
                        "schedules for regional ports, and operators expect lower haulage costs "
                        "once the new depth survey is confirmed by the maritime authority. " * 3),
            "source_url": f"https://example.com/shipping/{_TAG}",
            "source_name": "Example Maritime",
            "tags": ["logistics", "ports"],
            "seo_title": f"Shipping lane {_TAG}",
            "seo_description": "Coastal shipping lane reopens after dredging.",
        },
        {
            "title": f"Quantum processor {_TAG} passes lab certification",
            "summary": "A research team certified a small quantum processor in cold conditions.",
            "content": ("## Computing\n\nResearchers announced that a prototype quantum processor "
                        "cleared a calibration milestone at cryogenic temperatures, marking progress "
                        "toward stable qubit control for future experiments. " * 3),
            "source_url": f"https://another.example/quantum/{_TAG}",
            "source_name": "Another Wire",
            "tags": ["quantum", "research"],
            "seo_title": f"Quantum processor {_TAG}",
            "seo_description": "Quantum processor passes lab certification.",
        },
    ])


def _purge_e2e_drafts():
    db = SessionLocal()
    try:
        db.query(Article).filter(Article.title.like(f"%{_TAG}%")).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


@pytest.fixture
def stubbed_provider(monkeypatch):
    """One enabled, configured fake provider + stubbed network + stubbed image search."""
    _purge_e2e_drafts()
    fake = ai_gateway.AIProvider(id="testvendor", label="Test Vendor", style="openai",
                                 model="e2e-1", base_url="https://x.invalid", api_key="k", enabled=True)
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: [fake])
    monkeypatch.setattr(ai_gateway, "call_provider", lambda p, prompt, **kw: _fake_articles())

    async def _fake_image(*args, **kwargs):
        return "https://img.example.com/x.jpg", "Test Credit", "test image"
    monkeypatch.setattr(image_search_service, "search_news_image", _fake_image)
    yield fake
    _purge_e2e_drafts()


def test_full_pipeline_writes_and_approves_publish(stubbed_provider):
    assert ai_gateway.has_any_configured_provider() is True

    result = asyncio.run(ai_news_service.generate_news_for_category("technology", count=2))
    assert result.get("status") == "success", result
    assert result.get("saved") == 2, result

    slugs = [a["slug"] for a in result["articles"]]
    engine = f"{stubbed_provider.id}:{stubbed_provider.model}"

    db = SessionLocal()
    try:
        drafts = db.query(Article).filter(Article.slug.in_(slugs)).all()
        assert len(drafts) == 2
        for art in drafts:
            assert art.status == "AI_DRAFT"
            meta = json.loads(art.ai_draft_metadata)
            assert meta["generator"] == engine
            assert news_autopilot.is_trusted_engine(news_autopilot._engine(meta)) is True
            # The core fix: a real-provider draft is publishable, not held as 'local'.
            verdict = news_autopilot.evaluate_draft(db, art, run_quality_gate=False)
            assert verdict.eligible is True, verdict.reason
            assert verdict.auto_publish_at is not None
    finally:
        db.close()


def test_local_engine_draft_is_held():
    """Contrast case: a template/'local' draft must NOT be auto-published."""
    _purge_e2e_drafts()
    db = SessionLocal()
    try:
        cat = db.query(Category).first()
        author = db.query(Author).first()
        art = Article(
            title=f"E2E Local Held Draft {_TAG}",
            slug=f"e2e-local-{_TAG}",
            summary="held", content="x" * 400, status="AI_DRAFT", country="WORLD",
            language="en", category_id=cat.id, author_id=author.id,
            primary_source_url=f"https://example.com/held/{_TAG}",
            ai_draft_metadata=json.dumps({"generator": "local"}),
        )
        db.add(art); db.commit(); db.refresh(art)
        verdict = news_autopilot.evaluate_draft(db, art, run_quality_gate=False)
        assert verdict.eligible is False
        assert "not a configured AI provider" in verdict.reason
    finally:
        db.query(Article).filter(Article.slug == f"e2e-local-{_TAG}").delete(synchronize_session=False)
        db.commit(); db.close()
