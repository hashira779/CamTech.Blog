# Daily Discovery (CamTech.Blog)

> **Production-grade, high-performance web platform combining Verified News, Visual Discovery, Travel & Transit, and Everyday Utilities.**

[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#0-critical-architecture-rule-routes--containers)
[![Frontend: Next.js 16 App Router](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20TypeScript-black.svg)](https://nextjs.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.12-009688.svg)](https://fastapi.tiangolo.com/)
[![Database: PostgreSQL + Redis](https://img.shields.io/badge/Storage-PostgreSQL%20%2B%20Redis%20%2B%20MinIO-336791.svg)](#tech-stack)
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

* **500+ Routes** exist within **1 Next.js Web Service** running in identical horizontal replicas.
* **13 Business Modules** reside cleanly within **1 FastAPI Modular Monolith**.
* **Background Jobs** (RSS ingestion, trending popularity scoring, feed checks) run in **1 Asynchronous Worker Container**.

**Do NOT create one container per route.**

---

## 1. System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|               Web Browsers  *  Mobile Devices  *  Search Engine Crawlers          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                EDGE & SECURITY                                    |
|              Cloudflare CDN / WAF  *  SSL Termination  *  DDoS Shield             |
+-------------------+---------------------------------------+-----------------------+
                    |                                       |
                    v                                       v
+---------------------------------------+   +---------------------------------------+
|          FRONTEND SERVICE             |   |            ADMIN PORTAL               |
|  apps/web: Next.js 16 + React 19      |   |  apps/admin: Vite React SPA           |
|  SSR / ISR News & Discovery Pages     |   |  Super-System UI & DB Migration Wizard|
+-------------------+-------------------+   +-------------------+-------------------+
                    |                                       |
                    +-------------------+-------------------+
                                        |  REST API Requests
                                        v
+-----------------------------------------------------------------------------------+
|                             BACKEND MODULAR MONOLITH                              |
|                              apps/api: FastAPI Core                               |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Middleware Pipeline: CORS -> RequestLogger -> SecurityHeaders -> RateLimiter|  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  [News & Dedup]  [Discoveries & Quizzes]  [Travel & Transit]  [Utilities Engine]  |
|  [Audit Logging] [SSRF Validator]         [Circuit Breaker]   [Health Triad]      |
+--------------------+----------------------------------+---------------------------+
                     |                                  |
                     v                                  v
+------------------------------------+  +-------------------------------------------+
|          PERSISTENCE LAYER         |  |             BACKGROUND WORKER             |
|  PostgreSQL 16 (Primary DB)        |  |  apps/api/app/workers/runner.py           |
|  Redis 7 (Cache & Rate Limiting)   |  |  * Periodic RSS Wire Feed Ingestion       |
|  MinIO / R2 (S3-compatible Media)  |  |  * Autopilot AI Processing & Trend Scoring|
+------------------------------------+  +-------------------------------------------+
```

---

## 2. Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI** + Python 3.12 | Async REST API, OpenAPI docs, Pydantic v2 validation |
| **Database & ORM** | **PostgreSQL 16** + **SQLAlchemy 2.0** | Relational schemas, Unicode support, non-destructive status lifecycle |
| **Database Migrations**| **Alembic** | Version-controlled database schema changes |
| **Cache & Limiting**| **Redis 7** / In-Memory Limiter | Sliding-window rate limiting, multi-tier endpoint quotas |
| **Object Storage** | **MinIO** / Cloudflare R2 | S3-compatible image and asset storage with dual-sync fallback |
| **Web Frontend** | **Next.js 16** + React 19 + TypeScript | Server-Side Rendering (SSR), ISR for SEO, Tailwind CSS design system |
| **Admin Portal** | **Vite** + React 18 SPA | Centralized Super-System administration & migration wizard |
| **Security & Auth** | **python-jose** + **bcrypt** + Starlette | Zero-trust JWT authentication, SSRF guard, defense-in-depth headers |
| **Observability** | Structured JSON Logging + Health Triad | Probes at `/health`, `/live`, and `/ready` with JSON access logs |
| **Testing** | **pytest** + `TestClient` | Unit, integration, and security test coverage |

---

## 3. Core Pillars

| Pillar | Focus | Features |
| :--- | :--- | :--- |
| **KNOW** | Cambodia & World News | Bilingual (Khmer + English), non-destructive revisions, original value analysis, Jaccard deduplication. |
| **DISCOVER** | Science & Deep Dives | 15 categories (AI, Space, Animals, History, Nature), visual cards, interactive quizzes. |
| **TRAVEL** | Destinations & Transit | Generic location hierarchy, accommodations, restaurants, bus operators (Giant Ibis, Larryta), schedules, Haversine nearby calculator, and dynamic multi-day trip planner. |
| **USE** | Daily Utilities | 15 tools including financial/percentage calculators, JSON formatters, UUID/Base64 tools, QR generator, and image converter. |

---

## 4. Quick Start Guide

### Essential `Makefile` Commands

The repository provides a unified `Makefile` for zero-friction local development:

```bash
# 1. First-time setup (installs Python deps, npm packages, and pre-commit hooks)
make setup

# 2. Start full Docker Compose environment with hot-reload
make dev-up

# 3. View live logs from all containers
make logs

# 4. Run automated test suites
make test

# 5. Stop local containers
make dev-down
```

### Full Command Reference

| Command | Action |
| :--- | :--- |
| `make setup` | Install Python dependencies, frontend npm packages, and pre-commit hooks |
| `make dev-up` | Start dev environment with hot-reload in detached mode |
| `make dev-down` | Stop development containers and networks |
| `make logs` | Tail real-time service logs |
| `make test` | Run pytest backend unit & integration tests |
| `make lint` | Run ESLint and code style checks |
| `make db-migrate m="desc"` | Autogenerate a new Alembic database migration |
| `make db-upgrade` | Apply all pending database migrations |
| `make db-downgrade` | Rollback the latest migration |
| `make db-seed` | Populate database with realistic seed data |
| `make build` | Build production multi-stage Docker images |
| `make clean` | Clean build artifacts and temporary cache directories |

---

## 5. Deployed Endpoints

When running locally (`make dev-up`):

* **Web Application**: [http://localhost:3000](http://localhost:3000)
* **API Backend**: [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **MinIO Object Console**: [http://localhost:9001](http://localhost:9001) (`minio_admin` / `minio_secret_key`)
* **Health Check Probes**:
  - `GET /health`: Immediate server liveness
  - `GET /live`: Pod liveness probe
  - `GET /ready`: Deep readiness probe (DB & storage validation)

---

## 6. Monorepo Directory Structure

```text
CamTech.Blog/
├── Makefile                      # Standardized developer CLI commands
├── CONTRIBUTING.md               # Contribution, branch, and migration guide
├── docker-compose.yml            # Multi-container production & staging orchestration
├── docker-compose.dev.yml        # Development overrides (hot-reload mounts)
├── docs/                         # 18 comprehensive architectural specifications
│   ├── architecture.md           # Monorepo topology & scaling roadmap
│   ├── database.md               # Relational schema & non-destructive lifecycle
│   ├── api.md                    # REST API specifications
│   ├── security.md               # Security hardening, SSRF, & headers
│   └── ...
├── apps/
│   ├── api/                      # FastAPI Modular Monolith
│   │   ├── app/
│   │   │   ├── api/v1/           # Domain route controllers
│   │   │   ├── common/           # Database, config, audit logger, SSRF guard
│   │   │   ├── middleware/       # Rate limiting, security headers, request logger
│   │   │   ├── models/           # SQLAlchemy database entities
│   │   │   ├── schemas/          # Pydantic v2 schemas
│   │   │   ├── services/         # Business logic & algorithms
│   │   │   └── workers/          # Background scheduler & ingestion daemon
│   │   └── tests/                # Automated pytest suite (41+ tests passing)
│   ├── web/                      # Next.js 16+ App Router Web App
│   └── admin/                    # Vite React Super-System SPA
└── database/                     # Alembic migrations & initial seeds
```

---

## 7. Security Hardening & Zero-Trust Principles

* **Rate Limiting**: Configured sliding-window quotas per endpoint pattern (10 req/min for `/login`, 30 req/min for `/search`, 60 req/min default) with `429 Too Many Requests` and `Retry-After` enforcement.
* **Defense-in-Depth Headers**: Automatically injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and `Strict-Transport-Security`.
* **Structured Access Logging**: Requests emit structured JSON events containing method, path, status code, client IP, request ID, and execution duration.
* **Audit Logging**: Comprehensive `log_action` utility recording administrative and editorial events (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `PUBLISH`) with IP address and user-agent context.
* **SSRF Guard**: Proactive IP validator preventing server-side request forgery against private subnets (RFC 1918) and cloud metadata endpoints (`169.254.169.254`).
* **Non-destructive Data Policy**: Status lifecycle (`ACTIVE`, `INACTIVE`, `TEMPORARILY_CLOSED`, `ARCHIVED`) protects operational data integrity.

---

## 8. Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development workflow, testing procedures, and the process for submitting pull requests.

---

## 9. License

MIT © Hashira779