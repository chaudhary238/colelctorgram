"""Drop redundant post columns: is_admin_post, iso_conditions[] -> iso_condition

QA 2026-08-05 §2 — the v7 composer is simpler than what we built, and two columns fell
out of it. Founder ask: "make sure we don't have redundant columns in db."

1. **posts.is_admin_post** — DROPPED. It was written only by the admin seed-post tool and
   read only to be echoed back in the feed payload; the web never read it (grep: zero
   call sites). Its job was taken over on 2026-08-04 by `is_official`, which is derived
   from `author.is_admin` at serialisation time and is strictly more correct — it also
   catches an admin's ordinary post, which this flag missed. Nothing is lost: the value
   is recomputable from the author.

2. **posts.iso_conditions (TEXT[]) -> posts.iso_condition (VARCHAR(16))** — the ISO
   composer is a single-choice dropdown in v7 (Any / Sealed / MIB / BIB / Loose), and
   every read path already collapsed the array to one string (`", ".join(...)` -> the
   `iso_cond` field). Storing a list to render a scalar was the redundancy. Backfilled
   from the FIRST element, which is what the single chip effectively showed anyway.

Both directions are implemented, so this is reversible (the downgrade restores the array
shape with a single element; the multi-value history of the one affected row is not
recoverable, which is the accepted cost of the collapse).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c7e1b4a9d302"
down_revision: Union[str, None] = "b2e6c9a4f018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 2. iso_conditions[] → iso_condition ──────────────────────────────────
    op.add_column("posts", sa.Column("iso_condition", sa.String(length=16), nullable=True))
    # First element only. NULLIF guards the empty-array case so it lands as NULL
    # ("Any") rather than an empty string.
    op.execute(
        """
        UPDATE posts
           SET iso_condition = NULLIF(iso_conditions[1], '')
         WHERE iso_conditions IS NOT NULL
           AND array_length(iso_conditions, 1) >= 1
        """
    )
    op.drop_column("posts", "iso_conditions")

    # ── 1. is_admin_post ─────────────────────────────────────────────────────
    op.drop_column("posts", "is_admin_post")


def downgrade() -> None:
    op.add_column(
        "posts",
        sa.Column("is_admin_post", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Recompute rather than restore — the flag always meant "written by an admin".
    op.execute(
        """
        UPDATE posts p
           SET is_admin_post = true
          FROM users u
         WHERE u.id = p.user_id
           AND u.is_admin
        """
    )

    op.add_column("posts", sa.Column("iso_conditions", postgresql.ARRAY(sa.Text()), nullable=True))
    op.execute(
        """
        UPDATE posts
           SET iso_conditions = ARRAY[iso_condition]
         WHERE iso_condition IS NOT NULL
        """
    )
    op.drop_column("posts", "iso_condition")
