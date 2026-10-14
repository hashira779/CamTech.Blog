"""
Structured JSON Request Logging Middleware.

Logs inbound HTTP requests with method, path, status code, processing duration,
client IP, and correlation ID in structured JSON format for SIEM/observability ingestion.
Skips health check probes to prevent log pollution.
"""

import json
import logging
import time
from typing import Optional, Sequence
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api.access")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Middleware that records structured JSON access logs for all API requests.
    Exempts operational health endpoints (/health, /ready, /live).
    """
    def __init__(
        self,
        app,
        exempt_paths: Optional[Sequence[str]] = None,
        custom_logger: Optional[logging.Logger] = None
    ):
        super().__init__(app)
        self.exempt_paths = set(exempt_paths or ["/health", "/ready", "/live"])
        self.logger = custom_logger or logger

    def _get_client_ip(self, request: Request) -> str:
        client_ip = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Forwarded-For")
        if client_ip:
            return client_ip.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip logging for health check endpoints to reduce log noise
        if path in self.exempt_paths:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        request_id = (
            getattr(request.state, "request_id", None)
            or request.headers.get("X-Request-ID")
            or request.headers.get("X-Correlation-ID")
            or "unknown"
        )
        method = request.method
        user_agent = request.headers.get("user-agent", "")

        start_time = time.time()
        status_code = 500

        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            status_code = 500
            raise
        finally:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            log_record = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
                "request_id": request_id,
                "user_agent": user_agent,
            }
            self.logger.info(json.dumps(log_record))
