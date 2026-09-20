# Daily Discovery — Performance & Resilience Engineering

## 1. Performance Priorities
* **P0 (Immediate):** Fast HTML, headlines, hero image, critical CSS.
* **P1 (Early):** Secondary cards, related stories, nearby suggestions.
* **P2 (Deferred):** Comments, recommendations, non-intrusive ads.
* **P3 (Background):** Analytics, prefetch, worker synchronization.

## 2. Image Optimization
* Next.js Image component with WebP/AVIF automatic conversion.
* Responsive sizes for mobile viewport bandwidth efficiency.
* High priority exclusively for hero visuals.

## 3. Circuit Breakers
External services (AI, RSS source feeds, external mapping APIs) are wrapped in circuit breakers:
* Failure Threshold: 5 consecutive timeouts
* Recovery Timeout: 45.0s
* Fallback: Deterministic cached data or manual editorial workflows.

See [Performance Architecture](/docs/performance/architecture.md) for full metrics and budgets.
