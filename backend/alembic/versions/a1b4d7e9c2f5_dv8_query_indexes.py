"""Indexes for the DV8-batch query patterns (founder 2026-09-06: "make sure the db
is still optimal with the design changes").

What changed access-wise this batch, and what serves it:

- items(user_id, sku): the single hottest new lookup — viewer_item resolution on
  EVERY catalogue-entry view, the quick-add duplicate guard, wishlist toggles and
  "I own this too". idx_items_user alone degrades linearly with a collector's shelf
  size; the composite makes all of these point reads. (idx_items_sku stays — the
  people list and owner counts are sku-led.)

- community_join_requests: DV8 gated ALL joins through this table but it shipped
  with only a pkey — "your pending request" runs on every community page view and
  the mod approval queue on every manage view, both as seq scans today.

- community_members(user_id): the pkey is (community_id, user_id), which cannot
  serve the user-led "Your communities (N)" default tab or the created-vs-joined
  sections.

- events: the rail-widget fix filters browse on coalesce(ends_at, starts_at) >= now()
  and orders by starts_at; the table only had category/city/community indexes.

messages.ref_sku deliberately gets NO index: it is never queried by sku, and
catalogue rows are never deleted (FK reverse-lookup never runs).

Revision ID: a1b4d7e9c2f5
Revises: f2d5e8b1c6a7
Create Date: 2026-09-06
"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b4d7e9c2f5"
down_revision: Union[str, None] = "f2d5e8b1c6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("idx_items_user_sku", "items", ["user_id", "sku"])
    op.create_index("idx_cjr_user", "community_join_requests", ["user_id", "status"])
    op.create_index("idx_cjr_community", "community_join_requests", ["community_id", "status"])
    op.create_index("idx_community_members_user", "community_members", ["user_id"])
    op.create_index("idx_events_starts", "events", ["starts_at"])
    # Matches the browse filter expression verbatim so the planner can use it.
    op.execute("CREATE INDEX idx_events_horizon ON events (COALESCE(ends_at, starts_at))")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_events_horizon")
    op.drop_index("idx_events_starts", table_name="events")
    op.drop_index("idx_community_members_user", table_name="community_members")
    op.drop_index("idx_cjr_community", table_name="community_join_requests")
    op.drop_index("idx_cjr_user", table_name="community_join_requests")
    op.drop_index("idx_items_user_sku", table_name="items")
