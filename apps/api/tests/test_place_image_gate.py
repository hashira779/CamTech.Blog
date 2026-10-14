"""Regression tests for place galleries: only real, place-matched, loadable images may be stored.

Guards against the bug where a place card showed unrelated stock photos (a butterfly or a beach
on the Angkor Centre for Conservation of Biodiversity card) and broken "Gallery N" tiles.
"""
import asyncio

import pytest

from app.services import ai_tourism_engine as eng


PLACE = "Angkor Centre for Conservation of Biodiversity"
GENERIC_UNSPLASH = "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&q=85"
GENERIC_WIKI_POOL = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/1600px-Angkor_Wat.jpg"
REAL_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/7/7e/Angkor_Centre_for_Conservation_of_Biodiversity.jpg"


def test_static_generic_pool_is_never_valid_for_a_place():
    # Read the pools at runtime: hardcoding one URL here made the test rot when the entry left.
    from app.services import image_search_service as pools

    pool_urls = [
        url
        for attr in ("CATEGORY_NEWS_IMAGE_POOLS", "PLACE_CATEGORY_POOLS")
        for pool in getattr(pools, attr).values()
        for url in pool
    ]
    assert pool_urls, "expected the generic pools to still exist"
    for url in pool_urls:
        assert eng.is_generic_place_image(url), url
        assert eng.is_generic_place_image(url.split("?")[0]), url
    assert not eng.is_generic_place_image(REAL_IMAGE)


def test_unrelated_photo_without_context_is_rejected():
    ok, score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/3/31/Morpho_didius_butterfly.jpg", "", PLACE, None
    )
    assert ok is False and score < eng.IMAGE_RELEVANCE_THRESHOLD


def test_source_context_confirms_the_place():
    # Same opaque filename, but it came from the Wikipedia article about this place.
    ok, score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/3/31/DSC01234.jpg", PLACE, PLACE, None
    )
    assert ok is True and score == 1.0


def test_acronym_filename_counts_as_evidence():
    ok, score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/ACCB_annex_building.jpg", "", PLACE, None
    )
    assert ok is True and score >= eng.IMAGE_RELEVANCE_THRESHOLD


def test_nearbut_wrong_place_name_is_rejected():
    # Shares one word ("Angkor") with the target, but is a different site.
    ok, _score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/4/44/Angkor_Thom_gate.jpg", "", PLACE, None
    )
    assert ok is False


def test_place_tokens_ignore_generic_travel_words():
    assert eng.place_name_tokens("Bokor National Park") == ["bokor"]
    assert "waterfall" not in eng.place_name_tokens("Kbal Chai Waterfall")
    assert set(eng.place_name_tokens("Kbal Chai Waterfall")) == {"kbal", "chai"}


def _patch_sources(monkeypatch, wiki_items, commons_items, you_items=None):
    async def fake_wiki(place_name, province_name, local_name=None, max_images=15):
        return wiki_items

    async def fake_commons(place_name, province_name, max_images=15):
        return commons_items

    async def fake_you(place_name, province_name, you_api_key, max_images=12):
        return you_items or []

    async def fake_live(urls, **kwargs):
        return list(urls)

    monkeypatch.setattr(eng, "fetch_wiki_image_items", fake_wiki)
    monkeypatch.setattr(eng, "fetch_commons_image_items", fake_commons)
    monkeypatch.setattr(eng, "fetch_you_image_items", fake_you)
    monkeypatch.setattr(eng, "filter_live_images", fake_live)
    # Any attempt to pad with the generic pool must blow the test up.
    from app.services import image_search_service as image_search_module

    def boom(*args, **kwargs):
        raise AssertionError("generic stock padding must not be used for place galleries")

    monkeypatch.setattr(image_search_module.ImageSearchService, "get_diverse_place_gallery", boom)


def test_resolve_keeps_only_verified_images_and_never_pads(monkeypatch):
    _patch_sources(
        monkeypatch,
        wiki_items=[{"url": REAL_IMAGE, "context": PLACE}],
        commons_items=[
            {"url": GENERIC_UNSPLASH, "context": "File:Some beach.jpg"},
            {"url": "https://upload.wikimedia.org/wikipedia/commons/3/31/Morpho_didius_butterfly.jpg",
             "context": "File:Morpho didius butterfly.jpg"},
        ],
    )

    hero, gallery = asyncio.run(
        eng.ai_tourism_engine._resolve_place_images(PLACE, "Siem Reap", "ATTRACTION", None, None, target_count=12)
    )

    assert gallery == [REAL_IMAGE]           # 1 real photo, not 12 padded ones
    assert hero == REAL_IMAGE
    assert not any(eng.is_generic_place_image(u) for u in gallery)


