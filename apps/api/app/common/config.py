import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

def _resolve_default_db_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url and not env_url.endswith("./daily_discovery.db"):
        return env_url
    for candidate in ["./daily_discovery.db", "../daily_discovery.db", "../../daily_discovery.db"]:
        if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
            clean_path = os.path.abspath(candidate).replace("\\", "/")
            return f"sqlite:///{clean_path}"
    return "sqlite:///./daily_discovery.db"

class Settings(BaseSettings):
    APP_NAME: str = "Daily Discovery"
    APP_ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    DATABASE_URL: str = _resolve_default_db_url()
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # No default on purpose. These two strings sign every admin session, and a value that
    # ships in a public-ish repository is not a secret: anyone who can read the file can mint
    # a token for any user id. An environment that forgets to set one must fail at boot, loudly,
    # instead of quietly running on a key that the whole world knows.
    JWT_SECRET: str = ""
    SESSION_SECRET: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    AI_PROVIDER: str = "local"
    AI_API_KEY: Optional[str] = ""
    AI_MODEL_NAME: str = "gemini-2.5-flash"

    STORAGE_PROVIDER: str = "local"
    STORAGE_LOCAL_DIR: str = "./uploads"
    STORAGE_BUCKET: str = "daily-discovery-media"
    STORAGE_ENDPOINT: Optional[str] = None
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None

    ADSENSE_PUBLISHER_ID: str = "ca-pub-0000000000000000"
    ADSENSE_ENABLED: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# What counts as "the internet can see this one". Three behaviours key off it - the interactive
# API docs, the loopback CORS origins, and how much an error is allowed to say - and they must
# agree, so the answer lives here instead of being written twice. It sits below Settings()
# because middleware imports this module; putting it in app.main would be a circular import.
LIVE_ENV_NAMES = {"production", "prod", "live"}


def is_live_environment(app_env: str) -> bool:
    """Kept as a function so the gate can be tested for both answers, not just today's."""
    return str(app_env or "").strip().lower() in LIVE_ENV_NAMES


def is_live() -> bool:
    return is_live_environment(settings.APP_ENV)


# Values that were committed to this repository are burned: they are readable by anyone with
# repo access, forever, even after the file is deleted from tracking. Refusing to start is the
# only check that cannot be forgotten, because the alternative - running on a known key - looks
# exactly like a working site until someone logs in as you.
_BURNED_SECRETS = {
    "",
    "daily_discovery_dev_jwt_secret_key_2026_growth_platform",
    "daily_discovery_session_secret_2026",
}


def _assert_secrets_are_secret() -> None:
    weak = [
        name
        for name in ("JWT_SECRET", "SESSION_SECRET")
        if getattr(settings, name) in _BURNED_SECRETS
    ]
    if not weak:
        return
    raise RuntimeError(
        "Refusing to start: "
        + ", ".join(weak)
        + " is unset or is a value that once lived in this repository, so it is public. "
        "Set a fresh one in apps/api/.env (never commit it), for example "
        "`python -c \"import secrets; print(secrets.token_urlsafe(48))\"`. "
        "Existing admin sessions will need to log in again."
    )


_assert_secrets_are_secret()
