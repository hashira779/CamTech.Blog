"""Initial schema baseline (stamp migration)

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-14 23:00:00.000000

Baseline migration marking the initial schema state for CamTech.Blog (Daily Discovery).
This is a 'stamp' migration with empty upgrade/downgrade operations because all
underlying tables already exist in production and development databases:
  - users, authors, sources, source_fetch_logs
  - categories, tags, article_tags, articles, article_sources, article_revisions
  - discoveries, quizzes, quiz_questions, quiz_attempts
  - tools, media_assets, bookmarks
  - analytics_events, trending_scores, audit_logs, site_settings, security_events
  - countries, destinations, places, accommodations, place_revisions, place_suggestions
  - trips, trip_days, trip_day_items
  - navigation_items, homepage_sections, feature_flags
  - transport_operators, transport_hubs, transport_routes, transport_stops, transport_schedules
  - travel_guides, travel_events
  - storage_providers, storage_policies
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline stamp migration: tables already exist in pre-Alembic databases.
    # Future schema modifications will be defined in subsequent migrations.
    pass


def downgrade() -> None:
    # Baseline schema downgrade: no-op since baseline tables are pre-existing.
    pass
