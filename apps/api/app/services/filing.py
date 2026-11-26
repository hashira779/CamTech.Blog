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

# Cambodia markers — strictly Cambodian places, institutions, and leaders.
# Domestic newsroom names ("Kiripost", "Khmer Times") are intentionally omitted so
# syndicated AP/AFP world news ending in " - Kiripost" stays on WORLD unless copy mentions Cambodia.
KH_MARKERS = [
    "cambodia", "cambodian", "khmer", "phnom penh", "siem reap", "angkor",
    "kratie", "mondulkiri", "ratanakiri", "preah vihear", "sihanouk",
    "kampong", "kampot", "battambang", "pursat", "bavet", "poipet", "kep province",
    "koh kong", "stung treng", "oddar meanchey", "banteay meanchey", "takmao",
    "bokor", "bakong", "funan", "hun manet",
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
    "asean", "southeast asia", "southeast asian", "mekong", "rcep", "greater mekong", "clmv",
]

_ASEAN_MEMBER_NAMES = (
    "vietnam", "hanoi", "ho chi minh", "laos", "vientiane", "singapore",
    "malaysia", "kuala lumpur", "indonesia", "jakarta", "philippines",
    "manila", "brunei", "myanmar",
)

_WIRE_OUTLET_SUFFIX = re.compile(
    r"\s*[-–—|]\s*(?:kiripost|khmer times|phnom penh post|camboja news|camboja|"
    r"thmey thmey|fresh news|kampuchea thmey|akp|bangkok post|nation thailand|"
    r"the nation thailand|khaosod(?: english)?|thai pbs(?: world)?|channel newsasia|cna)\s*$",
    re.I,
)

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


def _strip_wire_credits(*texts) -> str:
    cleaned = [_WIRE_OUTLET_SUFFIX.sub("", str(t or "")).strip() for t in texts if t]
    return _norm(" ".join(cleaned))


def mentions_cambodia(*texts) -> bool:
    """Does any of this copy actually name Cambodia or a place in it?"""
    blob = _strip_wire_credits(*texts)
    if not blob:
        return False
    return any(marker in blob for marker in KH_MARKERS)


def mentions_thai_cambodia(*texts, source_name: Optional[str] = None, source_country: Optional[str] = None) -> bool:
    """True when reporting is from a Thai outlet about Cambodia or covers bilateral Thailand-Cambodia affairs."""
    raw_blob = _norm(" ".join(str(t or "") for t in texts))
    clean_blob = _strip_wire_credits(*texts)
    src_blob = _norm(source_name)
    is_thai_source = _norm(source_country) == "th" or any(m in src_blob or m in raw_blob for m in TH_OUTLET_MARKERS)
    if not mentions_cambodia(*texts):
        return False
    if is_thai_source:
        return True
    if any(pair in clean_blob for pair in ("thai-cambodia", "cambodia-thailand", "thailand-cambodia")):
        return True
    # Strong bilateral border/diplomacy/security signals when both Thailand and Cambodia are named together
    mentions_th = any(marker in clean_blob for marker in TH_CONTEXT_MARKERS)
    bilateral_topic = any(
        tok in clean_blob
        for tok in (
            "border", "migrant", "worker", "koh kood", "aranyaprathet", "poipet",
            "ban khlong luek", "embassy", "weapon", "rocket", "military", "defense",
            "defence", "security", "dispute", "tension", "bilateral", "concern",
            "diplom", "tariff", "preah vihear",
        )
    )
    return mentions_th and bilateral_topic


def mentions_asean(*texts, source_country: Optional[str] = None, source_name: Optional[str] = None) -> bool:
    """True when reporting centers on ASEAN / Mekong affairs (or is from an ASEAN feed naming a member nation)."""
    blob = _strip_wire_credits(*texts)
    if not blob:
        return False
    if any(marker in blob for marker in ASEAN_MARKERS):
        return True
    src_is_asean = _norm(source_country) == "asean" or any(
        tok in _norm(source_name) for tok in ("channel newsasia", "cna", "asean", "mekong")
    )
    return src_is_asean and any(member in blob for member in _ASEAN_MEMBER_NAMES)


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
    if mentions_asean(*story_texts, source_country=source_country, source_name=source_name):
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