def test_resolve_reports_no_image_instead_of_a_wrong_one(monkeypatch):
    _patch_sources(
        monkeypatch,
        wiki_items=[],
        commons_items=[{"url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600", "context": "File:Kep beach sunset.jpg"}],
    )

    hero, gallery = asyncio.run(
        eng.ai_tourism_engine._resolve_place_images(PLACE, "Siem Reap", "ATTRACTION", None, None, target_count=12)
    )

    assert hero == ""
    assert gallery == []


def test_dead_urls_are_reported_not_stored(monkeypatch):
    async def fake_live(urls, **kwargs):
        return [u for u in urls if "dead" not in u]

    monkeypatch.setattr(eng, "filter_live_images", fake_live)
    _patch_sources(
        monkeypatch,
        wiki_items=[
            {"url": REAL_IMAGE, "context": PLACE},
            {"url": "https://upload.wikimedia.org/wikipedia/commons/0/0x/dead-Angkor_Centre_for_Conservation_of_Biodiversity.jpg", "context": PLACE},
        ],
        commons_items=[],
    )
    # re-apply the stub after _patch_sources overwrites it
    monkeypatch.setattr(eng, "filter_live_images", fake_live)

    hero, gallery = asyncio.run(
        eng.ai_tourism_engine._resolve_place_images(PLACE, "Siem Reap", "ATTRACTION", None, None, target_count=12)
    )
    assert gallery == [REAL_IMAGE]
    assert hero == REAL_IMAGE


def test_curated_candidates_no_longer_fabricate_a_gallery():
    engine = eng.ai_tourism_engine
    import json as _json
    import os as _os

    json_path = _os.path.join(_os.path.dirname(eng.__file__), "..", "data_province_candidates.json")
    slug = "siem-reap"
    if not _os.path.exists(json_path):
        pytest.skip("province candidate dataset not present")

    processed = engine._get_curated_fallback_places(slug, "Siem Reap", "dest-1", "/images/destinations/siem-reap.jpg", set())
    if not processed:
        pytest.skip(f"no curated candidates for {slug}")
    for item in processed:
        assert item["hero_image_url"] == ""
        assert _json.loads(item["gallery_json"]) == []


# --------------------------------------------------------------------------- #
# Name variants: an alias in parentheses must not hide the real name            #
# --------------------------------------------------------------------------- #

def test_parenthetical_alias_does_not_dilute_the_place_name():
    # Ta Prohm has thousands of Commons photos titled "Ta Prohm ..."; scoring the whole
    # string "Ta Prohm (Tomb Raider Temple)" used to demand "tomb" and "raider" as well and
    # rejected 31 genuine candidates, leaving the temple with zero photos.
    ok, score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/9/9d/Ta_Prohm_entrance_2019.jpg",
        "File:Ta Prohm entrance 2019.jpg",
        "Ta Prohm (Tomb Raider Temple)",
        None,
    )
    assert ok is True and score == 1.0


def test_alias_variants_are_enumerated_in_both_directions():
    variants = eng.place_name_variants("Ta Prohm (Tomb Raider Temple)")
    assert "Ta Prohm" in variants and "Tomb Raider Temple" in variants
    assert eng.place_name_variants("Plain Name") == ["Plain Name"]


def test_nickname_alone_still_needs_the_full_alias():
    # A random temple photo must not ride in on one shared word of a two-word nickname.
    ok, _score = eng.verify_place_image(
        "https://upload.wikimedia.org/wikipedia/commons/1/11/Tomb_of_a_king.jpg",
        "File:Tomb of a king.jpg",
        "Ta Prohm (Tomb Raider Temple)",
    )
    assert ok is False


# --------------------------------------------------------------------------- #
# Guide / event hero images: same policy, article-shaped matching               #
# --------------------------------------------------------------------------- #

def test_guide_hero_accepts_a_commons_file_that_names_the_subject():
    assert eng.content_image_matches(
        "https://upload.wikimedia.org/wikipedia/commons/2/28/Angkor_Wat_Photography_Tour.jpg",
        context="File:Angkor Wat Photography Tour.jpg",
        subject="Angkor Wat Sunrise Photography & Sacred Etiquette",
        destination="Siem Reap",
    )


