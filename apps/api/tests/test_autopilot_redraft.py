"""Held drafts get a second chance once an AI provider answers.

Ingestion stamps a draft `local` when no provider answered; the autopilot never trusts those
for auto-publish, so before the re-draft step they sat until the archive job took them. These
tests drive `redraft_held_drafts` with a stub drafter at the provider seam, against rows that
are created and removed here.
"""
import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.common.database import SessionLocal
from app.models.article import Article, ArticleRevision
from app.models.audit import AuditLog
from app.models.author import Author
from app.models.category import Category
from app.services import ai_gateway, news_autopilot

BODY = "The publisher's own sentence about the reopened bridge. " * 4


class StubDrafter:
    def __init__(self, engine="gemini:gemini-2.5-flash", fail=False):
        self.engine, self.fail, self.calls = engine, fail, 0

    async def generate_draft_editorial(self, title, source_content, source_name):
        self.calls += 1
        if self.fail:
            raise RuntimeError("No AI provider produced an editorial draft: ['gemini: HTTP 429']")
        return {
            "summary": f"{source_name} reports that the bridge reopened after repairs. " * 3,
            "key_points": ["Traffic resumes across the river crossing from Monday morning",
                           "Repairs to the main span took six months and cost more than planned"],
            "why_it_matters": "The bridge links two provinces.",
            "seo_title": "Bridge reopens",
            "seo_description": "The bridge reopened after repairs.",
            "engine": self.engine,
        }


@pytest.fixture
def db(monkeypatch):
    monkeypatch.setattr(ai_gateway, "has_any_configured_provider", lambda: True)
    session = SessionLocal()
    created = []
    category = session.query(Category).first()
    author = session.query(Author).first()
    if not (category and author):
        pytest.skip("needs a seeded category and author")

    def make(engine="local", age_hours=3, **meta):
        art = Article(
            id=str(uuid.uuid4()), slug=f"redraft-{uuid.uuid4().hex[:10]}",
            title="Bridge reopens after six months of repairs", summary=BODY, content=BODY,
            country="KH", language="en", status="AI_DRAFT", category_id=category.id, author_id=author.id,
            primary_source_url="https://example.com/bridge", source_attribution_text="Source: Example Wire",
            created_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=age_hours),
            ai_draft_metadata=json.dumps({"engine": engine, "source": "Example Wire", **meta}),
        )
        session.add(art)
        session.commit()
        created.append(art.id)
        return art

    session.make = make
    yield session
    session.rollback()
    session.__dict__.pop("query", None)  # tests scope query to their own rows; undo that first
    session.query(ArticleRevision).filter(ArticleRevision.article_id.in_(created)).delete(synchronize_session=False)
    session.query(AuditLog).filter(AuditLog.entity_id.in_(created)).delete(synchronize_session=False)
    session.query(Article).filter(Article.id.in_(created)).delete(synchronize_session=False)
    session.commit()
    session.close()


def _meta(db, art):
    db.refresh(art)
    return json.loads(art.ai_draft_metadata)


def _ours(db, *arts):
    """Only our rows: other local drafts in the dev database must not be touched by a test."""
    ids = {a.id for a in arts}
    original = db.query

    def scoped(*entities):
        q = original(*entities)
        return q.filter(Article.id.in_(ids)) if entities and entities[0] is Article else q

    return scoped


def test_a_held_local_draft_is_rewritten_by_the_provider(db, monkeypatch):
    art = db.make()
    monkeypatch.setattr(db, "query", _ours(db, art))
    result = asyncio.run(news_autopilot.redraft_held_drafts(db, StubDrafter()))
    assert result["redrafted"] == 1
    meta = _meta(db, art)
    assert meta["engine"] == "gemini:gemini-2.5-flash"
    assert meta["redrafted_from"] == "local"
    assert "Example Wire reports" in art.summary
    assert len(json.loads(art.key_points)) == 2


def test_a_redraft_restarts_the_review_window(db, monkeypatch):
    art = db.make(age_hours=10)
    monkeypatch.setattr(db, "query", _ours(db, art))
    asyncio.run(news_autopilot.redraft_held_drafts(db, StubDrafter()))
    verdict = news_autopilot.evaluate_draft(db, art, run_quality_gate=False)
    assert verdict.eligible is True
    # Created 10 h ago, but re-drafted now: editors get the full window on the new copy
    assert verdict.auto_publish_at > datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)


def test_failures_are_recorded_and_retries_are_capped(db, monkeypatch):
    art = db.make()
    monkeypatch.setattr(db, "query", _ours(db, art))
    drafter = StubDrafter(fail=True)
    for _ in range(news_autopilot.REDRAFT_MAX_ATTEMPTS + 2):
        asyncio.run(news_autopilot.redraft_held_drafts(db, drafter))
    assert drafter.calls == news_autopilot.REDRAFT_MAX_ATTEMPTS
    meta = _meta(db, art)
    assert meta["engine"] == "local"
    assert "HTTP 429" in meta["redraft_error"]


def test_a_provider_that_falls_back_to_local_does_not_count_as_a_redraft(db, monkeypatch):
    art = db.make()
    monkeypatch.setattr(db, "query", _ours(db, art))
    result = asyncio.run(news_autopilot.redraft_held_drafts(db, StubDrafter(engine="local")))
    assert result["redrafted"] == 0
    assert _meta(db, art)["engine"] == "local"


def test_trusted_drafts_and_missing_providers_are_left_alone(db, monkeypatch):
    trusted = db.make(engine="gemini:gemini-2.5-flash")
    monkeypatch.setattr(db, "query", _ours(db, trusted))
    drafter = StubDrafter()
    asyncio.run(news_autopilot.redraft_held_drafts(db, drafter))
    assert drafter.calls == 0

    monkeypatch.setattr(ai_gateway, "has_any_configured_provider", lambda: False)
    held = db.make()
    monkeypatch.setattr(db, "query", _ours(db, held))
    result = asyncio.run(news_autopilot.redraft_held_drafts(db, drafter))
    assert result.get("no_provider") is True and drafter.calls == 0
