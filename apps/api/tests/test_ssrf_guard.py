"""SSRF: the process refuses to be pointed at itself, its neighbours, or its own credentials.

Every URL here arrives from outside the repository — a feed item's image, a Wikimedia search hit, a
row another editor saved, an endpoint an administrator pasted into the AI provider registry — and
each one used to be fetched with whatever host it named. On the deployment box that means
`http://169.254.169.254/latest/meta-data/iam/security-credentials/` (the instance role's keys),
`http://127.0.0.1:6379/` (Redis, published by the compose file) or `http://172.17.0.1:5432/`
(Postgres). The re-hosting services are the worst case: they do not merely probe the address, they
copy the response into public storage.

These tests assert the refusal happens *before a socket opens*, by recording every request the
faked client sees.
"""

import asyncio
import json

import httpx
import pytest

from app.common.ssrf import (
    SSRFRejected,
    guarded_get,
    is_prohibited,
    require_public_url,
    validate_provider_endpoint,
    validate_url_safe,
)

METADATA = "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
PUBLIC_IP_URL = "http://93.184.216.34/photo.jpg"  # an address literal: validated without DNS

INTERNAL_TARGETS = [
    METADATA,
    "http://169.254.169.254/",
    "http://metadata.google.internal/computeMetadata/v1/",
    "http://127.0.0.1:6379/",
    "http://localhost:5432/",
    "http://10.0.0.5/admin",
    "http://172.17.0.1:8000/docs",
    "http://[fd00:ec2::254]/",
    "http://0.0.0.0/",
    "file:///etc/passwd",
    "gopher://127.0.0.1:11211/",
]


@pytest.mark.parametrize("url", INTERNAL_TARGETS)
def test_an_internal_address_is_refused(url):
    ok, _ = validate_url_safe(url)
    assert not ok, url
    with pytest.raises(SSRFRejected):
        require_public_url(url, field="image")


def test_a_public_address_is_allowed():
    assert require_public_url(PUBLIC_IP_URL) == PUBLIC_IP_URL


# --- `is_prohibited`: "known bad", not "could not look" --------------------------------------

def test_unresolvable_is_not_a_verdict_about_the_image():
    """A laptop with no DNS must not be what empties a gallery, so this returns False (keep)."""
    assert is_prohibited("https://this-host-really-does-not-exist.invalid/a.jpg") is False


@pytest.mark.parametrize("url", [METADATA, "http://127.0.0.1:6379/", "not-a-url-at-all"])
def test_prohibited_is_true_without_touching_the_network(url):
    assert is_prohibited(url) is True


# --- the redirect hop is the attack -------------------------------------------------------------------------------------------------

class _Resp:
    def __init__(self, url, status_code=200, headers=None):
        self.url = url
        self.status_code = status_code
        self.headers = headers or {}
        self.content = b"jpeg-bytes"


