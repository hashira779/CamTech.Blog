"""Who is allowed to do what in /api/v1/admin, and what the platform refuses to say out loud.

The audit behind these checks found that `require_admin` had always admitted EDITOR, JOURNALIST
and REVIEWER, and that the routes using it were not only editorial ones: one newsroom role could
read every storage and AI credential, write a new database connection string and have the API copy
every table - password hashes included - into it, and register an AI provider the gateway would
then be told to connect to. It could also name itself Googlebot and stop being rate limited
anywhere, including the endpoint that spends money per call.

Each test here states the permission boundary as an executable fact, so a future route that forgets
the boundary fails instead of quietly widening it.
"""
import json
import os
import subprocess
import sys
from itertools import count
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.rate_limiter import rate_limiter
from app.models.user import User
from app.services.auth_service import get_current_user, require_admin, require_infra_admin


SECRET = "AKIA-real-looking-secret-that-must-never-leave-the-database-0000"
MASKED_TAIL = SECRET[-4:]

# This module deliberately fires dozens of requests at one IP, which is exactly what the shared
# 60/min limiter is there to stop. Without a bucket of its own it exhausts the allowance the rest
# of the suite is spending at the same time, and unrelated travel and tourism tests come back 429.
_TEST_NET_IPS = count(2)


def isolated_client(label: str = "module") -> TestClient:
    """A client whose traffic lands in its own rate-limit bucket (TEST-NET-3, never routable)."""
    return TestClient(app, headers={"X-Forwarded-For": f"198.51.100.{next(_TEST_NET_IPS) % 250}"})


@pytest.fixture(autouse=True)
def _leave_the_shared_limiter_as_we_found_it():
    before = {key: list(value) for key, value in rate_limiter._buckets.items()}
    yield
    rate_limiter._buckets.clear()
    rate_limiter._buckets.update(before)


def as_role(role: str, superuser: bool = False) -> User:
    """A transient User. Nothing here touches the users table or issues a token."""
    return User(
        id=f"stub-{role.lower()}",
        email=f"{role.lower()}@example.invalid",
        full_name=role,
        role=role,
        is_active=True,
        is_superuser=superuser,
    )


@pytest.fixture
def client(request):
    return isolated_client(request.node.name)


@pytest.fixture
def signed_in_as():
    """Swap the resolved user for the duration of a test, then put the real dependency back."""
    created = []

    def _sign_in(user: User):
        app.dependency_overrides[get_current_user] = lambda: user
        created.append(user)

    yield _sign_in
    app.dependency_overrides.pop(get_current_user, None)


# --------------------------------------------------------------------------- the dependency itself
@pytest.mark.parametrize("role", ["SUPER_ADMIN", "ADMIN"])
def test_administrators_pass_the_infra_guard(role):
    assert require_infra_admin(current_user=as_role(role)) is not None


@pytest.mark.parametrize("role", ["EDITOR", "JOURNALIST", "REVIEWER", "MODERATOR", "ANALYST", "USER"])
def test_non_administrators_are_refused_the_infra_guard(role):
    with pytest.raises(HTTPException) as refused:
        require_infra_admin(current_user=as_role(role))
    assert refused.value.status_code == 403
    assert "Administrator" in refused.value.detail


def test_a_superuser_without_an_admin_role_title_still_passes():
    assert require_infra_admin(current_user=as_role("ANALYST", superuser=True)) is not None


def test_the_editorial_guard_still_admits_the_newsroom_roles():
    # Publishing must not break: this is the whole reason require_infra_admin exists instead of
    # tightening require_admin in place.
    for role in ("ADMIN", "EDITOR", "JOURNALIST", "REVIEWER"):
        assert require_admin(current_user=as_role(role)) is not None
    with pytest.raises(HTTPException) as refused:
        require_admin(current_user=as_role("USER"))
    assert refused.value.status_code == 403


# --------------------------------------------------------------------------- live routes, real roles
INFRA_ROUTES = [
    ("post", "/api/v1/admin/database/migrate", {"target_url": "postgresql://u:p@db.example:5432/new", "copy_data": False}),
    ("get", "/api/v1/admin/ai-providers", None),
    ("put", "/api/v1/admin/ai-providers", {"providers": []}),
    ("post", "/api/v1/admin/ai-providers/test", {"provider_id": "openai"}),
    ("delete", "/api/v1/admin/storage/some-file-id", None),
    ("get", "/api/v1/admin/storage-config/providers", None),
    ("post", "/api/v1/admin/storage-config/providers", {"name": "x", "provider_type": "LOCAL_S3"}),
    ("put", "/api/v1/admin/storage-config/providers/1", {"name": "x", "provider_type": "LOCAL_S3"}),
    ("delete", "/api/v1/admin/storage-config/providers/1", None),
    ("get", "/api/v1/admin/storage-config/policies", None),
    ("post", "/api/v1/admin/storage-config/policies", {"entity_type": "ARTICLE", "provider_id": "1"}),
    ("delete", "/api/v1/admin/storage-config/policies/1", None),
]

