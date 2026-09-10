"""Repair drifted founder membership rows (founder QA 2026-09-10).

A community's founder must hold a community_members row with role='founder' —
the roster, the directory card's Manage CTA and the multi-admin gates all key
off it. Legacy rows drifted (e.g. a founder stored as role='member'), which
hid the Manage option on /community. Data-only; the card also grew an
is_founder display fallback so drift can never hide the door again.

Revision ID: b2d8f4a6c1e7
Revises: a7e3c9f1d5b8
Create Date: 2026-09-10
"""
from typing import Sequence, Union

from alembic import op

revision: str = "b2d8f4a6c1e7"
down_revision: Union[str, None] = "a7e3c9f1d5b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Founders whose membership row carries the wrong role.
    op.execute(
        """
        UPDATE community_members m
        SET role = 'founder'
        FROM communities c
        WHERE c.id = m.community_id
          AND c.founder_id = m.user_id
          AND m.role <> 'founder'
        """
    )
    # Founders with no membership row at all.
    op.execute(
        """
        INSERT INTO community_members (community_id, user_id, role, joined_at)
        SELECT c.id, c.founder_id, 'founder', c.created_at
        FROM communities c
        LEFT JOIN community_members m
          ON m.community_id = c.id AND m.user_id = c.founder_id
        WHERE m.user_id IS NULL
        """
    )


def downgrade() -> None:
    pass  # data repair — nothing sensible to reverse
