# Daily Discovery (CamTech.Blog)

> **Production-grade, high-performance web platform combining News, Visual Discovery, Travel & Transit, and Everyday Utilities.**

[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#critical-architecture-rule)
[![Frontend: Next.js 16 App Router](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20TypeScript-black.svg)](https://nextjs.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.12-009688.svg)](https://fastapi.tiangolo.com/)
[![Database: PostgreSQL + Redis](https://img.shields.io/badge/Storage-PostgreSQL%20%2B%20Redis%20%2B%20MinIO-336791.svg)](#docker-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 0. Critical Architecture Rule: Routes $\neq$ Containers

A core architectural principle of this repository:

```text
ROUTE       = User-facing URL / page (/news, /travel, /travel/siem-reap/hotels, etc.)
MODULE      = Business / domain boundary in code
SERVICE     = Deployable application boundary
CONTAINER   = Runtime / deployment unit
```

* **500+ Routes** can exist within **1 Next.js Web Service** and run in **1 or multiple identical horizontal replicas**.
* **13 Business Modules** (News, Travel, Places, Transport, Trips, Quizzes, Tools, Search, Moderation, Analytics) reside cleanly within **1 FastAPI Modular Monolith**.
* **Background Jobs** (RSS ingestion, trending popularity scoring, feed checks) run in **1 Asynchronous Worker Container**.

**Do NOT create one container per route.**

---

## 1. Core Pillars

| Pillar | Focus | Features |
| :--- | :--- | :--- |
| **KNOW** | Cambodia & World News | Bilingual (Khmer + English), non-destructive revisions, original value analysis, Jaccard deduplication. |
| **DISCOVER** | Science & Deep Dives | 15 categories (AI, Space, Animals, History, Nature), visual cards, interactive quizzes. |
| **TRAVEL** | Destinations & Transit | Generic location hierarchy, accommodations, restaurants, bus operators (Giant Ibis, Larryta), schedules, Haversine nearby calculator, and dynamic multi-day trip planner. |
| **USE** | Daily Utilities | 15 tools including financial/percentage calculators, JSON formatters, UUID/Base64 tools, QR generator, and image converter. |

---

## 2. Monorepo Structure

```text
CamTech.Blog/
├── docker-compose.yml            # Multi-container local & staging orchestration
├── docs/                         # 17 comprehensive architectural specifications
│   ├── architecture.md           # High-level architecture & scaling
│   ├── database.md               # Relational schema & non-destructive lifecycle
│   ├── api.md                    # REST API contracts & rate limiting
│   ├── travel.md                 # Destination, transit, and accommodation domain
│   ├── news.md                   # Editorial workflows & attribution
│   ├── docker.md                 # Containerization & non-root user specs
│   ├── security.md               # Defense-in-depth, SSRF protection, CSP
│   └── ...
├── apps/
│   ├── api/                      # FastAPI Modular Monolith
│   │   ├── Dockerfile            # Multi-stage production API image
│   │   ├── Dockerfile.worker     # Background worker image
│   │   ├── app/
│   │   │   ├── api/v1/           # Modular route controllers
│   │   │   ├── domain/           # Entities & domain contracts
│   │   │   ├── models/           # SQLAlchemy data models
│   │   │   ├── schemas/          # Pydantic v2 request/response schemas
│   │   │   ├── services/         # Business logic & algorithms
│   │   │   ├── workers/          # Async worker runner
│   │   │   └── security/         # SSRF protection, RBAC, headers
│   │   └── tests/                # Automated pytest suite (35 tests)
│   └── web/                      # Next.js 16+ App Router Web App
│       ├── Dockerfile            # Multi-stage production Web image
│       └── src/
│           ├── app/              # 34+ SSR / ISR / SSG pages
│           ├── components/       # Design system & interactive widgets
│           └── lib/              # API clients & type definitions
└── database/
```

---

## 3. Quick Start with Docker

Run the complete platform locally using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/hashira779/CamTech.Blog.git
cd CamTech.Blog

# Spin up all services
docker compose up --build -d
```

### Deployed Services:
* **Web Frontend**: [http://localhost:3000](http://localhost:3000)
* **API Backend**: [http://localhost:8000](http://localhost:8000)
* **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **MinIO Console**: [http://localhost:9001](http://localhost:9001) (User: `minio_admin` / Pass: `minio_secret_key`)
* **PostgreSQL**: `localhost:5432` (`daily_discovery`)
* **Redis**: `localhost:6379`

---

## 4. Local Development Setup (Without Docker)

### Backend (FastAPI)
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # Or on Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```

---

## 5. Automated Testing

### Backend Unit & Integration Tests (35 Tests Passing)
```bash
python -m pytest apps/api/tests/test_backend.py -v
```

### Frontend Production Build Verification (33/33 Pages Passing)
```bash
npm --prefix apps/web run build
```

---

## 6. Security & Production Principles

* **Defense in Depth**: Cloudflare WAF $\to$ Load Balancer $\to$ Next.js / FastAPI $\to$ PostgreSQL / Redis.
* **Server-side Security**: All role-based access control (RBAC) and data authorization enforced on the server.
* **Non-destructive Data Policy**: Status lifecycle (`ACTIVE`, `INACTIVE`, `CLOSED`, `ARCHIVED`, `MERGED`) avoids irreversible deletes.
* **SSRF Guard**: Strict outbound request validation blocking private IP ranges and internal metadata endpoints.
* **Health Checks**: Standardized `/live`, `/ready`, and `/health` endpoints for zero-downtime load balancer rotation.

---

## 7. License

MIT © Hashira779