class _RecordingClient:
    """Stands in for httpx.AsyncClient and remembers every URL it was actually asked for."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.requested = []

    async def get(self, url, headers=None, follow_redirects=False):
        self.requested.append(str(url))
        if not self._responses:
            raise AssertionError("the client was asked for more hops than the feed defined")
        return self._responses.pop(0)


def test_a_public_first_hop_cannot_redirect_into_the_instance():
    client = _RecordingClient([
        _Resp(PUBLIC_IP_URL, 302, {"location": "http://127.0.0.1:6379/"},),
    ])
    with pytest.raises(SSRFRejected):
        asyncio.run(guarded_get(client, PUBLIC_IP_URL))
    assert client.requested == [PUBLIC_IP_URL], "the redirect target must never be requested"


def test_a_relative_redirect_is_resolved_against_the_hop_it_came_from():
    client = _RecordingClient([
        _Resp(PUBLIC_IP_URL, 301, {"location": "/moved.jpg"}),
        _Resp("http://93.184.216.34/moved.jpg", 200),
    ])
    res = asyncio.run(guarded_get(client, PUBLIC_IP_URL))
    assert res.status_code == 200
    assert client.requested == [PUBLIC_IP_URL, "http://93.184.216.34/moved.jpg"]


def test_a_plain_200_is_returned_without_extra_hops():
    client = _RecordingClient([_Resp(PUBLIC_IP_URL, 200)])
    res = asyncio.run(guarded_get(client, PUBLIC_IP_URL))
    assert res.status_code == 200
    assert client.requested == [PUBLIC_IP_URL]


def test_the_initial_url_is_checked_before_the_first_request():
    client = _RecordingClient([])
    with pytest.raises(SSRFRejected):
        asyncio.run(guarded_get(client, METADATA))
    assert client.requested == []


# --- the services that fetch on somebody else's instruction -----------------------------------

def test_the_r2_rehost_never_opens_a_socket_to_an_internal_url(monkeypatch):
    import app.services.s3_service as s3_module

    asked = []

    class _NeverClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url, **kwargs):
            asked.append(str(url))
            raise AssertionError(f"fetched an internal URL: {url}")

    monkeypatch.setattr(s3_module.httpx, "AsyncClient", _NeverClient)
    monkeypatch.setattr(
        s3_module.s3_service, "_get_client_and_config", lambda: (object(), {"bucket": "b"})
    )
    assert asyncio.run(s3_module.s3_service.upload_file_from_url(METADATA)) is None
    assert asked == []


def test_the_drive_rehost_never_opens_a_socket_to_an_internal_url(monkeypatch):
    import app.services.google_drive_service as gdrive_module

    asked = []

    class _NeverClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url, **kwargs):
            asked.append(str(url))
            raise AssertionError(f"fetched an internal URL: {url}")

    monkeypatch.setattr(gdrive_module.httpx, "AsyncClient", _NeverClient)
    assert asyncio.run(gdrive_module.storage_service.upload_file_from_url(METADATA)) is None
    assert asked == []


def test_a_liveness_check_refuses_an_internal_candidate_and_keeps_the_rest(monkeypatch):
    """`filter_live_images` deletes what it proves is gone, so the two verdicts must stay apart.

    The client is faked rather than left to the network: a refused candidate must be decided
    without a request, and an unreachable one must be kept — neither of which should depend on
    whether this machine has DNS today.
    """
    import app.services.ai_tourism_engine as engine

    asked = []

    class _Unreachable:
        """Every public URL this stands in for times out, which the gate calls inconclusive."""

        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        def stream(self, method, url, **kwargs):
            asked.append(str(url))
            raise httpx.ConnectTimeout("no route to host")

    monkeypatch.setattr(engine.httpx, "AsyncClient", _Unreachable)

    kept = asyncio.run(engine.filter_live_images([METADATA, PUBLIC_IP_URL], timeout=0.1))
    assert METADATA not in kept, "an internal candidate must never survive the gate"
    assert PUBLIC_IP_URL in kept, "an unreachable photo is kept: a timeout is not proof it is gone"
    assert asked == [PUBLIC_IP_URL], "the refused URL must not have been requested"


# --- the provider registry (an administrator types these) ------------------------------------

def test_a_local_model_server_stays_a_valid_endpoint():
    """Ollama is a first-class entry in the catalog; a public-only rule would break it."""
    assert validate_provider_endpoint("http://localhost:11434/v1") == "http://localhost:11434/v1"
    assert validate_provider_endpoint("http://127.0.0.1:11434/v1")
    assert validate_provider_endpoint("https://openrouter.ai/api/v1")


@pytest.mark.parametrize("url", [
    METADATA,
    "http://169.254.169.254",
    "http://metadata.google.internal/",
    "http://[fd00:ec2::254]/",
    "ftp://models.example/x",
    "localhost:11434/v1",
    "",
    "https:///no-host",
])
def test_a_provider_endpoint_may_not_be_the_metadata_service(url):
    with pytest.raises(ValueError):
        validate_provider_endpoint(url)


def test_saving_a_provider_with_a_metadata_endpoint_is_rejected_and_nothing_is_written(monkeypatch):
    from app.services import ai_gateway

    written = []

    class _Setting:
        def __init__(self, **kw):
            written.append(kw)

    class _Q:
        def filter(self, *a, **k):
            return self

        def first(self):
            return None

    class _DB:
        def query(self, *a, **k):
            return _Q()

        def add(self, obj):
            written.append(obj)

        def commit(self):
            return None

    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: [])
    with pytest.raises(ValueError):
        ai_gateway.save_providers(_DB(), [{
            "id": "evil", "label": "Evil", "style": "openai", "model": "m",
            "base_url": METADATA, "api_key": "sk-test", "enabled": True,
        }])
    assert written == [], "a rejected registry must not reach the settings table"


def test_saving_a_provider_with_a_local_endpoint_still_works(monkeypatch):
    from app.services import ai_gateway

    class _Row:
        def __init__(self):
            self.key = ai_gateway.PROVIDERS_SETTING_KEY
            self.value_json = ""
            self.description = ""

    row = _Row()

    class _Q:
        def filter(self, *a, **k):
            return self

        def first(self):
            return row

    class _DB:
        def query(self, *a, **k):
            return _Q()

        def add(self, obj):
            raise AssertionError("an existing settings row must be updated, not duplicated")

        def commit(self):
            return None

    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: [])
    ai_gateway.save_providers(_DB(), [{
        "id": "ollama", "label": "Ollama", "style": "openai", "model": "llama3.1",
        "base_url": "http://localhost:11434/v1", "requires_key": False, "enabled": True,
    }])

    saved = json.loads(row.value_json)
    assert saved[0]["base_url"] == "http://localhost:11434/v1"
