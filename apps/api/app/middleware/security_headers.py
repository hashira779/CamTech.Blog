"""
Security Headers & CORS Middleware Configuration.

Provides defense-in-depth HTTP response headers and centralized CORS settings
for the Daily Discovery API platform.
"""

import uuid
import time
from typing import Dict, List, Optional
from urllib.parse import urlsplit
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.common.config import is_live, settings


# Origins that only ever exist while someone is running this on their own laptop. They are kept
# apart from the real ones so "may this be here when the public can reach the API?" has one
# answer instead of a comment nobody reads.
DEV_ONLY_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

PRODUCTION_ORIGINS: List[str] = [
    "https://blog.camtech.cam",
    "https://cms.camtech.cam",
]

DEFAULT_ALLOWED_ORIGINS: List[str] = DEV_ONLY_ORIGINS + PRODUCTION_ORIGINS

_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"}


def _is_loopback_origin(origin: str) -> bool:
    host = (urlsplit(origin).hostname or "").lower()
    return host in _LOOPBACK_HOSTS or host.startswith("127.")


def get_cors_origins() -> List[str]:
    """Origins a browser is allowed to call this API from.

    The origin in a CORS request is whatever the visitor's browser claims about itself, so a
    loopback entry does not help real users at all - it only admits anything on the same machine
    as the API, plus any page open in a developer's own browser. When the deployment is live the
    loopback origins are dropped even if `FRONTEND_URL` still points at one, because forgetting
    to override the default is the usual way a site ends up trusting `http://localhost:3000` in
    production.
    """
    origins = list(PRODUCTION_ORIGINS) if is_live() else list(DEFAULT_ALLOWED_ORIGINS)
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
        origins.append(settings.FRONTEND_URL)
    if is_live():
        origins = [origin for origin in origins if not _is_loopback_origin(origin)]
    return origins


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies zero-trust security headers, correlation IDs, and response timing.
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: SAMEORIGIN
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
    - X-Request-ID & X-Correlation-ID tracing
    - 10MB payload size guard
    """
    def __init__(self, app, custom_headers: Optional[Dict[str, str]] = None):
        super().__init__(app)
        self.custom_headers = custom_headers or {}

    async def dispatch(self, request: Request, call_next):
        # 1. Correlation ID generation & propagation
        request_id = (
            request.headers.get("X-Request-ID")
            or request.headers.get("X-Correlation-ID")
            or str(uuid.uuid4())
        )
        request.state.request_id = request_id

        # 2. Maximum Payload Size Protection (Reject giant bodies to prevent OOM)
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > 10 * 1024 * 1024:  # 10 MB limit
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload Too Large",
                            "message": "Request body exceeds maximum allowed size (10MB).",
                            "request_id": request_id,
                        },
                        headers={"X-Request-ID": request_id}
                    )
            except (ValueError, TypeError):
                pass

        start_time = time.time()
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            # Mask unexpected internal errors in production responses
            return JSONResponse(
                status_code=500,
                headers={
                    "X-Request-ID": request_id,
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "SAMEORIGIN",
                },
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred while processing your request.",
                    "request_id": request_id,
                }
            )

        process_time_ms = int((time.time() - start_time) * 1000)

        # 3. Apply Security & Observability Headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = request_id
        response.headers["X-Response-Time"] = f"{process_time_ms}ms"

        # Required security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Additional defense-in-depth headers
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"

        # Custom header overrides if supplied
        for k, v in self.custom_headers.items():
            response.headers[k] = v

        return response
