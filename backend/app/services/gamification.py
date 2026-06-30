"""Collector XP, ranks, archetypes, leaderboards & season badges (BRD v1.4 §8.12).

This module is the single source of truth for the *mechanics* — tier thresholds,
earn-action point values, dimension mapping, dedup and the windowed aggregates
behind the Rewards screen and leaderboard. Visual tokens (rank/archetype colours
and icons) live on the frontend, keyed by the ids returned here.

Award model (see models/gamification.XpEvent):
- Every grant is an append-only ledger row. ``award_xp`` inserts with
  ON CONFLICT DO NOTHING against the partial-unique (user, action, ref_id) index,
  so calls are idempotent (re-like, double check-in) — only a real insert bumps
  the denormalized ``users.xp`` cache.
- Lifetime XP is read on every profile/card → served from ``users.xp`` (O(1)).
- Weekly/monthly windows and the 4-way contribution mix are derived on demand
  from the ledger; never stored (no reset jobs, never stale).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func, and_, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import XpEvent, SeasonBadge
from app.models.notification import Notification
from app.models.user import User

# ── Rank tiers (GM-02/03) — ascending; rank is derived from lifetime XP ───────
# `live` = the perk is actually enforced in the build (real behaviour/UI). The two
# non-live perks are product-gated on systems that don't exist in Phase 1 — "early
# drop alerts" needs a drops/release-calendar feed (M15), "priority verification"
# needs a verification review queue (today verification is instant self-serve). The
# rank ladder shows these as "Coming soon" rather than faking them.
REWARD_TIERS = [
    {"id": "rookie",    "name": "Rookie",    "at": 0,    "perk": "Welcome to the shelf",     "live": True},
    {"id": "fan",       "name": "Fan",       "at": 250,  "perk": "Profile flair unlocked",   "live": True},
    {"id": "collector", "name": "Collector", "at": 750,  "perk": "Early drop alerts",        "live": False},
    {"id": "pro",       "name": "Pro",       "at": 1800, "perk": "Showcases get featured",   "live": True},
    {"id": "expert",    "name": "Expert",    "at": 4000, "perk": "Priority verification",    "live": False},
    {"id": "legend",    "name": "Legend",    "at": 8000, "perk": "Legend badge + spotlight", "live": True},
]

# Pro-tier threshold — showcases from Pro+ collectors get a discovery-feed boost.
PRO_TIER_AT = next(t["at"] for t in REWARD_TIERS if t["id"] == "pro")


def discovery_featured(author_xp: int | None) -> bool:
    """GM-03 Pro perk: is this author ranked Pro or above (showcases featured)?"""
    return (author_xp or 0) >= PRO_TIER_AT

# ── Contribution dimensions → archetype (GM-06) ──────────────────────────────
DIMENSIONS = ["posts", "social", "collection", "market"]
ARCHETYPES = {
    "posts":      {"id": "posts",      "name": "Showcaser", "label": "Showcases"},
    "social":     {"id": "social",     "name": "Connector", "label": "Community"},
    "collection": {"id": "collection", "name": "Archivist", "label": "Collection"},
    "market":     {"id": "market",     "name": "Trader",    "label": "Market"},
}

# ── Earn table (GM-05) — single source for points + dimension + frequency ────
# `dimension` 'none' = feeds lifetime rank XP but not the 4-way archetype mix.
# Order here is the display order on the Rewards "Ways to earn" list.
EARN_RULES = {
    "profile":  {"points": 50, "dimension": "none",       "freq": "once",   "label": "Complete your profile", "icon": "user"},
    "refer":    {"points": 40, "dimension": "none",       "freq": "repeat", "label": "Refer a friend",        "icon": "gift"},
    "item":     {"points": 20, "dimension": "collection", "freq": "repeat", "label": "Add a verified item",   "icon": "box"},
    "showcase": {"points": 15, "dimension": "posts",      "freq": "repeat", "label": "Post a showcase",       "icon": "camera"},
    "review":   {"points": 15, "dimension": "posts",      "freq": "repeat", "label": "Write a review",        "icon": "star"},
    "vouch":    {"points": 10, "dimension": "market",     "freq": "repeat", "label": "Vouch for a collector", "icon": "shield"},
    "rsvp":     {"points": 10, "dimension": "none",       "freq": "repeat", "label": "RSVP to an event",      "icon": "calendar"},
    "comment":  {"points": 5,  "dimension": "social",     "freq": "repeat", "label": "Comment on a post",     "icon": "comment"},
    "like":     {"points": 1,  "dimension": "social",     "freq": "repeat", "label": "Like a post",           "icon": "heart"},
    "checkin":  {"points": 5,  "dimension": "none",       "freq": "daily",  "label": "Daily check-in",        "icon": "zap"},
}

# Season-badge bonus XP banked toward lifetime rank (GM-12).
SEASON_REWARD = {"gold": 300, "silver": 200, "bronze": 120, "finalist": 50}
BADGE_TIER_RANK = {"gold": 0, "silver": 1, "bronze": 2, "finalist": 3}

# The 5 steps behind "Complete your profile" (GM-05, +50 one-time).
PROFILE_STEPS = 5


def _now() -> datetime:
    return datetime.now(timezone.utc)


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
async def award_xp(
    db: AsyncSession,
    user: User,
    action: str,
    *,
    ref_id: str | None = None,
    ref_type: str | None = None,
) -> bool:
    """Grant XP for `action`, idempotently. Returns True iff a new grant landed.

    Safe to call unconditionally from action routers — the partial-unique index
    dedups repeat grants (same user+action+ref_id). On a real insert the
    denormalized ``users.xp`` cache is bumped on the same session/transaction.
    """
    rule = EARN_RULES.get(action)
    if rule is None:
        return False

    stmt = (
        pg_insert(XpEvent)
        .values(
            id=uuid.uuid4(),
            user_id=user.id,
            action=action,
            dimension=rule["dimension"],
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
    """Notify on rank promotion (§9.17 P2 / GM-02). No-op unless the grant crossed
    a tier threshold. Deduped per (user, tier) so a tier is only ever announced once
    — XP is monotonic, so the crossing happens once, but the guard also protects the
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
        body=f"You're now a {tier['name']} — {tier['perk']}.",
        ref_type="rank",
        ref_id=tier["id"],
    ))


