# Multi-Tier Caching & Invalidation Strategy

## 1. Caching Hierarchy

```
Browser Cache (Static assets: 1 Year Immutable)
       ↓
Edge CDN Cache (Images, HTML microcache: 10s–60s TTL)
       ↓
Next.js ISR / Tagged Cache (revalidate = 60)
       ↓
Redis Cache (Trending calculation decay scores, session limits)
       ↓
PostgreSQL Database
```

## 2. Dynamic Content Invalidation Rules
- **Articles**: Revalidated on 60-second intervals (`export const revalidate = 60`). When an article is edited or updated, its cache tag is purged immediately.
- **Breaking News**: NGINX microcache allows serving slightly stale cached versions (`stale-while-revalidate`) during massive concurrency spikes, shielding origins from request dogpiling.
- **Private Data**: Admin routes (`/admin/*`) and authenticated endpoints explicitly output `Cache-Control: no-store, private` to prevent cache poisoning.
