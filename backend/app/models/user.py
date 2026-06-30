import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, Boolean, DateTime, Integer, Numeric, String, Text,
    UniqueConstraint, Index, ARRAY,
)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY as PG_ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    handle: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)  # kept; field hidden in UI (DF-05 — location collected separately later)
    gender: Mapped[str | None] = mapped_column(String(8), nullable=True)  # 'f' | 'm' (DF-01)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)  # from onboarding age slider (DF-05)
    # pg ARRAY (not generic sa.ARRAY) so .overlap() works in /users/me/suggested
    interests: Mapped[list[str]] = mapped_column(PG_ARRAY(Text), default=list)
    # Per-category sub-interest chips from onboarding step 2 (DV4-06, BRD §6.2/§9.2):
    #   {"figures": ["Hot Toys", "Marvel Legends"], "tcg": ["Pokémon"], ...}
    sub_interests: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Feed customisation (DF-08): {"categories": [...], "hide_listings": bool}
    feed_prefs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Per-type notification toggles (DF-23): {followers, messages, listing_activity,
    #   trade_requests, event_reminders, community_activity, price_drops, new_listings}
    notif_prefs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Extra privacy/safety settings (DF-23): {messaging: everyone|followers|none,
    #   wishlist: public|followers|private, show_online: bool}
    privacy_prefs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    tier: Mapped[str] = mapped_column(String(32), default="verified")

    # Gamification (BRD v1.4 §8.12). Lifetime Collector XP — monotonic, never
    # deducted. Denormalized cache of SUM(xp_events.points); incremented in the
    # same txn as each award. Rank is derived from this (services/gamification).
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False, server_default="0")

    # Trust signals
    deals_count: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    response_time_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active_listings_count: Mapped[int] = mapped_column(Integer, default=0)
    portfolio_value: Mapped[int] = mapped_column(Integer, default=0)  # paise
    verified_items_count: Mapped[int] = mapped_column(Integer, default=0)
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)

    # Privacy
    privacy_portfolio: Mapped[str] = mapped_column(String(16), default="public")
    privacy_value: Mapped[str] = mapped_column(String(16), default="followers")

    # Admin flags
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_seed_account: Mapped[bool] = mapped_column(Boolean, default=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False)

    # Auth
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Email OTP confirmation (DF-06 / B-72) — sha256 of the 6-digit code
    email_otp_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_users_handle", "handle"),
        Index("idx_users_email", "email"),
    )


class Follow(Base):
    __tablename__ = "follows"

    follower_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, primary_key=True)
    following_type: Mapped[str] = mapped_column(String(16), nullable=False, primary_key=True)  # user | community
    following_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_follows_follower", "follower_id"),
        Index("idx_follows_target", "following_type", "following_id"),
    )