async def maybe_award_profile_complete(db: AsyncSession, user: User) -> bool:
    """Award the one-time +50 once all 5 profile steps are filled (dedup'd on ref_id='profile')."""
    done, total = profile_completion(user)
    if done < total:
        return False
    return await award_xp(db, user, "profile", ref_id="profile", ref_type="profile")


# ── Time windows (GM-09) ─────────────────────────────────────────────────────
def week_start() -> datetime:
    """Most recent Monday 00:00 UTC — weekly boards reset Monday."""
    now = _now()
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def month_start() -> datetime:
    now = _now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def _windowed_xp(db: AsyncSession, user_id: uuid.UUID, since: datetime) -> int:
    res = await db.execute(
        select(func.coalesce(func.sum(XpEvent.points), 0)).where(
            and_(XpEvent.user_id == user_id, XpEvent.created_at >= since)
        )
    )
    return int(res.scalar() or 0)


async def _contrib_sums(db: AsyncSession, user_id: uuid.UUID) -> dict[str, int]:
    """Lifetime XP per contribution dimension (the 4-way mix, GM-07)."""
    res = await db.execute(
        select(XpEvent.dimension, func.coalesce(func.sum(XpEvent.points), 0))
        .where(and_(XpEvent.user_id == user_id, XpEvent.dimension.in_(DIMENSIONS)))
        .group_by(XpEvent.dimension)
    )
    sums = {d: 0 for d in DIMENSIONS}
    for dim, total in res.all():
        sums[dim] = int(total or 0)
    return sums


