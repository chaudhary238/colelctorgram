"""Idempotent social-graph + admin-profile top-up seed.

Why this exists (2026-06-29):
- The base seed (seed_dev_data.py) set denormalized followers_count / following_count
  to vanity numbers (843, 1240, …) but NEVER inserted `follows` rows, so tapping a
  follower/following count opened an EMPTY list. It also attached all vouches / deals /
  pre-orders to figurehead & friends, leaving the `collectohub_admin` profile blank.

This script (safe to run any number of times — deterministic UUIDs + ON CONFLICT):
  1. Builds a real follow graph among the seed users (incl. admin + the local `chaudhary`
     test account if present).
  2. RECONCILES followers_count / following_count / deals_count to the actual rows
     (replacing the vanity numbers so counts == what the list endpoints return).
  3. Gives collectohub_admin its own owned items, pre-orders (PO Calendar), vouches
     (in + out), incoming vouch requests, and confirmed trades.

Run standalone:  python seed_social_graph.py
Also invoked at the end of seed_dev_data.run() for fresh DBs.
"""
import asyncio
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub"

# Stable seed-account ids (see seed_dev_data.py)
ADMIN = "00000000-0000-0000-0000-000000000001"
FIG   = "00000000-0000-0000-0000-000000000002"
BBQ   = "00000000-0000-0000-0000-000000000003"
BRICK = "00000000-0000-0000-0000-000000000004"
DIE   = "00000000-0000-0000-0000-000000000005"

# Deterministic UUIDs so re-runs hit ON CONFLICT (id) instead of duplicating.
_NS = uuid.UUID("11111111-2222-3333-4444-555555555555")
def _id(tag: str) -> uuid.UUID:
    return uuid.uuid5(_NS, tag)


