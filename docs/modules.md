# Daily Discovery — Domain Modules Specification

## 1. Modular Monolith Architecture
Daily Discovery organizes business responsibilities into cohesive domain modules inside a single modular codebase:

```text
FastAPI Modular Monolith
│
├── News Domain           (/news, /cambodia, /world)
├── Discovery Domain      (/discover)
├── Travel Domain         (/travel, /travel/transport, /travel/nearby)
├── Location & Place      (/travel/[destination], /travel/place/[slug])
├── Accommodation         (Specialized Hotel & Resort metadata)
├── Transport & Routes    (Bus, Minivan, Train, Ferry, Terminals, Timetables)
├── Trip Engine           (/travel/planner, /travel/trips/[slug])
├── Daily Quiz            (/quiz, /quiz/[slug])
├── Operational Tools     (/tools, /tools/[slug] - 15 interactive utilities)
├── System Configuration  (navigation_items, homepage_sections, feature_flags)
├── Zero-Trust Security   (rate limiting, SSRF protection, CSP, RBAC)
└── Observability         (/health, /ready, /live, /admin/infrastructure)
```

## 2. Module Principles
* **Single Responsibility:** Each module manages its own entities, schemas, and services.
* **Routes ≠ Containers:** All 34+ web routes run in a single Next.js container; all backend modules run in a single FastAPI container.
* **Provider Independence:** Vendor adapters (MapProvider, StorageProvider, AIProvider) isolate infrastructure from domain logic.
* **No Normal Delete:** Major business records use lifecycle states (`ACTIVE`, `SUSPENDED`, `CLOSED`, `ARCHIVED`, `MERGED`).
