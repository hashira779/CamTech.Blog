"""
Image Search Service — high-resolution image discovery for News Articles and Tourism Places.

Sources actually used for stored content:
1. Wikimedia Commons, full-HD (1600px) photography with open licensing
2. Wikipedia PageImages at original resolution
3. The publisher's own image when a feed supplies one (set in the ingestion worker)

Every candidate must name its subject before it is stored (see
`ImageSearchService.news_image_is_attributable`); the generic pools below are the images we
reject, not a fallback. The story that has no matching photograph shows no photograph.
"""

import re
import urllib.parse
import hashlib
import logging
import asyncio
from typing import Optional, List, Tuple
import httpx

logger = logging.getLogger(__name__)

USER_AGENT = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"

BAD_IMAGE_KEYWORDS = [
    "flag", "symbol", "coat_of_arms", "icon", "map", "logo", "stub",
    "diagram", "locator", ".svg", "emblem", "seal_of", "district_in",
    "blank", "placeholder", "commons-logo", "wikivoyage", "wikidata",
    "fileicon", "sound", ".oga", ".ogg", ".opus", ".mp3", ".wav"
]

# High-resolution magazine-grade photography for News (1600px, Q=85, auto-format)
#
# READ THIS BEFORE ADDING AN ENTRY: the trailing comments describe what the photo *looks like*,
# not what it proves. None of these Unsplash IDs were checked against a location, so they must
# never caption a named Cambodian place, guide or event. `photo-1539037116277-4db20889f2d4`
# spent months in these pools labelled "Cambodia Angkor Sunrise" while actually showing Madrid's
# Gran Via, and it illustrated an Angkor Wat guide on the public site. Place and travel-content
# heroes go through ai_tourism_engine.verify_place_image / content_image_matches instead.
CATEGORY_NEWS_IMAGE_POOLS = {
    "technology": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85", # Circuitry & Microchips
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85", # Neural Network / AI Abstract
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=85", # Deep Learning / AI Brain
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=85", # Cybersecurity / Data Network
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=85", # Code Matrix / Cryptography
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=85", # Modern Laptop / Computing
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=85", # Software Engineering Team
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85", # Global Digital Earth Network
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1600&q=85", # Tech Hardware & Development
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=85", # Robotics / Modern Automation
    ],
    "cambodia": [
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=85", # Modern Banking & Payment
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=85", # City skyline (location unverified)
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85", # Infrastructure / High Speed Transit
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85", # Modern architecture (location unverified)
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1600&q=85", # Riverside at dusk (location unverified)
        "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1600&q=85", # Cultural Heritage & Monuments
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=85", # Coastal horizon (location unverified)
    ],
    "world": [
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=85", # International Diplomacy / Government
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1600&q=85", # Press Conference / Media Briefing
        "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1600&q=85", # Global Geopolitics & Capitol
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85", # Earth Satellite View / Continents
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=85", # International Flags & Summit
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85", # Global Education & Progress
    ],
    "business": [
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1600&q=85", # Stock Market / Financial Charts
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=85", # Trading Screen & Analytics
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85", # Corporate Skyscraper / Finance
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=85", # Digital Payments & Fintech
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=85", # Strategic Business Meeting
        "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=85", # Global Supply Chain & Logistics
    ],
    "science": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85", # Cosmos / Nebula / Space Telescopes
        "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1600&q=85", # Physics Laboratory Research
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=85", # Molecular Biology / DNA
        "https://images.unsplash.com/photo-1517976487588-46c59b669fcf?auto=format&fit=crop&w=1600&q=85", # Rocket Launch / Aerospace
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=85", # Orbital Spaceflight
        "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=85", # Environmental Science & Ecosystems
    ],
    "travel": [
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=85", # Tropical Turquoise Coast
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&q=85", # Scenic Highland Mountain Views
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85", # Transport & Train Journeys
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1600&q=85", # Riverside Sunset Walkways
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1600&q=85", # Boutique Eco Resort
    ],
}

