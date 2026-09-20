import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Daily Discovery"
    APP_ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    DATABASE_URL: str = "sqlite:///./daily_discovery.db"
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    JWT_SECRET: str = "daily_discovery_dev_jwt_secret_key_2026_growth_platform"
    SESSION_SECRET: str = "daily_discovery_session_secret_2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    AI_PROVIDER: str = "local"
    AI_API_KEY: Optional[str] = ""
    AI_MODEL_NAME: str = "gemini-1.5-flash"

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
