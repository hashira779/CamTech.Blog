"""Who a browser is allowed to call this API from.

CORS is the one control that can be handed to an attacker for free: a single over-broad origin in
the list, or credentials switched on for a cookie that nobody issues, turns a harmless-looking
default into a way for any page on the internet to read an admin's session. So the policy is
pinned for *both* answers to "is this live?", not only for today's, and checked against the
middleware the running app actually installed rather than against a copy of its arguments.
"""
from itertools import count

import pytest
from fastapi.testclient import TestClient

from app.common.config import LIVE_ENV_NAMES, is_live, is_live_environment, settings
from app.middleware.security_headers import (
    DEV_ONLY_ORIGINS,
    PRODUCTION_ORIGINS,
    get_cors_origins,
)

# Same trick the authorisation tests use: this module sends a preflight per case, and the shared
# 60/min limiter would otherwise spend the rest of the suite's allowance on CORS.
_TEST_NET_IPS = count(20)


def isolated_client() -> TestClient:
    from app.main import app

    return TestClient(app, headers={"X-Forwarded-For": f"198.51.100.{next(_TEST_NET_IPS) % 250}"})


def preflight(client: TestClient, origin: str, method: str = "POST") -> dict:
    """Send a real cross-origin preflight and hand back the response headers."""
    response = client.options(
        "/api/v1/articles",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    return {key.lower(): value for key, value in response.headers.items()}


# --------------------------------------------------------------------------------------
# The live-environment answer itself
# --------------------------------------------------------------------------------------


def test_the_live_question_has_one_answer_used_by_every_gate():
    """Docs and CORS both key off `is_live`; if they drifted apart, one would be off in prod."""
    from app.main import is_live_environment as main_copy

    assert main_copy is is_live_environment, "app.main must reuse config's answer, not restate it"
    assert LIVE_ENV_NAMES == {"production", "prod", "live"}


@pytest.mark.parametrize(
    "name,expected",
    [
        ("production", True),
        ("Production", True),
        (" PROD ", True),
        ("live", True),
        ("development", False),
        ("dev", False),
        ("staging", False),
        ("test", False),
        ("", False),
        (None, False),
    ],
)
def test_is_live_reads_the_environment_name_leniently(monkeypatch, name, expected):
    monkeypatch.setattr(settings, "APP_ENV", name)
    assert is_live() is expected


# --------------------------------------------------------------------------------------
# The origin list, for each environment
# --------------------------------------------------------------------------------------


def test_a_development_boot_keeps_the_laptop_origins(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "development")
    origins = get_cors_origins()
    for origin in DEV_ONLY_ORIGINS + PRODUCTION_ORIGINS:
        assert origin in origins, f"{origin} should be trusted while nobody but the developer can reach the API"


def test_a_live_boot_trusts_no_localhost_at_all(monkeypatch):
    """The default FRONTEND_URL is a loopback URL. A deployment that forgets to override it must
    not inherit trust in `http://localhost:3000` - that entry admits whatever runs on the API's
    own host, and nothing else, so on a live server it is a hole with no purpose."""
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://localhost:3000")
    origins = get_cors_origins()
    for origin in DEV_ONLY_ORIGINS:
        assert origin not in origins, f"{origin} must not be allowed once the public can reach the API"
    assert PRODUCTION_ORIGINS[0] in origins


def test_a_live_boot_still_honours_a_configured_frontend_origin(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cms.camtech.cam")
    assert get_cors_origins().count("https://cms.camtech.cam") == 1


def test_a_live_boot_adds_a_newly_configured_https_origin(monkeypatch):
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://newsroom.example.org")
    origins = get_cors_origins()
    assert "https://newsroom.example.org" in origins
    assert all(origin.startswith("https://") for origin in origins), "a live policy is https-only"


def test_neither_environment_offers_a_wildcard(monkeypatch):
    for env in ("development", "production"):
        monkeypatch.setattr(settings, "APP_ENV", env)
        assert "*" not in get_cors_origins()
        assert "" not in get_cors_origins()


def test_the_origin_entries_are_origins_not_urls():
    """A trailing path or query in an origin silently matches nothing, so a typo would read as
    "configured" while every request from that site is actually being refused."""
    for origin in DEV_ONLY_ORIGINS + PRODUCTION_ORIGINS:
        assert origin == origin.rstrip("/"), origin
        assert "://" in origin, origin
        assert "/" not in origin.split("://", 1)[1], origin


# --------------------------------------------------------------------------------------
# What the running app actually installed
# --------------------------------------------------------------------------------------


def _cors_kwargs():
    from app.main import app

    for middleware in app.user_middleware:
        if middleware.cls.__name__ == "CORSMiddleware":
            return middleware.kwargs
    raise AssertionError("the app installed no CORSMiddleware")


def test_the_running_app_sends_the_origin_list_it_documents():
    assert _cors_kwargs()["allow_origins"] == get_cors_origins()


def test_the_running_app_does_not_accept_cross_origin_cookies():
    """Nothing in this API calls set_cookie, and no client uses withCredentials, so credentialed
    CORS buys no functionality - it only widens what a stray origin could do. `Authorization:`
    still works: that header is not a credential in the CORS sense."""
    assert _cors_kwargs()["allow_credentials"] is False


def test_a_preflight_from_a_named_site_is_allowed():
    headers = preflight(isolated_client(), "https://blog.camtech.cam")
    assert headers.get("access-control-allow-origin") == "https://blog.camtech.cam"
    assert "authorization" in (headers.get("access-control-allow-headers") or "").lower()


def test_a_preflight_from_anything_else_gets_no_permission():
    for origin in ("https://evil.example", "http://blog.camtech.cam.attacker.example", "null"):
        headers = preflight(isolated_client(), origin)
        assert "access-control-allow-origin" not in headers, f"{origin} was granted cross-origin access"


def test_a_simple_get_from_a_stranger_is_not_granted_either():
    client = isolated_client()
    response = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in {k.lower() for k in response.headers}


def test_a_live_app_would_refuse_a_localhost_page(monkeypatch):
    """End to end, not just the helper: with APP_ENV=production a page served from the developer's
    own machine must not be able to preflight the API."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.middleware.security_headers import get_cors_origins as build

    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://localhost:3000")

    live = FastAPI()
    live.add_middleware(CORSMiddleware, allow_origins=build(), allow_credentials=False)

    @live.get("/api/v1/ping")
    def ping():
        return {"ok": True}

    client = TestClient(live)
    for origin in DEV_ONLY_ORIGINS:
        response = client.options(
            "/api/v1/ping",
            headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
        )
        assert "access-control-allow-origin" not in {k.lower() for k in response.headers}, origin
    assert "access-control-allow-origin" in {
        k.lower() for k in client.get("/api/v1/ping", headers={"Origin": PRODUCTION_ORIGINS[0]}).headers
    }
