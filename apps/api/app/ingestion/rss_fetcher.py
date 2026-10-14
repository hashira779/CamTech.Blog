import re
import time
import feedparser
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 (Compatible; CamTechBot/2.0; +https://blog.camtech.cam)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8"
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

        # Extract publisher metadata from syndicated feeds (e.g. Google News RSS source tag)
        source_obj = entry.get("source")
        source_href = None
        source_name = None
        if isinstance(source_obj, dict):
            source_href = source_obj.get("href")
            source_name = source_obj.get("title")

        if title and link:
            # If link is a syndicated redirect (e.g. news.google.com), prefer source_href as primary url
            article_url = link
            if source_href and "news.google.com" in link:
                article_url = source_href

            items.append({
                "title": title,
                "url": article_url,
                "feed_item_link": link,
                "source_href": source_href,
                "source_name": source_name,
                "raw_summary": summary,
                "author": author,
                "published_raw": pub_date,
                "image_url": extract_entry_image(entry, summary),
            })

    return items


_IMG_SRC_RE = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.IGNORECASE)


def _https_image(url: Optional[str]) -> Optional[str]:
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    if not url.startswith("https://") or len(url) > 500:
        return None
    return url


def extract_entry_image(entry: Any, summary_html: str = "") -> Optional[str]:
    """Best-effort hero image from an RSS/Atom entry (media:content, media:thumbnail,
    image enclosures, then the first <img> in the summary). HTTPS only."""
    for key in ("media_content", "media_thumbnail"):
        for media in entry.get(key, []) or []:
            medium = (media.get("medium") or media.get("type") or "image").lower()
            if "image" in medium:
                found = _https_image(media.get("url"))
                if found:
                    return found
    for link in entry.get("links", []) or []:
        if link.get("rel") == "enclosure" and str(link.get("type", "")).startswith("image"):
            found = _https_image(link.get("href"))
            if found:
                return found
    match = _IMG_SRC_RE.search(summary_html or "")
    if match:
        return _https_image(match.group(1))
    return None