def archetype_of(contrib: dict[str, int]) -> dict:
    """Dominant contribution dimension → archetype (GM-06). Defaults to Connector."""
    best, best_val = "social", -1
    for d in DIMENSIONS:
        if contrib.get(d, 0) > best_val:
            best_val, best = contrib.get(d, 0), d
    return ARCHETYPES[best]


def contrib_mix(contrib: dict[str, int]) -> list[dict]:
    """Stacked-bar rows: percentage of contribution XP per dimension, desc."""
    total = sum(contrib.values()) or 1
    rows = [
        {
            "dimension": d,
            "label": ARCHETYPES[d]["label"],
            "archetype": ARCHETYPES[d]["name"],
            "points": contrib.get(d, 0),
            "pct": round(contrib.get(d, 0) / total * 100),
        }
        for d in DIMENSIONS
    ]
    rows.sort(key=lambda r: r["points"], reverse=True)
    return rows


# ── Rewards screen payload (§9.17) ───────────────────────────────────────────
async def rewards_summary(db: AsyncSession, user: User) -> dict:
    xp = user.xp or 0
    contrib = await _contrib_sums(db, user.id)
    xp_week = await _windowed_xp(db, user.id, week_start())
    xp_month = await _windowed_xp(db, user.id, month_start())
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
        if action == "checkin":
            continue  # rendered separately at top of the screen
        row = {"id": action, "label": rule["label"], "xp": rule["points"],
               "icon": rule["icon"], "freq": rule["freq"]}
        if action == "profile":
            row["progress"] = {"done": done, "total": total}
        earn.append(row)

    return {
        "xp": xp,
        "xp_week": xp_week,
        "xp_month": xp_month,
        "rank": rank_payload(xp),
        "archetype": archetype_of(contrib),
        "contrib_mix": contrib_mix(contrib),
        "earn_actions": earn,
        "checkin": {
            "claimed": checked_in,
            "xp": EARN_RULES["checkin"]["points"],
            "streak": await checkin_streak(db, user.id),
        },
        # GM-05 referral: the share code is the handle; count = friends credited.
        "referral": {"code": user.handle, "count": referral_count, "xp": EARN_RULES["refer"]["points"]},
    }


