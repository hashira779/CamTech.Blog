"""Editorial filing rules shared by every write path (RSS worker, AI generators, admin).

Two questions kept coming back wrong because each pipeline answered them its own way:

1. Which desk does this story belong to? The site organises news across four clean desks:
   - KH: Domestic / national Cambodia reporting.
   - TH: Thai media & cross-border Thailand reporting specifically about Cambodia
         (e.g. Bangkok Post, Nation Thailand, Khaosod, Thai PBS covering Cambodia).
   - ASEAN: Southeast Asian regional developments affecting Cambodia.
   - WORLD: Global news and international technology/markets.

2. May this photograph be shown? See ``hero_provenance_ok``.
"""
import re
from typing import Optional, Tuple

# Cambodia markers — strictly Cambodian places, institutions, leaders, and media.
KH_MARKERS = [
    "cambodia", "cambodian", "khmer", "phnom penh", "siem reap", "angkor",
    "kratie", "mondulkiri", "ratanakiri", "preah vihear", "sihanouk",
    "kampong", "kampot", "battambang", "pursat", "bavet", "poipet", "kep province",
    "koh kong", "stung treng", "oddar meanchey", "banteay meanchey", "takmao",
    "bokor", "bakong", "funan", "hun manet", "khmer times", "phnom penh post",
    "kiripost", "camboja",
]

TH_OUTLET_MARKERS = [
    "bangkok post", "nation thailand", "the nation thailand", "khaosod",
    "thai pbs", "thaipbs", "matichon", "thairath", "the thaiger", "thaiger",
]

TH_CONTEXT_MARKERS = [
    "thailand", "thai ", "bangkok", "aranyaprathet", "sa kaeo", "surin",
    "si sa ket", "koh kood", "promptpay", "thai-cambodia", "cambodia-thailand",
    "thailand-cambodia", "thai border", "thai cabinet", "thai government",
]

ASEAN_MARKERS = [
    "asean", "southeast asia", "mekong", "rcep", "vietnam", "hanoi", "ho chi minh",
    "laos", "vientiane", "singapore", "malaysia", "kuala lumpur", "indonesia",
    "jakarta", "philippines", "manila", "brunei", "myanmar", "channel newsasia",
]

# Stock hosts that can never illustrate a specific news story.
STOCK_IMAGE_HOSTS = ["images.unsplash.com", "unsplash.com", "placehold.co", "via.placeholder.com"]

# A Wikimedia file may only be credited to Wikimedia (or to the publisher that supplied it).
_WIKIMEDIA_HOSTS = ("wikimedia.org", "wikipedia.org")
_CREDIT_OK_ON_WIKIMEDIA = ("wikimedia", "wikipedia", "image:")

CAMBODIA_CATEGORY_SLUGS = {"cambodia", "phnom-penh", "khmer-news"}
TH_CAMBODIA_CATEGORY_SLUGS = {"thailand-cambodia", "thai-cambodia", "thai-news-cambodia"}
ASEAN_CATEGORY_SLUGS = {"asean", "southeast-asia", "regional"}

_BRAND_SUFFIX = re.compile(
    r"\s*[|\-–—]\s*(?:daily discovery|camtech blog|camtech\.blog)(?: travel)?\s*$", re.I
)


def strip_brand_suffix(value: Optional[str]) -> Optional[str]:
    """Remove a trailing site-brand from a stored headline or SEO title."""
    if not value:
        return value
    cleaned = _BRAND_SUFFIX.sub("", value).strip()
    return cleaned or value.strip()


def _norm(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower())


def mentions_cambodia(*texts) -> bool:
    """Does any of this copy actually name Cambodia or a place in it?"""
    blob = _norm(" ".join(str(t or "") for t in texts))
    if not blob:
        return False
    return any(marker in blob for marker in KH_MARKERS)


