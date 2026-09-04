"""DV8 foundations — design_v8 (Aug 16-24 change review) schema groundwork.

- items.condition: the add forms have collected condition since v6 and silently
  dropped it (only Listing persisted one). Completeness = condition + price.
- catalogue_ratings: v8 reintroduces ratings on catalogue entries ONLY (the
  2026-07-18 removal stands for user/seller ratings). One rating per user+sku.
- events: Free/Paid + multi-currency price, optional ticket link and contact.
- communities: banner/photo uploads on create + manage.
- community_members.status: v8 approval gate — new members are 'pending' and
  cannot post/comment/act until approved. Existing rows backfill 'approved'.
- community_member_removals: removal now requires a stored reason.

Revision ID: a9d3f6c1e8b2
Revises: d4f2a7c9e610
Create Date: 2026-09-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a9d3f6c1e8b2"
down_revision: Union[str, None] = "d4f2a7c9e610"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("condition", sa.String(24), nullable=True))

    # DV8 composer item-tagging — posts can tag a CATALOGUE entry directly
    # (ref_item_id points at someone's copy; reviews must tag the shared entry).
    op.add_column("posts", sa.Column("ref_sku", sa.String(64), sa.ForeignKey("catalogue.sku"), nullable=True))

    op.create_table(
        "catalogue_ratings",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("sku", sa.String(64), sa.ForeignKey("catalogue.sku", ondelete="CASCADE"), primary_key=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="catalogue_rating_range"),
    )
    op.create_index("idx_catalogue_ratings_sku", "catalogue_ratings", ["sku"])

    op.add_column("events", sa.Column("is_free", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("events", sa.Column("price", sa.Integer(), nullable=False, server_default="0"))  # minor units
    op.add_column("events", sa.Column("currency", sa.String(3), nullable=False, server_default="INR"))
    op.add_column("events", sa.Column("ticket_url", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("contact", sa.Text(), nullable=True))

    op.add_column("communities", sa.Column("banner_url", sa.Text(), nullable=True))
    op.add_column("communities", sa.Column("avatar_url", sa.Text(), nullable=True))

    op.add_column(
        "community_members",
        sa.Column("status", sa.String(16), nullable=False, server_default="approved"),
    )

    # DV8-18 — comments on catalogue entries (item page's normal thread; the Post
    # Comment model is post_id-NOT-NULL so entries get their own table).
    op.create_table(
        "catalogue_comments",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("sku", sa.String(64), sa.ForeignKey("catalogue.sku", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", sa.UUID(as_uuid=True), sa.ForeignKey("catalogue_comments.id", ondelete="CASCADE"), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_catalogue_comments_sku", "catalogue_comments", ["sku", "created_at"])

    op.create_table(
        "community_member_removals",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("community_id", sa.String(32), sa.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("removed_by", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_member_removals_community", "community_member_removals", ["community_id"])


def downgrade() -> None:
    op.drop_index("idx_member_removals_community", table_name="community_member_removals")
    op.drop_table("community_member_removals")
    op.drop_index("idx_catalogue_comments_sku", table_name="catalogue_comments")
    op.drop_table("catalogue_comments")
    op.drop_column("community_members", "status")
    op.drop_column("communities", "avatar_url")
    op.drop_column("communities", "banner_url")
    op.drop_column("events", "contact")
    op.drop_column("events", "ticket_url")
    op.drop_column("events", "currency")
    op.drop_column("events", "price")
    op.drop_column("events", "is_free")
    op.drop_index("idx_catalogue_ratings_sku", table_name="catalogue_ratings")
    op.drop_table("catalogue_ratings")
    op.drop_column("posts", "ref_sku")
    op.drop_column("items", "condition")
