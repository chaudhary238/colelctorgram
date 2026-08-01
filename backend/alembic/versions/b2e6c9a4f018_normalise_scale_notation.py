"""Normalise scale notation to the slash form (Change Spec §5) — 2026-08-01.

Scale is written `1/7`, `1/300` everywhere in the app — never `1:300`. The two forms are
the same scale but different strings, so a colon-form row silently drops out of its own
filter group and shows up as a second, near-duplicate option in the Database's scale list.
One catalogue entry (the LEGO Eiffel Tower) was stored as `1:300`; this rewrites every
`N:M` scale in `catalogue` and `items` to `N/M` so the groups collapse.

Going forward `app.services.catalogue.norm_scale` guards every write path (add flow, item
PATCH, admin catalogue edit, `POST /catalogue`), so this backfill is one-time.

Idempotent: re-running is a no-op once no colon-form rows remain.

Chains off a9d4e7f1c3b6 (admin takedown columns).

Revision ID: b2e6c9a4f018
Revises: a9d4e7f1c3b6
Create Date: 2026-08-01
"""
from typing import Sequence, Union

from alembic import op

revision: str = "b2e6c9a4f018"
down_revision: Union[str, None] = "a9d4e7f1c3b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Only the bare `N:M` shape is rewritten, with any spacing around the colon collapsed.
# Free-text scales ("Non-scale") have no colon and are left untouched.
_REWRITE = r"""
    UPDATE {table}
       SET scale = regexp_replace(btrim(scale), '^(\d+)\s*:\s*(\d+)$', '\1/\2')
     WHERE scale ~ '^\s*\d+\s*:\s*\d+\s*$'
"""

# `norm_scale` also maps blank and the "—" placeholder to NULL. Existing rows carry a few
# empty strings, which render as a blank scale line on the entry page and would otherwise
# leave the stored data disagreeing with the function that now guards every write.
_BLANK = r"""
    UPDATE {table}
       SET scale = NULL
     WHERE btrim(scale) IN ('', '—')
"""


def upgrade() -> None:
    for table in ("catalogue", "items"):
        op.execute(_REWRITE.format(table=table))
        op.execute(_BLANK.format(table=table))


def downgrade() -> None:
    # No downgrade: the slash form is now canonical, and we cannot tell which rows were
    # originally typed with a colon. Reverting would re-introduce the split filter groups.
    pass