async def apply(db: AsyncSession) -> None:
    # Resolve the local non-seed test account (e.g. "chaudhary") if it exists, so its
    # following list works too. Anyone who isn't a seed account and follows nobody.
    chau = (await db.execute(text(
        "SELECT id FROM users WHERE is_seed_account = false ORDER BY created_at LIMIT 1"
    ))).scalar()

    # ── 1. Follow graph (follower -> following), following_type='user' ──────────
    edges = [
        (ADMIN, FIG), (ADMIN, BBQ), (ADMIN, BRICK), (ADMIN, DIE),
        (FIG, ADMIN), (FIG, BBQ), (FIG, BRICK), (FIG, DIE),
        (BBQ, ADMIN), (BBQ, FIG), (BBQ, DIE),
        (BRICK, ADMIN), (BRICK, FIG),
        (DIE, ADMIN), (DIE, FIG), (DIE, BBQ),
    ]
    if chau:
        edges += [(str(chau), ADMIN), (str(chau), FIG), (str(chau), BBQ)]

    for follower, following in edges:
        await db.execute(text("""
            INSERT INTO follows (follower_id, following_type, following_id, created_at)
            VALUES (:f, 'user', :t, NOW())
            ON CONFLICT DO NOTHING
        """), {"f": follower, "t": following})

    # ── 2. Reconcile denormalized counters to the real rows ────────────────────
    await db.execute(text("""
        UPDATE users u SET
          followers_count = COALESCE((
            SELECT COUNT(*) FROM follows f
            WHERE f.following_type = 'user' AND f.following_id = u.id), 0),
          following_count = COALESCE((
            SELECT COUNT(*) FROM follows f
            WHERE f.following_type = 'user' AND f.follower_id = u.id), 0),
          deals_count = COALESCE((
            SELECT COUNT(*) FROM deals d
            WHERE d.status = 'confirmed' AND (d.seller_id = u.id OR d.buyer_id = u.id)), 0)
    """))

    # ── 3. collectohub_admin's own collection (owned, across categories) ───────
    owned = [
        ("admin-own-fig", "SKU-FIG-001", "verified", 950000),
        ("admin-own-dsn", "SKU-DSN-001", "verified", 450000),
        ("admin-own-kit", "SKU-KIT-001", "claimed",  320000),
        ("admin-own-dcs", "SKU-DCS-001", "verified", 290000),
        ("admin-own-tcg", "SKU-TCG-001", "claimed",  1500000),
    ]
    for tag, sku, tier, value in owned:
        await db.execute(text("""
            INSERT INTO items (id, user_id, sku, status, verify_tier, value, is_listed,
                photo_count, wishlist_alert_enabled, privacy, created_at, updated_at)
            VALUES (:id, :u, :sku, 'owned', :tier, :v, false, 1, false, 'public', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
        """), {"id": _id(tag), "u": ADMIN, "sku": sku, "tier": tier, "v": value})

    # ── admin pre-orders (PO Calendar: month / quarter / TBD windows) ──────────
    preorders = [
        ("admin-po-fig", "SKU-FIG-004", "March 2026", "month",   "Hot Toys India", 7200000, 1800000, 20),
        ("admin-po-tcg", "SKU-TCG-002", "Q3 2026",    "quarter", "TCG Republic",   2500000,  500000, 8),
        ("admin-po-dsn", "SKU-DSN-003", "Date to be announced", "tbd", "Pop Mart India", 600000, 120000, 3),
    ]
    for tag, sku, eta, prec, seller, total, deposit, ago in preorders:
        await db.execute(text("""
            INSERT INTO items (id, user_id, sku, status, verify_tier, value, is_listed,
                photo_count, wishlist_alert_enabled, privacy,
                preorder_ordered_at, preorder_eta, preorder_window_precision, preorder_seller,
                preorder_total, preorder_deposit, created_at, updated_at)
            VALUES (:id, :u, :sku, 'preorder', 'claimed', :v, false, 0, false, 'public',
                NOW() - make_interval(days => :ago), :eta, :prec, :seller, :total, :deposit, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
        """), {"id": _id(tag), "u": ADMIN, "sku": sku, "v": total, "eta": eta,
               "prec": prec, "seller": seller, "total": total, "deposit": deposit, "ago": ago})

    # ── vouches for admin: 3 received (in) + 2 given (out) ─────────────────────
    vouches = [
        ("admin-v-in-1",  BBQ,   ADMIN, "community", "Solid admin, keeps the communities clean."),
        ("admin-v-in-2",  FIG,   ADMIN, "person",    "Met at the Mumbai meet — genuine collector."),
        ("admin-v-in-3",  BRICK, ADMIN, "friend",    "Known for years, fully trustworthy."),
        ("admin-v-out-1", ADMIN, FIG,   "app",       "Great trade on CollectorHub."),
        ("admin-v-out-2", ADMIN, DIE,   "offapp",    "Smooth off-app diecast swap."),
    ]
    for tag, frm, to, rel, body in vouches:
        await db.execute(text("""
            INSERT INTO vouches (id, from_user_id, to_user_id, deal_id, kind, relation, body, created_at)
            VALUES (:id, :frm, :to, NULL, 'social_endorsement', :rel, :body, NOW())
            ON CONFLICT (id) DO NOTHING
        """), {"id": _id(tag), "frm": frm, "to": to, "rel": rel, "body": body})

    # ── incoming vouch requests (people asking admin to vouch for them) ────────
    for tag, requester in [("admin-vr-1", DIE), ("admin-vr-2", BBQ)]:
        await db.execute(text("""
            INSERT INTO vouch_requests (id, requester_id, target_id, status, created_at)
            VALUES (:id, :req, :admin, 'pending', NOW())
            ON CONFLICT DO NOTHING
        """), {"id": _id(tag), "req": requester, "admin": ADMIN})

    # ── confirmed trades for admin (Trades tab) — use admin's owned items ──────
    deals = [
        ("admin-d-1", "admin-own-fig", ADMIN, FIG, 920000, "sale",  "seller", 5, 5, 5),
        ("admin-d-2", "admin-own-dcs", DIE,   ADMIN, 280000, "sale",  "buyer",  5, 4, 12),
        ("admin-d-3", "admin-own-kit", ADMIN, BBQ,  300000, "trade", "seller", 4, 5, 2),
    ]
    for tag, item_tag, seller, buyer, price, dtype, initby, srate, brate, ago in deals:
        await db.execute(text("""
            INSERT INTO deals (id, listing_id, item_id, seller_id, buyer_id, agreed_price,
                deal_type, status, initiated_by, confirmed_at,
                seller_rating, buyer_rating, seller_vouch_done, buyer_vouch_done, created_at, updated_at)
            VALUES (:id, NULL, :item, :seller, :buyer, :price, :dtype, 'confirmed', :initby,
                NOW() - make_interval(days => :ago), :srate, :brate, true, true,
                NOW() - make_interval(days => :ago), NOW())
            ON CONFLICT (id) DO NOTHING
        """), {"id": _id(tag), "item": _id(item_tag), "seller": seller, "buyer": buyer,
               "price": price, "dtype": dtype, "initby": initby, "srate": srate,
               "brate": brate, "ago": ago})

    # Re-reconcile deals_count now that admin's deals exist.
    await db.execute(text("""
        UPDATE users u SET deals_count = COALESCE((
            SELECT COUNT(*) FROM deals d
            WHERE d.status = 'confirmed' AND (d.seller_id = u.id OR d.buyer_id = u.id)), 0)
    """))


async def run() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        print("Applying social graph + admin-profile top-up…")
        await apply(db)
        await db.commit()
        print("✓ Follow graph built + counters reconciled to real rows")
        print("✓ collectohub_admin: owned items, pre-orders, vouches (in/out), requests, trades")
        print("Done.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