# Rich category photography pool for Places across Cambodia
PLACE_CATEGORY_POOLS = {
    "WATERFALL": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/1600px-Bou_Sra_Waterfall.jpg",
        "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1546272989-40c92939c6c2?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1600&q=85",
    ],
    "TEMPLE": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/1600px-Angkor_Wat.jpg",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1600&q=85",
    ],
    "ACCOMMODATION": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=85",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Raffles_Hotel_Le_Royal.jpg/1600px-Raffles_Hotel_Le_Royal.jpg",
    ],
    "RESORT": [
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=85",
    ],
    "RESTAURANT": [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=85",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Phnom_Penh_-_Street_Food.jpg/1600px-Phnom_Penh_-_Street_Food.jpg",
    ],
    "CAFE": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
    ],
    "MARKET": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Phsar_Thmei.jpg/1600px-Phsar_Thmei.jpg",
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85",
    ],
    "BEACH": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=85",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Otres_Beach.jpg/1600px-Otres_Beach.jpg",
    ],
    "MOUNTAIN": [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/1600px-Bokor_National_Park.jpg",
    ],
    "NATIONAL_PARK": [
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/1600px-Bokor_National_Park.jpg",
        "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=85",
    ],
    "ATTRACTION": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/1600px-Angkor_Wat.jpg",
        "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1600&q=85",
    ],
}