EDITORIAL_ROUTES = [
    ("get", "/api/v1/admin/dashboard-stats"),
    ("get", "/api/v1/admin/review-queue"),
    ("get", "/api/v1/admin/audit-logs"),
    ("get", "/api/v1/admin/autopilot"),
    ("get", "/api/v1/admin/settings"),
    ("get", "/api/v1/admin/place-suggestions"),
]


@pytest.mark.parametrize("method,path,payload", INFRA_ROUTES, ids=[r[1].replace("/api/v1/admin", "") + " " + r[0] for r in INFRA_ROUTES])
def test_an_editor_cannot_reach_any_infrastructure_or_credential_route(client, signed_in_as, method, path, payload):
    signed_in_as(as_role("EDITOR"))
    response = client.request(method, path, json=payload)
    assert response.status_code == 403, f"{method.upper()} {path} let an EDITOR through: {response.status_code}"
    assert "Administrator role required" in response.json()["detail"]


@pytest.mark.parametrize("method,path,payload", INFRA_ROUTES, ids=[r[1].replace("/api/v1/admin", "") + " " + r[0] for r in INFRA_ROUTES])
def test_anonymous_cannot_reach_any_infrastructure_route(client, method, path, payload):
    response = client.request(method, path, json=payload)
    assert response.status_code == 401, f"{method.upper()} {path} answered without a token: {response.status_code}"


@pytest.mark.parametrize("method,path", EDITORIAL_ROUTES, ids=[r[1].replace("/api/v1/admin", "") for r in EDITORIAL_ROUTES])
def test_an_editor_keeps_every_editorial_route(client, signed_in_as, method, path):
    signed_in_as(as_role("EDITOR"))
    response = client.request(method, path)
    assert response.status_code == 200, f"{method.upper()} {path} broke editorial work: {response.status_code} {response.text[:200]}"


# --------------------------------------------------------------------------- guard wiring, not just availability
def _dependency_names(node, found=None) -> set:
    found = set() if found is None else found
    call = getattr(node, "call", None) or getattr(node, "dependency", None)
    if call is not None:
        found.add(getattr(call, "__name__", str(call)))
    for sub in getattr(node, "dependencies", []) or []:
        _dependency_names(sub, found)
    return found


def _route_guards():
    """The guards each route actually resolves, walked from the dependant tree.

    FastAPI keeps a `Depends()` written in the endpoint signature on `route.dependant`, not on
    `route.dependencies`, so reading only the latter reported every admin route as unguarded.
    """
    index = {}

    def walk(routes, prefix="", inherited=frozenset()):
        for route in routes:
            # FastAPI >= 0.141 keeps each include_router() as one nested entry instead of copying
            # its routes onto the app; without descending, the index came back empty.
            context = getattr(route, "include_context", None)
            if context is not None and hasattr(route, "original_router"):
                extra = set(n for dep in context.dependencies or [] for n in _dependency_names(dep))
                walk(route.original_router.routes, prefix + context.prefix, inherited | extra)
                continue
            methods = getattr(route, "methods", None)
            dependant = getattr(route, "dependant", None)
            if not methods or dependant is None:
                continue
            guards = set(inherited) | _dependency_names(dependant) | set(
                name for dep in getattr(route, "dependencies", []) or [] for name in _dependency_names(dep)
            )
            for method in methods:
                index[(method, prefix + route.path)] = guards

    walk(app.routes)
    return index


ROUTES = _route_guards()


def test_the_guard_index_actually_resolved_the_admin_routes():
    # A silently empty index would make every wiring assertion below vacuously true.
    assert len(ROUTES) > 50, len(ROUTES)
    assert ROUTES[("GET", "/api/v1/admin/audit-logs")], "no guards found on a route that has them"


def test_the_route_that_copies_every_table_is_administrator_only():
    assert "require_infra_admin" in ROUTES[("POST", "/api/v1/admin/database/migrate")]


def test_every_credential_bearing_route_is_administrator_only():
    offenders = [
        (method, path)
        for (method, path), guards in ROUTES.items()
        if path.startswith("/api/v1/admin/storage-config")
        and "require_infra_admin" not in guards
    ]
    assert offenders == [], f"credential routes open to the newsroom: {offenders}"


