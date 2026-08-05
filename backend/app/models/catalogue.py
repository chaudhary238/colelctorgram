import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, Boolean, DateTime, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Catalogue(Base):
    __tablename__ = "catalogue"

    sku: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    # DV6-12 — normalized title (lower/accent-folded/punctuation-stripped) for fuzzy
    # de-dup search + the resolve-or-create write guard. Keep in sync with title via
    # app.services.catalogue.norm_title on every insert/update.
    norm_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)  # figures | designer | kits | diecast | tcg
    scale: Mapped[str | None] = mapped_column(String(16), nullable=True)
    year: Mapped[str | None] = mapped_column(String(8), nullable=True)
    # DV6-13 — shared blurb about the item (seeds the add form's description on pick).
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tone: Mapped[str] = mapped_column(String(16), default="ink")
    est_retail_price: Mapped[int] = mapped_column(Integer, default=0)  # paise
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    # DV6-13 — trust-by-default moderation: community entries are live immediately and
    # `status` supports reactive takedown ('live' | 'removed'). Visibility = status !=
    # 'removed'. Verification is a SEPARATE, purely informational axis:
    #   is_verified TRUE  -> "Scorred Verified" (an admin checked this record)
    #   is_verified FALSE -> "Pending verification"
    # Defaults FALSE and is only ever set by an admin action — creating an entry, even
    # as an admin, must never self-verify it (migration d4f2a7c9e610).
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="live", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_catalogue_category", "category"),
        Index("idx_catalogue_brand", "brand"),
    )
