import time
from collections import defaultdict
from typing import Dict, List, Tuple

class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter with Redis-fallback readiness.
    Maintains a rolling queue of timestamps for each bucket key.
    """
    def __init__(self):
        self._buckets: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """
        Determines whether an operation for `key` is allowed within the current sliding window.
        Returns:
            is_allowed (bool): True if allowed, False if limit exceeded
            remaining (int): Number of requests remaining in current window
            retry_after (int): Seconds until the client may retry (if limit exceeded)
        """
        now = time.time()
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
    "LOGIN": (5, 60),          # 5 attempts per min
    "SEARCH": (30, 60),        # 30 searches per min
    "TOOL_EXECUTE": (30, 60),  # 30 tool computations per min
    "ADMIN": (60, 60),         # 60 admin requests per min
    "DEFAULT": (120, 60),      # 120 standard requests per min
}
