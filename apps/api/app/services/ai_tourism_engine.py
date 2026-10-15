"""
AI Tourism Engine — Automatic discovery of tourist places across all 25 provinces of Cambodia.
Uses Google Gemini AI to research, generate, and insert real tourist places into the database.
Designed to run once per week via APScheduler.
"""
import json
import uuid
import re
import os
import difflib
import logging
import asyncio
import httpx
import urllib.parse
from typing import Optional
from datetime import datetime, timezone
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
from app.common.config import settings
from app.common.database import SessionLocal
from app.models.location import Country, Destination
from app.models.place import Place
from app.models.audit import SiteSetting
from app.services.google_drive_service import storage_service
from app.services.s3_service import s3_service
from app.services import ai_gateway

logger = logging.getLogger(__name__)

async def _call_you_com(prompt: str, api_key: str) -> str:
    if not api_key or not str(api_key).strip():
        return None
    api_key = str(api_key).strip()

    # 1. Try You.com Research API (fast 'lite' effort for rapid response)
    try:
        url = "https://api.you.com/v1/research"
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "input": f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON. No conversational commentary or markdown introduction.",
            "research_effort": "lite"
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                content = data.get("output", {}).get("content", "")
                if isinstance(content, (dict, list)):
                    return json.dumps(content)
                if content:
                    # Clean out citation marks like [[1]] or [[2]]
                    cleaned = re.sub(r'\[\[\d+\]\]', '', str(content))
                    return cleaned
    except Exception as e:
        logger.warning(f"You.com Research API failed: {e}")

    # 2. Try You.com Answer API as fallback (supported on standard developer keys)
    try:
        url = "https://api.you.com/v1/answer"
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "query": f"{prompt}\n\nReturn strictly valid JSON only."
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                answer = data.get("answer", "")
                if answer:
                    cleaned = re.sub(r'\[\[\d+\]\]', '', str(answer))
                    return cleaned
    except Exception as e:
        logger.warning(f"You.com Answer API fallback failed: {e}")

    return None

async def _you_web_search(query: str, api_key: str) -> dict:
    """Uses You.com Web Search API (https://ydc-index.io/v1/search) to get real search highlights and image thumbnails."""
    if not api_key or not str(api_key).strip():
        return None
    api_key = str(api_key).strip()
    headers = {"X-API-Key": api_key}
    params = {"query": query}

    # Primary official URL for You.com Search index is https://ydc-index.io/v1/search
    for url in ["https://ydc-index.io/v1/search", "https://api.you.com/v1/search"]:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"You.com Web Search at {url} failed: {e}")
            continue
    return None

BAD_IMAGE_KEYWORDS = [
    "flag", "symbol", "coat_of_arms", "icon", "map", "logo", "stub", 
    "diagram", "locator", ".svg", "emblem", "seal_of", "district_in",
    "blank", "placeholder", "commons-logo", "wikivoyage", "wikidata",
    # Reject business / ceremony / signing / politician photos for landmarks
    "signing", "mou", "agreement", "deliveree", "conference", "summit", 
    "handshake", "accord", "press_release", "official_portrait", "minister", 
    "diplomat", "meeting", "bilateral", "contract", "stadium", "football",
    # Reject third-party travel aggregator logos & badges
    "tripadvisor", "trip.com", "booking.com", "agoda", "expedia", 
    "banner", "badge", "watermark", "advertisement"
]

GENERIC_WIKI_PAGES = {
    'cambodia', 'kingdom of cambodia', 'tourism in cambodia', 'geography of cambodia', 
    'history of cambodia', 'culture of cambodia', 'politics of cambodia', 'economy of cambodia',
    'provinces of cambodia', 'transport in cambodia', 'demographics of cambodia'
}

def _score_wiki_page(title: str, place_name: str, clean_name: str) -> float:
    t_low = title.lower().strip()
    p_low = place_name.lower().strip()
    c_low = clean_name.lower().strip()
    if t_low in GENERIC_WIKI_PAGES or t_low.startswith('list of'):
        return -1.0
    if t_low == p_low or t_low == c_low:
        return 100.0
    if c_low in t_low or t_low in c_low:
        return 85.0
    words = [w for w in re.split(r'\W+', c_low) if len(w) > 2 and w not in ('the', 'and', 'cambodia', 'province', 'park', 'ancient', 'city', 'sanctuary', 'resort')]
    if not words:
        return 50.0 if any(w in t_low for w in re.split(r'\W+', c_low) if len(w) > 2) else 0.0
    matches = sum(1 for w in words if w in t_low)
    return (matches / len(words)) * 75.0 if matches > 0 else 0.0

