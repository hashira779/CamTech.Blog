# Daily Discovery — Docker & Container Architecture

## 1. Golden Architecture Rule: Routes are NOT Containers
A critical architectural boundary of Daily Discovery:
* **Route ≠ Container:** We do NOT create `news-container`, `travel-container`, `tools-container`, etc.
* **Service ≠ Route:** A single Next.js service serves all 34+ public and admin routes.
* **Modular Monolith:** A single FastAPI service serves all domain modules (News, Travel, Transport, Quiz, Tools, Users).

## 2. Initial Docker Compose Topology
```text
docker-compose.yml
├── web: Next.js 16 (Turbopack, multi-stage Alpine build, non-root user)
├── api: FastAPI (Python 3.12-slim, non-root appuser, /health probe)
├── worker: Asynchronous background worker (ingestion, trending, verification)
├── postgres: PostgreSQL 16 (central relational storage)
├── redis: Redis 7 (cache and queue)
└── minio: Local S3-compatible object storage
```

## 3. Horizontal Scaling Model
When traffic spikes occur (e.g. breaking news or viral travel content):
```text
Load Balancer
├── Next.js #1 (Port 3000)
├── Next.js #2 (Port 3000)
└── Next.js #3 (Port 3000)
```
Every Next.js replica runs the identical application bundle; traffic is distributed horizontally without route segmentation.
