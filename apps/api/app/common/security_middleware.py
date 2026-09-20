import uuid
import time
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.common.rate_limiter import rate_limiter, RATE_LIMIT_TIERS
from app.common.database import SessionLocal
from app.models.security_event import SecurityEvent

class SecurityHeadersAndCorrelationMiddleware(BaseHTTPMiddleware):
    """
    Applies security headers, handles request correlation IDs,
    enforces sliding-window rate limits, and masks internal errors.
    """
    async def dispatch(self, request: Request, call_next):
        # 1. Correlation ID Generation & Propagation (Section 85)
        request_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        client_ip = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Forwarded-For")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        path = request.url.path

        # 2. Skip rate-limiting for health checks
        if path in ("/health", "/ready", "/live"):
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response

        # 3. Rate Limiting by Risk Tier (Section 26)
        tier = "DEFAULT"
        if "/api/v1/auth/login" in path:
            tier = "LOGIN"
        elif "/api/v1/search" in path:
            tier = "SEARCH"
        elif "/api/v1/tools/execute" in path:
            tier = "TOOL_EXECUTE"
        elif "/api/v1/admin" in path:
            tier = "ADMIN"

        max_req, window_sec = RATE_LIMIT_TIERS[tier]
        bucket_key = f"{tier}:{client_ip}"
        allowed, remaining, retry_after = rate_limiter.is_allowed(bucket_key, max_req, window_sec)

        if not allowed:
            # Record security incident
            self._log_security_event(
                event_type="RATE_LIMIT_EXCEEDED",
                severity="WARNING",
                source_ip=client_ip,
                path=path,
                method=request.method,
                status=429,
                user_agent=request.headers.get("user-agent", ""),
                request_id=request_id,
                action="RATE_LIMITED",
                metadata={"tier": tier, "limit": max_req, "window": window_sec}
            )

            return JSONResponse(
                status_code=429,
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_req),
                    "X-RateLimit-Remaining": "0",
                    "X-Request-ID": request_id,
                },
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded for {tier.lower()} operations. Please retry in {retry_after} seconds.",
                    "request_id": request_id
                }
            )

        start_time = time.time()
        try:
            response = await call_next(request)
        except Exception as exc:
            # Safe Error Masking (Section 65)
            self._log_security_event(
                event_type="UNHANDLED_EXCEPTION",
                severity="HIGH",
                source_ip=client_ip,
                path=path,
                method=request.method,
                status=500,
                user_agent=request.headers.get("user-agent", ""),
                request_id=request_id,
                action="ESCALATED",
                metadata={"error": str(exc)}
            )
            return JSONResponse(
                status_code=500,
                headers={"X-Request-ID": request_id},
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred while processing your request.",
                    "request_id": request_id
                }
            )

        process_time_ms = int((time.time() - start_time) * 1000)

        # 4. Apply Defense-in-Depth Security Headers (Section 36)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = request_id
        response.headers["X-Response-Time"] = f"{process_time_ms}ms"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-RateLimit-Limit"] = str(max_req)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response

    def _log_security_event(self, **kwargs):
        try:
            db = SessionLocal()
            metadata = kwargs.pop("metadata", None)
            metadata_str = json.dumps(metadata) if metadata else None
            evt = SecurityEvent(
                metadata_json=metadata_str,
                **kwargs
            )
            db.add(evt)
            db.commit()
            db.close()
        except Exception:
            pass  # Avoid secondary failure in error logging