def test_the_ai_provider_registry_is_administrator_only():
    for method in ("GET", "PUT", "POST"):
        assert "require_infra_admin" in ROUTES[(method, "/api/v1/admin/ai-providers" + ("/test" if method == "POST" else ""))]


def test_editorial_routes_keep_using_the_editorial_guard():
    for _, path in EDITORIAL_ROUTES:
        guards = ROUTES[("GET", path)]
        assert "require_admin" in guards, f"{path} lost its auth dependency entirely"


# --------------------------------------------------------------------------- the migrate route's own limits
def test_a_newsroom_role_cannot_make_the_api_connect_to_an_arbitrary_database(client, signed_in_as):
    """The payload is deliberately a real-looking URL: before the fix this ran end to end."""
    signed_in_as(as_role("JOURNALIST"))
    response = client.post(
        "/api/v1/admin/database/migrate",
        json={"target_url": "sqlite:////app/daily_discovery.db", "copy_data": True},
    )
    assert response.status_code == 403


@pytest.mark.parametrize(
    "target_url",
    [
        "sqlite:////tmp/pwn.db",
        "sqlite:///relative.db",
        "mssql://u:p@db.example/none",
        "not-even-a-url",
        "",
    ],
)
def test_an_administrator_still_cannot_point_the_migrator_at_a_file_or_an_unknown_driver(client, signed_in_as, target_url):
    signed_in_as(as_role("ADMIN"))
    response = client.post("/api/v1/admin/database/migrate", json={"target_url": target_url, "copy_data": False})
    assert response.status_code == 400
    assert "postgresql" in response.json()["detail"]
    # The rejected string must come back as a shape complaint, never as driver text that quotes the URL.
    if target_url:
        assert target_url not in response.json()["detail"]


