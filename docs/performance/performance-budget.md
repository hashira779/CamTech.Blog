# Mobile Performance Budgets & Core Web Vitals

## 1. Core Web Vitals Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | < 1.8s | Fast rendering of hero image and article headlines |
| **INP (Interaction to Next Paint)**| < 100ms | Immediate response on quiz answer clicks & calculator inputs |
| **CLS (Cumulative Layout Shift)**  | < 0.05 | Reserved layout slots for dormant AdSlots, zero jumping |
| **TTFB (Time to First Byte)**      | < 200ms | Edge caching and server-side streaming |

## 2. Resource Size Budgets
- **Initial HTML Payload**: < 45 KB uncompressed
- **First-Load JavaScript**: < 95 KB gzipped across initial bundles
- **Hero Image**: < 120 KB (WebP / AVIF format with responsive srcset)
- **Zero Third-Party Blocking**: External analytics and ads are deferred until after main thread paint.
