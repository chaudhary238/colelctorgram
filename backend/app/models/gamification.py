import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, DateTime, Integer, String, Text, ForeignKey, Index, text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class XpEvent(Base):
    """Append-only Collector XP ledger (Rewards & Badge System v3).

    Each grant is one row. ``users.xp`` (lifetime) is a denormalized cache kept
    in sync on insert. Windowed totals (weekly) are derived on demand from this
    table — never stored. Idempotency / dedup is enforced by the partial-unique
    index on (user_id, action, ref_id): inserting with ON CONFLICT DO NOTHING
    makes every award call safe to fire repeatedly (e.g. re-liking a post, or
    claiming the same day's check-in twice). Per-day caps (v3 §7) are enforced in
    ``services.gamification.award_xp`` by counting the day's rows for the action.
    """

    __tablename__ = "xp_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)  # like | comment | showcase | review | rsvp | vouch | profile | checkin | refer | badge
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    ref_type: Mapped[str | None] = mapped_column(String(32), nullable=True)  # post | comment | event | user | date | profile | badge
    ref_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    __table_args__ = (
        # dedup: one grant per (user, action, target). NULL ref_id rows are not
        # deduped (none currently emitted — every rule carries a ref_id).
        Index("uq_xp_events_dedup", "user_id", "action", "ref_id", unique=True, postgresql_where=text("ref_id IS NOT NULL")),
        Index("idx_xp_events_user_created", "user_id", "created_at"),
        # (action, created_at) backs the per-day cap count query (v3 §7).
        Index("idx_xp_events_action_created", "action", "created_at"),
    )


class SeasonBadge(Base):
    """Permanent badge awarded when a leaderboard cycle ends (GM-11..GM-14).

    Phase 1: seeded only. The cycle-end award worker is Phase 2; this table +
    ``gamification.award_season_badge`` are the durable model it will write to.
    """

    __tablename__ = "season_badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tier: Mapped[str] = mapped_column(String(12), nullable=False)   # gold | silver | bronze | finalist
    kind: Mapped[str] = mapped_column(String(16), nullable=False)   # weekly | monthly | posts | social | collection | market
    period: Mapped[str] = mapped_column(String(24), nullable=False)  # e.g. "May 2026", "Wk 22 · 2026"
    title: Mapped[str] = mapped_column(Text, nullable=False)
    bonus_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    __table_args__ = (
        Index("idx_season_badges_user", "user_id"),
    )
