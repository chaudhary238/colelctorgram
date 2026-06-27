"""Compose v3 (DF-30) — ISO post type + multi-community posting.

Two related schema additions for the rebuilt composer:

1. ISO ("In Search Of" / Wanted) post type — new nullable columns on posts:
   iso_item (what the author is looking for), iso_budget (max budget, in PAISE
   to match the money convention), iso_conditions (acceptable conditions, e.g.
   {Sealed,MIB}). Only set when posts.type = 'iso'; null for every other type.

2. Multi-community posting — a post can now be published to the author's feed
   AND/OR several communities at once:
   - posts.to_feed (bool, default true) — whether it shows on the global feed.
   - post_communities join table (post_id, community_id, status) — one row per
     target community; status is 'published' or 'pending' (per-community mod
     approval). posts.community_id is kept as the PRIMARY community for
     back-compat displays.

Backfill: existing community posts get a published post_communities row so the
community feed (now driven by the join) keeps showing them; to_feed defaults
true so existing posts stay on the feed. NOT NULL cols carry a server_default
so the seed's raw inserts keep working. Chains off the comment-likes head.

Revision ID: c3f9d2a16b40
Revises: b2e8f1a4d790
Create Date: 2026-06-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY


revision: str = "c3f9d2a16b40"
down_revision: Union[str, None] = "b2e8f1a4d790"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── DF-30d optional display title (all post types) ──
    op.add_column("posts", sa.Column("title", sa.Text(), nullable=True))

    # ── ISO post type ──
    op.add_column("posts", sa.Column("iso_item", sa.Text(), nullable=True))
    op.add_column("posts", sa.Column("iso_budget", sa.Integer(), nullable=True))
    op.add_column("posts", sa.Column("iso_conditions", ARRAY(sa.Text()), nullable=True))

    # ── Multi-community posting ──
    op.add_column(
        "posts",
        sa.Column("to_feed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_table(
        "post_communities",
        sa.Column("post_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("community_id", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="published"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "community_id"),
    )
    op.create_index("idx_post_communities_community", "post_communities", ["community_id", "status"])

    # Backfill: every existing community post becomes a published join row, so the
    # community feed (now join-driven) keeps showing it. Mirror the post's own
    # status so already-pending posts stay pending in their community.
    op.execute(
        """
        INSERT INTO post_communities (post_id, community_id, status, created_at)
        SELECT id, community_id, status, created_at
        FROM posts
        WHERE community_id IS NOT NULL
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index("idx_post_communities_community", table_name="post_communities")
    op.drop_table("post_communities")
    op.drop_column("posts", "to_feed")
    op.drop_column("posts", "iso_conditions")
    op.drop_column("posts", "iso_budget")
    op.drop_column("posts", "iso_item")
    op.drop_column("posts", "title")
