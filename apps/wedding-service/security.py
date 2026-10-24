"""Request hardening shared by the wedding routes: client IP, rate limits,
URL / slug validation and upload sniffing."""
import re
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Request, status

# ---------------------------------------------------------------------------
# Client IP
# ---------------------------------------------------------------------------

def client_ip(request: Request) -> str:
    """The guest's address. Cloudflare overwrites CF-Connecting-IP on every
    request, so it is the one header a visitor cannot choose; the first
    X-Forwarded-For entry is whatever the client sent and only a fallback for
    traffic that did not come through Cloudflare (local dev)."""
    cf = request.headers.get("cf-connecting-ip", "").strip()
    if cf:
        return cf[:64]
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first[:64]
    real = request.headers.get("x-real-ip", "").strip()
    if real:
        return real[:64]
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------------------
# Rate limiting (in-process sliding window; one worker per container)
# ---------------------------------------------------------------------------

class RateLimiter:
    def __init__(self) -> None:
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                retry = int(window_seconds - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="សំណើច្រើនពេក សូមព្យាយាមម្តងទៀតបន្តិចក្រោយ (Too many requests, please try again shortly)",
                    headers={"Retry-After": str(max(retry, 1))},
                )
            hits.append(now)
            # Keep memory bounded: drop idle keys now and then
            if len(self._hits) > 20000:
                for k in [k for k, v in self._hits.items() if not v or now - v[-1] > 3600]:
                    self._hits.pop(k, None)


rate_limiter = RateLimiter()


# ---------------------------------------------------------------------------
# URLs and slugs
# ---------------------------------------------------------------------------

def is_safe_url(value: Optional[str]) -> bool:
    """Only plain web links or our own upload paths: these strings end up in
    public hrefs/srcs, so javascript:, data: and protocol-relative are refused."""
    if value is None or value == "":
        return True
    v = value.strip()
    if v.startswith("/") and not v.startswith("//"):
        return True
    try:
        parsed = urlparse(v)
    except ValueError:
        return False
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{2,59}$")

# Paths under /wedding/ that belong to the app, not to a couple
RESERVED_SLUGS = {
    "preview-frame", "preview", "editor", "dashboard", "admin", "api", "new",
    "create", "login", "logout", "auth", "settings", "templates", "demo", "sample",
}


def clean_slug(raw: str) -> str:
    return re.sub(r"[^a-z0-9_-]", "", raw.strip().lower())


def validate_slug(slug: str) -> None:
    if not SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail="តំណភ្ជាប់ត្រូវមាន ៣-៦០ តួ (a-z, 0-9, - , _) (Link must be 3-60 characters: a-z, 0-9, - or _)",
        )
    if slug in RESERVED_SLUGS:
        raise HTTPException(status_code=400, detail="តំណភ្ជាប់នេះមិនអាចប្រើបានទេ (This link is reserved)")


# ---------------------------------------------------------------------------
# Uploads
# ---------------------------------------------------------------------------

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # client compresses to WebP first; 8 MB is generous
MAX_FILES_PER_REQUEST = 30


def sniff_image_extension(head: bytes) -> Optional[str]:
    """Trust the bytes, not the filename or the declared content type."""
    if head.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    return None
