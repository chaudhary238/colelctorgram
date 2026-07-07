"""DV6-07 — retire the deal flow.

Deals move off-platform (trust is carried by vouches). Drops all deal schema:
- vouches.deal_id column + its uq_vouch_per_deal constraint (deal-rating path gone;
  the give-vouch endpoint dedups social endorsements in code).
- users.deals_count column (founder decision: remove entirely, not freeze).
- messages.is_deal_init column (the "marked as sold" system message is gone).
- the deals table itself.

Chains off the current head a1b2c6d7e8f9.

Revision ID: b2c3d7e8f9a0
Revises: a1b2c6d7e8f9
Create Date: 2026-07-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d7e8f9a0"
down_revision: Union[str, None] = "a1b2c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Vouch → drop the per-deal uniqueness + the FK column (deals table is going away).
    op.drop_constraint("uq_vouch_per_deal", "vouches", type_="unique")
    op.drop_column("vouches", "deal_id")
    # Trust number retired entirely (founder decision).
    op.drop_column("users", "deals_count")
    # The deal-init system message flag.
    op.drop_column("messages", "is_deal_init")
    # The deals table (FKs to listings/items/users drop with it).
    op.drop_index("idx_deals_seller", table_name="deals")
    op.drop_index("idx_deals_buyer", table_name="deals")
    op.drop_index("idx_deals_listing", table_name="deals")
    op.drop_index("idx_deals_status", table_name="deals")
    op.drop_table("deals")


def downgrade() -> None:
    op.create_table(
        "deals",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", sa.UUID(as_uuid=True), sa.ForeignKey("listings.id"), nullable=True),
        sa.Column("item_id", sa.UUID(as_uuid=True), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("seller_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("buyer_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("agreed_price", sa.Integer(), nullable=True),
        sa.Column("deal_type", sa.String(8), nullable=False, server_default="sale"),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("initiated_by", sa.String(8), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("seller_rating", sa.SmallInteger(), nullable=True),
        sa.Column("buyer_rating", sa.SmallInteger(), nullable=True),
        sa.Column("seller_vouch_done", sa.Boolean(), server_default=sa.false()),
        sa.Column("buyer_vouch_done", sa.Boolean(), server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_deals_seller", "deals", ["seller_id"])
    op.create_index("idx_deals_buyer", "deals", ["buyer_id"])
    op.create_index("idx_deals_listing", "deals", ["listing_id"])
    op.create_index("idx_deals_status", "deals", ["status"])
    op.add_column("messages", sa.Column("is_deal_init", sa.Boolean(), server_default=sa.false()))
    op.add_column("users", sa.Column("deals_count", sa.Integer(), server_default="0"))
    op.add_column("vouches", sa.Column("deal_id", sa.UUID(as_uuid=True), sa.ForeignKey("deals.id"), nullable=True))
    op.create_unique_constraint("uq_vouch_per_deal", "vouches", ["from_user_id", "deal_id"])
