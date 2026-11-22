"""Offline publishing safeguards, with an isolated database."""
import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.common.database import Base
from app.models.article import Article
from app.models.author import Author
from app.models.category import Category
from app.services.article_service import ArticleService
from app.services.content_quality import body_quality_issue, has_specific_source
from app.services import news_autopilot

BODY = ("Engineers published a dated technical report explaining the network upgrade. "
        "The document identifies affected software versions and migration steps. "
        "Operators can verify their version against the release notes before maintenance. ") * 8


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Author(id="author", name="Editor", slug="editor"))
        session.add(Category(id="category", name="Technology", slug="technology", scope="WORLD"))
        session.commit()
        yield session
    engine.dispose()


def article(**overrides):
    values = dict(id="test", title="Network upgrade release notes explained", slug="network-upgrade",
                  summary="A technical report explains the upgrade and operational implications.",
                  content=BODY, status="AI_DRAFT", country="WORLD", author_id="author", category_id="category",
                  primary_source_url="https://example.com/releases/upgrade", source_attribution_text="Release notes",
                  ai_draft_metadata=json.dumps({"engine": "gemini"}))
    return Article(**(values | overrides))


def test_substantive_draft_passes_structure_but_has_no_editor_review(db):
    verdict = ArticleService.validate_quality_gate(article(), db)
    assert verdict.can_publish
    assert not verdict.editorial_reviewed
    assert not verdict.no_unsupported_claims


@pytest.mark.parametrize("content", ["One sentence.", "<p> </p>" * 2000,
    BODY + " Official statements and documentation are being monitored."])
def test_gate_blocks_thin_padded_and_generic_copy(db, content):
    assert not ArticleService.validate_quality_gate(article(content=content), db).can_publish


def test_summary_alone_cannot_be_the_article():
    assert body_quality_issue(BODY, BODY)


@pytest.mark.parametrize("url", ["https://example.com", "https://example.com/", "http-invalid", "javascript:alert(1)"])
def test_requires_specific_source_document(url):
    assert not has_specific_source(url)


def test_editor_hold_wins_over_previously_enabled_auto_publishing(db):
    news_autopilot.set_setting(db, "AUTOPILOT_AUTO_PUBLISH_ENABLED", "true")
    verdict = news_autopilot.evaluate_draft(db, article())
    assert not verdict.eligible
    assert "Editor review required" in verdict.reason
    assert news_autopilot.publish_ready_content(db)["disabled"]
