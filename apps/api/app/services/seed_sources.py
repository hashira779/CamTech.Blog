"""Idempotent curated RSS source registry seeder across Cambodia, Thai Watch, ASEAN, and World."""
from __future__ import annotations

from typing import Dict, List
from sqlalchemy.orm import Session

from app.models.source import Source

RECOMMENDED_SOURCES: List[Dict[str, object]] = [
    {
        "slug": "cambodia-press-wire",
        "name": "Cambodia Press Wire (Google News)",
        "country": "KH",
        "language": "en",
        "website_url": "https://news.google.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=Cambodia+"
            "(site:phnompenhpost.com+OR+site:khmertimeskh.com+OR+site:kiripost.com+OR+site:cambojanews.com)"
            "&hl=en-US&gl=US&ceid=US:en"
        ),
        "category": "Cambodia",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Aggregated wire links pointing to original Cambodian newsroom articles.",
        "fetch_interval_mins": 60,
        "priority": 10,
    },
    {
        "slug": "thai-media-on-cambodia",
        "name": "Thai Media on Cambodia (Bangkok Post / Nation / Khaosod)",
        "country": "TH",
        "language": "en",
        "website_url": "https://www.bangkokpost.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=Cambodia+"
            "(site:bangkokpost.com+OR+site:nationthailand.com+OR+site:khaosodenglish.com+OR+site:thaipbsworld.com)"
            "&hl=en-US&gl=US&ceid=US:en"
        ),
        "category": "Thailand-Cambodia",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Tracks Thai English-language reporting specifically covering Cambodia, border trade, workers, and diplomacy.",
        "fetch_interval_mins": 60,
        "priority": 10,
    },
    {
        "slug": "asean-regional-wire",
        "name": "ASEAN & Mekong Regional Watch",
        "country": "ASEAN",
        "language": "en",
        "website_url": "https://www.channelnewsasia.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=(ASEAN+OR+Mekong+OR+%22Southeast+Asia%22)+"
            "(trade+OR+economy+OR+tech+OR+Cambodia+OR+Thailand+OR+Vietnam)"
            "&hl=en-SG&gl=SG&ceid=SG:en"
        ),
        "category": "ASEAN",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Regional Southeast Asian policy, digital economy, and ASEAN corridor coverage.",
        "fetch_interval_mins": 90,
        "priority": 8,
    },
    {
        "slug": "cna-asia-news",
        "name": "Channel News Asia",
        "country": "ASEAN",
        "language": "en",
        "website_url": "https://www.channelnewsasia.com",
        "feed_url": "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
        "category": "ASEAN",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "CNA Asia Pacific regional news RSS feed.",
        "fetch_interval_mins": 90,
        "priority": 8,
    },
    {
        "slug": "bbc-world-news",
        "name": "BBC World News",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://www.bbc.com/news/world",
        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "World",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Official BBC News World RSS feed with attribution links.",
        "fetch_interval_mins": 90,
        "priority": 7,
    },
    {
        "slug": "al-jazeera-english",
        "name": "Al Jazeera English",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://www.aljazeera.com",
        "feed_url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "World",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Official Al Jazeera international news feed.",
        "fetch_interval_mins": 90,
        "priority": 7,
    },
    {
        "slug": "ars-technica",
        "name": "Ars Technica",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://arstechnica.com",
        "feed_url": "https://feeds.arstechnica.com/arstechnica/index",
        "category": "Technology",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Global technology, science, and cybersecurity reporting.",
        "fetch_interval_mins": 120,
        "priority": 6,
    },
]


def seed_recommended_sources(db: Session) -> Dict[str, int]:
    """Insert missing recommended regional and global RSS sources without duplicating existing slugs."""
    added = 0
    existing = 0
    for item in RECOMMENDED_SOURCES:
        row = db.query(Source).filter(Source.slug == item["slug"]).first()
        if row:
            existing += 1
            continue
        db.add(Source(
            name=str(item["name"]),
            slug=str(item["slug"]),
            country=str(item["country"]),
            language=str(item["language"]),
            website_url=str(item["website_url"]),
            feed_url=str(item["feed_url"]),
            category=str(item["category"]),
            is_active=True,
            trust_level=str(item["trust_level"]),
            license_notes=str(item["license_notes"]),
            fetch_interval_mins=int(item["fetch_interval_mins"]),
            priority=int(item["priority"]),
        ))
        added += 1
    if added:
        db.commit()
    return {"added": added, "existing": existing, "total": len(RECOMMENDED_SOURCES)}
