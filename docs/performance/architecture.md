# High-Performance Architecture Overview

## 1. Speed as a Core Requirement
Daily Discovery delivers breaking news, interactive quizzes, visual science discoveries, and online tools with sub-second page loads even over mobile 4G/3G networks.

```
Request → Cloudflare Edge CDN (Static assets, HTML microcache)
        → NGINX Load Balancer (Least-connections routing, SSL termination)
        → Next.js 16 (Server-rendered HTML + selective interactive client islands)
        → FastAPI Backend (Async I/O, Pydantic validation)
        → Redis (Decay trending engine & cache layer)
        → PostgreSQL (Connection pooled, indexed queries)
```

## 2. Server-First Architecture
- **Server Components by default**: News articles, hubs, and legal policies are server-rendered to HTML with zero client JavaScript hydration required for basic reading.
- **Client Islands**: Client components (`"use client"`) are used strictly for interactive features:
  - Quiz answer selection & scoring
  - Interactive calculators & client-side image compression
  - Cookie consent banner & theme toggling
  - Admin editorial review desks
