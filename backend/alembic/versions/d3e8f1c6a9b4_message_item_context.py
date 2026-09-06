"""Message item-context — "Ask @owner about it" DMs (cost-lean route).

One nullable ref on MESSAGES instead of new threads-per-context: the pair keeps
its single thread (denormalized unread + one-query inbox stay intact — that is
what keeps chat cheap at 10k users), and each ask carries its own inline item
chip in the stream, so asking about item B under item A's old thread can't
mislabel the conversation.

Revision ID: d3e8f1c6a9b4
Revises: c8f5a2e7d3b1
Create Date: 2026-09-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d3e8f1c6a9b4"
down_revision: Union[str, None] = "c8f5a2e7d3b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("ref_sku", sa.String(64), sa.ForeignKey("catalogue.sku"), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "ref_sku")
