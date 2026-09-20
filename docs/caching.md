# Daily Discovery — Caching Architecture

## 1. Multi-Tier Cache Hierarchy
```text
Browser Cache
  ↓
Cloudflare Edge CDN (Static assets, public article HTML)
  ↓
Next.js Incremental Static Regeneration (ISR - 60s revalidate)
  ↓
Redis Cache (Trending scores, geocoded distance lookups)
  ↓
PostgreSQL Primary Database
```

## 2. Granular Cache Invalidation
When an editor publishes an article:
1. Invalidate article slug URL.
2. Invalidate parent category (`/cambodia` or `/world`).
3. Invalidate homepage section (`LATEST_NEWS`).
4. Keep all other unrelated destination and tools caches intact.

See [Caching Strategy](/docs/performance/caching.md) for TTL parameters.
