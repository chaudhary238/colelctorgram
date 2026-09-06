"""DV8 scenario seed — top-up for verifying the DV8 + design-parity batches.

Run AFTER seed_dev_data.py, from backend/:
    .venv/bin/python seed_dv8_scenarios.py

Adds 2-3 rows per DV8 scenario, anchored on figurehead (the documented dev
login: figurehead@collectohub.app / seed_pass_1!) as "you". Idempotent via the
DV8-LAB-001 catalogue sentinel. Uses the ORM so column defaults stay honest.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta, date

from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import (
    User, Catalogue, CatalogueRating, CatalogueComment, Item, ItemPhoto,
    Listing, Post, Comment, Community, CommunityMember, CommunityJoinRequest,
    Event, Thread, Message, Notification, Vouch,
)
from app.models.listing import ListingPriceVote, ListingQuestion, ListingLike
from app.models.post import PostCommunity

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub")

ADMIN = uuid.UUID("00000000-0000-0000-0000-000000000001")
FIG   = uuid.UUID("00000000-0000-0000-0000-000000000002")   # figurehead — "you"
BBQ   = uuid.UUID("00000000-0000-0000-0000-000000000003")   # blindbox_queen
BRICK = uuid.UUID("00000000-0000-0000-0000-000000000004")   # brickmaster
DIE   = uuid.UUID("00000000-0000-0000-0000-000000000005")   # diecast_dreams

MMB = uuid.UUID("00000000-0000-0000-0000-0000000000d1")     # mumbai_mint (new)
TOK = uuid.UUID("00000000-0000-0000-0000-0000000000d2")     # tokyo_trader (new)


def now(hours: float = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def img(seed: str, w=900, h=700) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        if (await db.execute(select(Catalogue.sku).where(Catalogue.sku == "DV8-LAB-001"))).scalar_one_or_none():
            print("DV8 scenario seed already present — skipping.")
            return
        pw = (await db.execute(select(User.password_hash).where(User.id == FIG))).scalar_one()

        # ── Users: city+country everywhere, gender variety, 2 new collectors ──
        await db.execute(text("""
            UPDATE users SET
              city = CASE handle WHEN 'figurehead' THEN 'Mumbai' WHEN 'blindbox_queen' THEN 'Bengaluru'
                                 WHEN 'brickmaster' THEN 'Delhi' WHEN 'diecast_dreams' THEN 'Chennai' ELSE city END,
              country = 'India',
              gender = CASE handle WHEN 'figurehead' THEN 'm' WHEN 'blindbox_queen' THEN 'f' ELSE 'x' END,
              onboarded_at = now()
            WHERE handle IN ('figurehead','blindbox_queen','brickmaster','diecast_dreams','collectohub_admin')
        """))
        db.add_all([
            User(id=MMB, handle="mumbai_mint", name="Meera Kulkarni", email="mumbai_mint@collectohub.app",
                 password_hash=pw, email_verified=True, city="Mumbai", country="India", gender="f",
                 bio="Sealed-only Gunpla shelf. MISB or nothing.", onboarded_at=now(500)),
            User(id=TOK, handle="tokyo_trader", name="Kenji Sato", email="tokyo_trader@collectohub.app",
                 password_hash=pw, email_verified=True, city="Tokyo", country="Japan", gender="m",
                 bio="Proxy runs from Nakano Broadway.", onboarded_at=now(900)),
        ])

        # ── Catalogue: 2 Reviewed (desc + MRP), 2 community "Intel by" entries ──
        cats = [
            Catalogue(sku="DV8-LAB-001", title="Hot Toys Iron Man Mark LXXXV — Battle Damaged", brand="Hot Toys",
                      category="figures", scale="1/6", year="2024", tone="red", est_retail_price=3499900,
                      description="Die-cast sixth-scale Mark LXXXV with battle-damaged armor, LED arc reactor, "
                                  "interchangeable Tony Stark head sculpt and nano-weapon accessories.",
                      thumbnail_url=img("dv8mk85"), is_verified=True),
            Catalogue(sku="DV8-LAB-002", title="MG 1/100 Sazabi Ver.Ka", brand="Bandai",
                      category="kits", scale="1/100", year="2023", tone="plum", est_retail_price=899900,
                      description="Master Grade Ver.Ka with full inner frame, flexible thruster binders and "
                                  "the classic red comeback colourway.",
                      thumbnail_url=img("dv8sazabi"), is_verified=True),
            Catalogue(sku="DV8-LAB-003", title="Pop Mart Skullpanda City of Night — Chase", brand="Pop Mart",
                      category="designer", year="2025", tone="ink", est_retail_price=159900,
                      description="Chase figure from the City of Night series.",
                      thumbnail_url=img("dv8panda"), is_verified=False, submitted_by=BBQ),
            Catalogue(sku="DV8-LAB-004", title="Pokémon 151 Booster Box (JP)", brand="Pokémon TCG",
                      category="tcg", year="2024", tone="gold", est_retail_price=1299900,
                      description="Japanese SV2a booster box — 20 packs.",
                      thumbnail_url=img("dv8poke"), is_verified=False, submitted_by=TOK),
        ]
        db.add_all(cats)
        await db.flush()

        # Ratings: 3 raters on -001 (avg 4.67 incl. figurehead's own), 2 on -002.
        db.add_all([
            CatalogueRating(user_id=FIG, sku="DV8-LAB-001", rating=5),
            CatalogueRating(user_id=BBQ, sku="DV8-LAB-001", rating=5),
            CatalogueRating(user_id=BRICK, sku="DV8-LAB-001", rating=4),
            CatalogueRating(user_id=MMB, sku="DV8-LAB-002", rating=4),
            CatalogueRating(user_id=DIE, sku="DV8-LAB-002", rating=3),
        ])
        # Comments: thread with a reply on -001, single comments on -002/-003.
        c1 = CatalogueComment(sku="DV8-LAB-001", user_id=BBQ,
                              body="Is the die-cast content on this one heavier than the Mark L?", created_at=now(30))
        db.add(c1); await db.flush()
        db.add_all([
            CatalogueComment(sku="DV8-LAB-001", user_id=FIG, parent_id=c1.id,
                             body="Noticeably — the torso and thighs are all metal.", created_at=now(28)),
            CatalogueComment(sku="DV8-LAB-002", user_id=BRICK, body="Best Ver.Ka box art, fight me.", created_at=now(50)),
            CatalogueComment(sku="DV8-LAB-003", user_id=MMB, body="Pull rate on the chase feels worse than listed.", created_at=now(12)),
        ])

        # ── Items for figurehead: every completeness/status scenario ──────────
        items = {
            # owned + complete (condition + price) — also gets an AVAILABLE listing (Sale row)
            "own_listed": Item(user_id=FIG, sku="DV8-LAB-001", status="owned", condition="MISB",
                               value=4200000, is_listed=True, category="figures", brand="Hot Toys"),
            # owned + complete, later SOLD (grey tile + line-through + Sold filter)
            "own_sold": Item(user_id=FIG, sku="DV8-LAB-002", status="owned", condition="MIB",
                             value=750000, is_listed=False, category="kits", brand="Bandai"),
            # owned incomplete — missing price ("Add price →")
            "own_noprice": Item(user_id=FIG, sku="DV8-LAB-003", status="owned", condition="Mint", value=0,
                                category="designer", brand="Pop Mart"),
            # owned incomplete — missing condition ("Add condition →")
            "own_nocond": Item(user_id=FIG, custom_title="SDCC Mezco Batman", status="owned", value=1500000,
                               category="figures", brand="Mezco"),
            # TCG graded w/ cert (grading card round-trip)
            "own_graded": Item(user_id=FIG, sku="DV8-LAB-004", status="owned", condition="Graded", value=2500000,
                               category="tcg", brand="Pokémon TCG", tcg_graded=True, tcg_grader="PSA",
                               tcg_grade="10", tcg_cert_no="78412095", tcg_language="JP"),
            # pre-order complete (month window + total + deposit)
            "po_full": Item(user_id=FIG, custom_title="Threezero Trigun Vash", status="preorder",
                            category="figures", brand="Threezero", preorder_eta="Mar 2027",
                            preorder_window_precision="month", preorder_seller="BBToyStore, Bangalore",
                            preorder_total=2800000, preorder_deposit=500000,
                            preorder_ordered_at=date(2026, 8, 2)),
            # pre-order "not announced" (counts as answered) + total → complete
            "po_tbd": Item(user_id=FIG, custom_title="Bandai RG Hi-Nu Evo", status="preorder",
                           category="kits", brand="Bandai", preorder_eta="Date to be announced",
                           preorder_window_precision="tbd", preorder_total=650000),
            # pre-order incomplete — no total ("Add details →" / finish flow)
            "po_bare": Item(user_id=FIG, custom_title="Good Smile Pop Up Parade Guts", status="preorder",
                            category="figures", brand="Good Smile", preorder_eta="Q2 2027",
                            preorder_window_precision="quarter"),
            # wishlist row (quick-add converts it)
            "wish": Item(user_id=FIG, sku="DV8-LAB-003", custom_title="Pop Mart Skullpanda City of Night — Chase",
                         status="wishlist", category="designer", brand="Pop Mart", wishlist_alert_enabled=True),
            # DB contribution
            "intel": Item(user_id=FIG, custom_title="TomyTec 1/64 Pandem Supra", status="intel",
                          category="diecast", brand="TomyTec"),
            # other collectors' copies (visitor views + people modal + "Ask @…")
            "bbq_own": Item(user_id=BBQ, sku="DV8-LAB-001", status="owned", condition="MIB", value=3900000,
                            category="figures", brand="Hot Toys", is_listed=True),
            "mmb_own": Item(user_id=MMB, sku="DV8-LAB-002", status="owned", condition="MISB", value=999900,
                            category="kits", brand="Bandai"),
            "tok_po": Item(user_id=TOK, sku="DV8-LAB-004", status="preorder", category="tcg",
                           brand="Pokémon TCG", preorder_eta="Jan 2027", preorder_window_precision="month",
                           preorder_total=1400000),
        }
        db.add_all(items.values()); await db.flush()
        db.add_all([
            ItemPhoto(item_id=items["own_listed"].id, url=img("dv8mk85shelf"), is_public=True),
            ItemPhoto(item_id=items["own_listed"].id, url=img("dv8mk85box"), is_public=False),
            ItemPhoto(item_id=items["bbq_own"].id, url=img("dv8bbqmk85"), is_public=True),
        ])

        # ── Listings: available ×3 (varied terms), sold, closed + votes/Q&A ──
        l_fig = Listing(item_id=items["own_listed"].id, seller_id=FIG, sku="DV8-LAB-001",
                        price=5400000, currency="INR", condition="MISB", qty=1, trade_willing=True,
                        ships_from_city="Mumbai", ships_nationwide=True, shipping_cost=0,
                        condition_notes="Shipper opened once for inspection, figure never displayed.",
                        terms=["Shipping included", "Returns accepted"], status="available")
        l_bbq = Listing(item_id=items["bbq_own"].id, seller_id=BBQ, sku="DV8-LAB-001",
                        price=4800000, currency="INR", condition="MIB", qty=1, trade_willing=False,
                        ships_from_city="Bengaluru", ships_nationwide=True, shipping_cost=45000,
                        condition_notes="Displayed 6 months, boxed since.", terms=[], status="available")
        l_mmb = Listing(item_id=items["mmb_own"].id, seller_id=MMB, sku="DV8-LAB-002",
                        price=1050000, currency="INR", condition="MISB", qty=2, trade_willing=True,
                        ships_from_city="Mumbai", ships_nationwide=False, shipping_cost=0,
                        terms=["Local pickup preferred"], status="available")
        l_sold = Listing(item_id=items["own_sold"].id, seller_id=FIG, sku="DV8-LAB-002",
                         price=850000, currency="INR", condition="MIB", qty=1,
                         ships_from_city="Mumbai", status="sold", closed_at=now(20))
        db.add_all([l_fig, l_bbq, l_mmb, l_sold]); await db.flush()

        # Price-fair votes on figurehead's live listing → seller bar + notification.
        db.add_all([
            ListingPriceVote(user_id=BBQ, listing_id=l_fig.id, vote="high"),
            ListingPriceVote(user_id=BRICK, listing_id=l_fig.id, vote="fair"),
            ListingPriceVote(user_id=MMB, listing_id=l_fig.id, vote="fair"),
            ListingPriceVote(user_id=TOK, listing_id=l_fig.id, vote="low"),
            # …and one BY figurehead on someone else's (visitor confirmed state)
            ListingPriceVote(user_id=FIG, listing_id=l_bbq.id, vote="fair"),
        ])
        db.add_all([
            ListingQuestion(listing_id=l_fig.id, asker_id=BRICK,
                            body="Does the arc reactor LED still hold charge?",
                            answer="Yes — fresh batteries included.", answered_at=now(5), created_at=now(6)),
            ListingQuestion(listing_id=l_fig.id, asker_id=MMB,
                            body="Would you split shipping on a Mumbai meetup?", created_at=now(2)),
            ListingLike(user_id=FIG, listing_id=l_bbq.id),   # "Saved" filter has content
            ListingLike(user_id=FIG, listing_id=l_mmb.id),
            ListingLike(user_id=BBQ, listing_id=l_fig.id),
        ])

        # ── Communities: figurehead-run approval community + invite-only + requests ──
        com_lab = Community(id="dv8-lab", name="DV8 Grail Lab", short_desc="Founder-run test community",
                            description="Scenario community for the DV8 batch — approval-mode posting.",
                            tag="DL", category="figures", tone="plum", founder_id=FIG, member_count=3,
                            post_mode="approval", is_invite_only=False, is_admin_created=False,
                            status="approved", banner_url=img("dv8banner", 1200, 400),
                            avatar_url=img("dv8avatar", 300, 300),
                            rules=["No bootlegs — official releases only.",
                                   "Declare condition honestly in every sale post.",
                                   "Keep price talk in the listing, not the comments."])
        com_priv = Community(id="dv8-vault", name="The Sealed Vault", short_desc="Invite-only MISB circle",
                             description="Private community for sealed-only collectors.", tag="SV",
                             category="figures", tone="ink", founder_id=BBQ, member_count=2,
                             post_mode="open", is_invite_only=True, is_admin_created=False, status="approved",
                             rules=["Sealed items only.", "No feeler posts."])
        db.add_all([com_lab, com_priv])
        db.add_all([
            CommunityMember(community_id="dv8-lab", user_id=FIG, role="founder"),
            CommunityMember(community_id="dv8-lab", user_id=BBQ, role="mod"),
            CommunityMember(community_id="dv8-lab", user_id=BRICK, role="member"),
            CommunityMember(community_id="dv8-vault", user_id=BBQ, role="founder"),
            CommunityMember(community_id="dv8-vault", user_id=MMB, role="member"),
            # pending join requests → Requests tab in figurehead's manage view
            CommunityJoinRequest(community_id="dv8-lab", user_id=MMB, status="pending"),
            CommunityJoinRequest(community_id="dv8-lab", user_id=TOK, status="pending"),
            CommunityJoinRequest(community_id="dv8-vault", user_id=FIG, status="pending"),  # your own "Requested" state
        ])

        # ── Posts: every type/ribbon + tagged chips + pending queue ───────────
        posts = {
            "review": Post(user_id=BBQ, type="review", title="Mark LXXXV — worth the grail tax?",
                           body="Paint apps are the best Hot Toys has shipped in years. Ankles still worry me.",
                           images=[img("dv8rev1")], category="figures", ref_sku="DV8-LAB-001",
                           review_rating=5, to_feed=True, tags=["#hottoys"], created_at=now(8)),
            "iso1": Post(user_id=BRICK, type="iso", iso_item="MG Sazabi Ver.Ka", body="Box condition flexible if sealed inside.",
                         images=[img("dv8iso1")], category="kits", ref_sku="DV8-LAB-002", iso_budget=800000,
                         iso_condition="sealed", iso_city="Delhi", to_feed=True, created_at=now(10)),
            "iso2": Post(user_id=MMB, type="iso", iso_item="Skullpanda City of Night chase", body="",
                         images=[img("dv8iso2")], category="designer", iso_budget=250000,
                         iso_city="Anywhere in India", to_feed=True, created_at=now(4)),
            "iso3": Post(user_id=TOK, type="iso", iso_item="PSA 10 Mew ex 151", body="Will pay proxy fees.",
                         images=[img("dv8iso3")], category="tcg", iso_city="Worldwide", to_feed=True, created_at=now(1)),
            "poll": Post(user_id=FIG, type="poll", title="Next unboxing?", body="",
                         poll_options={"Mark LXXXV": 4, "Sazabi Ver.Ka": 2, "151 booster box": 7},
                         category="figures", to_feed=True, created_at=now(16)),
            "show": Post(user_id=FIG, type="showcase", title="Shelf refresh — die-cast corner",
                         body="Finally lit properly.", images=[img("dv8show1"), img("dv8show2")],
                         category="figures", ref_sku="DV8-LAB-001", to_feed=True, created_at=now(20)),
            "share": Post(user_id=FIG, type="showcase", body="Letting the battle-damaged 85 go — priced to move.",
                          images=[], category="figures", to_feed=True, created_at=now(3)),
            # community-published (role badge: BBQ is mod) + pending queue entries
            "compub": Post(user_id=BBQ, type="discussion", title="Lab rules refresh",
                           body="Condition tags are now mandatory on sale posts here.",
                           category="figures", community_id="dv8-lab", to_feed=False, created_at=now(7)),
            "pend1": Post(user_id=BRICK, type="showcase", title="First Hot Toys — did I overpay?",
                          body="₹41k shipped for the 85.", images=[img("dv8pend1")], category="figures",
                          community_id="dv8-lab", to_feed=False, status="pending", created_at=now(2)),
            "pend2": Post(user_id=BRICK, type="discussion", title="Meetup thread — Delhi",
                          body="Sunday at Select City?", category="figures",
                          community_id="dv8-lab", to_feed=False, status="pending", created_at=now(1)),
        }
        posts["share"].ref_listing_id = l_fig.id
        db.add_all(posts.values()); await db.flush()
        db.add_all([
            PostCommunity(post_id=posts["compub"].id, community_id="dv8-lab", status="published"),
            PostCommunity(post_id=posts["pend1"].id, community_id="dv8-lab", status="pending"),
            PostCommunity(post_id=posts["pend2"].id, community_id="dv8-lab", status="pending"),
        ])
        cm1 = Comment(post_id=posts["review"].id, user_id=FIG, body="Ankles held up fine on mine after 6 months posed.", created_at=now(6))
        db.add(cm1); await db.flush()
        db.add_all([
            Comment(post_id=posts["review"].id, user_id=BBQ, parent_id=cm1.id, body="Good to know — posing it tonight then.", created_at=now(5)),
            Comment(post_id=posts["iso1"].id, user_id=FIG, body="I have this — check your DMs.", created_at=now(9)),
        ])

        # ── Events: free / paid / past / pending-hosted, venue+address ────────
        db.add_all([
            Event(title="Mumbai Toy Swap — Monsoon Edition", host_id=BBQ, community_id="dv8-lab",
                  categories=["figures", "designer"], mode="in_person", city="Mumbai", country="India",
                  venue="Phoenix Marketcity, Kurla", address="3rd floor atrium, near the food court",
                  cover_image_url=img("dv8ev1", 1200, 800), is_free=True,
                  starts_at=now(-96), ends_at=now(-96) + timedelta(hours=4),
                  going_count=23, interested_count=41, status="active"),
            Event(title="Gunpla Builders Night", host_id=MMB, categories=["kits"], mode="in_person",
                  city="Mumbai", country="India", venue="Doolally Taproom, Bandra",
                  address="1st floor, near Mehboob Studio", cover_image_url=img("dv8ev2", 1200, 800),
                  is_free=False, price=50000, currency="INR",
                  ticket_url="https://insider.in/dv8-gunpla-night", contact="@mumbai_mint on Scorred",
                  starts_at=now(-240), ends_at=now(-240) + timedelta(hours=5),
                  going_count=12, interested_count=9, status="active"),
            Event(title="TCG Trade Sunday", host_id=TOK, categories=["tcg"], mode="in_person",
                  city="Delhi", country="India", venue="Select Citywalk, Saket",
                  is_free=True, starts_at=now(400), ends_at=now(400) + timedelta(hours=3),
                  going_count=31, interested_count=15, status="past"),
            Event(title="DV8 Lab Meetup #1", host_id=FIG, community_id="dv8-lab",
                  categories=["figures"], mode="in_person", city="Mumbai", country="India",
                  venue="Versova Social", address="Rooftop, 7 Bungalows",
                  is_free=False, price=20000, currency="INR", contact="figurehead@collectohub.app",
                  starts_at=now(-336), ends_at=now(-336) + timedelta(hours=3),
                  status="pending_approval", is_admin_created=False),
        ])

        # ── Chat: thread w/ listing context, image message, vouches ───────────
        pa, pb = min(FIG, BBQ, key=str), max(FIG, BBQ, key=str)
        th = (await db.execute(select(Thread).where(
            Thread.participant_a == pa, Thread.participant_b == pb
        ))).scalar_one_or_none()
        if th is None:
            th = Thread(participant_a=pa, participant_b=pb, listing_id=l_bbq.id, unread_a=0, unread_b=1)
            db.add(th)
        else:
            th.listing_id = l_bbq.id   # point the existing seed thread at the DV8 listing
        await db.flush()
        db.add_all([
            Message(thread_id=th.id, sender_id=FIG, body="Is the MIB 85 still available? Interested at asking.", created_at=now(26)),
            Message(thread_id=th.id, sender_id=BBQ, body="It is — here's the current shelf state.", created_at=now(25)),
            Message(thread_id=th.id, sender_id=BBQ, image_url=img("dv8chatpic"), created_at=now(25)),
            Message(thread_id=th.id, sender_id=FIG, body="Looks clean. Would you take ₹46k with shipping?", created_at=now(24)),
        ])
        db.add_all([
            Vouch(from_user_id=FIG, to_user_id=BBQ, kind="social_endorsement", relation="app",
                  body="Two smooth trades, fast shipper."),
            Vouch(from_user_id=BRICK, to_user_id=BBQ, kind="social_endorsement", relation="community"),
            Vouch(from_user_id=MMB, to_user_id=FIG, kind="social_endorsement", relation="app",
                  body="Packed like a pro."),
            Vouch(from_user_id=TOK, to_user_id=FIG, kind="social_endorsement", relation="offapp"),
        ])

        # ── Notifications for figurehead: price votes, sold alert, follow ─────
        db.add_all([
            Notification(user_id=FIG, kind="price_vote", title="Price feedback on your listing",
                         body='A collector weighed in on "Hot Toys Iron Man Mark LXXXV" — open the listing to see the split.',
                         ref_type="listing", ref_id=str(l_fig.id), created_at=now(2)),
            Notification(user_id=FIG, kind="price_vote", title="Price feedback on your listing",
                         body='A collector weighed in on "Hot Toys Iron Man Mark LXXXV" — open the listing to see the split.',
                         ref_type="listing", ref_id=str(l_fig.id), created_at=now(5)),
            Notification(user_id=FIG, actor_id=BBQ, kind="follow", title="New follower",
                         body="@blindbox_queen followed you.", ref_type="profile", ref_id="blindbox_queen", created_at=now(11)),
        ])

        # Denormalized counters the UI reads.
        # (vouch counts are computed live by the API; only listings are denormalized)
        await db.execute(text("""
            UPDATE users SET
              active_listings_count = COALESCE((SELECT COUNT(*) FROM listings l WHERE l.seller_id = users.id AND l.status='available'), 0)
            WHERE id IN (:fig, :bbq, :mmb, :tok, :brick)
        """), {"fig": FIG, "bbq": BBQ, "mmb": MMB, "tok": TOK, "brick": BRICK})

        await db.commit()
        print("DV8 scenario seed complete.")
        print("Login: figurehead@collectohub.app / seed_pass_1!  (mumbai_mint / tokyo_trader share the password)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
