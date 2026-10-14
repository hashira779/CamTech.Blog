.PHONY: help db-migrate db-upgrade db-downgrade db-seed dev build test lint dev-up dev-down logs setup clean pre-commit

m ?= update_schema

# Database commands
db-migrate: ## Generate new migration
	docker compose exec api alembic revision --autogenerate -m "$(m)"

db-upgrade: ## Apply all pending migrations
	docker compose exec api alembic upgrade head

db-downgrade: ## Rollback one migration
	docker compose exec api alembic downgrade -1

db-seed: ## Run seed data
	docker compose exec api python seed_data.py

# Dev commands
dev: ## Start all services
	docker compose up

dev-up: ## Start dev environment with hot-reload
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

dev-down: ## Stop dev environment
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

logs: ## Tail all service logs
	docker compose logs -f

build: ## Build all containers
	docker compose build

test: ## Run all tests
	python -m pytest apps/api/tests/test_backend.py -v

lint: ## Run linters
	npm --prefix apps/web run lint

setup: ## First-time setup (install deps, create venv, etc.)
	python -m pip install -r apps/api/requirements.txt
	cd apps/web && npm install
	cd apps/admin && npm install
	python -m pip install pre-commit
	pre-commit install

clean: ## Remove build artifacts, caches
	rm -rf apps/web/.next apps/admin/dist
	rm -rf apps/api/.pytest_cache
	rm -rf **/__pycache__

pre-commit: ## Install pre-commit hooks
	pre-commit install
