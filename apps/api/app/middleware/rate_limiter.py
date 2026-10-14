"""
In-Memory Rate Limiting Middleware.

Production / Distributed Deployment Note:
This implementation utilizes an in-memory sliding window rate limiter suitable for
single-instance deployments or edge-terminated worker topologies. For horizontal
multi-replica or distributed deployments across containers/Kubernetes pods, upgrade
to a Redis-backed distributed rate limiter (e.g. using Redis sorted sets `ZADD` and
`ZREMRANGEBYSCORE` or Redis cell token-bucket scripts) to synchronize rate limit
counters globally across API nodes.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Sequence
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class InMemoryRateLimiter:
    """
    Sliding-window in-memory rate limiter with garbage collection
    and upper-bound protection against memory exhaustion.
    """
    MAX_BUCKETS = 25000

    def __init__(self):
        self._buckets: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_expired_buckets(self, now: float, max_window: int = 120):
        """Purge keys that have no activity within max_window to prevent memory growth."""
        if now - self._last_cleanup < 30.0:
            return
        self._last_cleanup = now
        cutoff = now - max_window
        expired_keys = [k for k, v in self._buckets.items() if not v or v[-1] < cutoff]
        for k in expired_keys:
            self._buckets.pop(k, None)

        if len(self._buckets) > self.MAX_BUCKETS:
            sorted_keys = sorted(
                self._buckets.keys(),
                key=lambda k: self._buckets[k][-1] if self._buckets[k] else 0
            )
            for k in sorted_keys[: int(self.MAX_BUCKETS * 0.3)]:
                self._buckets.pop(k, None)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """
        Evaluate if a request under `key` is allowed within current window.
        Returns:
            allowed (bool): True if allowed, False if exceeded.
            remaining (int): Requests remaining in current window.
            retry_after (int): Seconds until the client may retry (if limit exceeded).
        """
        now = time.time()
        self._cleanup_expired_buckets(now, window_seconds * 2)

        window_start = now - window_seconds
        timestamps = [ts for ts in self._buckets[key] if ts > window_start]
        self._buckets[key] = timestamps

        if len(timestamps) < max_requests:
            timestamps.append(now)
            remaining = max(0, max_requests - len(timestamps))
            return True, remaining, 0
        else:
            oldest = timestamps[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return False, 0, retry_after

    def reset(self, key: Optional[str] = None):
        """Reset rate limit buckets (for testing or administrative clears)."""
        if key:
            self._buckets.pop(key, None)
        else:
            self._buckets.clear()


# Global in-memory rate limiter instance
rate_limiter = InMemoryRateLimiter()

# Default rate limit tiers: list of (path_pattern, max_requests, window_seconds)
DEFAULT_LIMITS: List[Tuple[str, int, int]] = [
    ("/api/v1/auth/login", 10, 60),  # 10 req/min for login (anti-bruteforce)
    ("/api/v1/search", 30, 60),      # 30 req/min for search
    ("*", 60, 60),                   # 60 req/min general limit
]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette Rate Limiting Middleware.
    Enforces configurable sliding-window limits per endpoint pattern.
    """
    def __init__(
        self,
        app,
        limits: Optional[Sequence[Tuple[str, int, int]]] = None,
        exempt_paths: Optional[Sequence[str]] = None,
        limiter: Optional[InMemoryRateLimiter] = None
    ):
        super().__init__(app)
        self.limits = list(limits) if limits is not None else DEFAULT_LIMITS
        self.exempt_paths = set(exempt_paths or ["/health", "/ready", "/live"])
        self.limiter = limiter or rate_limiter

    def _get_client_ip(self, request: Request) -> str:
        client_ip = request.headers.get("CF-Connecting-IP") or request.headers.get("X-Forwarded-For")
        if client_ip:
            return client_ip.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def _match_tier(self, path: str) -> Tuple[str, int, int]:
        """Match request path against configured pattern limits."""
        for pattern, max_requests, window_sec in self.limits:
            if pattern != "*" and pattern in path:
                return pattern, max_requests, window_sec
        # Fallback to general default ("*")
        for pattern, max_requests, window_sec in self.limits:
            if pattern == "*":
                return "general", max_requests, window_sec
        return "general", 60, 60

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 1. Skip rate-limiting for health check endpoints
        if path in self.exempt_paths:
            return await call_next(request)

        # 2. Skip rate-limiting for verified search engine bots (SEO & indexer friendly)
        user_agent = request.headers.get("user-agent", "").lower()
        if any(bot in user_agent for bot in ("googlebot", "mediapartners-google", "bingbot")):
            return await call_next(request)

        # 3. Identify client IP and match endpoint rule
        client_ip = self._get_client_ip(request)
        pattern_name, max_requests, window_sec = self._match_tier(path)
        bucket_key = f"{pattern_name}:{client_ip}"

        allowed, remaining, retry_after = self.limiter.is_allowed(bucket_key, max_requests, window_sec)

        request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or ""

        if not allowed:
            headers = {
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
            }
            if request_id:
                headers["X-Request-ID"] = request_id

            return JSONResponse(
                status_code=429,
                headers=headers,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Please retry in {retry_after} seconds.",
                    "retry_after": retry_after,
                    "request_id": request_id,
                }
            )

        response: Response = await call_next(request)

        # Attach standard rate limit headers
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response