def test_a_failing_migration_does_not_echo_the_connection_string_back():
    """Driver errors quote the URL they failed on, and that URL carries the target password.
    127.0.0.1:1 refuses instantly, so this exercises the error path without a network wait."""
    admin_client = isolated_client("migrate-error-path")
    app.dependency_overrides[get_current_user] = lambda: as_role("ADMIN")
    try:
        response = admin_client.post(
            "/api/v1/admin/database/migrate",
            json={"target_url": "postgresql://newsroom:Sup3r-Secret-Target-Pass@127.0.0.1:1/evil", "copy_data": False},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 400
    assert "Sup3r-Secret-Target-Pass" not in response.text
    assert "127.0.0.1" not in response.text
    assert response.json()["detail"] == "Database migration failed"


# --------------------------------------------------------------------------- secrets stay in the database
class StubQuery:
    def __init__(self, rows):
        self.rows = list(rows)

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self.rows

    def first(self):
        return self.rows[0] if self.rows else None

    def update(self, *args, **kwargs):
        return 0


class StubSession:
    def __init__(self, rows):
        self.rows = rows

    def query(self, model):
        return StubQuery(self.rows)

    def add(self, obj):
        self.rows.append(obj)

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def _provider(**overrides):
    from app.models.storage import StorageProvider

    row = StorageProvider(
        id="prov-1",
        name="Primary S3",
        provider_type="LOCAL_S3",
        status="CONNECTED",
        is_default=True,
        configuration={"bucket": "camtech-media"},
        credentials={"secret_key": SECRET, "access_key": "AKID1234"},
    )
    for key, value in overrides.items():
        setattr(row, key, value)
    return row


def test_the_provider_list_never_returns_a_raw_credential():
    from app.api.v1.storage_config import get_providers

    row = _provider()
    payload = get_providers(db=StubSession([row]), current_user=as_role("ADMIN"))
    body = json.dumps(payload, ensure_ascii=False, default=str)
    assert SECRET not in body, "a live storage secret left the credential endpoint"
    assert "••••" + MASKED_TAIL in body
    assert payload["items"][0]["credentials_configured"] is True


def test_saving_a_masked_value_keeps_the_stored_secret_instead_of_overwriting_it():
    """The admin form round-trips what the API returned. If masking were treated as a new value,
    the first save after this change would have written `••••xxxx` over the real key."""
    from app.api.v1.storage_config import ProviderCreateRequest, update_provider

    row = _provider()
    request = ProviderCreateRequest(
        name="Renamed S3",
        provider_type="LOCAL_S3",
        is_default=True,
        configuration={"bucket": "camtech-media"},
        credentials={"secret_key": "••••" + MASKED_TAIL, "access_key": "AKID5678"},
    )
    result = update_provider("prov-1", request, db=StubSession([row]), current_user=as_role("ADMIN"))

    assert row.credentials["secret_key"] == SECRET, "the round-tripped mask destroyed the real key"
    assert row.credentials["access_key"] == "AKID5678", "a genuinely new key was ignored"
    assert result["credentials"]["secret_key"] == "••••" + MASKED_TAIL
    assert SECRET not in json.dumps(result, default=str)


def test_a_new_key_is_written_and_the_response_is_still_masked():
    from app.api.v1.storage_config import ProviderCreateRequest, update_provider

    row = _provider()
    fresh = "completely-new-key-value"
    request = ProviderCreateRequest(
        name="Renamed S3",
        provider_type="LOCAL_S3",
        configuration={},
        credentials={"secret_key": fresh},
    )
    result = update_provider("prov-1", request, db=StubSession([row]), current_user=as_role("ADMIN"))
    assert row.credentials["secret_key"] == fresh
    assert fresh not in json.dumps(result, default=str)
    assert result["credentials"]["secret_key"] == "••••" + fresh[-4:]


# --------------------------------------------------------------------------- uploads and the public image proxy
def test_an_svg_is_refused_as_an_upload(client, signed_in_as):
    signed_in_as(as_role("EDITOR"))
    response = client.post(
        "/api/v1/admin/upload",
        files={"file": ("payload.svg", b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "image/svg+xml")},
    )
    assert response.status_code == 400
    assert "SVG" in response.json()["detail"]


def test_a_non_image_is_still_refused(client, signed_in_as):
    signed_in_as(as_role("EDITOR"))
    response = client.post(
        "/api/v1/admin/upload",
        files={"file": ("payload.html", b"<script>alert(1)</script>", "text/html")},
    )
    assert response.status_code == 400


def test_the_object_key_can_no_longer_climb_out_of_its_prefix(client, signed_in_as, monkeypatch):
    import app.api.v1.admin as admin_module

    seen = {}

    async def capture(filename, content, content_type, folder_path=None):
        seen["filename"] = filename
        seen["folder_path"] = folder_path
        return {"success": True}

    monkeypatch.setattr(admin_module, "storage_service", SimpleNamespace(upload_file=capture))
    signed_in_as(as_role("EDITOR"))

    response = client.post(
        "/api/v1/admin/upload",
        files={"file": ("..\\..\\..\\etc\\passwd.png", b"not really a png", "image/png")},
        data={"folder_path": "Uploads/../../../../home"},
    )
    assert response.status_code == 200
    assert ".." not in seen["folder_path"], seen["folder_path"]
    assert "/" not in seen["filename"] and "\\" not in seen["filename"], seen["filename"]
    assert seen["folder_path"].startswith("Uploads/")


def test_the_public_image_proxy_does_not_quote_the_failure(client, monkeypatch):
    """GET /admin/storage/{id} is public by design, so its error text is attacker-visible."""
    import app.api.v1.admin as admin_module

    async def explode(file_id):
        raise RuntimeError(f"could not connect with password=S3cr3t-Db-Pass to bucket for {file_id}")

    monkeypatch.setattr(admin_module, "storage_service", SimpleNamespace(stream_file=explode))
    response = client.get("/api/v1/admin/storage/does-not-exist")

    assert response.status_code == 404
    body = response.text
    assert "S3cr3t-Db-Pass" not in body
    assert "could not connect" not in body
    assert response.json()["detail"] == "Image not found"


# --------------------------------------------------------------------------- rate limits and the docs surface
def _rate_limited_app():
    from fastapi import FastAPI

    from app.middleware.rate_limiter import DEFAULT_LIMITS, InMemoryRateLimiter, RateLimitMiddleware

    test_app = FastAPI()
    test_app.add_middleware(RateLimitMiddleware, limits=DEFAULT_LIMITS, limiter=InMemoryRateLimiter())

    @test_app.get("/api/v1/search/answer")
    def answer():
        return {"ok": True}

    @test_app.post("/api/v1/search/answer")
    def answer_post():
        return {"ok": True}

    @test_app.get("/api/v1/articles")
    def articles():
        return {"ok": True}

    @test_app.get("/api/v1/admin/ai-providers")
    def providers():
        return {"ok": True}

    @test_app.get("/health")
    def health():
        return {"ok": True}

    return TestClient(test_app), answer


def test_naming_yoursel_a_crawler_no_longer_removes_every_limit():
    from app.middleware.rate_limiter import DEFAULT_LIMITS, InMemoryRateLimiter

    tiers = {pattern: (limit, window) for pattern, limit, window in DEFAULT_LIMITS}
    assert tiers["/api/v1/search/answer"] == (8, 60), "the paid endpoint lost its own tighter tier"

    test_client, _ = _rate_limited_app()
    googlebot = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}

    codes = [test_client.post("/api/v1/search/answer", headers=googlebot).status_code for _ in range(9)]
    assert codes[:8] == [200] * 8
    assert codes[8] == 429, "a GET-free POST with a bot user-agent outran the paid tier"

    # A GET with a bot UA against a route that is not a read-only listing is limited too.
    blocked = [test_client.get("/api/v1/admin/ai-providers", headers=googlebot).status_code for _ in range(61)]
    assert 429 in blocked, "a bot user-agent bypassed the general limit on an admin path"


