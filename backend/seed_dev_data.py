"""
Development seed script — run from the backend/ directory:
    .venv/bin/python seed_dev_data.py
Creates communities, events, items, listings, posts, threads, messages.
Idempotent: skips if data already present.
"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub"

# ── Seed user IDs (from migration b91c3f2d5e80) ──────────────────
ADMIN  = uuid.UUID("00000000-0000-0000-0000-000000000001")
FIG    = uuid.UUID("00000000-0000-0000-0000-000000000002")   # figurehead
BBQ    = uuid.UUID("00000000-0000-0000-0000-000000000003")   # blindbox_queen
BRICK  = uuid.UUID("00000000-0000-0000-0000-000000000004")   # brickmaster
DIE    = uuid.UUID("00000000-0000-0000-0000-000000000005")   # diecast_dreams

def _now(delta_hours=0):
    return datetime.now(timezone.utc) - timedelta(hours=delta_hours)

async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # ── Check idempotency ─────────────────────────────────────────────
        comm_count = (await db.execute(text("SELECT COUNT(*) FROM communities"))).scalar()
        if comm_count and comm_count > 0:
            print("Seed data already present — skipping.")
            return

        print("Seeding dev data...")

        # ── Communities ───────────────────────────────────────────────────
        await db.execute(text("""
            INSERT INTO communities (id, name, description, short_desc, tag, category, tone,
                founder_id, member_count, post_count, post_mode, rules,
                is_invite_only, is_admin_created, created_at, updated_at)
            VALUES
              ('figures-india', 'Action Figure Collectors India',
               'For collectors of Hot Toys, MAFEX, S.H.Figuarts, Mezco & more. The largest Indian action figure community.',
               'India''s premier action figure community',
               '🦸', 'figures', 'plum',
               :admin, 124, 0, 'open',
               ARRAY['No bootlegs or KOs — all listings must be official releases.',
                     'Always declare condition honestly (MIB, MISB, opened, etc.).',
                     'Use price-check flair for valuation posts.',
                     'No spam or cross-posting. One listing per item.'],
               false, true, NOW(), NOW()),

              ('designer-toys-india', 'Designer Toys & Blind Boxes',
               'Popmart, Kennyswork, Kaws, Bearbrick & everything in between. Drop alerts, trade requests, and unboxings welcome.',
               'Blind boxes, vinyls & art toys',
               '🎲', 'designer', 'forest',
               :admin, 98, 0, 'open',
               ARRAY['No profit-flipping of newly released blind boxes.',
                     'Declare chase figures separately in listings.',
                     'Unboxing videos welcome — keep spoiler tags for pulls.',
                     'Trade swaps must be agreed by both parties before posting.'],
               false, true, NOW(), NOW()),

              ('gunpla-india', 'Gunpla India',
               'HG, MG, PG, RG — all grades welcome. Build logs, reviews, WIP photos and display setups.',
               'Bandai Gunpla builders & collectors',
               '🤖', 'kits', 'ink',
               :admin, 87, 0, 'open',
               ARRAY['Grade your kits: HG/MG/RG/PG/PB.',
                     'Include build hours and tools used in build logs.',
                     'No painting shaming — all skill levels welcome.',
                     'LEGO sets are also welcome in this community.'],
               false, true, NOW(), NOW()),

              ('diecast-india', 'Diecast India',
               'Hot Wheels RLC, Tomica, Mini GT, AutoArt — 1:64 to 1:18. Everything diecast under one hood.',
               'Diecast cars, bikes & commercial vehicles',
               '🚗', 'diecast', 'grail-gold',
               :admin, 63, 0, 'open',
               ARRAY['State scale (1:64, 1:43, 1:18) in all posts.',
                     'Hot Wheels mainline and premium lines are both welcome.',
                     'No reproductions. Only official diecast brands.',
                     'Custom paint jobs must be declared.'],
               false, true, NOW(), NOW())
        """), {"admin": ADMIN})

        # ── Community memberships ─────────────────────────────────────────
        await db.execute(text("""
            INSERT INTO community_members (community_id, user_id, role, joined_at)
            VALUES
              ('figures-india', :admin, 'founder', NOW()),
              ('figures-india', :fig,   'mod',     NOW()),
              ('designer-toys-india', :admin, 'founder', NOW()),
              ('designer-toys-india', :bbq,  'mod',     NOW()),
              ('gunpla-india', :admin, 'founder', NOW()),
              ('gunpla-india', :brick, 'mod',     NOW()),
              ('diecast-india', :admin, 'founder', NOW()),
              ('diecast-india', :die,   'mod',     NOW()),
              ('figures-india', :brick, 'member',  NOW()),
              ('gunpla-india',  :fig,   'member',  NOW()),
              ('designer-toys-india', :die, 'member', NOW())
            ON CONFLICT DO NOTHING
        """), {"admin": ADMIN, "fig": FIG, "bbq": BBQ, "brick": BRICK, "die": DIE})

        # Update member counts
        await db.execute(text("""
            UPDATE communities c SET member_count = (
                SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id
            )
        """))

        # ── Events ────────────────────────────────────────────────────────
        e1 = uuid.uuid4(); e2 = uuid.uuid4(); e3 = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO events (id, title, description, host_id, community_id, category,
                mode, city, venue, starts_at, interested_count, is_admin_created, status, created_at, updated_at)
            VALUES
              (:e1, 'Gunpla Open Build — Mumbai 2026',
               'Monthly open build session for Gunpla builders of all skill levels. Bring your kits, share tips, and display your completed builds. Beginners welcome — mentors available.',
               :admin, 'gunpla-india', 'kits', 'in_person', 'Mumbai',
               'Maker''s Asylum, Lower Parel', :starts1, 47, true, 'active', NOW(), NOW()),

              (:e2, 'Collector''s Swap Meet — Bangalore',
               'Quarterly toy and collectible swap meet. Bring your duplicates, trade or sell to fellow collectors. Categories: Action Figures, Designer Toys, Diecast, Kits.',
               :admin, 'figures-india', 'figures', 'in_person', 'Bangalore',
               'UB City Mall Atrium', :starts2, 112, true, 'active', NOW(), NOW()),

              (:e3, 'Popmart India Drop Watch Party',
               'Live unboxing and reaction stream for the upcoming Popmart Labubu Series 3 India drop. Join online or at the venue.',
               :admin, 'designer-toys-india', 'designer', 'hybrid', 'Delhi',
               'Hauz Khas Social', :starts3, 89, true, 'active', NOW(), NOW())
        """), {
            "e1": e1, "e2": e2, "e3": e3,
            "admin": ADMIN,
            "starts1": _now(-72 * 5),   # 15 days from now (positive offset = future)
            "starts2": _now(-72 * 12),
            "starts3": _now(-72 * 3),
        })

        # Fix: events should be in the future
        await db.execute(text("""
            UPDATE events SET starts_at = NOW() + INTERVAL '15 days' WHERE id = :e1
        """), {"e1": e1})
        await db.execute(text("""
            UPDATE events SET starts_at = NOW() + INTERVAL '30 days' WHERE id = :e2
        """), {"e2": e2})
        await db.execute(text("""
            UPDATE events SET starts_at = NOW() + INTERVAL '7 days' WHERE id = :e3
        """), {"e3": e3})

        # ── Items (owned by seed users) ───────────────────────────────────
        item1 = uuid.uuid4()  # figurehead owns Iron Man Hot Toys
        item2 = uuid.uuid4()  # figurehead owns MAFEX Spider-Man
        item3 = uuid.uuid4()  # brickmaster owns LEGO Eiffel Tower
        item4 = uuid.uuid4()  # brickmaster owns RG Nu Gundam
        item5 = uuid.uuid4()  # blindbox_queen owns Labubu Series 1
        item6 = uuid.uuid4()  # blindbox_queen owns Kaws Companion
        item7 = uuid.uuid4()  # diecast_dreams owns Hot Wheels RLC
        item8 = uuid.uuid4()  # diecast_dreams owns AutoArt Urus

        await db.execute(text("""
            INSERT INTO items (id, user_id, sku, status, verify_tier, value,
                is_listed, photo_count, wishlist_alert_enabled, privacy, created_at, updated_at)
            VALUES
              (:i1, :fig,   'SKU-FIG-001', 'owned', 'verified', 3500000, false, 2, false, 'public', NOW(), NOW()),
              (:i2, :fig,   'SKU-FIG-002', 'owned', 'shown',    900000,  false, 1, false, 'public', NOW(), NOW()),
              (:i3, :brick, 'SKU-KIT-001', 'owned', 'verified', 4200000, false, 3, false, 'public', NOW(), NOW()),
              (:i4, :brick, 'SKU-KIT-004', 'owned', 'claimed',  350000,  false, 0, false, 'public', NOW(), NOW()),
              (:i5, :bbq,   'SKU-DSN-001', 'owned', 'shown',    110000,  false, 1, false, 'public', NOW(), NOW()),
              (:i6, :bbq,   'SKU-DSN-004', 'owned', 'verified', 1400000, false, 2, false, 'public', NOW(), NOW()),
              (:i7, :die,   'SKU-DCS-001', 'owned', 'shown',    320000,  false, 1, false, 'public', NOW(), NOW()),
              (:i8, :die,   'SKU-DCS-004', 'owned', 'claimed',  2300000, false, 0, false, 'public', NOW(), NOW())
        """), {
            "i1": item1, "i2": item2, "i3": item3, "i4": item4,
            "i5": item5, "i6": item6, "i7": item7, "i8": item8,
            "fig": FIG, "brick": BRICK, "bbq": BBQ, "die": DIE,
        })

        # ── Listings ──────────────────────────────────────────────────────
        l1 = uuid.uuid4()  # figurehead selling MAFEX Spider-Man
        l2 = uuid.uuid4()  # brickmaster selling RG Nu Gundam
        l3 = uuid.uuid4()  # blindbox_queen selling Labubu
        l4 = uuid.uuid4()  # diecast_dreams selling HW RLC

        await db.execute(text("""
            INSERT INTO listings (id, item_id, seller_id, sku, price, retail_price, condition,
                condition_notes, qty, trade_willing, ships_from_city, ships_nationwide,
                shipping_cost, notes, terms, status, saves_count, watching_count, created_at, updated_at)
            VALUES
              (:l1, :i2, :fig, 'SKU-FIG-002', 850000, 850000, 'excellent',
               'Opened once for display. All accessories intact. Joint tightness is 9/10.',
               1, true, 'Mumbai', true, 15000,
               'Happy to trade for MAFEX No.203 or Mezco One:12. Price firm for outright sale.',
               ARRAY['Buyer pays shipping', 'No returns after deal is confirmed', 'Video unboxing optional but encouraged'],
               'available', 8, 3, NOW() - INTERVAL '2 days', NOW()),

              (:l2, :i4, :brick, 'SKU-KIT-004', 280000, 320000, 'like_new',
               'Unbuilt, sealed box. Minor shelf wear on box corner.',
               1, false, 'Delhi', true, 12000,
               'Got a duplicate from a gift. Sealed, never opened.',
               ARRAY['Buyer pays shipping', 'Payment via UPI before dispatch'],
               'available', 3, 1, NOW() - INTERVAL '5 hours', NOW()),

              (:l3, :i5, :bbq, 'SKU-DSN-001', 95000, 89900, 'good',
               'Opened, displayed for 2 months. All pieces present. No yellowing.',
               1, false, 'Bangalore', true, 10000,
               'Selling to fund the Series 3 purchase. Box included.',
               ARRAY['Buyer pays shipping', 'Box may have shelf wear', 'No returns'],
               'available', 12, 5, NOW() - INTERVAL '1 day', NOW()),

              (:l4, :i7, :die, 'SKU-DCS-001', 290000, 300000, 'mint',
               'Mint in sealed blister. Never removed from packaging.',
               1, true, 'Pune', true, 8000,
               'Selling my duplicate RLC. Will consider trade for other RLC or Tomica LV.',
               ARRAY['Buyer pays shipping', 'Will ship in bubble wrap + rigid box'],
               'available', 5, 2, NOW() - INTERVAL '3 days', NOW())
        """), {
            "l1": l1, "l2": l2, "l3": l3, "l4": l4,
            "i2": item2, "i4": item4, "i5": item5, "i7": item7,
            "fig": FIG, "brick": BRICK, "bbq": BBQ, "die": DIE,
        })

        # Update items as listed + user listing counts
        await db.execute(text("UPDATE items SET is_listed = true WHERE id = ANY(:ids)"),
                         {"ids": [item2, item4, item5, item7]})
        await db.execute(text("""
            UPDATE users SET active_listings_count = (
                SELECT COUNT(*) FROM listings WHERE seller_id = users.id AND status = 'available'
            )
        """))

        # ── Posts ─────────────────────────────────────────────────────────
        posts_data = [
            # figurehead posts
            (uuid.uuid4(), FIG, "showcase",
             "Finally got my Hot Toys Iron Man Mark LXXXV in hand! The detail on the nano tech gauntlet is insane. Took me 3 weeks of waiting but absolutely worth it. Has to be the best Marvel figure in my collection. 🔴⚡",
             [], "figures", "figures-india", None, _now(48)),
            (uuid.uuid4(), FIG, "review",
             "Review: MAFEX No.147 Spider-Man Comic Ver.\n\nAfter a month of display I can give a proper verdict.\n\n✅ Articulation is top-tier — full web-swinging poses with no stress marks\n✅ Two head sculpts both look amazing\n✅ Accessories: 3 pairs of hands, web effects, stand\n\n❌ Hip joints are a bit loose out of the box\n❌ Red is slightly darker than expected\n\nOverall: 8.5/10. Highly recommended for any Spider-Man fan.",
             [], "figures", "figures-india", 4, _now(24)),
            (uuid.uuid4(), FIG, "discussion",
             "Hot take: S.H.Figuarts is now more consistent than MAFEX for 1:12 scale Marvel figures. MAFEX has better sculpts but QC has been rough lately. Agree or disagree? Drop your takes below 👇",
             [], "figures", "figures-india", None, _now(6)),

            # blindbox_queen posts
            (uuid.uuid4(), BBQ, "showcase",
             "My Popmart wall is getting out of control 😅 Currently at 47 figures across 8 series. The Labubu Macarons series might be my favourite of the year. That pastel colourway is just *chef's kiss*. Anyone else building a dedicated shelf for their Popmarts?",
             [], "designer", "designer-toys-india", None, _now(36)),
            (uuid.uuid4(), BBQ, "showcase",
             "KAWS Companion in hand 🖤 This is the open edition vinyl but the build quality is genuinely premium. Been sitting in my cart for 6 months — finally pulled the trigger. No regrets. Pairs perfectly with my Bearbrick 1000%.",
             [], "designer", "designer-toys-india", None, _now(12)),
            (uuid.uuid4(), BBQ, "discussion",
             "For blind box collectors — what's your pull rate strategy?\n\nA) Buy individual boxes and hope for luck\nB) Buy full boxes (12 pieces) for better odds\nC) Buy directly from resellers for the one you want\nD) Trade within community\n\nI've been doing (B) for Popmart and (D) for everything else.",
             [], "designer", "designer-toys-india", None, _now(3)),

            # brickmaster posts
            (uuid.uuid4(), BRICK, "showcase",
             "LEGO Icons Eiffel Tower (10307) — COMPLETE! 10,001 pieces, approximately 14 hours of build time across 4 weekends. This is genuinely the most satisfying LEGO build I've ever done. The engineering for the tapering structure is brilliant.",
             [], "kits", "gunpla-india", None, _now(72)),
            (uuid.uuid4(), BRICK, "review",
             "MG 1/100 Wing Gundam EW Ver. — Build Review\n\n🔧 Build difficulty: 7/10 (wing deployment mechanism is tricky)\n⏱ Build time: ~6 hours\n🎨 Panel line suggestion: 0.3mm black for white parts, gray for dark parts\n\nThe beam sabers have great translucent effect and the inner frame is beautifully detailed for an MG. Wing buster rifle is satisfying to pose.\n\n9/10 — My favourite MG kit to date.",
             [], "kits", "gunpla-india", 5, _now(18)),

            # diecast_dreams posts
            (uuid.uuid4(), DIE, "showcase",
             "Hot Wheels RLC Red Edition '69 COPO Camaro — this is why I get up in the morning 🔥 Mint in sealed blister, not planning to open this one. The metal base and Spectraflame finish are just different from mainline. Anyone else doing RLC this year?",
             [], "diecast", "diecast-india", None, _now(60)),
            (uuid.uuid4(), DIE, "discussion",
             "The great 1:64 debate — Hot Wheels RLC vs Tomica Limited Vintage.\n\nHW RLC: better special editions, Spectraflame paint, stronger collector community\nTLV: more accurate castings, better metal content, incredible Japanese detail\n\nI collect both but I'm slowly leaning TLV for quality. Where do you stand?",
             [], "diecast", "diecast-india", None, _now(8)),

            # admin posts
            (uuid.uuid4(), ADMIN, "showcase",
             "Welcome to CollectorHub 🎉\n\nWe're live! CollectorHub is your home for showcasing your collection, connecting with fellow collectors, and trading trusted P2P.\n\nPhase 1 categories: Action Figures, Designer Toys & Blind Boxes, Gunpla & Model Kits, Diecast.\n\nSay hi in the comments and tell us what you collect 👇",
             [], "figures", None, None, _now(96)),
        ]

        for post_id, user_id, ptype, body, images, category, community_id, rating, created_at in posts_data:
            await db.execute(text("""
                INSERT INTO posts (id, user_id, type, body, images, category, community_id,
                    review_rating, likes_count, comments_count, saves_count,
                    is_admin_post, is_pinned, created_at, updated_at)
                VALUES (:id, :user_id, :type, :body, :images, :category, :community_id,
                    :rating, :likes, :comments, :saves, :is_admin, false, :created_at, :created_at)
            """), {
                "id": post_id,
                "user_id": user_id,
                "type": ptype,
                "body": body,
                "images": images,
                "category": category,
                "community_id": community_id,
                "rating": rating,
                "likes": 0,
                "comments": 0,
                "saves": 0,
                "is_admin": user_id == ADMIN,
                "created_at": created_at,
            })

        # Update community post counts
        await db.execute(text("""
            UPDATE communities c SET post_count = (
                SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id
            )
        """))

        # ── Threads & Messages ────────────────────────────────────────────
        # Thread between figurehead and blindbox_queen (about Labubu listing)
        a1, b1 = sorted([FIG, BBQ], key=str)
        t1 = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO threads (id, participant_a, participant_b, listing_id,
                last_message_at, unread_a, unread_b, created_at)
            VALUES (:id, :a, :b, :listing, NOW() - INTERVAL '30 minutes', 0, 1, NOW() - INTERVAL '2 hours')
        """), {"id": t1, "a": a1, "b": b1, "listing": l3})

        msgs1 = [
            (FIG, "Hey! Saw your Labubu listing. Is the Macarons series mascot still there?", _now(2)),
            (BBQ, "Yes! All 12 pieces from the series including the secret rare. Box is a bit dented on one corner though.", _now(1.8)),
            (FIG, "That's fine, I only care about the figures. Would you take ₹900 for it?", _now(1.5)),
            (BBQ, "The best I can do is ₹920. It's already listed below market.", _now(1)),
            (FIG, "Deal! Can you ship to Mumbai?", _now(0.5)),
        ]
        for sender, body, ts in msgs1:
            await db.execute(text("""
                INSERT INTO messages (id, thread_id, sender_id, body, is_deal_init, created_at)
                VALUES (:id, :thread, :sender, :body, false, :ts)
            """), {"id": uuid.uuid4(), "thread": t1, "sender": sender, "body": body, "ts": ts})

        # Thread between brickmaster and diecast_dreams (general chat)
        a2, b2 = sorted([BRICK, DIE], key=str)
        t2 = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO threads (id, participant_a, participant_b, listing_id,
                last_message_at, unread_a, unread_b, created_at)
            VALUES (:id, :a, :b, NULL, NOW() - INTERVAL '4 hours', 2, 0, NOW() - INTERVAL '1 day')
        """), {"id": t2, "a": a2, "b": b2, "listing": None})

        msgs2 = [
            (BRICK, "Dude your RLC collection is incredible. How many do you have?", _now(25)),
            (DIE, "Around 80 now! All sealed except a few I opened for display. You into diecast at all?", _now(24)),
            (BRICK, "Not really but the Hot Wheels Senna would tempt me. Saw it for ₹2400 at a show.", _now(10)),
            (DIE, "That's a steal. Usually goes for ₹3000+. Grab it if you see it again!", _now(9)),
            (DIE, "By the way — are you selling the Nu Gundam? Saw your listing.", _now(4)),
        ]
        for sender, body, ts in msgs2:
            await db.execute(text("""
                INSERT INTO messages (id, thread_id, sender_id, body, is_deal_init, created_at)
                VALUES (:id, :thread, :sender, :body, false, :ts)
            """), {"id": uuid.uuid4(), "thread": t2, "sender": sender, "body": body, "ts": ts})

        # Update thread last_message_at
        await db.execute(text("""
            UPDATE threads SET last_message_at = (
                SELECT MAX(created_at) FROM messages WHERE messages.thread_id = threads.id
            ) WHERE id IN (:t1, :t2)
        """), {"t1": t1, "t2": t2})

        # ── Update trust signals ──────────────────────────────────────────
        await db.execute(text("""
            UPDATE users SET
                deals_count    = CASE handle
                    WHEN 'figurehead'     THEN 28
                    WHEN 'blindbox_queen' THEN 41
                    WHEN 'brickmaster'    THEN 15
                    WHEN 'diecast_dreams' THEN 22
                    ELSE deals_count END,
                rating         = CASE handle
                    WHEN 'figurehead'     THEN 4.9
                    WHEN 'blindbox_queen' THEN 4.7
                    WHEN 'brickmaster'    THEN 4.8
                    WHEN 'diecast_dreams' THEN 5.0
                    ELSE rating END,
                rating_count   = CASE handle
                    WHEN 'figurehead'     THEN 26
                    WHEN 'blindbox_queen' THEN 39
                    WHEN 'brickmaster'    THEN 13
                    WHEN 'diecast_dreams' THEN 20
                    ELSE rating_count END,
                tier           = CASE handle
                    WHEN 'figurehead'     THEN 'top_seller'
                    WHEN 'blindbox_queen' THEN 'top_seller'
                    WHEN 'brickmaster'    THEN 'trusted'
                    WHEN 'diecast_dreams' THEN 'verified'
                    ELSE tier END,
                verified_items_count = CASE handle
                    WHEN 'figurehead'     THEN 12
                    WHEN 'blindbox_queen' THEN 8
                    WHEN 'brickmaster'    THEN 5
                    WHEN 'diecast_dreams' THEN 3
                    ELSE verified_items_count END,
                followers_count = CASE handle
                    WHEN 'figurehead'     THEN 843
                    WHEN 'blindbox_queen' THEN 1240
                    WHEN 'brickmaster'    THEN 312
                    WHEN 'diecast_dreams' THEN 194
                    ELSE followers_count END
            WHERE is_seed_account = true
        """))

        await db.commit()
        print("✓ Communities (4)")
        print("✓ Events (3)")
        print("✓ Items (8)")
        print("✓ Listings (4)")
        print("✓ Posts (11)")
        print("✓ Threads + Messages (2 threads, 9 messages)")
        print("✓ Trust signals updated")
        print("\nDone! Login: figurehead@collectohub.app / seed_pass_1!")

if __name__ == "__main__":
    asyncio.run(run())
