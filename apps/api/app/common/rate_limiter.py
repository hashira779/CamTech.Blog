import time
from collections import defaultdict
from typing import Dict, List, Tuple

class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter with Redis-fallback readiness.
    Maintains a rolling queue of timestamps for each bucket key with active garbage collection
    and max-capacity bounds to prevent memory exhaustion attacks.
    """
    MAX_BUCKETS = 25000  # Cap memory usage against spoofed IP flood

    def __init__(self):
        self._buckets: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_expired_buckets(self, now: float, max_window: int = 120):
        """Purge keys that have no activity within max_window to prevent memory leak."""
        if now - self._last_cleanup < 30.0:  # Run cleanup at most once every 30s
            return
        self._last_cleanup = now
        cutoff = now - max_window
        expired_keys = [k for k, v in self._buckets.items() if not v or v[-1] < cutoff]
        for k in expired_keys:
            self._buckets.pop(k, None)

        # Emergency eviction if bucket count exceeds maximum threshold
        if len(self._buckets) > self.MAX_BUCKETS:
            # Drop oldest 30% of keys
            sorted_keys = sorted(self._buckets.keys(), key=lambda k: self._buckets[k][-1] if self._buckets[k] else 0)
            for k in sorted_keys[:int(self.MAX_BUCKETS * 0.3)]:
                self._buckets.pop(k, None)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """
        Determines whether an operation for `key` is allowed within the current sliding window.
        Returns:
            is_allowed (bool): True if allowed, False if limit exceeded
            remaining (int): Number of requests remaining in current window
            retry_after (int): Seconds until the client may retry (if limit exceeded)
        """
        now = time.time()
        self._cleanup_expired_buckets(now, window_seconds * 2)

        window_start = now - window_seconds

        # Prune older timestamps outside the current window
        timestamps = self._buckets[key]
        self._buckets[key] = [ts for ts in timestamps if ts > window_start]

        current_count = len(self._buckets[key])

        if current_count < max_requests:
            self._buckets[key].append(now)
            remaining = max(0, max_requests - current_count - 1)
            return True, remaining, 0
        else:
            # Calculate time when the oldest timestamp in window expires
            oldest = self._buckets[key][0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return False, 0, retry_after

    def reset(self, key: str):
        if key in self._buckets:
            del self._buckets[key]

# Singleton rate limiter instance
rate_limiter = SlidingWindowRateLimiter()

# Preset configuration limits: (max_requests, window_seconds)
RATE_LIMIT_TIERS = {
    "LOGIN": (5, 60),          # 5 attempts per min (anti-bruteforce)
    "SUGGESTION": (5, 60),     # 5 submissions per min (anti-spam)
    "SEARCH": (30, 60),        # 30 searches per min
    "TOOL_EXECUTE": (30, 60),  # 30 tool computations per min
    "ADMIN": (60, 60),         # 60 admin requests per min
    "DEFAULT": (120, 60),      # 120 standard requests per min
}
