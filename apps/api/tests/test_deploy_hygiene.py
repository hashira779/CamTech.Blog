"""The deployment files, read as an attacker would read them.

Application code can be reviewed, merged and tested. `docker-compose.yml` is the one file whose
settings are applied to the live machine the moment someone runs `docker compose up`, so a
stray `ports:` line or a committed password turns a hardened app into an open box no matter how
green the suite is. These checks are the equivalent of the unit tests for that file: they fail
when it goes back to the shape that made the site easy to reach.

The compose files live at the repository root, outside the API image's build context, so this
module skips when they are not on disk (e.g. pytest running inside the container).
"""
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml", reason="PyYAML is needed to read the compose files")

REPO_ROOT = Path(__file__).resolve().parents[3]
COMPOSE = REPO_ROOT / "docker-compose.yml"
COMPOSE_DEV = REPO_ROOT / "docker-compose.dev.yml"
API_DOCKERIGNORE = REPO_ROOT / "apps" / "api" / ".dockerignore"

pytestmark = pytest.mark.skipif(
    not COMPOSE.exists(), reason=f"{COMPOSE} is not in this checkout"
)


def _load(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _services(path: Path) -> dict:
    return _load(path).get("services", {})


def _env(service: dict) -> dict:
    """Compose accepts `environment` as a list of KEY=VAL strings or as a map."""
    raw = service.get("environment") or []
    if isinstance(raw, dict):
        return {str(k): str(v) for k, v in raw.items()}
    out = {}
    for entry in raw:
        key, _, value = str(entry).partition("=")
        out[key.strip()] = value.strip()
    return out


# Anything that has ever been a default in this repository is public knowledge, so it must not
# reappear in a file that is handed to the production host. These are values, not key names:
# `POSTGRES_PASSWORD=` is what we want to see, `${POSTGRES_PASSWORD:?...}` is fine, and the word
# "password" in a comment is not a credential.
PUBLIC_VALUES = {
    "daily_discovery_dev_jwt_secret_key_2026_growth_platform",
    "daily_discovery_session_secret_2026",
    "discovery_secret",
    "minio_admin",
    "minio_secret_key",
    "changeme",
}

INFRA_CONTAINERS = {"postgres", "redis", "minio"}


# --------------------------------------------------------------------------------------
# Published ports
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize("service_name", sorted(_services(COMPOSE)))
def test_every_published_port_on_the_production_host_is_loopback_only(service_name):
    """`- "8000:8000"` means 0.0.0.0:8000 - the whole internet. Containers reach each other over
    the docker network by service name, so a published port is only ever needed by something on
    the host itself: the reverse proxy, or an operator with an SSH tunnel. Both are loopback."""
    ports = _services(COMPOSE)[service_name].get("ports") or []
    for mapping in ports:
        text = str(mapping) if not isinstance(mapping, dict) else f"{mapping.get('host')}:{mapping.get('target')}"
        bound = text.split(":")[0]
        assert bound == "127.0.0.1", (
            f"{service_name} publishes {text!r} on every interface; bind it to 127.0.0.1 "
            "(or drop it and let the proxy use the docker network)"
        )


def test_the_database_cache_and_object_store_are_not_reachable_from_the_internet():
    """Redis here had no password and Postgres had a committed one. On a host with a public IP
    that is not a theoretical risk: scanners find an open 6379 within hours of it appearing."""
    services = _services(COMPOSE)
    for name in INFRA_CONTAINERS:
        assert name in services, f"{name} disappeared from the compose file"
        published = [str(p) for p in (services[name].get("ports") or [])]
        assert published, f"{name} publishes no port at all - fine, keep it that way"
        assert all(p.startswith("127.0.0.1:") for p in published), f"{name}: {published}"


def test_redis_is_started_with_a_password():
    services = _services(COMPOSE)
    command = services["redis"].get("command")
    text = " ".join(map(str, command)) if isinstance(command, list) else str(command or "")
    assert "--requirepass" in text, "redis must not accept unauthenticated writes"
    assert "${REDIS_PASSWORD" in text, "the password comes from the server, not from this file"


# --------------------------------------------------------------------------------------
# Environment the containers actually boot with
# --------------------------------------------------------------------------------------


@pytest.mark.parametrize("service_name", ["api", "worker"])
def test_the_production_containers_say_they_are_production(service_name):
    """Pydantic reads environment variables before the `.env` file, so without APP_ENV here the
    image runs with whatever the checkout's `.env` says - which says `development`, and that
    reopens /docs and /openapi.json and trusts the loopback CORS origins."""
    env = _env(_services(COMPOSE)[service_name])
    assert env.get("APP_ENV") == "production", f"{service_name}: APP_ENV={env.get('APP_ENV')!r}"
    assert env.get("DEBUG", "false").lower() != "true", f"{service_name} must not boot in debug"


@pytest.mark.parametrize("service_name", ["api", "worker"])
def test_the_session_signing_keys_come_from_the_server(service_name):
    env = _env(_services(COMPOSE)[service_name])
    for key in ("JWT_SECRET", "SESSION_SECRET"):
        value = env.get(key) or ""
        assert value, f"{service_name} gets no {key}: it would sign with a value from the repository"
        assert value.startswith("${") and ":?" in value, (
            f"{key} must be a required substitution from the server environment, not a literal"
        )


def test_a_development_override_still_asks_for_development():
    """The base file now forces APP_ENV=production. A dev box layers on top of it, so it has to
    say the other answer out loud or laptops lose /docs and gain production CORS rules."""
    env = _env(_services(COMPOSE_DEV)["api"])
    assert env.get("APP_ENV") == "development"


def test_both_compose_files_ask_the_server_for_the_same_credentials():
    """Hardcoding one and interpolating the other is how a stack ends up with Postgres listening
    for a password the API does not send - a failure that shows up as an outage, not a mistake."""
    for path in (COMPOSE, COMPOSE_DEV):
        text = path.read_text(encoding="utf-8")
        for var in ("POSTGRES_PASSWORD", "REDIS_PASSWORD", "MINIO_ROOT_USER", "MINIO_ROOT_PASSWORD"):
            assert f"${{{var}" in text, f"{path.name} does not read {var} from the server"


@pytest.mark.parametrize("path", [COMPOSE, COMPOSE_DEV])
def test_no_committed_credential_value_survives_in_the_deploy_files(path):
    text = path.read_text(encoding="utf-8")
    for value in sorted(PUBLIC_VALUES):
        assert value not in text, f"{path.name} still contains the public value {value!r}"


# --------------------------------------------------------------------------------------
# What ends up inside the image
# --------------------------------------------------------------------------------------


def test_the_local_env_file_is_not_baked_into_the_api_image():
    """The Dockerfile is `COPY . .`, so anything in apps/api that is not ignored ships to the
    server - including the file that holds the signing key."""
    lines = [
        line.strip()
        for line in API_DOCKERIGNORE.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    assert ".env" in lines, "apps/api/.dockerignore must exclude .env"


def test_the_env_template_documents_every_key_without_a_value():
    """An operator setting up a server needs the list of names. A template with placeholders is
    how that happens without anyone pasting a real key into a commit or a chat window."""
    template = REPO_ROOT / "apps" / "api" / ".env.example"
    assert template.exists(), "apps/api/.env.example is missing"
    for line in template.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        key, value = s.split("=", 1)
        assert key.isupper(), f"{key} is not an upper-case setting name"
        assert not value or value.startswith("<") or "generate" in value.lower(), (
            f"{key} carries a real-looking value in the template: templates hold placeholders only"
        )


def test_the_api_refuses_a_burned_key_rather_than_running_on_it():
    """This is the check that makes the rest of the file safe to write down: a key that once
    lived in git cannot be used to sign a session, even if a deploy forgets to set a new one."""
    from app.common.config import _BURNED_SECRETS, _assert_secrets_are_secret

    assert _BURNED_SECRETS, "the burned-value list must not be empty"
    import app.common.config as config

    original = config.settings.JWT_SECRET
    try:
        config.settings.JWT_SECRET = sorted(_BURNED_SECRETS)[0]
        with pytest.raises(RuntimeError, match="Refusing to start"):
            _assert_secrets_are_secret()
    finally:
        config.settings.JWT_SECRET = original
    _assert_secrets_are_secret()  # the real environment must still pass


# --------------------------------------------------------------------------------------
# Seeded accounts
# --------------------------------------------------------------------------------------

# The seed script used to create a SUPER_ADMIN with a password written in the file, the deploy
# pipeline runs that script on every release, and the admin login page carried a button that
# filled both in. Anything that has happened like that is a published credential, so these
# literals are named here to keep them out of the tree - not to be typed into a login form.
#
# The one place a published signing key may appear is the denylist that refuses to boot on it:
# naming it is what makes that check work. Anywhere else, it is a live secret.
_ALLOWED_BLOCKLIST_FILE = "apps/api/app/common/config.py"
PUBLISHED_CREDENTIALS = {
    "AdminDaily2026": set(),
    "daily_discovery_dev_jwt_secret_key_2026_growth_platform": {_ALLOWED_BLOCKLIST_FILE},
    "daily_discovery_session_secret_2026": {_ALLOWED_BLOCKLIST_FILE},
}

SOURCE_TREE = ("database", "scripts", "docs", "apps/api/app", "apps/admin/src", "apps/web/src")


def _tracked_source_files():
    for relative in SOURCE_TREE:
        base = REPO_ROOT / relative
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in {".py", ".ts", ".tsx", ".js", ".mjs", ".md", ".yml", ".yaml", ".sh", ".sql"}:
                continue
            yield path


@pytest.mark.parametrize("value", sorted(PUBLISHED_CREDENTIALS))
def test_a_credential_that_was_once_committed_never_comes_back(value):
    allowed = PUBLISHED_CREDENTIALS[value]
    offenders = []
    for path in _tracked_source_files():
        try:
            if value not in path.read_text(encoding="utf-8", errors="ignore"):
                continue
        except OSError:
            continue
        relative = str(path.relative_to(REPO_ROOT)).replace("\\", "/")
        if relative not in allowed:
            offenders.append(relative)
    assert not offenders, f"{offenders} still contains the published credential {value!r}"


def test_the_seed_script_cannot_make_an_admin_without_a_supplied_password():
    """`database/seed_data.py` runs on every deploy. A literal password in it is a superuser
    account for anyone who has read the repository."""
    text = (REPO_ROOT / "database" / "seed_data.py").read_text(encoding="utf-8")
    assert 'get_password_hash("' not in text and "get_password_hash('" not in text, (
        "the seed script hashes a literal password; it must hash an environment value"
    )
    assert "BOOTSTRAP_ADMIN_PASSWORD" in text
    assert 'os.getenv("BOOTSTRAP_ADMIN_EMAIL", "")' in text, (
        "the bootstrap address must not default to a real account name"
    )


def test_the_admin_login_page_hands_out_no_credentials():
    """The login page is served to the whole internet; a convenience button on it is published
    in every browser that loads it."""
    text = (REPO_ROOT / "apps" / "admin" / "src" / "pages" / "Login.tsx").read_text(encoding="utf-8")
    assert "Use Default Credentials" not in text
    assert 'setPassword("' not in text and "setPassword('" not in text, (
        "the login form must never be filled in from source"
    )
