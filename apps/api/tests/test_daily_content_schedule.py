"""Daily scheduling and category coverage, using an isolated settings database."""
import asyncio
from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models.audit import SiteSetting
from app.services import news_autopilot as autopilot
from app.services.ai_news_service import AINewsService, CATEGORY_PROMPTS


@pytest.fixture
def settings_db():
    engine = create_engine("sqlite:///:memory:")
    SiteSetting.__table__.create(engine)
    with Session(engine) as db:
        yield db
    engine.dispose()


def test_news_runs_after_seven_and_once_per_cambodia_day(settings_db):
    morning = datetime(2026, 11, 22, 7, tzinfo=autopilot.CAMBODIA_TZ)
    assert not autopilot.daily_news_is_due(settings_db, morning - timedelta(minutes=1))
    assert autopilot.daily_news_is_due(settings_db, morning)
    autopilot.mark_daily_news_ran(settings_db, morning)
    assert not autopilot.daily_news_is_due(settings_db, morning + timedelta(hours=10))
    assert autopilot.daily_news_is_due(settings_db, morning + timedelta(days=1))


@pytest.mark.parametrize("key", ["AUTOPILOT_NEWS_ENABLED", "AUTOPILOT_DAILY_NEWS_ENABLED"])
def test_daily_news_respects_disabled_switch(settings_db, key):
    autopilot.set_setting(settings_db, key, "false")
    assert not autopilot.daily_news_is_due(
        settings_db, datetime(2026, 11, 22, 12, tzinfo=autopilot.CAMBODIA_TZ)
    )


def test_travel_refreshes_daily_and_respects_existing_override(settings_db, monkeypatch):
    now = datetime(2026, 11, 22, 7)
    monkeypatch.setattr(autopilot, "_utcnow_naive", lambda: now)
    autopilot.set_setting(settings_db, autopilot.LAST_TRAVEL_RUN_KEY,
                          (now - timedelta(hours=24)).isoformat())
    interval = autopilot.get_int(settings_db, "AUTOPILOT_TRAVEL_INTERVAL_HOURS")
    assert interval == 24
    assert autopilot.section_is_due(settings_db, "AUTOPILOT_TRAVEL_ENABLED",
                                    autopilot.LAST_TRAVEL_RUN_KEY, interval)
    autopilot.mark_section_ran(settings_db, autopilot.LAST_TRAVEL_RUN_KEY, "test")
    assert not autopilot.section_is_due(settings_db, "AUTOPILOT_TRAVEL_ENABLED",
                                        autopilot.LAST_TRAVEL_RUN_KEY, interval)
    autopilot.set_setting(settings_db, "AUTOPILOT_TRAVEL_INTERVAL_HOURS", "168")
    assert autopilot.get_int(settings_db, "AUTOPILOT_TRAVEL_INTERVAL_HOURS") == 168


def test_daily_batch_includes_blockchain_and_continues_after_category_failure(monkeypatch):
    service = AINewsService()
    seen = []

    async def generate(slug):
        seen.append(slug)
        if slug == "blockchain":
            raise RuntimeError("Provider unavailable")
        return {"status": "success", "saved": 1, "skipped": 0}

    monkeypatch.setattr(service, "generate_news_for_category", generate)
    result = asyncio.run(service.generate_all_categories())
    assert "blockchain" in seen
    assert set(seen) == set(CATEGORY_PROMPTS)
    assert result["total_saved"] == len(CATEGORY_PROMPTS) - 1
    assert any("blockchain" in error for error in result["errors"])