def test_guide_hero_rejects_the_madrid_stock_photo():
    # photo-1539037116277 spent months labelled "Cambodia Angkor Sunrise" while showing Madrid.
    assert not eng.content_image_matches(
        GENERIC_UNSPLASH, context="Gran Via Madrid at dusk",
        subject="Angkor Wat Sunrise Photography", destination="Siem Reap",
    )
    assert not eng.content_image_matches(
        GENERIC_UNSPLASH, context="", subject="Angkor Wat Sunrise Photography", destination="Siem Reap",
    )


def test_guide_hero_rejects_opaque_stock_urls_without_any_location_context():
    assert not eng.content_image_matches(
        "https://images.unsplash.com/photo-1507525428983-26c1652b9c4a?auto=format&fit=crop&w=1600&q=85",
        context="", subject="Kampot Pepper Plantation Walk", destination="Kampot",
    )


def test_guide_hero_matches_on_the_destination_alone():
    assert eng.subject_context_matches(
        "File:DSC0042 Phnom Penh riverside.jpg", subject="Night markets worth the trip", destination="Phnom Penh"
    )


def test_guide_hero_rejects_a_different_province():
    assert not eng.subject_context_matches(
        "File:DSC0042 Sihanoukville beach.jpg", subject="Bokor Mountain viewpoints", destination="Kampot"
    )


def test_bundled_asset_name_is_checked_against_the_subject():
    # Scripts keep "angkor-wat.jpg" on an Angkor event, drop a royal-palace photo from a
    # Kampot pepper guide.
    assert eng.subject_context_matches("angkor-wat.jpg", subject="Angkor Wat Half Marathon", destination="Siem Reap")
    assert not eng.subject_context_matches("royal-palace-phnom-penh.jpg", subject="Bokor Pepper Farm", destination="Kampot")


# --------------------------------------------------------------------------- #
# Liveness check: never delete a photo on an inconclusive answer               #
# --------------------------------------------------------------------------- #

def _stub_http(monkeypatch, statuses: dict):
    """Replace httpx.AsyncClient with a fake that answers with fixed status codes."""

    class _Resp:
        def __init__(self, status):
            self.status_code = status
            self.headers = {"content-type": "image/jpeg"}

    class _Stream:
        def __init__(self, status):
            self._status = status

        async def __aenter__(self):
            return _Resp(self._status)

        async def __aexit__(self, *exc):
            return False

    class _Client:
        def __init__(self, *a, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        def stream(self, _method, url, headers=None, timeout=None):
            return _Stream(statuses.get(url, 200))

    monkeypatch.setattr(eng.httpx, "AsyncClient", _Client)


def test_only_proven_404s_are_dropped(monkeypatch):
    throttled = "https://upload.wikimedia.org/wikipedia/commons/9/9d/ta_prohm.jpg"
    gone = "https://upload.wikimedia.org/wikipedia/commons/1/11/deleted.jpg"
    good = "https://upload.wikimedia.org/wikipedia/commons/2/28/angkor.jpg"
    _stub_http(monkeypatch, {throttled: 429, gone: 404, good: 200})

    kept = asyncio.run(eng.filter_live_images([throttled, gone, good]))
    assert kept == [throttled, good], "a 429 must not be treated as a dead photo"


def test_sync_keeps_original_url_when_rehost_is_rate_limited(monkeypatch):
    async def fake_get(self, url, headers=None):
        class _R:
            status_code = 429
            content = b""
            headers = {"Content-Type": "text/html"}
        return _R()

    class _Client:
        def __init__(self, *a, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        get = fake_get

    monkeypatch.setattr(eng.httpx, "AsyncClient", _Client)
    # Storage configured -> the download path is exercised; a 429 keeps the verified URL.
    monkeypatch.setattr(eng.storage_service, "is_configured", lambda: True)
    monkeypatch.setattr(eng.s3_service, "is_configured", lambda: True)
    monkeypatch.setattr(eng.s3_service, "_get_client_and_config", lambda: (None, {"public_domain": "cdn.example.com"}))

    url = "https://upload.wikimedia.org/wikipedia/commons/9/9d/ta_prohm.jpg"
    assert asyncio.run(eng.ai_tourism_engine._sync_single_image(url, "Siem Reap", "Ta Prohm")) == url
