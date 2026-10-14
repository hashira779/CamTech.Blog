"""
Discovery quality gates: a scan must add only places that are new and specific, and the
admin must be able to see what actually happened instead of a toast that fires before
the background job starts.
"""
import pytest

from app.services import ai_tourism_engine as eng
from app.services.ai_tourism_engine import (
    AITourismEngine,
    find_near_duplicate_place,
    is_generic_curated_candidate,
)

SIEM_REAP = [
    "Angkor Wat",
    "Ta Prohm (Tomb Raider Temple)",
    "Preah Khan (Royal Sword Temple)",
    "Banteay Srei",
    "Phnom Bakheng Sunset Vantage",
]


class TestNearDuplicateNames:
    @pytest.mark.parametrize("candidate,stored", [
        ("Ta Prohm Temple", "Ta Prohm (Tomb Raider Temple)"),
        ("Preah Khan Temple", "Preah Khan (Royal Sword Temple)"),
        ("Banteay Srei (Citadel of Women)", "Banteay Srei"),
        ("Phnom Bakheng Sunset Hill", "Phnom Bakheng Sunset Vantage"),
        ("Angkor Wat", "Angkor Wat"),
    ])
    def test_alias_and_suffix_spellings_are_the_same_place(self, candidate, stored):
        assert find_near_duplicate_place(candidate, SIEM_REAP) == stored

    def test_different_places_that_share_one_word_stay_new(self):
        # "national"/"museum"/"wat" are all stop-words, leaving "angkor" alone on both
        # sides. One shared word is not enough to call two places the same.
        assert find_near_duplicate_place("Angkor National Museum", SIEM_REAP) is None

    @pytest.mark.parametrize("candidate,stored", [
        ("Banteay Kdei (Citadel of Chambers)", "Banteay Srei"),
        ("Central Market (Phsar Thmey)", "Phnom Penh Night Market (Phsar Reatrey)"),
        ("Kep National Park Trail", "Kep National Park & Sunset Rock"),
    ])
    def test_neighbouring_places_are_not_merged_into_one_row(self, candidate, stored):
        assert find_near_duplicate_place(candidate, [stored]) is None

    def test_similar_looking_khmer_names_are_not_merged(self):
        assert find_near_duplicate_place("Cha Ong Waterfall", ["Ka Chanh Waterfall"]) is None

    def test_spelling_variant_of_one_word_name_is_still_a_duplicate(self):
        assert find_near_duplicate_place(
            "Bou Sra Waterfall", ["Bousra Waterfall (Bou Sra)"]
        ) == "Bousra Waterfall (Bou Sra)"

    def test_single_shared_word_only_counts_when_both_names_are_the_same_kind(self):
        # Both names collapse to the one distinctive word "bakong" once the type word is
        # dropped, so the kind of place is the only thing telling them apart.
        assert find_near_duplicate_place("Bakong", ["Bakong Temple"]) == "Bakong Temple"
        assert find_near_duplicate_place("Bakong Museum", ["Bakong Temple"]) is None

    def test_no_existing_names_means_nothing_to_compare(self):
        assert find_near_duplicate_place("Somewhere New", []) is None
        assert find_near_duplicate_place("", SIEM_REAP) is None


class TestGenericCuratedCandidates:
    @pytest.mark.parametrize("name,province", [
        ("Takeo Historic Pagoda", "Takeo"),
        ("Pursat Riverside Park & Promenade", "Pursat"),
        ("Kandal Central Market", "Kandal"),
    ])
    def test_templated_entries_are_recognised(self, name, province):
        assert is_generic_curated_candidate(name, province) is True

    def test_the_province_name_has_to_be_the_templated_one(self):
        assert is_generic_curated_candidate("Siem Reap Historic Pagoda", "Siem Reap") is True
        assert is_generic_curated_candidate("Historic Pagoda", "Siem Reap") is False
        assert is_generic_curated_candidate("Takeo Historic Pagoda", "Kandal") is False

    @pytest.mark.parametrize("name", [
        "Phnom Chisor Ancient Sanctuary",
        "Bou Sra Waterfall",
        "Kampi Irrawaddy Dolphin Site",
    ])
    def test_real_named_places_pass(self, name):
        assert is_generic_curated_candidate(name, "Takeo") is False


@pytest.mark.asyncio
async def test_auto_save_skips_duplicates_and_placeholders(monkeypatch):
    engine = AITourismEngine()
    saved = []

    async def fake_save(place):
        saved.append(place["name"])
        return {"status": "success"}

    monkeypatch.setattr(engine, "save_approved_place", fake_save)
    candidates = [
        {"name": "Ta Prohm Temple", "is_duplicate": True},
        {"name": "Takeo Historic Pagoda", "generic_placeholder": True},
        {"name": "Tuol Sleng Genocide Museum (S-21)"},
    ]

    stats = await engine._auto_save_candidates(candidates, auto_save=True)

    assert saved == ["Tuol Sleng Genocide Museum (S-21)"]
    assert stats == {"saved_to_db": 1, "duplicates_skipped": 1, "generic_withheld": 1}


@pytest.mark.asyncio
async def test_dry_run_counts_without_touching_the_database(monkeypatch):
    engine = AITourismEngine()
    calls = []

    async def fail_save(place):  # pragma: no cover - must never run
        calls.append(place["name"])
        return {"status": "success"}

    monkeypatch.setattr(engine, "save_approved_place", fail_save)
    stats = await engine._auto_save_candidates(
        [{"name": "Somewhere New"}, {"name": "Old Place", "is_duplicate": True}],
        auto_save=False,
    )

    assert calls == []
    assert stats["saved_to_db"] == 0 and stats["duplicates_skipped"] == 1


