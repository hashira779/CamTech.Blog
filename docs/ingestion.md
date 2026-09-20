# News Ingestion System & Source Registry

Section 8 & 46 Guidelines: Daily Discovery uses polite, controlled RSS/Atom ingestion rather than aggressive, unauthorized web scraping.

---

## 1. Adding an Ingestion Source

Admins can register new sources via `/api/v1/sources`:

```json
POST /api/v1/sources
{
  "name": "Khmer Times",
  "country": "KH",
  "language": "en",
  "website_url": "https://www.khmertimeskh.com",
  "feed_url": "https://www.khmertimeskh.com/feed",
  "category": "Cambodia News",
  "trust_level": "VERIFIED_PUBLISHER",
  "fetch_interval_mins": 60,
  "priority": 5
}
```

---

## 2. Ingestion Flow & Deduplication

1. **Polite Request**: Standard User-Agent header and timeout controls.
2. **Canonical Matching**: Deduplication engine normalizes titles and tests Jaccard token overlap against recent items.
3. **Draft Synthesis**: Local or LLM provider creates initial draft summaries, bullet highlights, and SEO tags.
4. **Queue Placement**: Ingested stories land in `AI_DRAFT` status and await human editor review.
