"""For You ranking (routers/feed.py): time comes first; follow, interest and recent
engagement only add a bounded number of hours. Founder decision 2026-11-01.
"""
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import update

from app.models.post import PostLike
from app.routers.feed import _engagement_bonus, _score
from app.services import feed_cache
from tests.conftest import signup_verified

NOW = datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc)
FRIEND = str(uuid.uuid4())
STRANGER = str(uuid.uuid4())
ME = str(uuid.uuid4())


def post(hours_old: float, author: str = STRANGER, category: str = "figures") -> SimpleNamespace:
    return SimpleNamespace(user_id=author, category=category, created_at=NOW - timedelta(hours=hours_old))


def score(p: SimpleNamespace, interests: tuple[str, ...] = ("figures",), engagement: int = 0) -> float:
    return _score(p, set(interests), {FRIEND}, ME, engagement)


def test_newer_post_outranks_older_when_nothing_else_differs():
    assert score(post(1)) > score(post(2))


def test_follow_outweighs_interest():
    followed_off_topic = score(post(1, FRIEND, "diecast"))
    stranger_on_topic = score(post(1, STRANGER, "figures"))
    assert followed_off_topic > stranger_on_topic


def test_own_post_ranks_exactly_like_a_followed_author():
    assert score(post(3, ME)) == score(post(3, FRIEND))


def test_bonuses_are_worth_the_agreed_hours():
    base = score(post(0), interests=())
    assert score(post(0, FRIEND), interests=()) - base == pytest.approx(12)
    assert score(post(0)) - base == pytest.approx(6)


def test_engagement_is_log_scaled_and_capped():
    assert _engagement_bonus(0) == 0
    assert _engagement_bonus(6) == pytest.approx(5.07, abs=0.01)
    assert _engagement_bonus(99) == pytest.approx(12)
    assert _engagement_bonus(100_000) == 12


def test_nothing_over_30_hours_old_beats_a_brand_new_post():
    best_old = score(post(30.5, FRIEND), engagement=1_000_000)
    brand_new = score(post(0), interests=())
    assert best_old < brand_new


def test_score_is_stable_between_requests():
    p = post(5)
    assert score(p) == score(p)


async def _post(client, headers, category="figures"):
    r = await client.post("/v1/posts", headers=headers, json={
        "type": "showcase", "body": "shelf update", "images": [], "category": category})
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _foryou(client, headers, query=""):
    r = await client.get(f"/v1/feed?sort=foryou{query}", headers=headers)
    assert r.status_code == 200, r.text
    return [p["id"] for p in r.json()["items"]]


@pytest.mark.asyncio
async def test_recent_reactions_lift_a_post_but_own_and_old_ones_do_not(client, db):
    author = await signup_verified(client, "rankauthor")
    fan1 = await signup_verified(client, "rankfan1")
    fan2 = await signup_verified(client, "rankfan2")
    viewer = await signup_verified(client, "rankviewer")
    liked = await _post(client, author["headers"])
    self_liked = await _post(client, author["headers"])
    stale = await _post(client, author["headers"])
    plain = await _post(client, author["headers"])

    await client.post(f"/v1/posts/{self_liked}/like", headers=author["headers"])
    for headers in (fan1["headers"], fan2["headers"]):
        await client.post(f"/v1/posts/{liked}/like", headers=headers)
        await client.post(f"/v1/posts/{stale}/like", headers=headers)
    await db.execute(update(PostLike).where(PostLike.post_id == uuid.UUID(stale)).values(
        created_at=datetime.now(timezone.utc) - timedelta(hours=49)))
    await db.commit()
    feed_cache.invalidate()

    ids = await _foryou(client, viewer["headers"])
    assert ids[0] == liked
    # Newest-first among posts with no counted engagement.
    assert ids.index(plain) < ids.index(stale) < ids.index(self_liked)


@pytest.mark.asyncio
async def test_two_comments_from_one_person_count_once(client):
    author = await signup_verified(client, "chatauthor")
    fan = await signup_verified(client, "chatfan")
    fan2 = await signup_verified(client, "chatfan2")
    viewer = await signup_verified(client, "chatviewer")
    argued = await _post(client, author["headers"])
    discussed = await _post(client, author["headers"])
    for _ in range(3):
        await client.post(f"/v1/posts/{argued}/comments", headers=fan["headers"], json={"body": "no"})
    for commenter in (fan, fan2):
        await client.post(f"/v1/posts/{discussed}/comments", headers=commenter["headers"], json={"body": "nice"})
    feed_cache.invalidate()

    ids = await _foryou(client, viewer["headers"])
    assert ids.index(discussed) < ids.index(argued)


@pytest.mark.asyncio
async def test_pin_leads_page_one_for_the_author_only(client):
    author = await signup_verified(client, "pinauthor")
    other = await signup_verified(client, "pinother")
    mine = await _post(client, author["headers"], "tcg")

    for user in (author, other):
        r = await client.patch("/v1/users/me", headers=user["headers"], json={
            "feed_prefs": {"categories": ["figures"], "hide_listings": False}})
        assert r.status_code == 200, r.text
    assert mine not in await _foryou(client, author["headers"])  # filtered out…

    ids = await _foryou(client, author["headers"], f"&pin={mine}")
    assert ids[0] == mine  # …but still shown once
    assert ids.count(mine) == 1
    assert mine not in await _foryou(client, author["headers"], f"&pin={mine}&page=2")

    # Someone else's post can't be pinned.
    assert mine not in await _foryou(client, other["headers"], f"&pin={mine}")


@pytest.mark.asyncio
async def test_customize_categories_filter_for_you_only(client):
    author = await signup_verified(client, "catauthor")
    viewer = await signup_verified(client, "catviewer")
    tcg = await _post(client, author["headers"], "tcg")

    r = await client.patch("/v1/users/me", headers=viewer["headers"], json={"interests": ["figures"]})
    assert r.status_code == 200, r.text
    assert tcg in await _foryou(client, viewer["headers"])  # never saved Customize: all pass

    await client.patch("/v1/users/me", headers=viewer["headers"], json={
        "feed_prefs": {"categories": ["figures", "tcg"], "hide_listings": False}})
    assert tcg in await _foryou(client, viewer["headers"])  # ticked, though not an interest

    await client.patch("/v1/users/me", headers=viewer["headers"], json={
        "feed_prefs": {"categories": ["figures"], "hide_listings": False}})
    assert tcg not in await _foryou(client, viewer["headers"])
    latest = await client.get("/v1/feed?sort=latest", headers=viewer["headers"])
    assert tcg in [p["id"] for p in latest.json()["items"]]  # Explore ignores Customize


@pytest.mark.asyncio
async def test_followed_authors_bypass_the_customize_filter(client):
    friend = await signup_verified(client, "bypassfriend")
    stranger = await signup_verified(client, "bypassstranger")
    viewer = await signup_verified(client, "bypassviewer")
    r = await client.post(f"/v1/users/{friend['handle']}/follow", headers=viewer["headers"])
    assert r.status_code == 200, r.text
    await client.patch("/v1/users/me", headers=viewer["headers"], json={
        "feed_prefs": {"categories": ["figures"], "hide_listings": False}})

    followed_post = await _post(client, friend["headers"], "diecast")
    stranger_post = await _post(client, stranger["headers"], "diecast")

    ids = await _foryou(client, viewer["headers"])
    assert followed_post in ids
    assert stranger_post not in ids