def mentions_thai_cambodia(*texts, source_name: Optional[str] = None, source_country: Optional[str] = None) -> bool:
    """True when reporting is from a Thai outlet about Cambodia or covers bilateral Thailand-Cambodia affairs."""
    blob = _norm(" ".join(str(t or "") for t in texts))
    src_blob = _norm(source_name)
    is_thai_source = _norm(source_country) == "th" or any(m in src_blob or m in blob for m in TH_OUTLET_MARKERS)
    if not mentions_cambodia(blob):
        return False
    if is_thai_source:
        return True
    if any(pair in blob for pair in ("thai-cambodia", "cambodia-thailand", "thailand-cambodia")):
        return True
    # Strong bilateral border/worker signals when both Thailand and Cambodia are named together
    mentions_th = any(marker in blob for marker in TH_CONTEXT_MARKERS)
    bilateral_topic = any(tok in blob for tok in ("border", "migrant", "worker", "koh kood", "aranyaprathet", "poipet", "ban khlong luek", "embassy"))
    return mentions_th and bilateral_topic


def mentions_asean(*texts) -> bool:
    """True when reporting explicitly centers on ASEAN or Southeast Asian regional affairs."""
    blob = _norm(" ".join(str(t or "") for t in texts))
    if not blob:
        return False
    return any(marker in blob for marker in ASEAN_MARKERS)


def resolve_country(
    detected_category: Optional[str] = None,
    source_country: Optional[str] = None,
    *story_texts,
    source_name: Optional[str] = None,
) -> str:
    """File a story on the desk it is about: KH, TH (Thai news on Cambodia), ASEAN, or WORLD."""
    cat = _norm(detected_category)
    if cat in ("thailand-cambodia", "thai-cambodia", "thai news on cambodia", "thai-news-cambodia", "thailand"):
        return "TH"
    if mentions_thai_cambodia(*story_texts, source_name=source_name, source_country=source_country):
        return "TH"
    if cat in ("cambodia", "khmer", "cambodia news"):
        return "KH"
    if mentions_cambodia(*story_texts):
        return "KH"
    if cat in ("asean", "regional", "southeast asia", "southeast-asia"):
        return "ASEAN"
    if not detected_category and _norm(source_country) == "kh":
        return "KH"
    if not detected_category and _norm(source_country) == "asean":
        return "ASEAN"
    return "WORLD"


def category_is_cambodia(category_slug: Optional[str], category_scope: Optional[str]) -> bool:
    slug = _norm(category_slug)
    scope = _norm(category_scope)
    return slug in CAMBODIA_CATEGORY_SLUGS or scope in ("cambodia", "kh")


def filing_is_consistent(country: Optional[str], category_slug: Optional[str], category_scope: Optional[str]) -> bool:
    """A Cambodia-scope category requires the story to sit on the Cambodia (or Thai-Cambodia) desk."""
    slug = _norm(category_slug)
    if slug in TH_CAMBODIA_CATEGORY_SLUGS:
        return _norm(country) in ("th", "kh")
    if not category_is_cambodia(category_slug, category_scope):
        return True
    return _norm(country) in ("kh", "th")


def hero_provenance_ok(url: Optional[str], credit: Optional[str]) -> Tuple[bool, str]:
    """Can we honestly show and caption this photograph?"""
    if not url:
        return True, ""

    from app.services.ai_tourism_engine import is_generic_place_image

    lowered = _norm(url)
    if any(host in lowered for host in STOCK_IMAGE_HOSTS):
        return False, "hero image is a generic stock photograph"
    if is_generic_place_image(url):
        return False, "hero image comes from the curated fallback pool"

    host = (re.match(r"https?://([^/]+)", str(url)) or [None, ""])[1].lower()
    if any(w in host for w in _WIKIMEDIA_HOSTS):
        low_credit = _norm(credit)
        if not any(ok in low_credit for ok in _CREDIT_OK_ON_WIKIMEDIA):
            return False, f"credit '{credit}' does not match the file host {host}"
    return True, ""
