import time
import feedparser
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.common.ssrf import validate_url_safe
from app.common.circuit_breaker import get_circuit_breaker, CircuitBreakerOpenException

MAX_FEED_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB payload limit to prevent resource exhaustion

async def fetch_rss_feed(feed_url: str, timeout_seconds: int = 12) -> List[Dict[str, Any]]:
    """
    Fetches and parses an RSS or Atom feed with SSRF protection, circuit-breaker fault isolation,
    payload size limits, and polite bot headers.
    """
    # 1. SSRF URL validation
    is_safe, error_msg = validate_url_safe(feed_url)
    if not is_safe:
        raise ValueError(f"SSRF Protection Rejected URL: {error_msg}")

    # 2. Circuit Breaker check
    cb = get_circuit_breaker("rss_fetcher", failure_threshold=5, recovery_timeout=45.0)
    if not cb.can_execute():
        raise CircuitBreakerOpenException(f"Circuit breaker 'rss_fetcher' is OPEN. External feed requests paused.")

    headers = {
        "User-Agent": "DailyDiscoveryBot/1.0 (+https://dailydiscovery.com; news-verification)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"
    }

    try:
        async with httpx.AsyncClient(
            timeout=timeout_seconds,
            follow_redirects=False,  # We will manually validate redirects against SSRF
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        ) as client:
            current_url = feed_url
            response = None
            redirect_count = 0

            # Follow redirects with SSRF validation on each hop (max 3 hops)
            while redirect_count < 3:
                response = await client.get(current_url, headers=headers)
                if response.is_redirect:
                    redirect_url = response.headers.get("Location")
                    if not redirect_url:
                        break
                    # Validate redirect URL against SSRF
                    is_safe_redirect, redirect_err = validate_url_safe(redirect_url)
                    if not is_safe_redirect:
                        raise ValueError(f"SSRF rejected redirect hop: {redirect_err}")
                    current_url = redirect_url
                    redirect_count += 1
                else:
                    break

            if response is None:
                raise ValueError("No response received from feed target.")

            response.raise_for_status()

            # Enforce max body size
            if len(response.content) > MAX_FEED_SIZE_BYTES:
                raise ValueError(f"Feed content exceeded maximum allowed limit of {MAX_FEED_SIZE_BYTES} bytes.")

            content = response.text
            cb.record_success()

    except Exception as e:
        cb.record_failure()
        raise e

    parsed = feedparser.parse(content)
    items = []

    for entry in parsed.entries:
        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        summary = entry.get("summary", "") or entry.get("description", "")
        author = entry.get("author", "")
        pub_date = entry.get("published", "") or entry.get("updated", "")

        if title and link:
            items.append({
                "title": title,
                "url": link,
                "raw_summary": summary,
                "author": author,
                "published_raw": pub_date
            })

    return items
