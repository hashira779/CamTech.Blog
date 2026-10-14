"""
Security Headers & CORS Middleware Configuration.

Provides defense-in-depth HTTP response headers and centralized CORS settings
for the Daily Discovery API platform.
"""

import uuid
import time
from typing import Dict, List, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.common.config import settings


# Standard allowed CORS origins across environments
DEFAULT_ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://blog.camtech.cam",
    "https://cms.camtech.cam",
]

def get_cors_origins() -> List[str]:
    """Return all allowed origins including runtime configured FRONTEND_URL."""
    origins = list(DEFAULT_ALLOWED_ORIGINS)
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
        origins.append(settings.FRONTEND_URL)
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
