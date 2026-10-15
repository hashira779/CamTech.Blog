"""Editorial filing rules shared by every write path (RSS worker, AI generators, admin).

Two questions kept coming back wrong because each pipeline answered them its own way:

1. Which desk does this story belong to? The RSS worker copied the *publisher's* country,
   so a Khmer Times report on the US election landed on the Cambodia page, and the AI news
   generator ignored the publisher entirely and used a per-category constant, so a story
   about the Bakong payments system filed under "technology" became WORLD news.

2. May this photograph be shown? See ``hero_provenance_ok``.

The rule for (1) is about the story, not the outlet: Cambodia desk when the text names
Cambodia or a Cambodian province, World desk otherwise.
"""
import re
from typing import Optional, Tuple

# Country codes the site can file a story under. Anything else is world news.
KH_MARKERS = [
    "cambodia", "cambodian", "khmer", "phnom penh", "siem reap", "angkor", "asean",
    "mekong", "kratie", "mondulkiri", "ratanakiri", "preah vihear", "sihanouk",
    "kampong", "kampot", "battambang", "pursat", "bavet", "kep province", "koh kong",
    "stung treng", "oddar meanchey", "takmao", "bokor", "phnom",
]

# Stock hosts that can never illustrate a specific news story.
STOCK_IMAGE_HOSTS = ["images.unsplash.com", "unsplash.com", "placehold.co", "via.placeholder.com"]

# A Wikimedia file may only be credited to Wikimedia (or to the publisher that supplied it).
_WIKIMEDIA_HOSTS = ("wikimedia.org", "wikipedia.org")
_CREDIT_OK_ON_WIKIMEDIA = ("wikimedia", "wikipedia", "image:")

# Category slugs that belong on the Cambodia desk regardless of what the text says.
CAMBODIA_CATEGORY_SLUGS = {"cambodia", "phnom-penh", "khmer-news"}

# The site brand belongs to the metadata template, never to a stored title. Older AI
# drafts wrote "Story | Daily Discovery" into seo_title, so the browser tab read the
# brand twice once the template appended the current name.
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


def resolve_country(
    detected_category: Optional[str] = None,
    source_country: Optional[str] = None,
    *story_texts,
) -> str:
    """File a story on the desk it is about, not the desk that published it.

    Cambodian outlets report world news and world outlets report Cambodian news. The
    publisher's country is only a hint for a story the classifier could not place at all;
    used as the rule, it is what put US election coverage on the Cambodia page.
    """
    if _norm(detected_category) in ("cambodia", "khmer", "cambodia news"):
        return "KH"
    if mentions_cambodia(*story_texts):
        return "KH"
    if not detected_category and _norm(source_country) == "kh":
        return "KH"
    return "WORLD"


def category_is_cambodia(category_slug: Optional[str], category_scope: Optional[str]) -> bool:
    slug = _norm(category_slug)
    scope = _norm(category_scope)
    return slug in CAMBODIA_CATEGORY_SLUGS or scope in ("cambodia", "kh")


def filing_is_consistent(country: Optional[str], category_slug: Optional[str], category_scope: Optional[str]) -> bool:
    """A Cambodia-scope category requires the story to sit on the Cambodia desk.

    The reader's nav uses ``country``; the chip and the category page use the other field.
    When they disagree, a story listed under /world links to /cambodia — the misfiling
    readers noticed. The reverse is normal: a Cambodian-desk story can be Technology.
    """
    if not category_is_cambodia(category_slug, category_scope):
        return True
    return _norm(country) == "kh"


def hero_provenance_ok(url: Optional[str], credit: Optional[str]) -> Tuple[bool, str]:
    """Can we honestly show and caption this photograph?

    Rejected: the hardcoded generic pools the pipeline used as a fallback (26 of 81 stored
    heroes, including 4 of 5 published ones), any stock host, and a caption that does not
    belong to the file's own host — "NASA / ESA / CSA Scientific Archive" sat on an
    Unsplash picture, and "Wikipedia / Public Press Attribution" on a second one.
    """
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
