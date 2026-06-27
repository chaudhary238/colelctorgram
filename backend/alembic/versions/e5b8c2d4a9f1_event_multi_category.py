"""Events multi-category (DF-35) — events.category → events.categories text[].

v3's events are multi-category (the create flow says "pick one or more" and the
detail renders the categories joined by " · "). The schema stored a single
events.category, so the composer's multi-select silently dropped every pick
after the first. This migration replaces the single column with a categories
text[] array (faithful to v3, removes the latent dead multi-select).

- ADD events.categories text[] NOT NULL server_default '{}' (so the seed's raw
  inserts and any in-flight rows stay valid).
- BACKFILL categories = ARRAY[category] for rows that had a single category.
- Swap the index: drop idx_events_category, add a GIN idx_events_categories so
  the (still-supported) ?category= list filter can do an array-contains match.
- DROP events.category.

Chains off the notification-actor head (DF-32).

Revision ID: e5b8c2d4a9f1
Revises: d4a7c1e9f3b2
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY


revision: str = "e5b8c2d4a9f1"
down_revision: Union[str, None] = "d4a7c1e9f3b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("categories", ARRAY(sa.Text()), nullable=False, server_default="{}"),
    )
    # Backfill from the single category before dropping it.
    op.execute("UPDATE events SET categories = ARRAY[category] WHERE category IS NOT NULL")

    op.drop_index("idx_events_category", table_name="events")
    op.create_index(
        "idx_events_categories", "events", ["categories"], postgresql_using="gin"
    )
    op.drop_column("events", "category")


def downgrade() -> None:
    op.add_column("events", sa.Column("category", sa.Text(), nullable=True))
    # Restore the first category as the single value.
    op.execute(
        "UPDATE events SET category = categories[1] "
        "WHERE array_length(categories, 1) >= 1"
    )
    op.drop_index("idx_events_categories", table_name="events")
    op.create_index("idx_events_category", "events", ["category"])
    op.drop_column("events", "categories")