def test_a_crawler_is_still_exempt_on_read_only_listings_and_health_is_always_free():
    test_client, _ = _rate_limited_app()
    googlebot = {"User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"}
    for _ in range(80):
        assert test_client.get("/api/v1/articles", headers=googlebot).status_code == 200
    for _ in range(80):
        assert test_client.get("/health", headers=googlebot).status_code == 200


def test_a_plain_search_keeps_its_own_looser_tier_than_the_paid_answer():
    from app.middleware.rate_limiter import DEFAULT_LIMITS

    test_client, _ = _rate_limited_app()
    limits = {pattern: limit for pattern, limit, _window in DEFAULT_LIMITS}
    assert limits["/api/v1/search"] > limits["/api/v1/search/answer"]


def test_the_docs_and_schema_only_exist_where_development_happens():
    from app.main import is_live_environment

    for name in ("production", "Production", " prod ", "live", "LIVE"):
        assert is_live_environment(name) is True
    for name in ("development", "dev", "staging", "test", "", None):
        assert is_live_environment(name) is False


def test_the_running_app_matches_its_environment_on_the_docs_surface(client):
    from app.common.config import settings
    from app.main import is_live_environment

    live = is_live_environment(settings.APP_ENV)
    assert client.get("/docs").status_code == (404 if live else 200)
    assert client.get("/redoc").status_code == (404 if live else 200)
    assert client.get("/openapi.json").status_code == (404 if live else 200)
    if live:
        assert "/admin/database/migrate" not in json.dumps(client.get("/openapi.json").json())


def test_a_burned_signing_secret_is_refused_at_import_time():
    """The default JWT secret lived in a tracked file, so it is public: anyone could mint an
    admin token. The settings module must refuse to start on it rather than sign with it."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    code = (
        "import os;"
        "os.environ['JWT_SECRET']='daily_discovery_dev_jwt_secret_key_2026_growth_platform';"
        "os.environ['SESSION_SECRET']='fresh-unrelated-value';"
        "import app.common.config"
    )
    result = subprocess.run([sys.executable, "-c", code], cwd=repo_root, capture_output=True, text=True)
    assert result.returncode != 0
    assert "Refusing to start" in result.stderr
    assert "JWT_SECRET" in result.stderr


def test_a_burned_session_secret_is_named_in_the_same_refusal():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    code = (
        "import os;"
        "os.environ['JWT_SECRET']='fresh-unrelated-value';"
        "os.environ['SESSION_SECRET']='daily_discovery_session_secret_2026';"
        "import app.common.config"
    )
    result = subprocess.run([sys.executable, "-c", code], cwd=repo_root, capture_output=True, text=True)
    assert result.returncode != 0
    assert "SESSION_SECRET" in result.stderr


def test_an_unset_signing_secret_is_refused_too():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    code = (
        "import os;"
        "os.environ['JWT_SECRET']='';"
        "os.environ['SESSION_SECRET']='fresh-unrelated-value';"
        "import app.common.config"
    )
    result = subprocess.run([sys.executable, "-c", code], cwd=repo_root, capture_output=True, text=True)
    assert result.returncode != 0
    assert "Refusing to start" in result.stderr


def test_the_local_env_file_is_not_still_using_a_value_that_shipped_in_git():
    """`.env` is gitignored now, but it was tracked once. Nothing in it may still equal a default."""
    from app.common.config import settings

    pytest.importorskip("dotenv")
    from dotenv import dotenv_values

    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.exists(env_path):
        pytest.skip("no local .env to inspect")
    values = dotenv_values(env_path)
    burned = {
        "JWT_SECRET": "daily_discovery_dev_jwt_secret_key_2026_growth_platform",
        "SESSION_SECRET": "daily_discovery_session_secret_2026",
    }
    for name, old_value in burned.items():
        assert values.get(name), f"{name} is missing from the local .env"
        assert values[name] != old_value, f"{name} in the local .env is still the value that shipped in git"
        assert getattr(settings, name) not in ("", old_value), f"{name} still resolves to a public value"
