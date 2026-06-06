"""Background task helpers — plain asyncio, no Redis/ARQ required."""


async def phash_and_watermark(item_photo_id: str):
    """Compute perceptual hash and apply watermark to an item photo."""
    # TODO: Download from R2 → pHash dedup → watermark @handle+timestamp → re-upload
    pass


async def dispatch_wishlist_notifications(listing_id: str):
    """On new listing, find matching saved_searches and create notifications."""
    from app.database import AsyncSessionLocal
    from app.models.listing import Listing
    from app.models.search import SavedSearch
    from app.models.notification import Notification
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
        listing = listing_result.scalar_one_or_none()
        if not listing or not listing.sku:
            return

        searches = await db.execute(
            select(SavedSearch).where(
                SavedSearch.sku == listing.sku,
                SavedSearch.alert_enabled == True,
            )
        )
        for search in searches.scalars().all():
            if search.max_price and listing.price > search.max_price:
                continue
            notif = Notification(
                user_id=search.user_id,
                kind="wishlist_match",
                title="Wishlist match found",
                body=f"A listing for {listing.sku} is now available at ₹{listing.price // 100:,}",
                ref_type="listing",
                ref_id=str(listing.id),
            )
            db.add(notif)
        await db.commit()


async def cancel_expired_deals():
    """Auto-cancel unconfirmed deals older than 72h."""
    from datetime import datetime, timezone, timedelta
    from app.database import AsyncSessionLocal
    from app.models.deal import Deal
    from sqlalchemy import update

    cutoff = datetime.now(timezone.utc) - timedelta(hours=72)
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Deal)
            .where(Deal.status == "pending", Deal.created_at < cutoff)
            .values(status="cancelled")
        )
        await db.commit()
