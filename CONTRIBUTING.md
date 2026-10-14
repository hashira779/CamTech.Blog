# Contributing to Daily Discovery (CamTech.Blog)

Thank you for your interest in contributing to **Daily Discovery**! This guide outlines our standards, workflow, and instructions to ensure high code quality, security, and maintainability across the platform.

---

## 1. Project Overview

Daily Discovery is a modular monolith web platform combining:
* **KNOW**: Verified bilingual Cambodia & World news with Jaccard deduplication and non-destructive editorial revisions.
* **DISCOVER**: Visual educational discoveries, interactive trivia quizzes, and deep dives.
* **TRAVEL**: Cambodian destination directories, accommodations, verified transit operators (Giant Ibis, Larryta), bus schedules, and dynamic AI multi-day trip planning.
* **USE**: Client-side everyday utilities and calculators running without server computation.

The monorepo contains:
* `apps/api`: Python FastAPI backend with SQLAlchemy ORM, rate limiting, and zero-trust security.
* `apps/web`: Next.js 15+ App Router, React 19, TypeScript, and Tailwind CSS.
* `apps/admin`: Vite React SPA with Super-System database migration wizard.
* `database/`: Database schemas, migrations (Alembic), and seed datasets.

---

## 2. Prerequisites

Ensure your development machine has the following tools installed:

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.12+` | FastAPI backend, migration tooling, test runners |
| **Node.js** | `20+ LTS` | Next.js web application and React Admin dashboard |
| **npm** | `10+` | Node package management |
| **Docker & Compose** | `v2+` | Containerized development, PostgreSQL, Redis, MinIO |
| **Git** | `2.40+` | Version control |

---

## 3. Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/hashira779/CamTech.Blog.git
cd CamTech.Blog
```

### Step 2: Environment Configuration
Copy the template environment variables:
```bash
cp .env.example .env
```
Ensure configuration keys (such as `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`) match your local environment.

### Step 3: Automated One-Command Setup
Using the provided `Makefile`:
```bash
make setup
```
This installs Python dependencies, Node packages for `apps/web` and `apps/admin`, and activates git pre-commit hooks.

### Step 4: Run the Services
**Using Docker Compose (Recommended):**
```bash
make dev-up
```
All services (Web, API, DB, Redis, MinIO) will boot in detached mode with hot reloading.

**Using Native Local Shells:**
* **API Backend**:
  ```bash
  cd apps/api
  uvicorn app.main:app --reload --port 8000
  ```
* **Web Frontend**:
  ```bash
  cd apps/web
  npm run dev
  ```
* **Admin Dashboard**:
  ```bash
  cd apps/admin
  npm run dev
  ```

---

## 4. Development Workflow

We follow standard Trunk-Based Development with feature branches.

### Branch Naming Conventions
* `feature/<feature-name>`: New feature or capability (e.g. `feature/rate-limiter-redis`)
* `fix/<bug-description>`: Bug fix (e.g. `fix/cors-preflight-cache`)
* `security/<patch-name>`: Vulnerability mitigation or security hardening
* `docs/<topic>`: Documentation updates
* `refactor/<scope>`: Code restructuring without functional changes

### Git Commit Guidelines
Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
```text
<type>(<scope>): <short description>

[optional body]

[optional issue reference]
```
*Types:* `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Example:
```bash
git commit -m "feat(security): add in-memory rate limiting middleware with 429 response"
```

### Pull Request (PR) Checklist
Before submitting a PR:
1. Ensure all backend tests pass (`make test`).
2. Run linters across frontend and backend (`make lint`).
3. Ensure no uncommitted schema changes or secrets are in the git tree.
4. Provide a clear summary of changes and test results in the PR description.

---

## 5. How to Run Tests

### Backend Test Suite
Run the full pytest suite:
```bash
# Via Makefile:
make test

# Or directly in apps/api:
cd apps/api
pytest tests/ -v
```

### Frontend Build & Lint Checks
```bash
# Lint Web app:
npm --prefix apps/web run lint

# Verify Next.js production build:
npm --prefix apps/web run build
```

---

## 6. How to Create Database Migrations

Database migrations are managed via **Alembic**.

### Creating a New Migration
When modifying SQLAlchemy models in `apps/api/app/models/`:
```bash
# Generate revision with autogenerate:
make db-migrate m="add_user_agent_to_audit_logs"

# Or using docker-compose directly:
docker compose exec api alembic revision --autogenerate -m "your_change_description"
```

### Applying Migrations
```bash
# Apply pending migrations:
make db-upgrade

# Rollback the last migration:
make db-downgrade
```

### Seeding Initial Data
```bash
make db-seed
```

---

## 7. Code Style & Pre-commit Hooks

We maintain strict formatting and static analysis standards.

### Pre-commit Hooks
The project uses `pre-commit` to catch errors prior to git commits:
```bash
# Install hooks manually (if not done in make setup):
make pre-commit
```
Hooks configured:
* `trailing-whitespace`: Trims trailing whitespace.
* `end-of-file-fixer`: Ensures files end with a newline.
* `check-yaml` / `check-json`: Validates syntax.
* `ruff`: Fast Python linter and formatter.
* `eslint`: JavaScript/TypeScript linting.

### Python Guidelines
* Python code follows PEP 8 conventions.
* Type hints (`typing`) are strongly encouraged across service functions and schemas.
* Never expose unhandled raw tracebacks to clients (use structured HTTPException or standard error envelopes).

### TypeScript & React Guidelines
* Use strict TypeScript typing; avoid `any`.
* Follow Next.js 15 App Router paradigms (Server Components by default, Client Components only when state/interactivity is required).

---

## 8. Deployment Process

### Production Container Builds
Production containers are built with multi-stage Dockerfiles that minimize image size and eliminate non-production build tooling:
```bash
make build
```

### Deployment Strategy
1. **Edge CDN (Cloudflare)**: Handles SSL termination, WAF protection, DDoS mitigation, and edge caching for static assets and public article ISR pages.
2. **Reverse Proxy (Nginx / Caddy)**: Forwards traffic to Next.js (`apps/web`) and FastAPI (`apps/api`).
3. **API & Background Workers**:
   - `apps/api`: Serves stateless REST API requests behind Uvicorn workers.
   - `apps/workers`: Runs scheduled RSS ingestion and autopilot tasks as an isolated daemon.
4. **Health Check Probes**:
   - `/health`: Instant process liveness probe.
   - `/live`: Container runtime probe.
   - `/ready`: Deep readiness probe checking database and cache connectivity.