class ImageSearchService:
    """High-Resolution Multi-Source Image Engine for News Articles and Tourism."""

    @staticmethod
    def _clean_search_keywords(title: str) -> list[str]:
        """Extract high-yield query terms from news title."""
        # Remove noisy prefixes and punctuation
        t = re.sub(r'^(breaking|exclusive|alert|report|watch|analysis):\s*', '', title, flags=re.IGNORECASE)
        t = re.sub(r'[^\w\s-]', ' ', t)
        words = [w.strip() for w in t.split() if len(w.strip()) > 3]

        stop_words = {
            "today", "this", "week", "year", "after", "before", "over", "under", "about",
            "could", "would", "should", "their", "there", "which", "where", "while", "during"
        }
        filtered = [w for w in words if w.lower() not in stop_words]
        queries = []
        if len(filtered) >= 2:
            queries.append(" ".join(filtered[:3]))
        if len(filtered) >= 4:
            queries.append(" ".join(filtered[:4]))
        queries.append(t[:60].strip())
        return [q for q in queries if q]

    @classmethod
    async def search_commons_high_res(cls, query: str, max_results: int = 5) -> list[str]:
        """Queries Wikimedia Commons for 1600px+ high-definition photography."""
        results = []
        headers = {"User-Agent": USER_AGENT}
        url = (
            f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
            f"&gsrsearch={urllib.parse.quote(query)}"
            f"&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600&format=json&gsrlimit={max_results}"
        )
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    for p in pages.values():
                        for info in p.get("imageinfo", []):
                            mime = info.get("mime", "")
                            if not mime.startswith("image/") or "svg" in mime:
                                continue
                            # Prefer 1600px high-res thumburl, fallback to original url
                            u = info.get("thumburl") or info.get("url", "")
                            u_clean = u.split("?")[0].lower()
                            if not any(bad in u_clean for bad in BAD_IMAGE_KEYWORDS):
                                if any(u_clean.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                                    results.append(u)
        except Exception as e:
            logger.debug(f"[ImageSearch:Commons] Query '{query}' notice: {e}")
        return results

    @classmethod
    async def search_wikipedia_original(cls, query: str) -> Optional[str]:
        """Queries Wikipedia PageImages for the original high-res article visual."""
        headers = {"User-Agent": USER_AGENT}
        url = (
            f"https://en.wikipedia.org/w/api.php?action=query&generator=search"
            f"&gsrsearch={urllib.parse.quote(query)}"
            f"&gsrlimit=2&prop=pageimages&piprop=original&format=json"
        )
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    for p in pages.values():
                        if "original" in p:
                            src = p["original"]["source"]
                            src_clean = src.split("?")[0].lower()
                            if not any(bad in src_clean for bad in BAD_IMAGE_KEYWORDS):
                                return src
        except Exception as e:
            logger.debug(f"[ImageSearch:Wiki] Query '{query}' notice: {e}")
        return None

    @classmethod
    def get_curated_news_photo(cls, category: str, title: str) -> str:
        """DEPRECATED: not wired into any write path.

        Returned a photo from a generic per-category pool, which put the same laptop
        picture on unrelated stories and let a card claim a photograph it had no right to.
        Every URL in these pools is rejected by news_image_is_attributable /
        is_generic_place_image. Kept only so nothing that still imports it breaks.
        """
        cat_key = (category or "technology").lower()
        pool = CATEGORY_NEWS_IMAGE_POOLS.get(cat_key) or CATEGORY_NEWS_IMAGE_POOLS["technology"]
        # Use SHA-256 for stable, uniform distribution
        h = int(hashlib.sha256(title.encode("utf-8")).hexdigest(), 16)
        idx = h % len(pool)
        return pool[idx]

    @classmethod
    def credit_for_host(cls, url: str) -> str:
        """Attribution stated by the file's own host — never a credit invented for a photo.

        Stored rows had "NASA / ESA / CSA Scientific Archive" pasted onto an Unsplash
        picture and "Wikipedia / Public Press Attribution" onto another stock file, so
        credit is now derived from the URL and nothing else.
        """
        host = (re.match(r"https?://([^/]+)", str(url or "")) or [None, ""])[1].lower()
        if "wikimedia" in host:
            return "Wikimedia Commons"
        if "wikipedia" in host:
            return "Wikipedia"
        if host.startswith("images.") and "unsplash" in host:
            return "Unsplash"
        return host

    @classmethod
    def news_image_is_attributable(cls, url: str, title: str, context: str = "") -> bool:
        """Only keep a discovered photo when it can be named back to this story.

        A Commons/Wikipedia keyword hit is not evidence of relevance: a Bruegel painting
        of children playing was attached to a Google Play article, and a photo of
        humanitarian aid to Gaza to a Starlink/Ukraine story. The filename (or the page
        title the file came from) must carry a distinctive word of the headline.
        """
        from app.services.ai_tourism_engine import is_generic_place_image, subject_context_matches

        if not url or not str(url).startswith("http"):
            return False
        if is_generic_place_image(url):
            return False
        haystack = urllib.parse.unquote(str(url).split("?")[0]) + " " + str(context or "")
        return subject_context_matches(haystack, subject=title)

    @classmethod
    async def search_news_image(
        cls,
        title: str,
        category: str = "technology",
        country: str = "WORLD",
        tags: list = None
    ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Find a hero image that genuinely belongs to this story, or say there is none.

        Returns (url, credit, alt); url is None when nothing attributable was found, which
        is the honest answer — the reader UI renders a text-only card. There used to be a
        third step here that returned a curated Unsplash photo, so every story in a category
        wore the same generic picture. That fallback is gone: 26 of 81 stored article heroes
        came from it, including 4 of the 5 published ones.
        """
        queries = cls._clean_search_keywords(title)
        context_words = " ".join([str(title)] + [str(t) for t in (tags or [])])

        # 1. Wikimedia Commons, but only files whose name names the story.
        for q in queries[:2]:
            search_q = f"{q} Cambodia" if country == "KH" and "cambodia" not in q.lower() else q
            for found in await cls.search_commons_high_res(search_q, max_results=3):
                if cls.news_image_is_attributable(found, context_words):
                    return (found, cls.credit_for_host(found), title[:150])

        # 2. Wikipedia's own lead image for the matched article.
        for q in queries[:1]:
            wiki_img = await cls.search_wikipedia_original(q)
            if wiki_img and cls.news_image_is_attributable(wiki_img, context_words):
                return (wiki_img, cls.credit_for_host(wiki_img), title[:150])

        logger.info(f"[ImageSearch:News] No attributable hero for '{title[:60]}' — leaving it empty")
        return (None, None, title[:150])

    @classmethod
    def get_diverse_place_gallery(cls, place_type: str, place_name: str, count: int = 12) -> List[str]:
        """DEPRECATED for place galleries.

        Tourism galleries now store only images whose source context matches the place name
        (see app.services.ai_tourism_engine.verify_place_image), because this generic per-type
        pool produced irrelevant photos on real place cards. Kept only so nothing that still
        imports it breaks; do not wire it back into the place pipeline.
        """
        ptype = (place_type or "ATTRACTION").upper()
        pool = PLACE_CATEGORY_POOLS.get(ptype) or PLACE_CATEGORY_POOLS["ATTRACTION"]
        h = int(hashlib.sha256(place_name.encode("utf-8")).hexdigest(), 16)
        
        # Reorder pool starting at deterministic offset
        start_idx = h % len(pool)
        ordered = pool[start_idx:] + pool[:start_idx]
        
        # Expand with general travel beauty if needed
        all_options = ordered + CATEGORY_NEWS_IMAGE_POOLS["travel"]
        seen = set()
        unique = []
        for u in all_options:
            if u not in seen:
                seen.add(u)
                unique.append(u)
            if len(unique) >= count:
                break
        return unique


image_search_service = ImageSearchService()
