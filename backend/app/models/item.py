import uuid
from datetime import datetime, date, timezone

from sqlalchemy import (
    UUID, Boolean, Date, DateTime, Integer, String, Text,
    ForeignKey, CheckConstraint, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(64), ForeignKey("catalogue.sku"), nullable=True)
    custom_title: Mapped[str | None] = mapped_column(Text, nullable=True)

    # DF-17: free-form item details captured by the AddListing form (no catalogue match).
    brand: Mapped[str | None] = mapped_column(Text, nullable=True)
    scale: Mapped[str | None] = mapped_column(Text, nullable=True)        # scale (figures/diecast/kits) or size text (designer)
    release_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)     # figures | diecast | kits | designer (custom items)

    status: Mapped[str] = mapped_column(String(16), default="owned", nullable=False)  # owned | wishlist | preorder
    verify_tier: Mapped[str] = mapped_column(String(16), default="claimed", nullable=False)  # claimed | shown | verified
    value: Mapped[int] = mapped_column(Integer, default=0)  # estimated value, in minor units of value_currency
    value_currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)  # DV4-05
    is_listed: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_count: Mapped[int] = mapped_column(Integer, default=0)

    # DV4-01: TCG-specific spec (Trading Cards promoted to Phase-1 in BRD v1.4).
    tcg_language: Mapped[str | None] = mapped_column(String(8), nullable=True)        # EN | JP | KR | TW | Other
    tcg_product_type: Mapped[str | None] = mapped_column(Text, nullable=True)         # Single Card | Booster Box | …
    tcg_graded: Mapped[bool] = mapped_column(Boolean, default=False)
    tcg_grader: Mapped[str | None] = mapped_column(String(8), nullable=True)          # PSA | BGS | CGC
    tcg_grade: Mapped[str | None] = mapped_column(String(8), nullable=True)           # e.g. "9", "10", "9.5"

    preorder_ordered_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    preorder_eta: Mapped[str | None] = mapped_column(Text, nullable=True)             # human window e.g. "Mar 2026", "Q2 2026", "Date to be announced"
    # DV4-03: pre-order financial + calendar layer.
    preorder_window_precision: Mapped[str | None] = mapped_column(String(8), nullable=True)  # date | month | quarter | year | tbd
    preorder_seller: Mapped[str | None] = mapped_column(Text, nullable=True)          # ordered-from store / seller
    preorder_total: Mapped[int | None] = mapped_column(Integer, nullable=True)        # paise
    preorder_deposit: Mapped[int | None] = mapped_column(Integer, nullable=True)      # paise (balance = total - deposit)
    wishlist_alert_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    privacy: Mapped[str] = mapped_column(String(16), default="public")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    photos: Mapped[list["ItemPhoto"]] = relationship("ItemPhoto", back_populates="item", lazy="select")

    __table_args__ = (
        CheckConstraint("sku IS NOT NULL OR custom_title IS NOT NULL", name="items_has_identity"),
        Index("idx_items_user", "user_id"),
        Index("idx_items_sku", "sku"),
        Index("idx_items_status", "status"),
        Index("idx_items_verify", "verify_tier"),
    )


class ItemPhoto(Base):
    __tablename__ = "item_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    phash: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verify_photo: Mapped[bool] = mapped_column(Boolean, default=False)
    is_challenge_shot: Mapped[bool] = mapped_column(Boolean, default=False)
    watermarked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_duplicate_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    item: Mapped["Item"] = relationship("Item", back_populates="photos")

    __table_args__ = (
        Index("idx_photos_item", "item_id"),
    )
