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
    "comprehensive overview and background context",
    "recent reporting and verified institutional documentation outline significant developments",
    "while the exact technical specifications of",
    "evolving vector in cybercrime",
)

_KHMER_CHAR_RE = re.compile(r"[\u1780-\u17FF]")
_FOREIGN_SCRIPT_RE = re.compile(r"[\u0E00-\u0E7F\u0E80-\u0EFF]")


def khmer_quality_issue(
    title_km: str | None,
    summary_km: str | None,
    content_km: str | None,
    title_en: str | None = "",
    summary_en: str | None = "",
    content_en: str | None = "",
    require_complete: bool = False,
) -> str | None:
    """Validate Khmer fields for pure script integrity and completeness."""
    for label, val in (("title_km", title_km), ("summary_km", summary_km), ("content_km", content_km)):
        if val and _FOREIGN_SCRIPT_RE.search(str(val)):
            return (
                f"Khmer translation ({label}) contains mixed Thai or Lao script characters "
                "and must be regenerated cleanly"
            )

    t_count = len(_KHMER_CHAR_RE.findall(str(title_km or "")))
    s_count = len(_KHMER_CHAR_RE.findall(str(summary_km or "")))
    c_count = len(_KHMER_CHAR_RE.findall(strip_for_text(content_km or "")))

    if (t_count >= 3 or s_count >= 10) and c_count < 25:
        return (
            "Partial Khmer translation: headline/summary exist in Khmer without a "
            "complete Khmer body (content_km)"
        )

    if require_complete:
        if (title_en or "").strip() and t_count < 3:
            return "Missing verified Khmer headline (title_km) before auto-publish"
        if (summary_en or "").strip() and s_count < 10:
            return "Missing verified Khmer summary (summary_km) before auto-publish"
        if (content_en or "").strip() and c_count < 25:
            return "Missing full Khmer article body (content_km) before auto-publish"
    return None


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
