"""add_wedding_tables

Revision ID: 002_add_wedding_tables
Revises: 001_initial_schema
Create Date: 2026-10-17 18:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "002_add_wedding_tables"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()

    # 1. wedding_users
    if "wedding_users" not in tables:
        op.create_table(
            "wedding_users",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("phone", sa.String(length=50), nullable=False),
            sa.Column("username", sa.String(length=100), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_wedding_users_phone", "wedding_users", ["phone"], unique=True)

    # 2. wedding_cards
    if "wedding_cards" not in tables:
        op.create_table(
            "wedding_cards",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("wedding_users.id"), nullable=False),
            sa.Column("slug", sa.String(length=100), nullable=False),
            sa.Column("theme", sa.String(length=50), server_default="royal_khmer_gold"),
            sa.Column("title", sa.String(length=255), server_default="សិរីសួស្តី អាពាហ៍ពិពាហ៍"),
            sa.Column("groom_name", sa.String(length=100), nullable=True),
            sa.Column("groom_title", sa.String(length=100), nullable=True),
            sa.Column("groom_parents", sa.String(length=255), nullable=True),
            sa.Column("groom_image_url", sa.String(length=500), nullable=True),
            sa.Column("bride_name", sa.String(length=100), nullable=True),
            sa.Column("bride_title", sa.String(length=100), nullable=True),
            sa.Column("bride_parents", sa.String(length=255), nullable=True),
            sa.Column("bride_image_url", sa.String(length=500), nullable=True),
            sa.Column("khmer_date", sa.String(length=255), nullable=True),
            sa.Column("solar_date", sa.String(length=50), nullable=True),
            sa.Column("solar_time", sa.String(length=50), nullable=True),
            sa.Column("morning_agenda", sa.Text(), nullable=True),
            sa.Column("evening_reception", sa.Text(), nullable=True),
            sa.Column("cover_image_url", sa.String(length=500), nullable=True),
            sa.Column("gallery_images", sa.Text(), nullable=True),
            sa.Column("music_url", sa.String(length=500), nullable=True),
            sa.Column("khqr_image_url", sa.String(length=500), nullable=True),
            sa.Column("khqr_account_name", sa.String(length=100), nullable=True),
            sa.Column("khqr_account_number", sa.String(length=100), nullable=True),
            sa.Column("enable_rsvp", sa.Boolean(), server_default="1"),
            sa.Column("enable_wishes", sa.Boolean(), server_default="1"),
            sa.Column("is_published", sa.Boolean(), server_default="1"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_wedding_cards_user_id", "wedding_cards", ["user_id"], unique=False)
        op.create_index("ix_wedding_cards_slug", "wedding_cards", ["slug"], unique=True)

    # 3. wedding_wishes
    if "wedding_wishes" not in tables:
        op.create_table(
            "wedding_wishes",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("card_id", sa.String(length=36), sa.ForeignKey("wedding_cards.id"), nullable=False),
            sa.Column("guest_name", sa.String(length=100), nullable=False),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("attendance", sa.String(length=50), server_default="attending"),
            sa.Column("guest_count", sa.Integer(), server_default="1"),
            sa.Column("blessing_message", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_wedding_wishes_card_id", "wedding_wishes", ["card_id"], unique=False)

def downgrade() -> None:
    op.drop_table("wedding_wishes")
    op.drop_table("wedding_cards")
    op.drop_table("wedding_users")
