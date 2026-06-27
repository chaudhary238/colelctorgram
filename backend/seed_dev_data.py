"""
Development seed script — run from the backend/ directory:
    .venv/bin/python seed_dev_data.py
Creates communities, events, items, listings, posts, threads, messages.
Idempotent: skips if data already present.
"""
import asyncio
import json
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

def _imgs(*seeds):
    # Stable placeholder photos so the feed image gallery (DF-29b) has content.
    return [f"https://picsum.photos/seed/{s}/900/700" for s in seeds]

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

        # An invite-only community (founder = brickmaster) so the private flows are
        # exercisable end-to-end: locked preview, request-to-join / withdraw, the admin
        # Manage requests queue, and the "Posts reviewed" badge (post_mode = approval).
        await db.execute(text("""
            INSERT INTO communities (id, name, description, short_desc, tag, category, tone,
                founder_id, member_count, post_count, post_mode, rules,
                is_invite_only, is_admin_created, status, created_at, updated_at)
            VALUES
              ('grail-vault-india', 'The Grail Vault',
               'An invite-only circle for serious grail hunters — high-end, rare and chase pieces only. Request to join; admins review every member.',
               'Invite-only · high-end grails & chase pieces',
               '💎', 'figures', 'teal',
               :brick, 2, 0, 'approval',
               ARRAY['Grails only — no mainline or common pieces.',
                     'Proof of ownership required for showcase posts.',
                     'Trades are off-platform; always vouch after a deal.'],
               true, false, 'approved', NOW(), NOW())
        """), {"brick": BRICK})

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
              ('designer-toys-india', :die, 'member', NOW()),
              ('grail-vault-india', :brick, 'founder', NOW()),
              ('grail-vault-india', :die,   'member',  NOW())
            ON CONFLICT DO NOTHING
        """), {"admin": ADMIN, "fig": FIG, "bbq": BBQ, "brick": BRICK, "die": DIE})

        # A pending join request (figurehead → The Grail Vault) so the default login sees the
        # "Request pending — tap to withdraw" locked state and brickmaster's Manage > Requests
        # queue has a row to approve/decline.
        await db.execute(text("""
            INSERT INTO community_join_requests (id, community_id, user_id, status, created_at)
            VALUES (:id, 'grail-vault-india', :fig, 'pending', NOW())
            ON CONFLICT DO NOTHING
        """), {"id": uuid.uuid4(), "fig": FIG})

        # Update member counts
        await db.execute(text("""
            UPDATE communities c SET member_count = (
                SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id
            )
        """))

        # ── Events ────────────────────────────────────────────────────────
        e1 = uuid.uuid4(); e2 = uuid.uuid4(); e3 = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO events (id, title, description, host_id, community_id, categories,
                mode, city, venue, starts_at, going_count, interested_count, is_admin_created, status, created_at, updated_at)
            VALUES
              (:e1, 'Gunpla Open Build — Mumbai 2026',
               'Monthly open build session for Gunpla builders of all skill levels. Bring your kits, share tips, and display your completed builds. Beginners welcome — mentors available.',
               :admin, 'gunpla-india', ARRAY['kits'], 'in_person', 'Mumbai',
               'Maker''s Asylum, Lower Parel', :starts1, 38, 9, true, 'active', NOW(), NOW()),

              (:e2, 'Collector''s Swap Meet — Bangalore',
               'Quarterly toy and collectible swap meet. Bring your duplicates, trade or sell to fellow collectors. Categories: Action Figures, Designer Toys, Diecast, Kits.',
               :admin, 'figures-india', ARRAY['figures','designer','diecast','kits'], 'in_person', 'Bangalore',
               'UB City Mall Atrium', :starts2, 86, 26, true, 'active', NOW(), NOW()),

              (:e3, 'Popmart India Drop Watch Party',
               'Live unboxing and reaction stream for the upcoming Popmart Labubu Series 3 India drop. Join online or at the venue.',
               :admin, 'designer-toys-india', ARRAY['designer'], 'online', 'Delhi',
               'Hauz Khas Social', :starts3, 64, 25, true, 'active', NOW(), NOW())
        """), {
            "e1": e1, "e2": e2, "e3": e3,
            "admin": ADMIN,
            "starts1": _now(-72 * 5),   # 15 days from now (positive offset = future)
            "starts2": _now(-72 * 12),
            "starts3": _now(-72 * 3),
        })

        # Real RSVP rows so the Going/Interested guest lists aren't empty (the counts above
        # stay a touch higher — Facebook-style "+N more"). Each row: (event, user, status).
        await db.execute(text("""
            INSERT INTO event_interests (event_id, user_id, status, created_at) VALUES
              (:e1, :fig, 'going', NOW()), (:e1, :brick, 'going', NOW()), (:e1, :die, 'interested', NOW()),
              (:e2, :bbq, 'going', NOW()), (:e2, :die, 'going', NOW()), (:e2, :fig, 'interested', NOW()),
              (:e3, :fig, 'going', NOW()), (:e3, :bbq, 'going', NOW()), (:e3, :brick, 'interested', NOW())
        """), {"e1": e1, "e2": e2, "e3": e3, "fig": FIG, "bbq": BBQ, "brick": BRICK, "die": DIE})

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
        # Each post carries: tags (drive the feed hashtag slider DF-09/10),
        # likes/saves (real engagement + social-proof strip), and one of every
        # post TYPE the feed renders — showcase, review (review_rating → Stars),
        # discussion, and poll (poll_options → PollBlock, DF-30). Stable ids so
        # comments can attach below. (ISO type is decision-gated — not seeded.)
        p_iron, p_mafex, p_fig_disc, p_fig_poll = (uuid.uuid4() for _ in range(4))
        p_pop, p_kaws, p_bb_disc, p_bb_poll = (uuid.uuid4() for _ in range(4))
        p_eiffel, p_wing = uuid.uuid4(), uuid.uuid4()
        p_camaro, p_die_disc, p_die_poll = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        p_welcome, p_restock = uuid.uuid4(), uuid.uuid4()
        p_iso, p_cross = uuid.uuid4(), uuid.uuid4()

        posts_data = [
            # ── figurehead — figures ──
            dict(id=p_iron, user=FIG, type="showcase", category="figures", community="figures-india",
                 tags=["#HotToys", "#Marvel", "#NewDrops"], images=_imgs("ch-iron1", "ch-iron2", "ch-iron3"),
                 likes=342, saves=89, age=48,
                 body="Finally got my Hot Toys Iron Man Mark LXXXV in hand! The detail on the nano tech gauntlet is insane. Took me 3 weeks of waiting but absolutely worth it. Has to be the best Marvel figure in my collection. 🔴⚡"),
            dict(id=p_mafex, user=FIG, type="review", category="figures", community="figures-india",
                 tags=["#HotToys", "#Marvel", "#Grails"], images=_imgs("ch-mafex1"), rating=4,
                 likes=218, saves=54, age=24,
                 body="Review: MAFEX No.147 Spider-Man Comic Ver.\n\nAfter a month of display I can give a proper verdict.\n\n✅ Articulation is top-tier — full web-swinging poses with no stress marks\n✅ Two head sculpts both look amazing\n✅ Accessories: 3 pairs of hands, web effects, stand\n\n❌ Hip joints are a bit loose out of the box\n❌ Red is slightly darker than expected\n\nOverall: 8.5/10. Highly recommended for any Spider-Man fan."),
            dict(id=p_fig_disc, user=FIG, type="discussion", category="figures", community="figures-india",
                 tags=["#HotToys", "#Marvel"], likes=96, saves=12, age=6,
                 body="Hot take: S.H.Figuarts is now more consistent than MAFEX for 1:12 scale Marvel figures. MAFEX has better sculpts but QC has been rough lately. Agree or disagree? Drop your takes below 👇"),
            dict(id=p_fig_poll, user=FIG, type="poll", category="figures", community="figures-india",
                 tags=["#HotToys", "#Marvel"], likes=58, saves=7, age=10,
                 poll_options={"S.H.Figuarts": 142, "MAFEX": 98, "Both equally": 64},
                 body="Settling the debate once and for all — which 1:12 Marvel line gives the best bang for buck right now? Vote 👇"),

            # ── blindbox_queen — designer ──
            dict(id=p_pop, user=BBQ, type="showcase", category="designer", community="designer-toys-india",
                 tags=["#PopMart", "#NewDrops"], images=_imgs("ch-pop1", "ch-pop2", "ch-pop3", "ch-pop4"),
                 likes=511, saves=130, age=36,
                 body="My Popmart wall is getting out of control 😅 Currently at 47 figures across 8 series. The Labubu Macarons series might be my favourite of the year. That pastel colourway is just *chef's kiss*. Anyone else building a dedicated shelf for their Popmarts?"),
            dict(id=p_kaws, user=BBQ, type="showcase", category="designer", community="designer-toys-india",
                 tags=["#PopMart", "#Grails"], images=_imgs("ch-kaws1", "ch-kaws2"),
                 likes=288, saves=61, age=12,
                 body="KAWS Companion in hand 🖤 This is the open edition vinyl but the build quality is genuinely premium. Been sitting in my cart for 6 months — finally pulled the trigger. No regrets. Pairs perfectly with my Bearbrick 1000%."),
            dict(id=p_bb_disc, user=BBQ, type="discussion", category="designer", community="designer-toys-india",
                 tags=["#PopMart"], likes=73, saves=9, age=3,
                 body="For blind box collectors — what's your pull rate strategy?\n\nA) Buy individual boxes and hope for luck\nB) Buy full boxes (12 pieces) for better odds\nC) Buy directly from resellers for the one you want\nD) Trade within community\n\nI've been doing (B) for Popmart and (D) for everything else."),
            dict(id=p_bb_poll, user=BBQ, type="poll", category="designer", community="designer-toys-india",
                 tags=["#PopMart", "#NewDrops"], likes=64, saves=5, age=7,
                 poll_options={"Individual boxes": 88, "Full case (12)": 156, "Buy from resellers": 42, "Trade in community": 95},
                 body="Blind box strategy check — how do you actually chase the figure you want? Pick your main move 👇"),

            # ── brickmaster — kits ──
            dict(id=p_eiffel, user=BRICK, type="showcase", category="kits", community="gunpla-india",
                 tags=["#Lego", "#NewDrops"], images=_imgs("ch-eiffel1", "ch-eiffel2", "ch-eiffel3"),
                 likes=423, saves=77, age=72,
                 body="LEGO Icons Eiffel Tower (10307) — COMPLETE! 10,001 pieces, approximately 14 hours of build time across 4 weekends. This is genuinely the most satisfying LEGO build I've ever done. The engineering for the tapering structure is brilliant."),
            dict(id=p_wing, user=BRICK, type="review", category="kits", community="gunpla-india",
                 tags=["#Gunpla", "#Sealed"], images=_imgs("ch-wing1", "ch-wing2"), rating=5,
                 likes=196, saves=48, age=18,
                 body="MG 1/100 Wing Gundam EW Ver. — Build Review\n\n🔧 Build difficulty: 7/10 (wing deployment mechanism is tricky)\n⏱ Build time: ~6 hours\n🎨 Panel line suggestion: 0.3mm black for white parts, gray for dark parts\n\nThe beam sabers have great translucent effect and the inner frame is beautifully detailed for an MG. Wing buster rifle is satisfying to pose.\n\n9/10 — My favourite MG kit to date."),

            # ── diecast_dreams — diecast ──
            dict(id=p_camaro, user=DIE, type="showcase", category="diecast", community="diecast-india",
                 tags=["#Diecast", "#NewDrops", "#Restock"], images=_imgs("ch-camaro1", "ch-camaro2"),
                 likes=154, saves=33, age=60,
                 body="Hot Wheels RLC Red Edition '69 COPO Camaro — this is why I get up in the morning 🔥 Mint in sealed blister, not planning to open this one. The metal base and Spectraflame finish are just different from mainline. Anyone else doing RLC this year?"),
            dict(id=p_die_disc, user=DIE, type="discussion", category="diecast", community="diecast-india",
                 tags=["#Diecast"], likes=88, saves=14, age=8,
                 body="The great 1:64 debate — Hot Wheels RLC vs Tomica Limited Vintage.\n\nHW RLC: better special editions, Spectraflame paint, stronger collector community\nTLV: more accurate castings, better metal content, incredible Japanese detail\n\nI collect both but I'm slowly leaning TLV for quality. Where do you stand?"),
            dict(id=p_die_poll, user=DIE, type="poll", category="diecast", community="diecast-india",
                 tags=["#Diecast"], likes=52, saves=6, age=14,
                 poll_options={"Hot Wheels RLC": 120, "Tomica Limited Vintage": 134, "Mini GT": 78},
                 body="Best 1:64 brand for a serious collector starting out today? Settle it 👇"),

            # ── ISO ("In Search Of") — DF-30c ──
            dict(id=p_iso, user=FIG, type="iso", category="figures", community="figures-india",
                 tags=["#Grails", "#HotToys", "#Marvel"], likes=12, saves=3, age=20,
                 iso_item="Hot Toys Iron Man Mark III (MMS256)", iso_budget=4500000,
                 iso_conditions=["Sealed", "MIB"],
                 body="Chasing the Mark III to complete my MCU Phase 1 shelf. Sealed preferred but a clean MIB works — can pay a fair premium for mint packaging. DM me if you're letting one go."),

            # ── multi-community cross-post — DF-30h ──
            dict(id=p_cross, user=BRICK, type="discussion", category="kits", community="gunpla-india",
                 communities=["gunpla-india", "figures-india"], title="Combined Mumbai meetup?",
                 tags=["#Meetups", "#Gunpla", "#NewDrops"], likes=64, saves=8, age=5,
                 body="Cross-posting to both communities for reach — anyone in Mumbai up for a combined Gunpla + figures meetup next month? Trying to gauge interest across both before I book a venue."),

            # ── admin / releases ──
            dict(id=p_welcome, user=ADMIN, type="showcase", category="figures", community=None,
                 tags=["#NewDrops"], likes=1024, saves=40, age=96,
                 body="Welcome to CollectorHub 🎉\n\nWe're live! CollectorHub is your home for showcasing your collection, connecting with fellow collectors, and trading trusted P2P.\n\nPhase 1 categories: Action Figures, Designer Toys & Blind Boxes, Gunpla & Model Kits, Diecast.\n\nSay hi in the comments and tell us what you collect 👇"),
            dict(id=p_restock, user=ADMIN, type="showcase", category="designer", community=None,
                 tags=["#Restock", "#PopMart", "#NewDrops"], images=_imgs("ch-restock1"),
                 likes=389, saves=120, age=30,
                 body="📦 RESTOCK ALERT — Popmart Labubu Macarons series is back in stock at the official store from 6 PM today. Limited quantities, one case per customer. Set your reminders, collectors. 🔔"),
        ]

        for p in posts_data:
            await db.execute(text("""
                INSERT INTO posts (id, user_id, type, title, body, images, category, community_id,
                    to_feed, review_rating, poll_options, tags,
                    iso_item, iso_budget, iso_conditions,
                    likes_count, comments_count, saves_count,
                    is_admin_post, is_pinned, status, created_at, updated_at)
                VALUES (:id, :user_id, :type, :title, :body, :images, :category, :community_id,
                    true, :rating, CAST(:poll AS JSONB), :tags,
                    :iso_item, :iso_budget, :iso_conditions,
                    :likes, 0, :saves,
                    :is_admin, false, 'published', :created_at, :created_at)
            """), {
                "id": p["id"],
                "user_id": p["user"],
                "type": p["type"],
                "title": p.get("title"),
                "body": p["body"],
                "images": p.get("images", []),
                "category": p["category"],
                "community_id": p.get("community"),
                "rating": p.get("rating"),
                "poll": json.dumps(p["poll_options"]) if p.get("poll_options") else None,
                "tags": p.get("tags", []),
                "iso_item": p.get("iso_item"),
                "iso_budget": p.get("iso_budget"),
                "iso_conditions": p.get("iso_conditions"),
                "likes": p.get("likes", 0),
                "saves": p.get("saves", 0),
                "is_admin": p["user"] == ADMIN,
                "created_at": _now(p["age"]),
            })

            # DF-30h — one post_communities row per target community (defaults to the
            # single primary). Drives the join-based community feed.
            targets = p.get("communities") or ([p["community"]] if p.get("community") else [])
            for cid in targets:
                await db.execute(text("""
                    INSERT INTO post_communities (post_id, community_id, status, created_at)
                    VALUES (:pid, :cid, 'published', :created_at)
                    ON CONFLICT DO NOTHING
                """), {"pid": p["id"], "cid": cid, "created_at": _now(p["age"])})

        # ── Comments — a few real threads so comments_count is truthful and the
        #    rich CommentThread (DF-29b) has content to render.
        comments_data = [
            (p_iron, BBQ, "That nano gauntlet detail is unreal 🔥 huge congrats!"),
            (p_iron, BRICK, "Mark LXXXV is peak Hot Toys. Display it proud."),
            (p_iron, DIE, "Worth every week of the wait. Stunning shelf piece."),
            (p_mafex, DIE, "Loose hips are a known QC thing — a drop of clear nail polish on the joint fixes it."),
            (p_mafex, BRICK, "Great honest review, the darker red actually photographs better imo."),
            (p_fig_disc, BBQ, "Hard agree. Figuarts QC has been way more consistent lately."),
            (p_fig_disc, BRICK, "Sculpts still go to MAFEX for me, but can't argue the QC point."),
            (p_pop, FIG, "47 is wild 😅 the Macarons pastel set is unbeatable."),
            (p_pop, DIE, "Shelf goals. That lighting setup really sells it."),
            (p_bb_disc, DIE, "Full case every time. The per-box math just works out cheaper."),
            (p_eiffel, FIG, "14 hours well spent — that taper engineering is genius."),
            (p_wing, DIE, "Best MG build review I've read. Saving this for my own build."),
            (p_camaro, BRICK, "RLC Spectraflame hits different. Keep it sealed!"),
            (p_die_disc, FIG, "TLV for accuracy, RLC for the chase. Both camps eating good."),
            (p_welcome, BBQ, "Hi all! Designer toys + blind boxes here 👋"),
            (p_welcome, BRICK, "LEGO & Gunpla. Excited for this 🎉"),
            (p_welcome, DIE, "Diecast diehard checking in 🚗"),
        ]
        for post_id, uid, body in comments_data:
            await db.execute(text("""
                INSERT INTO comments (id, post_id, user_id, body, likes_count, created_at, updated_at)
                VALUES (:id, :post_id, :uid, :body, 0, NOW(), NOW())
            """), {"id": uuid.uuid4(), "post_id": post_id, "uid": uid, "body": body})

        # comments_count mirrors the real comment rows above
        await db.execute(text("""
            UPDATE posts SET comments_count = (
                SELECT COUNT(*) FROM comments c WHERE c.post_id = posts.id
            )
        """))

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

        # ── Confirmed deals (trade history for the profile Trades tab) ────
        d1, d2, d3 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
        await db.execute(text("""
            INSERT INTO deals (id, listing_id, item_id, seller_id, buyer_id, agreed_price,
                deal_type, status, initiated_by, confirmed_at,
                seller_rating, buyer_rating, seller_vouch_done, buyer_vouch_done,
                created_at, updated_at)
            VALUES
              (:d1, :l1, :i2, :fig,   :bbq, 850000, 'sale',  'confirmed', 'buyer',
               NOW() - INTERVAL '9 days',  5, 5, true,  true,  NOW() - INTERVAL '12 days', NOW()),
              (:d2, :l2, :i4, :brick, :die, 280000, 'sale',  'confirmed', 'seller',
               NOW() - INTERVAL '4 days',  5, 4, true,  false, NOW() - INTERVAL '6 days',  NOW()),
              (:d3, :l3, :i5, :bbq,   :fig, 95000,  'trade', 'confirmed', 'buyer',
               NOW() - INTERVAL '2 days',  4, 5, false, true,  NOW() - INTERVAL '3 days',  NOW())
        """), {
            "d1": d1, "d2": d2, "d3": d3,
            "l1": l1, "l2": l2, "l3": l3,
            "i2": item2, "i4": item4, "i5": item5,
            "fig": FIG, "bbq": BBQ, "brick": BRICK, "die": DIE,
        })

        # ── Portfolio value = sum of owned-item value (paise) ─────────────
        await db.execute(text("""
            UPDATE users SET portfolio_value = COALESCE((
                SELECT SUM(value) FROM items
                WHERE items.user_id = users.id AND items.status = 'owned'
            ), 0)
        """))

        await db.commit()
        print("✓ Communities (5 — incl. invite-only 'The Grail Vault')")
        print("✓ Events (3)")
        print("✓ Items (8)")
        print("✓ Listings (4)")
        print("✓ Posts (11)")
        print("✓ Threads + Messages (2 threads, 9 messages)")
        print("✓ Deals (3 confirmed)")
        print("✓ Trust signals + portfolio value updated")
        print("\nDone! Login: figurehead@collectohub.app / seed_pass_1!")
        print("Private-community demo (grail-vault-india 'The Grail Vault'):")
        print("  • figurehead (seed_pass_1!)  → non-member w/ a pending request: locked preview + withdraw")
        print("  • blindbox  (seed_pass_2!)   → non-member, no request: locked preview + 'Request to join'")
        print("  • brickmaster (seed_pass_3!) → founder: Manage > Requests (approve/decline figurehead)")
        print("  • diecast_dreams (seed_pass_4!) → member: Posts/Members tabs visible")

if __name__ == "__main__":
    asyncio.run(run())
