"""Background task helpers — plain asyncio, no Redis/ARQ required."""
import asyncio
import logging

logger = logging.getLogger(__name__)


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


async def send_preorder_reminders():
    """B-65: Notify users 7d and 1d before their preorder ETA."""
    from datetime import datetime, timezone, timedelta
    from app.database import AsyncSessionLocal
    from app.models.item import Item
    from app.models.notification import Notification
    from sqlalchemy import select, and_

    now = datetime.now(timezone.utc)
    windows = [
        (timedelta(days=7), timedelta(hours=12), "7 days", "7d"),
        (timedelta(days=1), timedelta(hours=6), "tomorrow", "1d"),
    ]

    async with AsyncSessionLocal() as db:
        for target_delta, tolerance, label, tag in windows:
            lo = now + target_delta - tolerance
            hi = now + target_delta + tolerance
            result = await db.execute(
                select(Item).where(
                    and_(
                        Item.status == "preorder",
                        Item.preorder_eta >= lo,
                        Item.preorder_eta <= hi,
                        # Only notify if we haven't sent this tag recently
                        # We encode this in the notification body to keep it simple
                    )
                )
            )
            items = result.scalars().all()
            for item in items:
                # De-duplicate: check if a reminder was already sent
                existing = await db.execute(
                    select(Notification).where(
                        Notification.user_id == item.user_id,
                        Notification.ref_type == "item",
                        Notification.ref_id == str(item.id),
                        Notification.kind == f"preorder_reminder_{tag}",
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                title_str = item.custom_title or item.sku or "Your pre-order"
                db.add(Notification(
                    user_id=item.user_id,
                    kind=f"preorder_reminder_{tag}",
                    title=f"Pre-order arriving {label}",
                    body=f"{title_str} is expected to arrive in {label}.",
                    ref_type="item",
                    ref_id=str(item.id),
                ))
        await db.commit()
    logger.info("send_preorder_reminders: done")


async def reconcile_counters():
    """B-67: Recount likes, comments, saves on posts; member counts on communities."""
    from app.database import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        # comments_count counts every comment (incl. replies) to match the live
        # increment in posts.add_comment — the UI shows a flat thread.
        await db.execute(text("""
            UPDATE posts p
            SET
              likes_count    = (SELECT COUNT(*) FROM post_likes    WHERE post_id = p.id),
              comments_count = (SELECT COUNT(*) FROM comments      WHERE post_id = p.id),
              saves_count    = (SELECT COUNT(*) FROM post_saves    WHERE post_id = p.id)
            WHERE p.id IN (
                SELECT DISTINCT post_id FROM post_likes
                UNION SELECT DISTINCT post_id FROM comments
                UNION SELECT DISTINCT post_id FROM post_saves
            )
        """))
        # community_members has no status column — every row is an active member.
        await db.execute(text("""
            UPDATE communities c
            SET member_count = (
                SELECT COUNT(*) FROM community_members
                WHERE community_id = c.id
            )
        """))
        await db.commit()
    logger.info("reconcile_counters: done")


async def send_event_reminders():
    """BL-10: Notify users who tapped the event bell, before the event starts.

    Per-event opt-in lives in event_reminders (v3 EventDetail bell). Fires once
    per (event, user) for events starting within the next 24h; deduped by
    Notification.kind so a missed tick just delivers on the next hourly run.
    Respects the user's global event_reminders notif pref (defaults on)."""
    from datetime import datetime, timezone, timedelta
    from app.database import AsyncSessionLocal
    from app.models.event import Event, EventReminder
    from app.models.user import User
    from app.models.notification import Notification
    from sqlalchemy import select, and_

    now = datetime.now(timezone.utc)
    horizon = now + timedelta(hours=24)

    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            select(Event, User)
            .join(EventReminder, EventReminder.event_id == Event.id)
            .join(User, User.id == EventReminder.user_id)
            .where(and_(
                Event.status == "active",
                Event.starts_at > now,
                Event.starts_at <= horizon,
            ))
        )
        for event, user in rows.all():
            prefs = user.notif_prefs or {}
            if prefs.get("event_reminders", True) is False:
                continue
            existing = await db.execute(
                select(Notification).where(
                    Notification.user_id == user.id,
                    Notification.kind == "event_reminder",
                    Notification.ref_id == str(event.id),
                )
            )
            if existing.scalar_one_or_none():
                continue
            db.add(Notification(
                user_id=user.id,
                kind="event_reminder",
                title="Event starting soon",
                body=f"{event.title} starts soon — see you there.",
                ref_type="event",
                ref_id=str(event.id),
            ))
        await db.commit()
    logger.info("send_event_reminders: done")


async def award_season_badges():
    """GM-11/12: at each cycle end, award permanent season badges + bonus XP to the
    top-10 finishers of the completed weekly and monthly XP boards.

    Self-healing: computes the most-recently-completed week ([prev Monday, this
    Monday)) and month ([1st prev month, 1st this month)) windows and awards each.
    ``cycle_already_awarded`` guards re-runs, so a missed tick just lands on the
    next hourly pass and a restart never double-awards. Each award also drops an
    in-app notification for the recipient."""
    from datetime import timedelta
    from app.database import AsyncSessionLocal
    from app.services import gamification as gam

    async with AsyncSessionLocal() as db:
        this_week = gam.week_start()
        prev_week = this_week - timedelta(days=7)
        n_week = await gam.award_cycle_badges(
            db, kind="weekly", since=prev_week, until=this_week,
            period=gam.iso_week_period(prev_week),
        )

        this_month = gam.month_start()
        prev_month = (this_month - timedelta(days=1)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        n_month = await gam.award_cycle_badges(
            db, kind="monthly", since=prev_month, until=this_month,
            period=gam.month_period(prev_month),
        )
        await db.commit()
    logger.info("award_season_badges: done (weekly=%d, monthly=%d)", n_week, n_month)


async def _run_periodic(coro_factory, interval_seconds: int, name: str):
    """Run a coroutine factory on a fixed interval, logging exceptions without crashing."""
    while True:
        await asyncio.sleep(interval_seconds)
        try:
            await coro_factory()
        except Exception as exc:
            logger.exception("Periodic task %s failed: %s", name, exc)


def schedule_background_workers(app_state: dict | None = None):
    """
    Register periodic background tasks on the running asyncio loop.
    Call from FastAPI lifespan after the app starts.
    """
    loop = asyncio.get_event_loop()
    loop.create_task(_run_periodic(cancel_expired_deals,   interval_seconds=3600,       name="cancel_expired_deals"))
    loop.create_task(_run_periodic(send_preorder_reminders, interval_seconds=3600 * 6,  name="send_preorder_reminders"))
    loop.create_task(_run_periodic(send_event_reminders,    interval_seconds=3600,       name="send_event_reminders"))
    loop.create_task(_run_periodic(reconcile_counters,      interval_seconds=3600 * 12, name="reconcile_counters"))
    loop.create_task(_run_periodic(award_season_badges,     interval_seconds=3600,       name="award_season_badges"))
    logger.info("Background workers scheduled.")
