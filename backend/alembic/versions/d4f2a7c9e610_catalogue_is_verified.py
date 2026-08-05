"""catalogue: is_official + is_approved -> a single is_verified

QA 2026-08-05 (founder): "somehow it has tagged them as official — it should be Scorred
Verified... if verified by admin: Scorred Verified, if not verified: pending for
verification."

There is ONE question a catalogue entry answers — *has the Scorred team verified this
record?* — and it was stored as two overlapping booleans:

  * `is_official`  — admin-blessed badge, rendered as the "Official" chip / seal.
  * `is_approved`  — drove the "Pending review" badge, the approved-only /search filter
                     and the admin approve queue. DV6-13 (trust-by-default) stopped it
                     gating visibility, so every live row already carried True and the
                     "pending" state it was supposed to express could never appear.

Collapsed into **`is_verified`**, defaulting to FALSE. Two states, matching the founder's
wording exactly: verified by an admin -> "Scorred Verified"; otherwise -> "Pending
verification".

Backfill is `is_official AND is_approved AND submitted_by IS NULL`. The last clause is the
data CORRECTION, not just a shape change: because `resolve_or_create` set
`is_official=user.is_admin`, every catalogue entry an admin created by adding something to
their own collection was already flagged official. Those are user submissions that were
never reviewed by anyone, so carrying them over as "Scorred Verified" would launder the
bug into the new model. `submitted_by IS NULL` is exactly the team-loaded set — the seed
fixtures and the bulk importers (`ingestion/`), which set it to NULL — so anything a USER
created starts at Pending verification and needs a real admin action to be promoted.

DEFAULT FALSE is the important half: `resolve_or_create` used to set
`is_official=user.is_admin`, so an admin merely adding something to their own collection
silently minted a verified catalogue entry. Verification is now only ever a deliberate
admin action (`PATCH /admin/catalogue/{sku}/verify`).

NOTE: `posts.is_official` is a different thing entirely (an admin-authored post rendered
as "Scorred · Official") and is deliberately untouched.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4f2a7c9e610"
down_revision: Union[str, None] = "c7e1b4a9d302"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "catalogue",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        """
        UPDATE catalogue
           SET is_verified = (is_official AND is_approved AND submitted_by IS NULL)
        """
    )
    op.drop_column("catalogue", "is_official")
    op.drop_column("catalogue", "is_approved")


def downgrade() -> None:
    op.add_column(
        "catalogue",
        sa.Column("is_official", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "catalogue",
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    # Best-effort inverse. NOTE it is not exact: the admin-self-verified entries this
    # upgrade deliberately demoted come back as is_official = false, because that is the
    # state they SHOULD have been in. The bug is not restored.
    op.execute("UPDATE catalogue SET is_official = is_verified, is_approved = true")
    op.drop_column("catalogue", "is_verified")