async def fetch_wiki_image_items(place_name: str, province_name: str, local_name: str = None, max_images: int = 15) -> list[dict]:
    """Uses Wikipedia API with pageimages and embedded article media to find real high-resolution photos.

    Returns [{"url", "context"}] where context is the Wikipedia article title the image came from —
    that article title is the source evidence used later to decide whether the photo really shows
    the place, so images from an unrelated article can be rejected instead of padded in.
    """
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    queries = [
        clean_name,
        f"{clean_name} Cambodia",
        f"{clean_name} {province_name}",
    ]
    if local_name and local_name.strip():
        queries.append(local_name.strip())

    found_images = []
    seen = set()

    async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
        for q in dict.fromkeys(queries):
            url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrlimit=5&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=original&format=json"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = list(res.json().get("query", {}).get("pages", {}).values())
                    # Sort candidates by title relevance to the place
                    scored_pages = []
                    for p in pages:
                        score = _score_wiki_page(p.get("title", ""), place_name, clean_name)
                        if score > 20:
                            scored_pages.append((score, p))
                    scored_pages.sort(key=lambda x: x[0], reverse=True)

                    for score, p in scored_pages:
                        title = p.get("title", "")
                        # 1. Primary Pageimage
                        if "original" in p:
                            src = p["original"]["source"]
                            src_clean = src.split("?")[0]
                            if not any(bad in src_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                if src_clean not in seen:
                                    seen.add(src_clean)
                                    found_images.append({"url": src, "context": title})

                        # 2. Extract photos embedded within the relevant Wikipedia article
                        if title and len(found_images) < max_images:
                            art_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&generator=images&gimlimit=25&prop=imageinfo&iiprop=url|mime&format=json"
                            try:
                                art_res = await client.get(art_url)
                                if art_res.status_code == 200:
                                    art_pages = art_res.json().get("query", {}).get("pages", {})
                                    for img_p in art_pages.values():
                                        for info in img_p.get("imageinfo", []):
                                            u = info.get("url", "")
                                            u_clean = u.split("?")[0]
                                            mime = info.get("mime", "")
                                            if "image/" in mime and not any(bad in u_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                                if any(u_clean.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                                                    if u_clean not in seen:
                                                        seen.add(u_clean)
                                                        found_images.append({"url": u, "context": title})
                            except Exception:
                                pass
            except Exception as e:
                logger.debug(f"Wiki search error for {q}: {e}")

            if len(found_images) >= max_images:
                break

    return found_images

async def fetch_commons_image_items(place_name: str, province_name: str, max_images: int = 15) -> list[dict]:
    """Queries Wikimedia Commons open media library for real photos (1600px Full-HD).

    Returns [{"url", "context"}] where context is the Commons File title — i.e. the filename the
    community actually assigned to the photo, which is the evidence used to confirm it depicts
    this place.
    """
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    
    queries = [
        f"{clean_name} {province_name}",
        f"{clean_name} Cambodia",
        clean_name
    ]
    
    found = []
    seen = set()

    async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
        for q in queries:
            url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600&format=json&gsrlimit={max_images}"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    for p in pages.values():
                        for info in p.get("imageinfo", []):
                            u = info.get("thumburl") or info.get("url", "")
                            u_clean = u.split("?")[0]
                            mime = info.get("mime", "")
                            if "image/" in mime and not any(bad in u_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                if any(u_clean.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                                    if u_clean not in seen:
                                        seen.add(u_clean)
                                        found.append({"url": u, "context": p.get("title", "")})
            except Exception:
                pass
            if len(found) >= max_images:
                break

    return found

async def fetch_you_image_items(place_name: str, province_name: str, you_api_key: str, max_images: int = 12) -> list[dict]:
    """Queries You.com Web Search index to extract real travel thumbnails and images.

    Returns [{"url", "context"}] where context is the title of the page the thumbnail came from.
    """
    if not you_api_key:
        return []
    found = []
    seen = set()

    def _push(url: str, context: str):
        if not url or not url.startswith("http"):
            return
        key = url.split("?")[0]
        if key in seen:
            return
        seen.add(key)
        found.append({"url": url, "context": context or ""})

    try:
        search_data = await asyncio.wait_for(_you_web_search(f"{place_name} {province_name} Cambodia travel tourism", you_api_key), timeout=4.0)
        if search_data and "results" in search_data:
            # 1. Image results if present
            for img_item in search_data["results"].get("images", []):
                u = img_item.get("url") or img_item.get("thumbnail_url")
                _push(u, img_item.get("title") or img_item.get("description") or "")
            # 2. Web search thumbnails (TripAdvisor, Booking, blogs)
            for r in search_data["results"].get("web", []):
                thumb = r.get("thumbnail_url")
                if thumb and not any(bad in thumb.lower() for bad in BAD_IMAGE_KEYWORDS):
                    _push(thumb, r.get("title") or r.get("page_title") or "")
    except Exception:
        pass
    return found[:max_images]

# Minimal single fallback photo per category — only used when ALL real image sources fail
CATEGORY_FALLBACK_IMAGE = {
    "WATERFALL":     "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
    "TEMPLE":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "ACCOMMODATION": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Raffles_Hotel_Le_Royal.jpg/800px-Raffles_Hotel_Le_Royal.jpg",
    "RESTAURANT":    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Phnom_Penh_-_Street_Food.jpg/800px-Phnom_Penh_-_Street_Food.jpg",
    "CAFE":          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Phnom_Penh_-_Street_Food.jpg/800px-Phnom_Penh_-_Street_Food.jpg",
    "MARKET":        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Phsar_Thmei.jpg/800px-Phsar_Thmei.jpg",
    "MUSEUM":        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/National_Museum_Phnom_Penh.jpg/800px-National_Museum_Phnom_Penh.jpg",
    "NATIONAL_PARK": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/800px-Bokor_National_Park.jpg",
    "BEACH":         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Otres_Beach.jpg/800px-Otres_Beach.jpg",
    "LAKE":          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Tonle_Sap_Lake.jpg/800px-Tonle_Sap_Lake.jpg",
    "MOUNTAIN":      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/800px-Bokor_National_Park.jpg",
    "VILLAGE":       "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
    "ACTIVITY":      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "ATTRACTION":    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "RESORT":        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Raffles_Hotel_Le_Royal.jpg/800px-Raffles_Hotel_Le_Royal.jpg",
    "HIDDEN_GEM":    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
}

def get_category_fallback_photo(place_type: str, name: str) -> str:
    """Return a single generic photo for a place type.

    Deprecated for galleries: place galleries now store only images verified against the
    place name, so this is kept purely for callers that need a last-resort placeholder.
    """
    ptype = (place_type or "ATTRACTION").upper()
    return CATEGORY_FALLBACK_IMAGE.get(ptype, CATEGORY_FALLBACK_IMAGE["ATTRACTION"])


# --------------------------------------------------------------------------- image verification
# A place gallery must contain only photographs that really depict that place and that still
# load. Generic per-category stock padding produced irrelevant tiles (a butterfly or a beach on
# a biodiversity-centre card) and unverified external URLs produced broken tiles, so:
#   1. every candidate is checked against the place name using its SOURCE CONTEXT
#      (Wikipedia article title / Commons file title / web page title + filename);
#   2. anything coming from a static generic pool is rejected outright;
#   3. survivors get an HTTP liveness check before being stored.
# The result may legitimately contain fewer images than requested.

IMAGE_RELEVANCE_THRESHOLD = 0.6

PLACE_NAME_STOPWORDS = {
    "the", "of", "and", "in", "at", "de", "a", "an", "for", "with", "near",
    "cambodia", "cambodian", "kingdom", "province", "khan", "district", "commune", "village",
    "national", "park", "protected", "landscape", "centre", "center", "cultural", "complex",
    "heritage", "tourism", "site", "temple", "wat", "pagoda", "hotel", "resort", "restaurant",
    "cafe", "coffee", "market", "beach", "waterfall", "mountain", "lake", "river", "museum",
    "sanctuary", "attraction", "guesthouse", "guest", "house", "villa", "lodge", "cave",
}

# Words that carry no identity of their own but still form part of an official abbreviation.
NAME_CONNECTIVES = {"the", "of", "and", "in", "at", "de", "a", "an", "for", "with", "near"}


def _norm_text(value) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _url_key(url: str) -> str:
    return str(url or "").split("?")[0].strip().rstrip("/").lower()


def place_name_tokens(place_name: str, local_name: str = None) -> list[str]:
    """Distinctive words of a place name (generic travel/administrative words removed)."""
    tokens: list[str] = []
    for part in (place_name, local_name):
        for word in _norm_text(part).split():
            if len(word) >= 3 and word not in PLACE_NAME_STOPWORDS and word not in tokens:
                tokens.append(word)
    return tokens


_PARENTHETICAL_ALIAS_RE = re.compile(r"[(\[]([^\])]{2,80})[\])]")


def place_name_variants(place_name: str, local_name: str = None) -> list[str]:
    """Every way this place is spelled, so an alias cannot dilute the real name.

    "Ta Prohm (Tomb Raider Temple)" is photographed and titled as "Ta Prohm"; scoring the
    whole string as one name demands "tomb" and "raider" too, so genuine temple photos were
    dropped. Each variant is scored on its own and the strongest match wins.
    """
    raw = str(place_name or "").strip()
    variants: list[str] = [raw]
    variants.extend(_PARENTHETICAL_ALIAS_RE.findall(raw))
    stripped = _PARENTHETICAL_ALIAS_RE.sub(" ", raw).strip()
    if stripped:
        variants.append(stripped)
    if local_name:
        variants.append(str(local_name))

    seen: set[str] = set()
    unique: list[str] = []
    for variant in variants:
        key = _norm_text(variant)
        if key and key not in seen:
            seen.add(key)
            unique.append(variant)
    return unique


def _score_name_variant(
    name: str, words: set[str], compact: str, haystack: str
) -> float:
    full_name = _norm_text(name)
    if not full_name:
        return 0.0
    if full_name in haystack:
        return 1.0

    tokens = place_name_tokens(name)
    if not tokens:
        return 0.0

    acronym_words = [w for w in full_name.split() if w not in NAME_CONNECTIVES]
    if len(acronym_words) >= 3:
        if "".join(w[0] for w in acronym_words) in compact:
            return 0.9

    matched = sum(1 for token in tokens if token in words or (len(token) >= 4 and token in compact))
    return matched / len(tokens)


def image_relevance(url: str, context: str = "", place_name: str = None, local_name: str = None) -> float:
    """0.0-1.0 confidence that an image depicts the place, judged from its source context + filename."""
    if not place_name:
        return 0.0
    haystack = _norm_text(f"{context} {urllib.parse.unquote(_url_key(url))}")
    if not haystack:
        return 0.0
    words = set(haystack.split())
    compact = haystack.replace(" ", "")

    variants = place_name_variants(place_name, local_name)
    if not variants:
        return 0.0
    return max(_score_name_variant(v, words, compact, haystack) for v in variants)


_GENERIC_POOL_KEYS: set[str] | None = None


def generic_pool_image_keys() -> set[str]:
    """Normalized URLs of every image in the static generic pools — never valid for a real place."""
    global _GENERIC_POOL_KEYS
    if _GENERIC_POOL_KEYS is not None:
        return _GENERIC_POOL_KEYS

    keys: set[str] = {_url_key(url) for url in CATEGORY_FALLBACK_IMAGE.values()}
    # The pools are module-level constants (the imported name in this file is the service instance).
    from app.services import image_search_service as _image_search_module

    for pool_name in ("PLACE_CATEGORY_POOLS", "CATEGORY_NEWS_IMAGE_POOLS"):
        for pool in getattr(_image_search_module, pool_name, {}).values():
            for url in pool:
                keys.add(_url_key(url))
    _GENERIC_POOL_KEYS = {k for k in keys if k}
    return _GENERIC_POOL_KEYS


def verify_place_image(url: str, context: str = "", place_name: str = None, local_name: str = None) -> tuple[bool, float]:
    """True only for real, place-matched, non-generic images that plausibly depict the place."""
    key = _url_key(url)
    if not key or key.startswith("/") or not str(url).startswith("http"):
        return False, 0.0
    if key in generic_pool_image_keys():
        return False, 0.0
    if any(bad in key.lower() for bad in BAD_IMAGE_KEYWORDS):
        return False, 0.0
    score = image_relevance(url, context, place_name, local_name)
    return score >= IMAGE_RELEVANCE_THRESHOLD, score


def is_generic_place_image(url: str) -> bool:
    """True when the URL is one of the hardcoded generic stock/fallback photos."""
    return _url_key(url) in generic_pool_image_keys()


def same_image(a, b) -> bool:
    """Whether two stored/discovered URLs point at the same picture.

    Comparison ignores the query string because the same Commons file comes back as
    ``.../Grand_Hotel_dAngkor_SiemReap.jpg`` and ``...jpg?utm_source=en.wikipedia.org``. Without
    this, a rescan that found the identical photograph looks like a replacement in the report.
    """
    ka, kb = _url_key(a), _url_key(b)
    return bool(ka) and ka == kb


def image_set_changed(before: list[str], after: list[str]) -> bool:
    """True when a gallery really holds a different collection of pictures (order ignored)."""
    return {k for k in (_url_key(u) for u in before) if k} != {k for k in (_url_key(u) for u in after) if k}


def parse_gallery_urls(raw) -> list[str]:
    """A stored gallery_json value as a list of URL strings, tolerating junk."""
    if isinstance(raw, list):
        return [u for u in raw if isinstance(u, str)]
    try:
        data = json.loads(raw or "[]")
    except (TypeError, ValueError):
        return []
    return [u for u in data if isinstance(u, str)] if isinstance(data, list) else []


def place_image_audit(hero_url: Optional[str], gallery_json, place_name: str,
                      local_name: Optional[str] = None) -> dict:
    """Judge the images a place ALREADY has, with the same verifier that judged them on entry.

    This is the question the scan never used to ask. ``/admin/ai/enhance-place-images``
    selected only places whose hero was empty or a ``/images/destinations/`` placeholder, so
    every place that already carried an http hero was skipped permanently - including the ones
    holding a photograph of something else entirely (a big cat on the Elephant Valley card, a
    French-captioned Kinnari statue on Royal Palace). A wrong image is invisible to a rule that
    only looks for missing ones.

    Returns ``{"needs_work": bool, "reasons": [...], "hero_score": float|None,
    "unverified_gallery": [...]}``. Verification here is filename/source-URL only, because no
    capture context is stored, and an opaque but legitimate Wikimedia filename scores 0.0 - so
    an unverified hero is a *suspicion to re-research*, never proof, and callers must not
    delete a hero on this alone.
    """
    hero = (hero_url or "").strip()
    reasons: list[str] = []
    hero_score: Optional[float] = None
    gallery = parse_gallery_urls(gallery_json)

    if not hero:
        reasons.append("no hero image")
    elif not hero.startswith("http"):
        reasons.append(f"hero is not a loadable URL ({hero[:48]})")
    elif is_generic_place_image(hero):
        reasons.append("hero comes from the generic stock pool")
    else:
        ok, hero_score = verify_place_image(hero, "", place_name, local_name)
        if not ok:
            reasons.append(f"hero is not place-matched (confidence {hero_score:.2f})")

    unverified = [u for u in gallery if not (u.startswith("http")
                  and not is_generic_place_image(u)
                  and verify_place_image(u, "", place_name, local_name)[0])]
    if unverified:
        reasons.append(f"{len(unverified)} gallery image(s) not place-matched")

    return {
        "needs_work": bool(reasons),
        "reasons": reasons,
        "hero_score": hero_score,
        "unverified_gallery": unverified,
        "gallery_count": len(gallery),
    }


def subject_context_matches(haystack: str, subject: str = "", destination: str = "") -> bool:
    """Does this text (an image filename, page title, or file name) name the subject or its province?"""
    normalized = _norm_text(haystack)
    if not normalized:
        return False
    words = set(normalized.split())
    compact = normalized.replace(" ", "")

    for word in _norm_text(destination).split():
        if len(word) >= 4 and (word in words or word in compact):
            return True

    distinctive = [token for token in place_name_tokens(subject) if len(token) >= 5]
    return any(token in words or token in compact for token in distinctive)


def content_image_matches(url: str, context: str = "", subject: str = "", destination: str = "") -> bool:
    """Does this photo actually depict an article's subject or its province?

    Guides and events are not places, so the strict place-token rule does not fit: a photo
    titled "Angkor Wat at dawn" belongs on a Siem Reap sunrise guide even though the guide
    title holds five more words. Accept when the source context names the destination or a
    distinctive word of the subject; generic stock pools are always rejected.
    """
    key = _url_key(url)
    if not key or not str(url).startswith("http"):
        return False
    if key in generic_pool_image_keys():
        return False

    haystack = f"{context} {urllib.parse.unquote(key)}"
    return subject_context_matches(haystack, subject=subject, destination=destination)


async def filter_live_images(urls: list[str], timeout: float = 6.0, concurrency: int = 6, overall_budget: float = 20.0) -> list[str]:
    """Keep only URLs that actually return a loadable image (200 + image/* content type).

    Fails open: if the whole batch cannot be checked (network trouble / budget exceeded) the
    input is returned untouched so a transient outage never wipes a good gallery.
    """
    urls = [u for u in urls if isinstance(u, str) and u.startswith("http")]
    if not urls:
        return []

    sem = asyncio.Semaphore(max(1, concurrency))
    headers = {
        "User-Agent": "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }

    async def _check(client: httpx.AsyncClient, url: str) -> Optional[bool]:
        """True = loads, False = provably gone, None = inconclusive (keep the image)."""
        async with sem:
            try:
                async with client.stream("GET", url, headers=headers, timeout=timeout) as res:
                    if res.status_code in (404, 410):
                        return False
                    if res.status_code != 200:
                        # 429 from a CDN that rate-limits bulk checks, 5xx, hotlink 403:
                        # the photo may be perfectly fine, so never delete on a guess.
                        logger.debug(f"[PlaceImages] liveness inconclusive ({res.status_code}) {url}")
                        return None
                    content_type = (res.headers.get("content-type") or "").lower()
                    if content_type and not content_type.startswith("image"):
                        return False
                    return True
            except Exception:
                return None

    outcome: list[Optional[bool]] = [None] * len(urls)
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            results = await asyncio.wait_for(
                asyncio.gather(*[_check(client, u) for u in urls], return_exceptions=True),
                timeout=overall_budget,
            )
        for idx, res in enumerate(results):
            outcome[idx] = res if isinstance(res, bool) else None
    except Exception as e:
        logger.warning(f"[PlaceImages] liveness check unavailable, keeping candidates: {e}")
        return urls

    # Fail open per URL: only a proven 404/410 or a non-image content type removes an image.
    kept = [u for u, ok in zip(urls, outcome) if ok is not False]
    dropped = len(urls) - len(kept)
    inconclusive = sum(1 for ok in outcome if ok is None)
    if dropped:
        logger.info(f"[PlaceImages] dropped {dropped} dead/non-image URL(s)")
    if inconclusive:
        logger.info(f"[PlaceImages] kept {inconclusive} URL(s) that could not be confirmed")
    return kept


# All 25 provinces/cities of Cambodia
CAMBODIA_PROVINCES = [
    {"name": "Phnom Penh", "name_km": "ភ្នំពេញ", "slug": "phnom-penh", "hero_image_url": "/images/destinations/phnom-penh.jpg"},
    {"name": "Siem Reap", "name_km": "សៀមរាប", "slug": "siem-reap", "hero_image_url": "/images/destinations/siem-reap.jpg"},
    {"name": "Sihanoukville", "name_km": "ក្រុងព្រះសីហនុ", "slug": "sihanoukville", "hero_image_url": "/images/destinations/sihanoukville.jpg"},
    {"name": "Battambang", "name_km": "បាត់ដំបង", "slug": "battambang", "hero_image_url": "/images/destinations/battambang.jpg"},
    {"name": "Kampot", "name_km": "កំពត", "slug": "kampot", "hero_image_url": "/images/destinations/kampot.jpg"},
    {"name": "Kep", "name_km": "កែប", "slug": "kep", "hero_image_url": "/images/destinations/kep.jpg"},
    {"name": "Kratie", "name_km": "ក្រចេះ", "slug": "kratie", "hero_image_url": "/images/destinations/kratie.jpg"},
    {"name": "Mondulkiri", "name_km": "មណ្ឌលគិរី", "slug": "mondulkiri", "hero_image_url": "/images/destinations/mondulkiri.jpg"},
    {"name": "Ratanakiri", "name_km": "រតនគិរី", "slug": "ratanakiri", "hero_image_url": "/images/destinations/ratanakiri.jpg"},
    {"name": "Stung Treng", "name_km": "ស្ទឹងត្រែង", "slug": "stung-treng", "hero_image_url": "/images/destinations/stung-treng.jpg"},
    {"name": "Pursat", "name_km": "ពោធិ៍សាត់", "slug": "pursat", "hero_image_url": "/images/destinations/pursat.jpg"},
    {"name": "Kampong Cham", "name_km": "កំពង់ចាម", "slug": "kampong-cham", "hero_image_url": "/images/destinations/kampong-cham.jpg"},
    {"name": "Kampong Chhnang", "name_km": "កំពង់ឆ្នាំង", "slug": "kampong-chhnang", "hero_image_url": "/images/destinations/kampong-chhnang.jpg"},
    {"name": "Kampong Speu", "name_km": "កំពង់ស្ពឺ", "slug": "kampong-speu", "hero_image_url": "/images/destinations/kampong-speu.jpg"},
    {"name": "Kampong Thom", "name_km": "កំពង់ធំ", "slug": "kampong-thom", "hero_image_url": "/images/destinations/kampong-thom.jpg"},
    {"name": "Kandal", "name_km": "កណ្តាល", "slug": "kandal", "hero_image_url": "/images/destinations/kandal.jpg"},
    {"name": "Koh Kong", "name_km": "កោះកុង", "slug": "koh-kong", "hero_image_url": "/images/destinations/koh-kong.jpg"},
    {"name": "Preah Vihear", "name_km": "ព្រះវិហារ", "slug": "preah-vihear", "hero_image_url": "/images/destinations/preah-vihear.jpg"},
    {"name": "Prey Veng", "name_km": "ព្រៃវែង", "slug": "prey-veng", "hero_image_url": "/images/destinations/prey-veng.jpg"},
    {"name": "Svay Rieng", "name_km": "ស្វាយរៀង", "slug": "svay-rieng", "hero_image_url": "/images/destinations/svay-rieng.jpg"},
    {"name": "Takeo", "name_km": "តាកែវ", "slug": "takeo", "hero_image_url": "/images/destinations/takeo.jpg"},
    {"name": "Banteay Meanchey", "name_km": "បន្ទាយមានជ័យ", "slug": "banteay-meanchey", "hero_image_url": "/images/destinations/banteay-meanchey.jpg"},
    {"name": "Oddar Meanchey", "name_km": "ឧត្ដរមានជ័យ", "slug": "oddar-meanchey", "hero_image_url": "/images/destinations/oddar-meanchey.jpg"},
    {"name": "Pailin", "name_km": "ប៉ៃលិន", "slug": "pailin", "hero_image_url": "/images/destinations/pailin.jpg"},
    {"name": "Tboung Khmum", "name_km": "ត្បូងឃ្មុំ", "slug": "tboung-khmum", "hero_image_url": "/images/destinations/tboung-khmum.jpg"},
]


# ----------------------------------------------------------------------------------
# Discovery quality gates: a candidate is only worth inserting when it names a real,
# specific place that is not already in the directory under another spelling.
# ----------------------------------------------------------------------------------

# The built-in heritage list carries one entry per provincial capital for each of these
# families ("Pursat Historic Pagoda", "Kandal Riverside Park & Promenade"). They are
# placeholders rather than researched places: no proper name, no coordinates, and a
# description that would fit any town. They are reported to the admin, never auto-saved.
GENERIC_CURATED_LANDMARKS = (
    "riverside park & promenade",
    "historic pagoda",
    "central market",
)

_NEAR_DUPLICATE_TOKEN_GAP = 2
_NEAR_DUPLICATE_RATIO = 0.86


def is_generic_curated_candidate(name: str, province_name: str) -> bool:
    """True for templated fallback entries that describe no specific place."""
    core = _PARENTHETICAL_ALIAS_RE.sub(" ", str(name or "")).strip()
    norm_core = _norm_text(core)
    if not norm_core:
        return True
    norm_province = _norm_text(province_name)
    if norm_province and norm_core.startswith(norm_province):
        remainder = norm_core[len(norm_province):].strip()
        for family in GENERIC_CURATED_LANDMARKS:
            if remainder == _norm_text(family) or remainder.startswith(_norm_text(family)):
                return True
    return False


def _name_token_sets(name: str) -> list[frozenset]:
    """Distinctive word sets for a place, one per spelling variant (alias included)."""
    sets: list[frozenset] = []
    for variant in place_name_variants(name):
        tokens = frozenset(place_name_tokens(variant))
        if tokens and tokens not in sets:
            sets.append(tokens)
    return sets


# Words that say what kind of place this is. They are dropped when comparing names
# ("Ta Prohm Temple" and "Ta Prohm" are one place) but kept as a tie-breaker, because a
# museum and a temple that share the only distinctive word are not the same entry.
PLACE_TYPE_WORDS = {
    "temple", "wat", "pagoda", "stupa", "museum", "gallery", "beach", "waterfall",
    "market", "bazaar", "park", "garden", "mountain", "hill", "lake", "river", "cave",
    "island", "sanctuary", "shrine", "hotel", "resort", "restaurant", "cafe", "farm",
    "bridge", "village", "promenade", "square", "theatre", "zoo", "complex",
}


def _type_words(name: str) -> set[str]:
    return {w for w in _norm_text(name).split() if w in PLACE_TYPE_WORDS}


def _types_compatible(name: str, other: str) -> bool:
    """Two names may only be merged when they do not claim to be different kinds of place."""
    a, b = _type_words(name), _type_words(other)
    return not a or not b or bool(a & b)


def find_near_duplicate_place(name: str, existing_names) -> Optional[str]:
    """Return the already-stored place this candidate actually repeats, else None.

    Directory rows are keyed on free-text names, so "Ta Prohm Temple" and
    "Ta Prohm (Tomb Raider Temple)" are one place that exact matching lets through as a
    "new discovery" - the duplicate cards the province pages are judged on. Comparing the
    distinctive words of every spelling variant catches the alias, punctuation and
    "Bou Sra / Bousra" re-orders.

    Evidence required, in order of confidence: identical distinctive words (two or more),
    a strong word overlap, or a near-identical spelling. A single shared word is only
    enough when neither name claims a different kind of place, which is what keeps
    "Angkor National Museum" from being swallowed by "Angkor Wat" and "Banteay Kdei" from
    being swallowed by "Banteay Srei".
    """
    candidate_sets = _name_token_sets(name)
    candidate_tokens = set().union(*candidate_sets) if candidate_sets else set()
    if not candidate_tokens:
        return None
    candidate_compact = {_norm_text(v).replace(" ", "") for v in place_name_variants(name)}

    for existing in existing_names or []:
        if not existing:
            continue
        existing_str = str(existing)
        if _norm_text(existing_str) == _norm_text(name):
            return existing_str
        existing_sets = _name_token_sets(existing_str)
        if not existing_sets:
            continue

        for a in candidate_sets:
            for b in existing_sets:
                shared = a & b
                if len(shared) >= 2:
                    if a == b or len(shared) / len(a | b) >= 0.6:
                        return existing_str
                    if abs(len(a) - len(b)) <= _NEAR_DUPLICATE_TOKEN_GAP and shared == (
                        a if len(a) < len(b) else b
                    ):
                        return existing_str
                elif len(shared) == 1 and a == b and _types_compatible(name, existing_str):
                    return existing_str

        if candidate_tokens & set().union(*existing_sets) and _types_compatible(name, existing_str):
            existing_compact = {
                _norm_text(v).replace(" ", "") for v in place_name_variants(existing_str)
            }
            best = max(
                (difflib.SequenceMatcher(None, ca, cb).ratio()
                 for ca in candidate_compact for cb in existing_compact if ca and cb),
                default=0.0,
            )
            if best >= _NEAR_DUPLICATE_RATIO:
                return existing_str
    return None


# Live progress of the background discovery job, so the admin can see what a scan is
# actually doing instead of guessing from a toast that fires before it starts.
SCAN_STATE: dict = {
    "running": False,
    "started_at": None,
    "finished_at": None,
    "discovery_source": None,
    "provinces_total": 0,
    "provinces_done": 0,
    "current_province": None,
    "new_places": 0,
    "candidates": 0,
    "duplicates_skipped": 0,
    "generic_withheld": 0,
    "errors": [],
    "results": [],
    "last_summary": None,
}


class AITourismEngine:
    """
    Super engine that uses the pluggable AI gateway to discover and populate tourist
    places for all 25 provinces of Cambodia automatically.
    """

    def _candidates_json_path(self) -> str:
        return os.path.join(os.path.dirname(__file__), "..", "data_province_candidates.json")

    def _get_curated_fallback_places(self, province_slug: str, dest_name: str, dest_id: str, default_hero: str, existing_names_set: set, existing_names: list = None) -> list[dict]:
        """Load verified heritage candidate places for this province."""
        json_path = self._candidates_json_path()
        candidates = []
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    all_candidates = json.load(f)
                    candidates = all_candidates.get(province_slug, [])
            except Exception as e:
                logger.warning(f"Failed to load candidate places JSON: {e}")

        processed = []
        for p in candidates:
            name = p.get("name", "").strip()
            if not name:
                continue
            p_type = p.get("place_type", "ATTRACTION")
            duplicate_of = find_near_duplicate_place(name, existing_names) or (
                name if name.lower() in existing_names_set else None
            )
            # No generic hero/gallery is fabricated here any more: real images are resolved
            # (and verified) by save_approved_place, which leaves them empty when nothing
            # genuinely depicting this place can be found.
            processed.append({
                "name": name,
                "local_name": p.get("local_name"),
                "place_type": p_type,
                "description": p.get("description", f"Notable tourist landmark in {dest_name} Province, Cambodia."),
                "description_km": p.get("description_km"),
                "address": p.get("address", f"{dest_name} Province, Cambodia"),
                "latitude": p.get("latitude"),
                "longitude": p.get("longitude"),
                "opening_hours": p.get("opening_hours", "08:00 AM - 05:00 PM daily"),
                "price_level": p.get("price_level", "$$"),
                "phone": p.get("phone"),
                "website": p.get("website"),
                "tags": p.get("tags", ["Heritage", "Culture"]),
                "rating": p.get("rating", 4.7),
                "is_duplicate": bool(duplicate_of),
                "duplicate_of": duplicate_of,
                "generic_placeholder": is_generic_curated_candidate(name, dest_name),
                "destination_id": dest_id,
                "hero_image_url": "",
                "gallery_json": "[]"
            })
        return processed

    async def _auto_save_candidates(self, places: list[dict], auto_save: bool) -> dict:
        """Insert only candidates that name a new, specific place.

        A near-duplicate spelling and a templated placeholder are both reported instead of
        being written, because either one would land as a second card for a place the
        province page already shows.
        """
        saved = duplicates = withheld = 0
        for p in places:
            if p.get("is_duplicate"):
                duplicates += 1
                continue
            if p.get("generic_placeholder"):
                withheld += 1
                logger.info(f"[Discovery] withheld templated placeholder candidate: {p.get('name')}")
                continue
            if not auto_save:
                continue
            try:
                save_res = await self.save_approved_place(p)
                if save_res.get("status") == "success":
                    saved += 1
                    p["saved_to_db"] = True
                elif save_res.get("status") == "skipped":
                    duplicates += 1
            except Exception as s_err:
                logger.warning(f"Auto-save failed for {p.get('name')}: {s_err}")
        return {"saved_to_db": saved, "duplicates_skipped": duplicates, "generic_withheld": withheld}

    async def _resolve_place_images(
        self,
        name: str,
        dest_name: str,
        place_type: str,
        local_name: str = None,
        you_api_key: str = None,
        target_count: int = 12,
        verify_live: bool = True
    ) -> tuple[str, list[str]]:
        """
        Multi-source image discovery that keeps ONLY verified results.

        Candidates come from Wikipedia (article pageimage + article media), Wikimedia Commons
        and You.com web search. Each candidate is judged on its source context (article title,
        Commons file title, page title + filename) against the place name; generic stock pools
        are never used, so a gallery may legitimately contain fewer than `target_count` images
        — or none, which is reported honestly instead of being padded with wrong photos.
        """
        candidates: list[dict] = []
        seen = set()

        def _add(url: str, context: str = ""):
            if not url or not url.startswith("http"):
                return
            key = url.split("?")[0].strip()
            if key in seen:
                return
            seen.add(key)
            candidates.append({"url": url, "context": context or ""})

        # 1. Concurrently query Wikipedia, Wikimedia Commons and (optionally) You.com
        try:
            tasks = [
                fetch_wiki_image_items(name, dest_name, local_name, max_images=10),
                fetch_commons_image_items(name, dest_name, max_images=12),
            ]
            if you_api_key:
                tasks.append(fetch_you_image_items(name, dest_name, you_api_key, max_images=8))

            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=12.0)
            for res in results:
                if isinstance(res, list):
                    for item in res:
                        if isinstance(item, dict):
                            _add(item.get("url", ""), item.get("context", ""))
                        elif isinstance(item, str):
                            _add(item, "")
        except Exception as e:
            logger.debug(f"Image discovery notice for {name}: {e}")

        # 2. Keep only images whose source context really matches this place
        verified: list[str] = []
        rejected = 0
        for item in candidates:
            ok, _score = verify_place_image(item["url"], item.get("context", ""), name, local_name)
            if ok:
                verified.append(item["url"])
            else:
                rejected += 1
        if rejected:
            logger.info(f"[PlaceImages] {name}: rejected {rejected} unverified image candidate(s)")

        # 3. Drop dead / non-image URLs so no broken tiles reach the UI
        if verify_live and verified:
            verified = await filter_live_images(verified)

        hero = verified[0] if verified else ""
        gallery = verified[:target_count]
        return hero, gallery

    async def _resolve_candidate_image(
        self,
        name: str,
        dest_name: str,
        place_type: str,
        local_name: str = None,
        you_api_key: str = None,
        default_hero: str = None
    ) -> str:
        """Compatibility wrapper returning primary hero image."""
        hero, _ = await self._resolve_place_images(name, dest_name, place_type, local_name, you_api_key, target_count=12)
        return hero


    def _ensure_cambodia_destinations(self, db):
        """Ensure all 25 provinces exist as Destinations in the database."""
        # Ensure Cambodia country exists
        cambodia = db.query(Country).filter(Country.code == "KH").first()
        if not cambodia:
            cambodia = Country(
                code="KH",
                name="Cambodia",
                name_km="កម្ពុជា",
                currency_code="USD",
                is_active=True
            )
            db.add(cambodia)
            db.commit()
            db.refresh(cambodia)
        # Ensure all 25 destinations exist with real hero images
        created_count = 0
        for prov in CAMBODIA_PROVINCES:
            existing = db.query(Destination).filter(Destination.slug == prov["slug"]).first()
            if not existing:
                dest = Destination(
                    country_id=cambodia.id,
                    name=prov["name"],
                    name_km=prov["name_km"],
                    slug=prov["slug"],
                    overview=f"Explore {prov['name']}, one of Cambodia's beautiful provinces.",
                    hero_image_url=prov.get("hero_image_url"),
                    is_featured=prov["slug"] in ["phnom-penh", "siem-reap", "sihanoukville", "battambang", "kampot"],
                    status="ACTIVE"
                )
                db.add(dest)
                created_count += 1
            else:
                if not existing.hero_image_url or "1600585154340" in existing.hero_image_url:
                    existing.hero_image_url = prov.get("hero_image_url")
                    created_count += 1
        
        if created_count > 0:
            db.commit()
            logger.info(f"Updated/Created {created_count} destination records with verified images.")
            
    async def discover_places_for_province(self, province_slug: str, auto_save: bool = False) -> dict:
        """Use Gemini AI to discover tourist places for a single province."""
        db = SessionLocal()
        try:
            self._ensure_cambodia_destinations(db)

            destination = db.query(Destination).filter(Destination.slug == province_slug).first()
            if not destination:
                raise ValueError(f"Province '{province_slug}' not found in database.")

            dest_id = destination.id
            dest_name = destination.name
            dest_slug = destination.slug
            default_hero = destination.hero_image_url or "/images/destinations/phnom-penh.jpg"

            # Check how many places already exist for this destination
            existing_count = db.query(Place).filter(Place.destination_id == dest_id).count()
            existing_names = [p.name for p in db.query(Place.name).filter(
                Place.destination_id == dest_id, Place.status == "ACTIVE"
            ).all()]
            existing_names_set = set(n.strip().lower() for n in existing_names)

            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        try:
            prompt = f"""You are an expert Cambodia travel researcher and database builder.

Your task: Find real, existing tourist attractions, temples, restaurants, hotels, markets, waterfalls, 
natural sites, museums, and hidden gems in **{dest_name} Province, Cambodia**.

IMPORTANT RULES:
- Only include REAL places that actually exist. Do NOT invent fictional places.
- Include a mix of well-known and lesser-known places.
- Include the Khmer name (local_name) if you know it.
- Include real GPS coordinates (latitude, longitude) if possible.
- Include real opening hours, phone numbers, websites if available.
- For each place, assign a place_type from: ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM, NATIONAL_PARK, BEACH, LAKE, MOUNTAIN, VILLAGE

Already in database ({existing_count} places): {', '.join(existing_names[:20]) if existing_names else 'None yet'}
Please find 8-12 NEW places that are NOT already in the database.

Return a JSON array of objects. Each object must have these keys:
- name: English name
- local_name: Khmer name (or null)  
- place_type: One of the types listed above
- description: 2-3 sentence description in English
- description_km: Description in Khmer (or null)
- address: Street address or location description
- latitude: GPS latitude (float or null)
- longitude: GPS longitude (float or null)
- opening_hours: e.g. "07:00 AM - 05:00 PM daily" (or null)
- price_level: One of FREE, $, $$, $$$, $$$$
- phone: Phone number (or null)
- website: Website URL (or null)
- tags: Array of string tags, e.g. ["UNESCO", "Family Friendly", "Photography"]
- rating: Estimated rating 1.0-5.0
"""

            response_text = None

            if ai_gateway.has_any_configured_provider():
                text, meta = await asyncio.to_thread(
                    ai_gateway.generate_text, prompt, use_search=True, timeout=30.0
                )
                if text:
                    response_text = text
                    logger.info(f"Place discovery via {(meta or {}).get('engine')}")

            if not response_text and you_api_key:
                logger.info("Trying You.com API fallback...")
                response_text = await _call_you_com(prompt, you_api_key)

            # If all external AI failed or no API key, use verified curated heritage candidates!
            if not response_text:
                logger.info(f"External AI unavailable or unconfigured, using curated heritage database for {dest_name}...")
                curated_places = self._get_curated_fallback_places(
                    dest_slug, dest_name, dest_id, default_hero, existing_names_set, existing_names
                )
                stats = await self._auto_save_candidates(curated_places, auto_save)

                return {
                    "province": dest_name,
                    "province_slug": dest_slug,
                    "discovered": len(curated_places),
                    "saved_to_db": stats["saved_to_db"],
                    "duplicates_skipped": stats["duplicates_skipped"],
                    "generic_withheld": stats["generic_withheld"],
                    "places_data": curated_places,
                    "source": "curated_heritage"
                }

            # Parse response
            places_data = None
            try:
                places_data = json.loads(response_text)
            except json.JSONDecodeError:
                # 1. Try markdown code block
                match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
                if match:
                    try:
                        places_data = json.loads(match.group(1))
                    except Exception:
                        pass
                
                # 2. Try raw brackets if markdown search missed
                if not places_data:
                    match = re.search(r'(\[\s*\{.*?\}\s*\])', response_text, re.DOTALL)
                    if match:
                        try:
                            places_data = json.loads(match.group(1))
                        except Exception:
                            pass

                if not places_data:
                    logger.warning(f"Failed to parse JSON from AI response, using curated fallback: {response_text[:100]}...")
                    curated_places = self._get_curated_fallback_places(
                        dest_slug, dest_name, dest_id, default_hero, existing_names_set, existing_names
                    )
                    stats = await self._auto_save_candidates(curated_places, auto_save)

                    return {
                        "province": dest_name,
                        "province_slug": dest_slug,
                        "discovered": len(curated_places),
                        "saved_to_db": stats["saved_to_db"],
                        "duplicates_skipped": stats["duplicates_skipped"],
                        "generic_withheld": stats["generic_withheld"],
                        "places_data": curated_places,
                        "source": "curated_heritage"
                    }

            if not isinstance(places_data, list):
                places_data = [places_data]

            # Enrich candidate places with authentic, distinct images in parallel
            default_hero = destination.hero_image_url or "/images/destinations/phnom-penh.jpg"
            async def _enrich_candidate(p):
                name = p.get("name", "").strip()
                p_type = p.get("place_type", "ATTRACTION")
                local_name = p.get("local_name")
                hero, gallery = await self._resolve_place_images(name, dest_name, p_type, local_name, you_api_key, target_count=12)
                p["hero_image_url"] = hero
                p["gallery_json"] = json.dumps(gallery)
                return p

            valid_places = [p for p in places_data if p.get("name", "").strip()]
            for p in valid_places:
                name = str(p.get("name", "")).strip()
                duplicate_of = find_near_duplicate_place(name, existing_names) or (
                    name if name.lower() in existing_names_set else None
                )
                p["is_duplicate"] = bool(duplicate_of)
                p["duplicate_of"] = duplicate_of
                p["generic_placeholder"] = is_generic_curated_candidate(name, dest_name)
                p["destination_id"] = dest_id

            # Images are only searched for places that can actually be saved: a duplicate
            # costs the same dozen network calls and still cannot be used.
            await asyncio.gather(*[
                _enrich_candidate(p) for p in valid_places
                if not p["is_duplicate"] and not p["generic_placeholder"]
            ])
            stats = await self._auto_save_candidates(valid_places, auto_save)

            return {
                "province": dest_name,
                "province_slug": dest_slug,
                "discovered": len(valid_places),
                "saved_to_db": stats["saved_to_db"],
                "duplicates_skipped": stats["duplicates_skipped"],
                "generic_withheld": stats["generic_withheld"],
                "places_data": valid_places,
                "source": "ai_gateway"
            }

        except Exception as e:
            logger.error(f"AI Tourism Engine error for {province_slug}: {e}")
            
            # If it's an API Error from google-genai, return a friendly message
            error_str = str(e)
            user_message = f"Error: {error_str}"
            if "API key not valid" in error_str or "API_KEY_INVALID" in error_str:
                user_message = "Your Google Gemini API Key is invalid. Please check Settings."
            elif "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower() or "429" in error_str:
                user_message = "Gemini API Quota Exceeded. Please try again tomorrow or upgrade your plan."
            elif "Failed to parse" in error_str:
                user_message = "AI returned an invalid format. Please try again."
            
            return {
                "status": "failed",
                "error": error_str,
                "message": user_message
            }

    def get_scan_status(self) -> dict:
        """Progress of the discovery job, for the admin UI to poll while it runs."""
        return json.loads(json.dumps({**SCAN_STATE, "results": SCAN_STATE.get("results", [])}, default=str))

    def is_scan_running(self) -> bool:
        return bool(SCAN_STATE.get("running"))

    def discovery_source(self) -> str:
        """Which engine a scan would use, so the UI can say whether results are researched or curated."""
        if ai_gateway.has_any_configured_provider():
            return "ai_research"
        db = SessionLocal()
        try:
            row = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            if (row and row.value_json) or os.environ.get("YOU_API_KEY"):
                return "ai_research"
        finally:
            db.close()
        return "curated_heritage_list"

    async def run_full_scan(self) -> dict:
        """
        Run a full scan across ALL 25 provinces.
        This is the main entry point for the weekly cron job and admin trigger.
        Discovers AND automatically saves places directly to the database dynamically.

        Progress is mirrored into SCAN_STATE because this runs as a background task: the
        HTTP response returns long before the work does, and the result would otherwise be
        invisible to whoever pressed the button.
        """
        if SCAN_STATE.get("running"):
            return {"status": "already_running", "message": "A discovery scan is already in progress."}

        db = SessionLocal()
        try:
            self._ensure_cambodia_destinations(db)
        finally:
            if db.is_active:
                db.close()

        SCAN_STATE.update({
            "running": True,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "finished_at": None,
            "discovery_source": self.discovery_source(),
            "provinces_total": len(CAMBODIA_PROVINCES),
            "provinces_done": 0,
            "current_province": None,
            "new_places": 0,
            "candidates": 0,
            "duplicates_skipped": 0,
            "generic_withheld": 0,
            "errors": [],
            "results": [],
        })

        results = []
        total_inserted = 0
        errors = []

        try:
            for prov in CAMBODIA_PROVINCES:
                SCAN_STATE["current_province"] = prov["name"]
                try:
                    logger.info(f"🔍 Scanning {prov['name']} with auto-save...")
                    result = await self.discover_places_for_province(prov["slug"], auto_save=True)
                    if result.get("status") == "failed":
                        errors.append(f"❌ {prov['name']}: {result.get('message')}")
                        SCAN_STATE["errors"] = errors
                    saved_count = result.get("saved_to_db", 0)
                    total_inserted += saved_count
                    SCAN_STATE["new_places"] = total_inserted
                    SCAN_STATE["candidates"] += result.get("discovered", 0)
                    SCAN_STATE["duplicates_skipped"] += result.get("duplicates_skipped", 0)
                    SCAN_STATE["generic_withheld"] += result.get("generic_withheld", 0)
                    summary = {k: result.get(k) for k in
                               ("province", "province_slug", "discovered", "saved_to_db",
                                "duplicates_skipped", "generic_withheld", "source", "status")}
                    results.append(summary)
                    SCAN_STATE["results"] = results
                    SCAN_STATE["provinces_done"] += 1
                    logger.info(f"✅ {prov['name']}: {saved_count} new places saved to database.")
                except Exception as e:
                    error_msg = f"❌ {prov['name']}: {str(e)}"
                    errors.append(error_msg)
                    SCAN_STATE["errors"] = errors
                    SCAN_STATE["provinces_done"] += 1
                    logger.error(error_msg)
        finally:
            SCAN_STATE.update({
                "running": False,
                "current_province": None,
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "last_summary": {
                    "status": "completed",
                    "provinces_scanned": SCAN_STATE["provinces_done"],
                    "new_places": total_inserted,
                    "candidates": SCAN_STATE["candidates"],
                    "duplicates_skipped": SCAN_STATE["duplicates_skipped"],
                    "generic_withheld": SCAN_STATE["generic_withheld"],
                    "discovery_source": SCAN_STATE["discovery_source"],
                    "error_count": len(errors),
                },
            })

        return {
            "status": "completed",
            "total_provinces_scanned": len(CAMBODIA_PROVINCES),
            "total_new_places": total_inserted,
            "total_candidates": SCAN_STATE["candidates"],
            "duplicates_skipped": SCAN_STATE["duplicates_skipped"],
            "generic_withheld": SCAN_STATE["generic_withheld"],
            "discovery_source": SCAN_STATE["discovery_source"],
            "results": results,
            "errors": errors
        }

    async def update_place_via_ai(self, place_id: str) -> dict:
        """Update an existing place using AI and Wikipedia."""
        db = SessionLocal()
        try:
            place = db.query(Place).filter(Place.id == place_id).first()
            if not place:
                return {"status": "failed", "message": "Place not found."}
                
            destination = db.query(Destination).filter(Destination.id == place.destination_id).first()
            if not destination:
                return {"status": "failed", "message": "Destination not found."}

            place_name = place.name
            place_local_name = place.local_name
            place_curr_hero = place.hero_image_url
            dest_name = destination.name
            dest_hero = destination.hero_image_url

            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        try:
            # 1. Fetch real-world data from You.com Web Search to augment AI prompt
            search_context = ""
            extracted_images: list[tuple[str, str]] = []   # (thumbnail_url, page_title) pairs
            
            if you_api_key:
                logger.info(f"Using You.com Web Search for '{place_name}' context...")
                search_data = await _you_web_search(f"{place_name} {dest_name} Cambodia tourism", you_api_key)
                if search_data and "results" in search_data and "web" in search_data["results"]:
                    for idx, result in enumerate(search_data["results"]["web"][:5]):
                        title = result.get("title", "")
                        snippets = result.get("snippets", [])
                        if not snippets and result.get("description"):
                            snippets = [result.get("description")]
                        elif not snippets and result.get("contents", {}).get("highlights"):
                            snippets = result.get("contents", {}).get("highlights", [])
                        highlights = "\n".join(snippets) if isinstance(snippets, list) else str(snippets)
                        search_context += f"Source {idx+1}: {title}\n{highlights}\n\n"
                        
                        # Grab real thumbnails (kept with their page title as verification context)
                        thumb = result.get("thumbnail_url")
                        if thumb and all(thumb != u for u, _c in extracted_images):
                            extracted_images.append((thumb, title))
            
            prompt = f"""You are an expert Cambodia travel blogger and researcher.
I have a place in my database named "{place_name}" located in {dest_name} Province, Cambodia.
Please write a highly detailed, up-to-date blog post.

{"Here is some fresh search data to base your writing on:" if search_context else ""}
{search_context}

Provide VERY DETAILED, rich blog content (10+ paragraphs if possible) covering history, architecture, travel tips, opening hours, exact ticket prices, and upcoming events.

Return a JSON object with these keys ONLY:
- name: English name
- local_name: Khmer name (or null)  
- place_type: One of ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM
- description: VERY detailed blog post style description in English (10+ paragraphs)
- description_km: VERY detailed description in Khmer (or null)
- address: Street address or location description
- latitude: GPS latitude (float or null)
- longitude: GPS longitude (float or null)
- opening_hours: e.g. "07:00 AM - 05:00 PM daily" (or null)
- price_level: One of FREE, $, $$, $$$, $$$$
- phone: Phone number (or null)
- website: Website URL (or null)
- tags: Array of string tags, e.g. ["UNESCO", "Family Friendly", "Photography"]
- rating: Estimated rating 1.0-5.0
"""
            response_text = None

            if you_api_key:
                logger.info("Attempting You.com API for place update...")
                response_text = await _call_you_com(prompt, you_api_key)

            if not response_text and ai_gateway.has_any_configured_provider():
                text, meta = await asyncio.to_thread(
                    ai_gateway.generate_text, prompt, use_search=True, timeout=30.0
                )
                if text:
                    response_text = text

            if response_text is None:
                return {
                    "status": "failed",
                    "message": "AI update unavailable. Configure an AI provider (and optional You.com key) in Settings."
                }

            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    ai_data = json.loads(match.group(1))
                else:
                    raise ValueError(f"Failed to parse AI response.")

            # Multi-source photo discovery: only real, place-verified, loadable images
            hero_url, gallery_raw = await self._resolve_place_images(
                ai_data.get("name", place_name),
                dest_name,
                ai_data.get("place_type", "ATTRACTION"),
                ai_data.get("local_name", place_local_name),
                you_api_key,
                target_count=12
            )

            # You.com page thumbnails may join the gallery — but only verified ones
            for ext_u, ext_ctx in extracted_images:
                _name = ai_data.get("name", place_name)
                ok, _score = verify_place_image(ext_u, ext_ctx, _name, ai_data.get("local_name", place_local_name))
                if ok and _url_key(ext_u) not in {_url_key(g) for g in gallery_raw}:
                    gallery_raw.insert(0, ext_u)

            # Drop anything that does not actually load, then re-host survivors
            gallery_raw = await filter_live_images(gallery_raw[:12])
            hero_url = gallery_raw[0] if gallery_raw else ""

            if hero_url:
                try:
                    hero_url = await self._sync_single_image(hero_url, dest_name, ai_data.get("name", place_name)) or ""
                except Exception as hero_err:
                    logger.warning(f"Hero sync notice: {hero_err}")

            synced_gallery_json = None
            if gallery_raw:
                try:
                    synced_gallery = await asyncio.gather(
                        *[self._sync_single_image(url, dest_name, ai_data.get("name", place_name)) for url in gallery_raw],
                        return_exceptions=True,
                    )
                    synced_items = list(dict.fromkeys([r for r in synced_gallery if isinstance(r, str) and r.startswith("http")]))
                    if synced_items:
                        synced_gallery_json = json.dumps(synced_items)
                except Exception as g_err:
                    logger.warning(f"Gallery sync error: {g_err}")
                    synced_gallery_json = json.dumps(gallery_raw[:12])


            # Fast atomic write to DB
            db = SessionLocal()
            try:
                place = db.query(Place).filter(Place.id == place_id).first()
                if not place:
                    return {"status": "failed", "message": "Place not found during commit."}

                place.name = ai_data.get("name", place.name)
                place.local_name = ai_data.get("local_name") or place.local_name
                place.place_type = ai_data.get("place_type") or place.place_type
                place.description = ai_data.get("description") or place.description
                place.description_km = ai_data.get("description_km") or place.description_km
                place.address = ai_data.get("address") or place.address
                place.latitude = ai_data.get("latitude") or place.latitude
                place.longitude = ai_data.get("longitude") or place.longitude
                place.phone = ai_data.get("phone") or place.phone
                place.website = ai_data.get("website") or place.website
                place.opening_hours = ai_data.get("opening_hours") or place.opening_hours
                place.price_level = ai_data.get("price_level") or place.price_level
                place.rating = ai_data.get("rating") or place.rating
                
                if ai_data.get("tags") and isinstance(ai_data["tags"], list):
                    place.tags_json = json.dumps(ai_data["tags"])

                if hero_url:
                    place.hero_image_url = hero_url
                elif place.hero_image_url and (
                    not str(place.hero_image_url).startswith("http")
                    or is_generic_place_image(place.hero_image_url)
                ):
                    # The re-search came back empty. Keep a suspect photo (no proof it is wrong),
                    # but never keep one that is provably unusable - that is the case where the
                    # admin pressed "update this place" and the wrong picture stayed anyway.
                    place.hero_image_url = None
                if synced_gallery_json:
                    place.gallery_json = synced_gallery_json
                else:
                    stored_gallery = parse_gallery_urls(place.gallery_json)
                    usable = [u for u in stored_gallery
                              if u.startswith("http") and not is_generic_place_image(u)]
                    if len(usable) != len(stored_gallery):
                        place.gallery_json = json.dumps(usable)

                place.verification_status = "AI_UPDATED"
                db.commit()
                return {"status": "success", "message": f"Updated {place.name} successfully."}
            except Exception as commit_err:
                db.rollback()
                raise commit_err
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Failed to update place via AI: {e}")
            error_str = str(e)
            user_message = f"Error: {error_str}"
            if "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower() or "429" in error_str:
                user_message = "Gemini API Quota Exceeded. Please try again tomorrow or upgrade your plan."
            elif "API key not valid" in error_str or "API_KEY_INVALID" in error_str:
                user_message = "Your Google Gemini API Key is invalid. Please check Settings."
                
            return {"status": "failed", "message": user_message}

    async def _sync_single_image(self, img_url: str, dest_name: str, place_name: str = None) -> Optional[str]:
        """
        Downloads image bytes ONCE and uploads to both Google Drive (backup) and Cloudflare R2 (fast CDN) in parallel.
        Returns the Cloudflare R2 public CDN URL if available, otherwise the original URL.
        Returns None only when the URL is provably gone (404/410) or is not an image, so broken
        tiles can never be stored; a rate-limited or failing upload keeps the verified original.
        """
        if not img_url or not img_url.startswith("http"):
            return None

        has_gdrive = storage_service.is_configured()
        has_r2 = s3_service.is_configured()
        if not has_gdrive and not has_r2:
            return img_url

        # If already on Cloudflare R2, no need to re-upload
        r2_client, r2_cfg = s3_service._get_client_and_config()
        if r2_cfg and r2_cfg.get("public_domain") and r2_cfg["public_domain"] in img_url:
            return img_url

        try:
            headers = {
                "User-Agent": "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1",
                "Accept": "image/*,*/*;q=0.8"
            }
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                res = await client.get(img_url, headers=headers)
                if res.status_code in (404, 410) or (res.status_code == 200 and not res.content):
                    logger.info(f"[PlaceImages] dropped dead URL ({res.status_code}): {img_url}")
                    return None
                if res.status_code != 200:
                    # Rate limit or transient upstream failure. The URL already passed the
                    # relevance + liveness gate, so keep it rather than lose a good photo.
                    logger.info(f"[PlaceImages] re-host skipped ({res.status_code}), keeping original URL: {img_url}")
                    return img_url
                content_type = (res.headers.get("Content-Type") or "image/jpeg").lower()
                if not content_type.startswith("image"):
                    logger.info(f"[PlaceImages] dropped non-image URL ({content_type}): {img_url}")
                    return None
                content = res.content
        except Exception as dl_err:
            logger.warning(f"Download failed for {img_url}: {dl_err} - keeping the verified URL")
            return img_url

        import urllib.parse
        parsed = urllib.parse.urlparse(img_url)
        filename = os.path.basename(parsed.path)
        if not filename or '.' not in filename:
            ext = ".png" if "png" in content_type else ".jpg"
            filename = f"image{ext}"

        folder_path = f"Destinations/{dest_name}"
        if place_name:
            import re
            safe_place = re.sub(r'[^a-zA-Z0-9_\-\s]', '', place_name).strip()
            if safe_place:
                folder_path = f"{folder_path}/{safe_place}"

        async def upload_gdrive():
            if not has_gdrive:
                return
            try:
                await storage_service.upload_file(filename, content, content_type, folder_path)
            except Exception as e:
                logger.warning(f"Google Drive upload warning: {e}")

        async def upload_r2():
            if not has_r2:
                return None
            try:
                return await s3_service.upload_file(filename, content, content_type, folder_path)
            except Exception as e:
                logger.warning(f"Cloudflare R2 upload warning: {e}")
                return None

        try:
            # Parallel execution with 12s safety timeout
            results = await asyncio.wait_for(
                asyncio.gather(upload_gdrive(), upload_r2(), return_exceptions=True),
                timeout=12.0
            )
            r2_res = results[1]
            if isinstance(r2_res, str) and r2_res.startswith("http"):
                return r2_res
        except Exception as sync_err:
            logger.warning(f"Dual storage sync timeout or error for {img_url}: {sync_err}")

        return img_url

    async def save_approved_place(self, place_dict: dict) -> dict:
        name = place_dict.get("name", "").strip()
        dest_id = place_dict.get("destination_id")

        # If destination_id is not directly provided, dynamically resolve from slug or province name
        if not dest_id:
            slug_candidate = place_dict.get("destination_slug") or place_dict.get("province_slug")
            province_name = place_dict.get("province")
            db_res = SessionLocal()
            try:
                if slug_candidate:
                    dest = db_res.query(Destination).filter(Destination.slug == slug_candidate).first()
                    if dest:
                        dest_id = dest.id
                if not dest_id and province_name:
                    dest = db_res.query(Destination).filter(Destination.name.ilike(f"%{province_name.strip()}%")).first()
                    if dest:
                        dest_id = dest.id
            finally:
                db_res.close()

        if not name or not dest_id:
            raise ValueError("Missing name or destination_id")

        db = SessionLocal()
        try:
            existing = db.query(Place).filter(Place.destination_id == dest_id, Place.name == name).first()
            if existing:
                return {"status": "skipped", "message": "Already exists"}

            stored_names = [n for (n,) in db.query(Place.name).filter(
                Place.destination_id == dest_id, Place.status != "ARCHIVED"
            ).all()]
            duplicate_of = find_near_duplicate_place(name, stored_names)
            if duplicate_of:
                logger.info(f"[Discovery] refused duplicate: '{name}' repeats stored '{duplicate_of}'")
                return {"status": "skipped", "reason": "near_duplicate", "message": f"Already exists as '{duplicate_of}'"}

            destination = db.query(Destination).filter(Destination.id == dest_id).first()
            dest_name = destination.name if destination else "Cambodia"
            dest_hero = destination.hero_image_url if destination else None
        finally:
            db.close()

        # Fetch images for the approved place OUTSIDE the database session
        hero_url = place_dict.get("hero_image_url")
        gallery_json = place_dict.get("gallery_json", "[]")

        # Load You.com key if configured
        db = SessionLocal()
        try:
            you_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_key_setting.value_json if you_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        # Keep only verified, loadable images. A gallery with 3 real photos is stored as 3 —
        # the old "pad up to 10-12 with category stock" behaviour produced irrelevant tiles.
        gallery_list = json.loads(gallery_json) if isinstance(gallery_json, str) else (gallery_json or [])
        gallery_list = [
            g for g in gallery_list
            if isinstance(g, str) and g.startswith("http")
            and not is_generic_place_image(g) and "/images/destinations/" not in g
        ]
        hero_is_placeholder = (not hero_url) or "/images/destinations/" in str(hero_url) or is_generic_place_image(hero_url)

        if hero_is_placeholder or not gallery_list:
            discovered_hero, discovered_gallery = await self._resolve_place_images(
                name,
                dest_name,
                place_dict.get("place_type", "ATTRACTION"),
                place_dict.get("local_name"),
                you_api_key,
                target_count=12
            )
            if not gallery_list and discovered_gallery:
                gallery_list = list(dict.fromkeys(gallery_list + discovered_gallery))
            if hero_is_placeholder or not hero_url:
                hero_url = discovered_hero or (gallery_list[0] if gallery_list else "")
            gallery_json = json.dumps(gallery_list)

        # Liveness pass: URLs that no longer resolve are removed, never stored as broken tiles
        gallery_list = await filter_live_images(gallery_list[:12])
        if hero_url and hero_url.startswith("http") and not await filter_live_images([hero_url]):
            hero_url = gallery_list[0] if gallery_list else ""

        # Dual storage synchronization:
        # 1. Google Drive for persistent backup
        # 2. Cloudflare R2 for fast public display
        if hero_url and hero_url.startswith("http"):
            try:
                hero_url = await self._sync_single_image(hero_url, dest_name, name) or ""
            except Exception as hero_err:
                logger.warning(f"Hero image sync failed for {name}: {hero_err}")

        # Process gallery items concurrently (verified photos only, no fixed quota)
        try:
            if gallery_list:
                synced_results = await asyncio.gather(
                    *[self._sync_single_image(g, dest_name, name) for g in gallery_list],
                    return_exceptions=True,
                )
                final_gallery = list(dict.fromkeys(
                    [r for r in synced_results if isinstance(r, str) and r.startswith("http")]
                ))
                gallery_json = json.dumps(final_gallery)
        except Exception as gal_err:
            logger.warning(f"Gallery sync error: {gal_err}")


        # Fast atomic insert into DB
        db = SessionLocal()
        try:
            base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            while db.query(Place).filter(Place.slug == slug).first():
                slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

            # Clean & sanitize coordinate and numeric data
            raw_lat = place_dict.get("latitude")
            raw_lng = place_dict.get("longitude")
            try:
                lat = float(raw_lat) if raw_lat is not None and str(raw_lat).strip() != "" else None
            except (ValueError, TypeError):
                lat = None

            try:
                lng = float(raw_lng) if raw_lng is not None and str(raw_lng).strip() != "" else None
            except (ValueError, TypeError):
                lng = None

            raw_rating = place_dict.get("rating", 4.5)
            try:
                rating = float(raw_rating) if raw_rating is not None and str(raw_rating).strip() != "" else 4.5
            except (ValueError, TypeError):
                rating = 4.5

            raw_tags = place_dict.get("tags", [])
            if isinstance(raw_tags, str):
                try:
                    raw_tags = json.loads(raw_tags)
                except Exception:
                    raw_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
            tags_json = json.dumps(raw_tags if isinstance(raw_tags, list) else [])

            new_place = Place(
                id=uuid.uuid4().hex,
                destination_id=dest_id,
                name=name,
                local_name=place_dict.get("local_name"),
                slug=slug,
                place_type=place_dict.get("place_type", "ATTRACTION"),
                description=place_dict.get("description", ""),
                description_km=place_dict.get("description_km"),
                address=place_dict.get("address"),
                latitude=lat,
                longitude=lng,
                opening_hours=place_dict.get("opening_hours"),
                price_level=place_dict.get("price_level", "$$"),
                phone=place_dict.get("phone"),
                website=place_dict.get("website"),
                hero_image_url=hero_url,
                gallery_json=gallery_json,
                tags_json=tags_json,
                rating=rating,
                verification_status="AI_GENERATED",
                status="ACTIVE",
                is_featured=False
            )
            db.add(new_place)
            db.commit()
            return {"status": "success", "message": f"Saved {name}"}
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

ai_tourism_engine = AITourismEngine()
