"""Conservative editorial checks; these are internal rules, not Google requirements."""
import re
from urllib.parse import urlsplit

from app.common.html_hygiene import strip_for_text

MIN_BODY_CHARS = 1000
FILLER_PHRASES = (
    "official statements and documentation are being monitored",
    "further regional developments are expected to follow",
    "important indicator for stakeholders following regional and sector-specific trends",
    "sustained monitoring will clarify long-term impacts",
)


def body_quality_issue(content, summary="", context=""):
    text = strip_for_text(content or "")
    if len(re.sub(r"\s", "", text)) < MIN_BODY_CHARS:
        return "Article needs a substantive body (at least 1000 non-whitespace text characters)"
    combined = " ".join((text, summary or "", context or "")).lower()
    if any(phrase in combined for phrase in FILLER_PHRASES):
        return "Replace generic monitoring boilerplate with specific, verified reporting"
    if text.casefold().strip() == strip_for_text(summary or "").casefold().strip():
        return "Article body must add information beyond the summary"
    return None


def has_specific_source(url):
    try:
        parsed = urlsplit(url or "")
        return (parsed.scheme in {"http", "https"} and bool(parsed.hostname)
                and parsed.path.strip("/") != "" and not parsed.username)
    except ValueError:
        return False
