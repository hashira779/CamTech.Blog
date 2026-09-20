# Production Deployment Guide

Daily Discovery is prepared for containerized or standalone deployment with Node.js and Python runtimes.

---

## 1. Environment Checklist

Ensure all variables in `.env` are configured:
- `DATABASE_URL`: Production PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/daily_discovery`).
- `JWT_SECRET`: High-entropy 64-character random string.
- `FRONTEND_URL`: Canonical public domain (e.g. `https://dailydiscovery.com`).

---

## 2. Docker Compose Setup

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: daily_discovery
      POSTGRES_USER: dd_user
      POSTGRES_PASSWORD: dd_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: ./apps/api
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    environment:
      DATABASE_URL: postgresql://dd_user:dd_password@db:5432/daily_discovery
    depends_on:
      - db

  web:
    build:
      context: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: https://api.dailydiscovery.com/api/v1
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

---

## 3. Database Migration & Seeding

```bash
# Apply schema & seed initial content
python database/seed_data.py
```