async def checkin_streak(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Consecutive-day check-in streak (§9.17 P2 / GM-04). Derived from the ledger
    (check-in rows carry the calendar date in ref_id) — no stored counter, never
    stale. Counts back from today, or from yesterday if today isn't yet claimed, so
    the streak is preserved up to the moment it would actually break."""
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


# ── Rank card (GM-15) — own (full) or other user (no contribution mix) ────────
async def rank_card(db: AsyncSession, user: User, *, include_mix: bool) -> dict:
    xp = user.xp or 0
    contrib = await _contrib_sums(db, user.id)
    payload = {
        "xp": xp,
        "xp_week": await _windowed_xp(db, user.id, week_start()),
        "rank": rank_payload(xp),
        "archetype": archetype_of(contrib),
    }
    if include_mix:
        payload["contrib_mix"] = contrib_mix(contrib)
    return payload


# ── Leaderboard (§9.18 / GM-08..GM-10) ───────────────────────────────────────
TOP_N = 50


async def leaderboard(
    db: AsyncSession,
    *,
    mode: str,
    period: str,
    cat: str,
    me: User | None,
) -> dict:
    """Ranked rows + the caller's own standing for the selected board.

    mode='xp'      → period in {week, month, all}
    mode='contrib' → cat in {posts, social, collection, market} (lifetime totals)
    """
    if mode == "contrib":
        points_col = func.coalesce(
            func.sum(XpEvent.points).filter(XpEvent.dimension == cat), 0
        ).label("points")
        agg = (
            select(XpEvent.user_id, points_col)
            .where(XpEvent.dimension == cat)
            .group_by(XpEvent.user_id)
            .subquery()
        )
        use_lifetime = False
        since = None
    elif period == "all":
        # Lifetime XP — served straight off the denormalized cache.
        use_lifetime = True
        agg = None
        since = None
    else:
        since = week_start() if period == "week" else month_start()
        agg = (
            select(XpEvent.user_id, func.coalesce(func.sum(XpEvent.points), 0).label("points"))
            .where(XpEvent.created_at >= since)
            .group_by(XpEvent.user_id)
            .subquery()
        )
        use_lifetime = False

    if use_lifetime:
        q = (
            select(User, User.xp.label("points"))
            .order_by(User.xp.desc(), User.followers_count.desc())
            .limit(TOP_N)
        )
    else:
        q = (
            select(User, agg.c.points)
            .join(agg, agg.c.user_id == User.id)
            .order_by(agg.c.points.desc(), User.followers_count.desc())
            .limit(TOP_N)
        )

    res = await db.execute(q)
    raw = res.all()

    # Per-row archetype needs each displayed user's dimension breakdown — bounded
    # to the rows actually shown (≤ TOP_N + me), so a single grouped query.
    shown_ids = [u.id for (u, _pts) in raw]
    if me is not None and me.id not in shown_ids:
        shown_ids.append(me.id)
    arche_by_user = await _archetypes_for(db, shown_ids)

    rows = []
    for (u, pts) in raw:
        rows.append(_row(u, int(pts or 0), me, arche_by_user))

    standing = await _my_standing(db, me, mode, period, cat, since, use_lifetime, rows, arche_by_user)
    return {"mode": mode, "period": period, "cat": cat, "rows": rows, "me": standing}


def _row(u: User, points: int, me: User | None, arche_by_user: dict) -> dict:
    return {
        "key": "you" if (me is not None and u.id == me.id) else u.handle,
        "handle": u.handle,
        "name": "You" if (me is not None and u.id == me.id) else u.name,
        "avatar_url": u.avatar_url,
        "points": points,
        "tier_id": tier_of(u.xp or 0)["id"],
        "tier_name": tier_of(u.xp or 0)["name"],
        "archetype": arche_by_user.get(u.id, ARCHETYPES["social"]),
        "is_me": me is not None and u.id == me.id,
    }


async def _archetypes_for(db: AsyncSession, user_ids: list[uuid.UUID]) -> dict:
    if not user_ids:
        return {}
    res = await db.execute(
        select(XpEvent.user_id, XpEvent.dimension, func.coalesce(func.sum(XpEvent.points), 0))
        .where(and_(XpEvent.user_id.in_(user_ids), XpEvent.dimension.in_(DIMENSIONS)))
        .group_by(XpEvent.user_id, XpEvent.dimension)
    )
    sums: dict[uuid.UUID, dict[str, int]] = {uid: {d: 0 for d in DIMENSIONS} for uid in user_ids}
    for uid, dim, total in res.all():
        sums[uid][dim] = int(total or 0)
    return {uid: archetype_of(s) for uid, s in sums.items()}


async def _my_standing(db, me, mode, period, cat, since, use_lifetime, rows, arche_by_user) -> dict | None:
    """Caller's rank + score for this board, even when outside the top-N (GM-10)."""
    if me is None:
        return None
    # If already in the displayed rows, reuse it.
    for i, r in enumerate(rows):
        if r["is_me"]:
            return {"rank": i + 1, "points": r["points"], **{k: r[k] for k in ("tier_id", "tier_name", "archetype")}}

    if mode == "contrib":
        my_points = await _scalar_sum(db, and_(XpEvent.user_id == me.id, XpEvent.dimension == cat))
        higher = await _count_users_above_contrib(db, cat, my_points)
    elif use_lifetime:
        my_points = me.xp or 0
        higher = await _scalar(db, select(func.count()).select_from(User).where(User.xp > my_points))
    else:
        my_points = await _windowed_xp(db, me.id, since)
        higher = await _count_users_above_window(db, since, my_points)

    return {
        "rank": higher + 1,
        "points": my_points,
        "tier_id": tier_of(me.xp or 0)["id"],
        "tier_name": tier_of(me.xp or 0)["name"],
        "archetype": arche_by_user.get(me.id, ARCHETYPES["social"]),
    }


async def _scalar(db, stmt) -> int:
    res = await db.execute(stmt)
    return int(res.scalar() or 0)


async def _scalar_sum(db, where) -> int:
    return await _scalar(db, select(func.coalesce(func.sum(XpEvent.points), 0)).where(where))


async def _count_users_above_window(db, since, my_points) -> int:
    sub = (
        select(XpEvent.user_id, func.sum(XpEvent.points).label("p"))
        .where(XpEvent.created_at >= since)
        .group_by(XpEvent.user_id)
        .having(func.sum(XpEvent.points) > my_points)
        .subquery()
    )
    return await _scalar(db, select(func.count()).select_from(sub))


async def _count_users_above_contrib(db, cat, my_points) -> int:
    sub = (
        select(XpEvent.user_id, func.sum(XpEvent.points).label("p"))
        .where(XpEvent.dimension == cat)
        .group_by(XpEvent.user_id)
        .having(func.sum(XpEvent.points) > my_points)
        .subquery()
    )
    return await _scalar(db, select(func.count()).select_from(sub))


# ── Season badges (§9.19 / GM-11..GM-14) ─────────────────────────────────────
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
    badges = await badges_of(db, user.id)
    return {
        "count": len(badges),
        "bonus_xp_total": sum(b.bonus_xp for b in badges),
        "badges": [badge_payload(b) for b in badges],
    }


async def award_season_badge(
    db: AsyncSession, user: User, *, tier: str, kind: str, period: str, title: str
) -> SeasonBadge:
    """Award a permanent season badge + bank its bonus XP (GM-11/12).

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
        # Banked to lifetime rank XP, not shown as a separate season-XP total
        # (GM-12). Dimension-less ledger row keyed to the badge so it's once-only.
        db.add(XpEvent(
            id=uuid.uuid4(), user_id=user.id, action="badge", dimension="none",
            points=bonus, ref_type="badge", ref_id=str(badge.id), created_at=_now(),
        ))
        old_xp = user.xp or 0
        user.xp = old_xp + bonus
        await _emit_rank_up(db, user, old_xp, user.xp)
    return badge


# ── Cycle-end award worker (GM-11/12, §9.18/§9.19) ───────────────────────────
# A weekly cycle ends every Monday, a monthly cycle on the 1st. The Phase-2
# worker (workers.tasks.award_season_badges) calls award_cycle_badges for the
# most-recently-completed week and month; the cycle guard makes re-runs free, so
# it self-heals across missed ticks and restarts. Contribution boards are
# lifetime (GM-09) — they never reset, so they never mint badges.
_BADGE_TIERS = ["gold", "silver", "bronze"]  # ranks 1–3; rest = finalist (GM-11)
_TIER_LABEL = {"gold": "Champion", "silver": "Silver", "bronze": "Bronze", "finalist": "Finalist"}


def iso_week_period(d: datetime) -> str:
    """ISO-week cycle label, e.g. "Wk 25 · 2026" (matches the seed format)."""
    iso = d.isocalendar()
    return f"Wk {iso.week} · {iso.year}"


def month_period(d: datetime) -> str:
    """Month cycle label, e.g. "May 2026" (matches the seed format)."""
    return d.strftime("%b %Y")


def _badge_tier_for_rank(i: int) -> str:
    """0-based finishing position → badge tier (1st gold … 4th-10th finalist)."""
    return _BADGE_TIERS[i] if i < len(_BADGE_TIERS) else "finalist"


def _badge_title(kind: str, tier: str, period: str) -> str:
    label = _TIER_LABEL[tier]
    if kind == "weekly":
        return f"Weekly {label}"           # e.g. "Weekly Bronze"
    return f"{period.split()[0]} {label}"  # e.g. "May Champion"


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
    """Award season badges to the top 10 finishers of a completed cycle (GM-11/12).

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
            db, user, tier=tier, kind=kind, period=period,
            title=_badge_title(kind, tier, period),
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