@pytest.mark.asyncio
async def test_full_scan_reports_progress_and_counts(monkeypatch):
    engine = AITourismEngine()
    monkeypatch.setattr(engine, "_ensure_cambodia_destinations", lambda db: None)
    monkeypatch.setattr(engine, "discovery_source", lambda: "curated_heritage_list")
    monkeypatch.setattr(eng, "CAMBODIA_PROVINCES", [
        {"name": "Takeo", "slug": "takeo"},
        {"name": "Pailin", "slug": "pailin"},
    ])

    seen_running = []

    async def fake_discover(slug, auto_save=False):
        seen_running.append(eng.SCAN_STATE["running"])
        if slug == "takeo":
            return {"province": "Takeo", "discovered": 4, "saved_to_db": 1,
                    "duplicates_skipped": 2, "generic_withheld": 1, "source": "curated_heritage"}
        return {"province": "Pailin", "discovered": 0, "saved_to_db": 0,
                "duplicates_skipped": 0, "generic_withheld": 0,
                "status": "failed", "message": "Gemini quota exceeded"}

    monkeypatch.setattr(engine, "discover_places_for_province", fake_discover)
    eng.SCAN_STATE.update({"running": False, "last_summary": None})

    result = await engine.run_full_scan()

    assert all(seen_running), "the job must mark itself running before the first province"
    assert result["total_new_places"] == 1
    assert result["total_candidates"] == 4
    assert result["duplicates_skipped"] == 2
    assert result["generic_withheld"] == 1
    assert result["discovery_source"] == "curated_heritage_list"
    assert len(result["errors"]) == 1

    assert eng.SCAN_STATE["running"] is False
    assert eng.SCAN_STATE["provinces_done"] == 2
    assert eng.SCAN_STATE["new_places"] == 1
    assert eng.SCAN_STATE["last_summary"]["new_places"] == 1
    assert eng.SCAN_STATE["last_summary"]["error_count"] == 1


@pytest.mark.asyncio
async def test_full_scan_refuses_to_run_twice(monkeypatch):
    engine = AITourismEngine()
    monkeypatch.setattr(eng, "SCAN_STATE", {**eng.SCAN_STATE, "running": True})

    result = await engine.run_full_scan()

    assert result["status"] == "already_running"


def test_scan_status_is_readable_without_a_scan(monkeypatch):
    engine = AITourismEngine()
    state = engine.get_scan_status()

    assert state["running"] in (True, False)
    assert set(["provinces_total", "new_places", "duplicates_skipped",
                "generic_withheld", "last_summary"]) <= set(state)


def test_curated_fallback_marks_duplicates_and_placeholders(tmp_path, monkeypatch):
    """The offline heritage list must flag what cannot be saved, per province."""
    import json as _json

    payload = {"takeo": [
        {"name": "Takeo Central Market", "description": "Vibrant morning market"},
        {"name": "Phnom Chisor Ancient Sanctuary", "description": "A real temple"},
        {"name": "Kbal Chhay Waterfall", "description": "unrelated province"},
    ]}
    path = tmp_path / "candidates.json"
    path.write_text(_json.dumps(payload), encoding="utf-8")

    engine = AITourismEngine()
    monkeypatch.setattr(engine, "_candidates_json_path", lambda: str(path))
    stored = ["Phnom Chisor Ancient Mountain Temple"]
    places = engine._get_curated_fallback_places(
        "takeo", "Takeo", "dest-1", "",
        {n.strip().lower() for n in stored}, stored,
    )

    by_name = {p["name"]: p for p in places}
    assert by_name["Takeo Central Market"]["generic_placeholder"] is True
    assert by_name["Phnom Chisor Ancient Sanctuary"]["is_duplicate"] is True
    assert by_name["Phnom Chisor Ancient Sanctuary"]["duplicate_of"] == stored[0]
    assert by_name["Kbal Chhay Waterfall"]["is_duplicate"] is False
    assert by_name["Kbal Chhay Waterfall"]["generic_placeholder"] is False


@pytest.fixture()
def admin_client():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.services.auth_service import require_admin
    from app.models.user import User

    app.dependency_overrides[require_admin] = lambda: User(
        id="admin-id", email="admin@example.com", role="ADMIN", is_superuser=True
    )
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.pop(require_admin, None)


def test_scan_endpoint_answers_started_without_promising_counts(admin_client, monkeypatch):
    """The old UI read total_new_places from this response, which always rendered "0"."""
    from app.services import ai_tourism_engine as module

    started = []
    monkeypatch.setattr(module.ai_tourism_engine, "is_scan_running", lambda: False)
    monkeypatch.setattr(module.ai_tourism_engine, "discovery_source", lambda: "curated_heritage_list")
    monkeypatch.setattr(module.ai_tourism_engine, "run_full_scan",
                        lambda: started.append(True))  # never awaited: background task stub

    response = admin_client.post("/api/v1/admin/ai/tourism-scan")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "started"
    assert "total_new_places" not in body
    assert body["discovery_source"] == "curated_heritage_list"


def test_scan_endpoint_refuses_a_second_concurrent_scan(admin_client, monkeypatch):
    from app.services import ai_tourism_engine as module

    monkeypatch.setattr(module.ai_tourism_engine, "is_scan_running", lambda: True)

    response = admin_client.post("/api/v1/admin/ai/tourism-scan")

    assert response.status_code == 409
    assert "already running" in response.json()["detail"].lower()


def test_scan_status_endpoint_reports_progress(admin_client):
    response = admin_client.get("/api/v1/admin/ai/tourism-scan/status")

    assert response.status_code == 200
    body = response.json()
    for key in ("running", "provinces_total", "new_places", "duplicates_skipped",
                "generic_withheld", "discovery_source", "last_summary"):
        assert key in body
