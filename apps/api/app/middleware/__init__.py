"""
API Middleware Package.

Exports security, rate limiting, and structured logging middleware
for the Daily Discovery backend.
"""

from app.middleware.rate_limiter import (
    RateLimitMiddleware,
    InMemoryRateLimiter,
    rate_limiter,
    DEFAULT_LIMITS,
)
from app.middleware.security_headers import (
    SecurityHeadersMiddleware,
    get_cors_origins,
    DEFAULT_ALLOWED_ORIGINS,
    DEV_ONLY_ORIGINS,
    PRODUCTION_ORIGINS,
)
from app.middleware.request_logger import (
    RequestLoggerMiddleware,
)

__all__ = [
    "RateLimitMiddleware",
    "InMemoryRateLimiter",
    "rate_limiter",
    "DEFAULT_LIMITS",
    "SecurityHeadersMiddleware",
    "get_cors_origins",
    "DEFAULT_ALLOWED_ORIGINS",
    "DEV_ONLY_ORIGINS",
    "PRODUCTION_ORIGINS",
    "RequestLoggerMiddleware",
]
