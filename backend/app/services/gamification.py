"""Collector XP, ranks, leaderboards & badges (Rewards & Badge System BRD v3).

This module is the single source of truth for the *mechanics* — rank thresholds,
earn-action point values, per-day caps, dedup and the windowed aggregates behind
the Rewards screen and leaderboard. Visual tokens (rank/badge colours and icons)
live on the frontend, keyed by the ids returned here.

Rewards & Badge System v3 (July 2026) simplifies the system to two badge types:
- **First Start badges** — permanent, manually team-assigned (Founding Member /
  Early Believer / Pioneer). Stored as ``users.first_start_badge``. Pioneers and
  Early Believers also get a gold avatar frame.
- **XP / Season badges** — (a) the rank badge derived from lifetime XP, and
  (b) leaderboard badges awarded to the weekly league's top-10 finishers.

Award model (see models/gamification.XpEvent):
- Every grant is an append-only ledger row. ``award_xp`` inserts with
  ON CONFLICT DO NOTHING against the partial-unique (user, action, ref_id) index,
  so calls are idempotent (re-like, double check-in) — only a real insert bumps
  the denormalized ``users.xp`` cache. Per-day caps (v3 §7) additionally stop
  awarding past N grants/day for repeatable actions.
- Lifetime XP is read on every profile/card → served from ``users.xp`` (O(1)).
- Weekly windows are derived on demand from the ledger; never stored (no reset
  jobs, never stale). The monthly board was removed in v3.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func, and_, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import XpEvent, SeasonBadge
from app.models.notification import Notification
from app.models.user import User

# ── Rank ladder (v3 §5/§8) — "Collector Journey", ascending; rank is derived ──
# from lifetime XP. v3 removed all rank perks — the ladder now carries name +
# XP threshold only. The ladder is open-ended (v3 §5): beyond Icon, new ranks are
# added manually as the community scales (+20,000 XP each); nobody reaches Icon in
# Phase 1, so the 7 named ranks are the live set.
REWARD_TIERS = [
    {"id": "rookie",    "name": "Rookie",    "at": 0},
    {"id": "hunter",    "name": "Hunter",    "at": 300},
    {"id": "collector", "name": "Collector", "at": 1000},
    {"id": "curator",   "name": "Curator",   "at": 3000},
    {"id": "archivist", "name": "Archivist", "at": 7500},
    {"id": "legend",    "name": "Legend",    "at": 15000},
    {"id": "icon",      "name": "Icon",      "at": 30000},
]

# ── First Start badges (v3 §6.1) — permanent, manually team-assigned ─────────
# One per user, stored on users.first_start_badge. `frame` = receives the gold
# avatar frame (v3 §2.2 — Founding Members keep their pill treatment instead).
FIRST_START = {
    "founding": {
        "id": "founding", "name": "Founding Member", "emoji": "⭐", "frame": False,
        "description": "One of the founding members of Scorred. Permanently and manually assigned — never expires.",
    },
    "early_believer": {
        "id": "early_believer", "name": "Early Believer", "emoji": "🌱", "frame": True,
        "description": "One of the first collectors to join Scorred. Permanent — never expires.",
    },
    "pioneer": {
        "id": "pioneer", "name": "Pioneer", "emoji": "🔥", "frame": True,
        "description": "One of the earliest beta collectors on Scorred. Permanent — never expires.",
    },
}
# Feed/shelf priority order for First Start badges (v3 §2.1, §3).
FIRST_START_ORDER = ["founding", "early_believer", "pioneer"]


def first_start_payload(code: str | None) -> dict | None:
    """Public First Start badge descriptor, or None. Used by the profile shelf,
    feed badge pill, avatar frame and BadgeSheet (v3 §2/§3/§4/§6.1)."""
    if not code:
        return None
    return FIRST_START.get(code)

# ── Earn table (v3 §7) — single source for points + per-day cap + frequency ──
# `cap` = max grants per calendar day (UTC), or None for uncapped. Order here is
# the display order on the Rewards "Ways to earn" list. v3 removed "Add a verified
# item" and any deal/verified-item earn action.
EARN_RULES = {
    "profile":  {"points": 100, "freq": "once",   "cap": None, "label": "Complete your profile", "icon": "user"},
    "refer":    {"points": 150, "freq": "repeat", "cap": None, "label": "Refer a friend",        "icon": "gift"},
    # v6 (DV6-02) — first collector to add a new item to the shared catalogue DB.
    # Deduped per item via ref_id; the /day cap stops bulk-add farming.
    "db_new":   {"points": 50,  "freq": "repeat", "cap": 5,    "label": "Add new item to Scorred DB", "icon": "database"},
    "showcase": {"points": 25,  "freq": "repeat", "cap": 5,    "label": "Post a showcase",       "icon": "camera"},
    "review":   {"points": 15,  "freq": "repeat", "cap": 3,    "label": "Write a review",        "icon": "star"},
    "vouch":    {"points": 15,  "freq": "repeat", "cap": 3,    "label": "Vouch for a collector", "icon": "shield"},
    "rsvp":     {"points": 10,  "freq": "repeat", "cap": 3,    "label": "RSVP to an event",      "icon": "calendar"},
    "comment":  {"points": 10,  "freq": "repeat", "cap": 10,   "label": "Comment on a post",     "icon": "comment"},
    "checkin":  {"points": 5,   "freq": "daily",  "cap": 1,    "label": "Daily check-in",        "icon": "zap"},
    "like":     {"points": 1,   "freq": "repeat", "cap": 50,   "label": "Like a post",           "icon": "heart"},
    # v6 (DV6-04) — small +2 micro-reward on following a collector. Deduped per
    # target (one grant per person ever); NOT shown on the "ways to earn" list.
    "follow":   {"points": 2,   "freq": "repeat", "cap": 20,   "label": "Follow a collector",    "icon": "user"},
}
# Earn actions rendered separately (not in the "ways to earn" list): the daily
# check-in has its own card, and follow is an invisible micro-reward (v6 §DV6-04).
HIDDEN_EARN = {"checkin", "follow"}

# Leaderboard-badge bonus XP banked toward lifetime rank (v3 §6.2).
SEASON_REWARD = {"gold": 300, "silver": 200, "bronze": 120, "finalist": 50}
BADGE_TIER_RANK = {"gold": 0, "silver": 1, "bronze": 2, "finalist": 3}

# The 5 steps behind "Complete your profile" (v3 §7, +100 one-time).
PROFILE_STEPS = 5


def _now() -> datetime:
    return datetime.now(timezone.utc)


def day_start() -> datetime:
    """Midnight UTC today — the per-day cap window (v3 §7)."""
    return _now().replace(hour=0, minute=0, second=0, microsecond=0)


# ── Rank helpers ─────────────────────────────────────────────────────────────
def tier_index_of(xp: int) -> int:
    idx = 0
    for i, t in enumerate(REWARD_TIERS):
        if xp >= t["at"]:
            idx = i
    return idx


def tier_of(xp: int) -> dict:
    return REWARD_TIERS[tier_index_of(xp)]


def next_tier_of(xp: int) -> dict | None:
    i = tier_index_of(xp)
    return REWARD_TIERS[i + 1] if i + 1 < len(REWARD_TIERS) else None


def rank_payload(xp: int) -> dict:
    """Tier + progress block shared by the rank card and the Rewards hero."""
    idx = tier_index_of(xp)
    tier = REWARD_TIERS[idx]
    nxt = next_tier_of(xp)
    if nxt:
        span = nxt["at"] - tier["at"] or 1
        pct = max(3, min(100, round((xp - tier["at"]) / span * 100)))
        need = nxt["at"] - xp
    else:
        pct, need = 100, 0
    return {
        "tier": tier,
        "next": nxt,
        "index": idx,
        "total": len(REWARD_TIERS),
        "pct": pct,
        "need": need,
    }


def is_gamification_excluded(user: User | None) -> bool:
    """Admin/staff accounts sit OUTSIDE the rewards system entirely (QA 2026-08-04 §4).

    They earn no XP, hold no rank or First Start badge, and never appear on a
    leaderboard. Their posts are the house voice ("Scorred · Official"), so a rank
    pill next to one would read as the platform competing with its own users."""
    return bool(user is not None and getattr(user, "is_admin", False))


def feed_badge(user: User) -> dict | None:
    """The single badge shown next to an author in the feed/leaderboard (v3 §3).

    Priority: (1) First Start badge if the user has one, else (2) the rank badge.
    Every ordinary user has a rank, so this is only empty for excluded (admin)
    accounts — those render the Official tag instead."""
    if is_gamification_excluded(user):
        return None
    fs = first_start_payload(getattr(user, "first_start_badge", None))
    if fs:
        return {"kind": "first_start", "code": fs["id"], "name": fs["name"], "emoji": fs["emoji"]}
    tier = tier_of(user.xp or 0)
    return {"kind": "rank", "code": tier["id"], "name": tier["name"], "emoji": None}


def profile_completion(user: User) -> tuple[int, int]:
    """How many of the 5 profile steps are done (avatar, bio, city, interests, birth year)."""
    steps = [
        bool(user.avatar_url),
        bool(user.bio),
        bool(user.city),
        bool(user.interests),
        bool(user.birth_year),
    ]
    return sum(steps), PROFILE_STEPS


# ── Awarding ─────────────────────────────────────────────────────────────────
async def _day_count(db: AsyncSession, user_id: uuid.UUID, action: str) -> int:
    res = await db.execute(
        select(func.count()).select_from(XpEvent).where(and_(
            XpEvent.user_id == user_id, XpEvent.action == action,
            XpEvent.created_at >= day_start(),
        ))
    )
    return int(res.scalar() or 0)


async def award_xp(
    db: AsyncSession,
    user: User,
    action: str,
    *,
    ref_id: str | None = None,
    ref_type: str | None = None,
) -> bool:
    """Grant XP for `action`, idempotently. Returns True iff a new grant landed.

    Safe to call unconditionally from action routers. Two guards apply: the
    partial-unique index dedups repeat grants against the same target
    (user+action+ref_id), and the per-day cap (v3 §7) stops awarding once the
    day's quota for a repeatable action is spent. On a real insert the
    denormalized ``users.xp`` cache is bumped on the same session/transaction.
    """
    rule = EARN_RULES.get(action)
    if rule is None:
        return False

    # Staff accounts are outside the rewards system (QA 2026-08-04 §4) — no ledger
    # row, so nothing to reverse if an account is promoted/demoted later.
    if is_gamification_excluded(user):
        return False

    # Per-day cap on repeatable actions (v3 §7). 'once' is guarded by ref_id dedup;
    # 'daily' (check-in) is guarded by its date ref_id — neither needs a count.
    cap = rule.get("cap")
    if cap is not None and rule["freq"] == "repeat":
        if await _day_count(db, user.id, action) >= cap:
            return False

    stmt = (
        pg_insert(XpEvent)
        .values(
            id=uuid.uuid4(),
            user_id=user.id,
            action=action,
            points=rule["points"],
            ref_type=ref_type,
            ref_id=ref_id,
            created_at=_now(),
        )
        # Match the PARTIAL unique index (… WHERE ref_id IS NOT NULL) so Postgres
        # can infer it for the ON CONFLICT arbiter.
        .on_conflict_do_nothing(
            index_elements=["user_id", "action", "ref_id"],
            index_where=text("ref_id IS NOT NULL"),
        )
        .returning(XpEvent.id)
    )
    res = await db.execute(stmt)
    if res.first() is None:
        return False  # deduped — already granted
    old_xp = user.xp or 0
    user.xp = old_xp + rule["points"]
    await _emit_rank_up(db, user, old_xp, user.xp)
    return True


async def _emit_rank_up(db: AsyncSession, user: User, old_xp: int, new_xp: int) -> None:
    """Notify on rank promotion. No-op unless the grant crossed a tier threshold.
    Deduped per (user, tier) so a tier is only ever announced once — XP is
    monotonic, so the crossing happens once, but the guard also protects the
    badge-bonus path and any double-award edge."""
    old_i, new_i = tier_index_of(old_xp), tier_index_of(new_xp)
    if new_i <= old_i:
        return
    tier = REWARD_TIERS[new_i]
    exists = await db.execute(
        select(Notification.id).where(and_(
            Notification.user_id == user.id,
            Notification.kind == "rank_up",
            Notification.ref_id == tier["id"],
        )).limit(1)
    )
    if exists.first() is not None:
        return
    db.add(Notification(
        user_id=user.id,
        kind="rank_up",
        title=f"You reached {tier['name']}!",
        body=f"You're now a {tier['name']} — keep collecting.",
        ref_type="rank",
        ref_id=tier["id"],
    ))


async def maybe_award_profile_complete(db: AsyncSession, user: User) -> bool:
    """Award the one-time +100 once all 5 profile steps are filled (dedup'd on ref_id='profile')."""
    done, total = profile_completion(user)
    if done < total:
        return False
    return await award_xp(db, user, "profile", ref_id="profile", ref_type="profile")


# ── Time windows (v3 §9) ─────────────────────────────────────────────────────
def week_start() -> datetime:
    """Most recent Monday 00:00 UTC — weekly boards reset Monday."""
    now = _now()
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


async def _windowed_xp(db: AsyncSession, user_id: uuid.UUID, since: datetime) -> int:
    res = await db.execute(
        select(func.coalesce(func.sum(XpEvent.points), 0)).where(
            and_(XpEvent.user_id == user_id, XpEvent.created_at >= since)
        )
    )
    return int(res.scalar() or 0)


# ── Referral (v6 DV6-05) ─────────────────────────────────────────────────────
# Unambiguous alphabet (no 0/O/1/I) for the SCOR-XXXXX share code.
_REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _gen_referral_code() -> str:
    return "SCOR-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(5))


async def ensure_referral_code(db: AsyncSession, user: User) -> str:
    """Return the user's stable SCOR-XXXXX code, generating one on first access.
    Lazy so pre-existing / seed accounts (raw inserts, NULL code) get one the
    first time they open Rewards or the referral dashboard."""
    if user.referral_code:
        return user.referral_code
    for _ in range(6):  # retry on the (unlikely) unique-code collision
        code = _gen_referral_code()
        clash = await db.execute(select(User.id).where(User.referral_code == code))
        if clash.first() is None:
            user.referral_code = code
            await db.flush()
            return code
    # Extremely unlikely: fall back to a code seeded from the user id.
    user.referral_code = "SCOR-" + str(user.id).replace("-", "")[:5].upper()
    await db.flush()
    return user.referral_code


async def inviter_for_code(db: AsyncSession, code: str | None) -> User | None:
    """Resolve a SCOR-XXXXX referral code to the inviting user, or None."""
    if not code:
        return None
    norm = code.strip().upper()
    if not norm.startswith("SCOR-"):
        norm = "SCOR-" + norm
    res = await db.execute(select(User).where(User.referral_code == norm))
    return res.scalar_one_or_none()


async def resolve_referral(db: AsyncSession, invitee: User) -> None:
    """Credit the inviter +150 XP once `invitee` adds their first collection item
    (v6 DV6-05 — the reward fires on first item, not signup). Idempotent:
    award_xp dedups on (inviter, "refer", invitee_id), so this is safe to call on
    every add. `referred_by` is retained so the invite stays on the inviter's
    dashboard; the resolved/pending status is derived from the XpEvent ledger."""
    if invitee.referred_by is None:
        return
    inviter = (await db.execute(select(User).where(User.id == invitee.referred_by))).scalar_one_or_none()
    if inviter is None or inviter.id == invitee.id:
        return
    granted = await award_xp(db, inviter, "refer", ref_id=str(invitee.id), ref_type="user")
    if granted:
        db.add(Notification(
            user_id=inviter.id,
            actor_id=invitee.id,
            kind="referral",
            title="Your invite paid off!",
            body=f"@{invitee.handle} joined and added their first item — +{EARN_RULES['refer']['points']} XP.",
            ref_type="user",
            ref_id=str(invitee.id),
        ))


async def referrals_list(db: AsyncSession, inviter: User) -> list[dict]:
    """The inviter's referral dashboard rows: each invitee with pending/joined
    status and the XP earned (v6 DV6-05 GET /users/me/referrals)."""
    invitees = (await db.execute(
        select(User).where(User.referred_by == inviter.id).order_by(User.created_at.desc())
    )).scalars().all()
    if not invitees:
        return []
    # Which invitees have already resolved (credited the inviter +150)?
    resolved = set((await db.execute(
        select(XpEvent.ref_id).where(and_(
            XpEvent.user_id == inviter.id,
            XpEvent.action == "refer",
        ))
    )).scalars().all())
    reward = EARN_RULES["refer"]["points"]
    rows = []
    for u in invitees:
        joined = str(u.id) in resolved
        rows.append({
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "status": "joined" if joined else "pending",
            "xp": reward if joined else 0,
        })
    return rows


# ── Rewards screen payload (§9.17) ───────────────────────────────────────────
async def rewards_summary(db: AsyncSession, user: User) -> dict:
    xp = user.xp or 0
    xp_week = await _windowed_xp(db, user.id, week_start())
    done, total = profile_completion(user)
    checked_in = await checked_in_today(db, user.id)
    referral_count = await _scalar(
        db,
        select(func.count()).select_from(XpEvent).where(
            and_(XpEvent.user_id == user.id, XpEvent.action == "refer")
        ),
    )

    earn = []
    for action, rule in EARN_RULES.items():
        if action in HIDDEN_EARN:
            continue  # check-in has its own card; follow is an invisible micro-reward
        row = {"id": action, "label": rule["label"], "xp": rule["points"],
               "icon": rule["icon"], "freq": rule["freq"], "cap": rule["cap"]}
        if action == "profile":
            row["progress"] = {"done": done, "total": total}
        earn.append(row)

    return {
        "xp": xp,
        "xp_week": xp_week,
        "rank": rank_payload(xp),
        "earn_actions": earn,
        "checkin": {
            "claimed": checked_in,
            "xp": EARN_RULES["checkin"]["points"],
            "streak": await checkin_streak(db, user.id),
        },
        # v6 DV6-05 referral: stable SCOR-XXXXX code; count = friends credited.
        "referral": {"code": await ensure_referral_code(db, user), "count": referral_count, "xp": EARN_RULES["refer"]["points"]},
    }


async def checkin_streak(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Consecutive-day check-in streak. Derived from the ledger (check-in rows
    carry the calendar date in ref_id) — no stored counter, never stale. Counts
    back from today, or from yesterday if today isn't yet claimed, so the streak
    is preserved up to the moment it would actually break."""
    from datetime import date, timedelta as _td
    res = await db.execute(
        select(XpEvent.ref_id).where(
            and_(XpEvent.user_id == user_id, XpEvent.action == "checkin")
        )
    )
    days = {r[0] for r in res.all() if r[0]}
    if not days:
        return 0
    today = _now().date()
    cursor: date = today if today.isoformat() in days else today - _td(days=1)
    streak = 0
    while cursor.isoformat() in days:
        streak += 1
        cursor -= _td(days=1)
    return streak


async def checked_in_today(db: AsyncSession, user_id: uuid.UUID) -> bool:
    today = _now().date().isoformat()
    res = await db.execute(
        select(XpEvent.id).where(
            and_(XpEvent.user_id == user_id, XpEvent.action == "checkin", XpEvent.ref_id == today)
        ).limit(1)
    )
    return res.first() is not None


async def claim_checkin(db: AsyncSession, user: User) -> dict:
    today = _now().date().isoformat()
    granted = await award_xp(db, user, "checkin", ref_id=today, ref_type="date")
    return {"granted": granted, "xp": user.xp or 0}


# ── Rank card (GM-15) — own or other user ────────────────────────────────────
async def rank_card(db: AsyncSession, user: User) -> dict:
    xp = user.xp or 0
    return {
        "xp": xp,
        "xp_week": await _windowed_xp(db, user.id, week_start()),
        "rank": rank_payload(xp),
        "first_start": None if is_gamification_excluded(user) else first_start_payload(user.first_start_badge),
    }


# ── Leaderboard (§9.18) — Weekly + Lifetime only (v3 §9) ─────────────────────
TOP_N = 50


async def leaderboard(db: AsyncSession, *, period: str, me: User | None) -> dict:
    """Ranked rows + the caller's own standing for the selected board.

    period='week' → XP earned since Monday · period='all' → lifetime XP.
    The monthly board and the contribution boards were removed in v3.
    """
    if period == "all":
        # Lifetime XP — served straight off the denormalized cache.
        use_lifetime = True
        agg = None
        since = None
    else:
        use_lifetime = False
        since = week_start()
        agg = (
            select(XpEvent.user_id, func.coalesce(func.sum(XpEvent.points), 0).label("points"))
            .where(XpEvent.created_at >= since)
            .group_by(XpEvent.user_id)
            .subquery()
        )

    # Staff never rank (QA 2026-08-04 §4). They earn no XP either, so this is belt
    # and braces — it also cleans up any XP banked before the exclusion landed.
    not_staff = User.is_admin.is_(False)
    if use_lifetime:
        q = (
            select(User, User.xp.label("points"))
            .where(not_staff)
            .order_by(User.xp.desc(), User.followers_count.desc())
            .limit(TOP_N)
        )
    else:
        q = (
            select(User, agg.c.points)
            .join(agg, agg.c.user_id == User.id)
            .where(not_staff)
            .order_by(agg.c.points.desc(), User.followers_count.desc())
            .limit(TOP_N)
        )

    res = await db.execute(q)
    raw = res.all()

    rows = [_row(u, int(pts or 0), me) for (u, pts) in raw]
    standing = await _my_standing(db, me, period, since, use_lifetime, rows)
    return {"period": period, "rows": rows, "me": standing}


def _row(u: User, points: int, me: User | None) -> dict:
    return {
        "key": "you" if (me is not None and u.id == me.id) else u.handle,
        "handle": u.handle,
        "name": "You" if (me is not None and u.id == me.id) else u.name,
        "avatar_url": u.avatar_url,
        "points": points,
        "tier_id": tier_of(u.xp or 0)["id"],
        "tier_name": tier_of(u.xp or 0)["name"],
        "badge": feed_badge(u),
        "is_me": me is not None and u.id == me.id,
    }


async def _my_standing(db, me, period, since, use_lifetime, rows) -> dict | None:
    """Caller's rank + score for this board, even when outside the top-N.

    None for staff — they're not on the board at all, so a "you're #4,213" strip
    would be a rank they can never move."""
    if me is None or is_gamification_excluded(me):
        return None
    # If already in the displayed rows, reuse it.
    for i, r in enumerate(rows):
        if r["is_me"]:
            return {"rank": i + 1, "points": r["points"], **{k: r[k] for k in ("tier_id", "tier_name", "badge")}}

    if use_lifetime:
        my_points = me.xp or 0
        higher = await _scalar(db, select(func.count()).select_from(User).where(
            User.xp > my_points, User.is_admin.is_(False)
        ))
    else:
        my_points = await _windowed_xp(db, me.id, since)
        higher = await _count_users_above_window(db, since, my_points)

    return {
        "rank": higher + 1,
        "points": my_points,
        "tier_id": tier_of(me.xp or 0)["id"],
        "tier_name": tier_of(me.xp or 0)["name"],
        "badge": feed_badge(me),
    }


async def _scalar(db, stmt) -> int:
    res = await db.execute(stmt)
    return int(res.scalar() or 0)


async def _count_users_above_window(db, since, my_points) -> int:
    sub = (
        select(XpEvent.user_id, func.sum(XpEvent.points).label("p"))
        .join(User, User.id == XpEvent.user_id)
        .where(XpEvent.created_at >= since, User.is_admin.is_(False))
        .group_by(XpEvent.user_id)
        .having(func.sum(XpEvent.points) > my_points)
        .subquery()
    )
    return await _scalar(db, select(func.count()).select_from(sub))


# ── Leaderboard / Season badges (§9.19 / v3 §6.2) ────────────────────────────
async def badges_of(db: AsyncSession, user_id: uuid.UUID) -> list[SeasonBadge]:
    res = await db.execute(select(SeasonBadge).where(SeasonBadge.user_id == user_id))
    badges = list(res.scalars().all())
    badges.sort(key=lambda b: (BADGE_TIER_RANK.get(b.tier, 9), -b.awarded_at.timestamp()))
    return badges


def badge_payload(b: SeasonBadge) -> dict:
    return {
        "id": str(b.id),
        "tier": b.tier,
        "kind": b.kind,
        "period": b.period,
        "title": b.title,
        "bonus_xp": b.bonus_xp,
    }


async def trophy_case(db: AsyncSession, user: User) -> dict:
    # Staff hold no badges at all (QA 2026-08-04 §4) — an empty case, not a shelf.
    if is_gamification_excluded(user):
        return {"first_start": None, "count": 0, "bonus_xp_total": 0, "badges": []}
    badges = await badges_of(db, user.id)
    return {
        # First Start badges sit first on the shelf (v3 §2.1).
        "first_start": first_start_payload(user.first_start_badge),
        "count": len(badges),
        "bonus_xp_total": sum(b.bonus_xp for b in badges),
        "badges": [badge_payload(b) for b in badges],
    }


async def award_season_badge(
    db: AsyncSession, user: User, *, tier: str, kind: str, period: str, title: str
) -> SeasonBadge:
    """Award a permanent leaderboard badge + bank its bonus XP (v3 §6.2).

    Phase 1 uses this from the seed; the Phase-2 cycle-end worker is a thin loop
    over the top-10 finishers calling this.
    """
    bonus = SEASON_REWARD.get(tier, 0)
    badge = SeasonBadge(
        id=uuid.uuid4(), user_id=user.id, tier=tier, kind=kind,
        period=period, title=title, bonus_xp=bonus, awarded_at=_now(),
    )
    db.add(badge)
    if bonus:
        # Banked to lifetime rank XP, not shown as a separate season-XP total.
        # Ledger row keyed to the badge so it's once-only.
        db.add(XpEvent(
            id=uuid.uuid4(), user_id=user.id, action="badge",
            points=bonus, ref_type="badge", ref_id=str(badge.id), created_at=_now(),
        ))
        old_xp = user.xp or 0
        user.xp = old_xp + bonus
        await _emit_rank_up(db, user, old_xp, user.xp)
    return badge


# ── Cycle-end award worker (§9.18/§9.19 / v3 §9) ─────────────────────────────
# A weekly cycle ends every Monday. The Phase-2 worker
# (workers.tasks.award_season_badges) calls award_cycle_badges for the
# most-recently-completed week; the cycle guard makes re-runs free, so it
# self-heals across missed ticks and restarts. The monthly board and contribution
# boards were removed in v3 — the weekly league is the only badge-minting cycle.
_BADGE_TIERS = ["gold", "silver", "bronze"]  # ranks 1–3; rest = finalist (v3 §6.2)
_TIER_LABEL = {"gold": "Champion", "silver": "Silver", "bronze": "Bronze", "finalist": "Finalist"}


def iso_week_period(d: datetime) -> str:
    """ISO-week cycle label, e.g. "Wk 25 · 2026" (matches the seed format)."""
    iso = d.isocalendar()
    return f"Wk {iso.week} · {iso.year}"


def _badge_tier_for_rank(i: int) -> str:
    """0-based finishing position → badge tier (1st gold … 4th-10th finalist)."""
    return _BADGE_TIERS[i] if i < len(_BADGE_TIERS) else "finalist"


def _badge_title(tier: str) -> str:
    return f"Weekly {_TIER_LABEL[tier]}"  # e.g. "Weekly Bronze"


async def cycle_already_awarded(db: AsyncSession, kind: str, period: str) -> bool:
    res = await db.execute(
        select(SeasonBadge.id)
        .where(and_(SeasonBadge.kind == kind, SeasonBadge.period == period))
        .limit(1)
    )
    return res.first() is not None


async def _window_top(db: AsyncSession, since: datetime, until: datetime, limit: int):
    """Top finishers by XP summed over [since, until) — mirrors the windowed
    leaderboard agg, tie-broken on followers like the live board."""
    pts = func.coalesce(func.sum(XpEvent.points), 0)
    res = await db.execute(
        select(User, pts.label("points"))
        .join(XpEvent, XpEvent.user_id == User.id)
        .where(and_(XpEvent.created_at >= since, XpEvent.created_at < until))
        .group_by(User.id)
        .order_by(pts.desc(), User.followers_count.desc())
        .limit(limit)
    )
    return res.all()


async def award_cycle_badges(
    db: AsyncSession, *, kind: str, since: datetime, until: datetime, period: str
) -> int:
    """Award leaderboard badges to the top 10 finishers of a completed weekly
    cycle (v3 §6.2).

    Idempotent: a cycle that already has any badge is skipped wholesale. Returns
    the number of badges minted. The caller commits."""
    if await cycle_already_awarded(db, kind, period):
        return 0
    awarded = 0
    for i, (user, points) in enumerate(await _window_top(db, since, until, limit=10)):
        if (points or 0) <= 0:
            continue  # no real activity → no badge
        tier = _badge_tier_for_rank(i)
        badge = await award_season_badge(
            db, user, tier=tier, kind=kind, period=period, title=_badge_title(tier),
        )
        db.add(Notification(
            user_id=user.id,
            kind="season_badge",
            title="You earned a season badge!",
            body=f"{badge.title} — {badge.period}. +{badge.bonus_xp} bonus XP banked.",
            ref_type="badge",
            ref_id=str(badge.id),
        ))
        awarded += 1
    return awarded
