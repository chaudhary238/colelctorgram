"""Comment replies — answering a reply, and who gets notified.

Threads stay one level deep: a reply to a reply files under the same top-level
comment, but the person answered is the one notified. @mentions notify too, and
nobody is notified twice for one comment.
"""
import pytest

from app.models.catalogue import Catalogue
from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio


async def _make_post(client, headers, body="hello world") -> str:
    r = await client.post("/v1/posts", json={"type": "discussion", "body": body}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _comment(client, headers, post_id, body, parent_id=None) -> dict:
    r = await client.post(f"/v1/posts/{post_id}/comments", headers=headers,
                          json={"body": body, "parent_id": parent_id})
    assert r.status_code == 201, r.text
    return r.json()


async def _notifs(client, headers) -> list[tuple[str, str]]:
    r = await client.get("/v1/notifications", headers=headers)
    assert r.status_code == 200, r.text
    return [(n["kind"], n["body"]) for n in r.json()]


async def test_reply_to_a_reply_threads_under_parent_and_notifies_its_author(client):
    ann = await signup_verified(client, "ann")
    ben = await signup_verified(client, "ben")
    cat = await signup_verified(client, "cat")
    post_id = await _make_post(client, ann["headers"])

    top = await _comment(client, ben["headers"], post_id, "great shot")
    reply = await _comment(client, cat["headers"], post_id, "agreed", parent_id=top["id"])
    # ben answers cat's reply, not his own top-level comment
    answer = await _comment(client, ben["headers"], post_id, "@cat thanks", parent_id=reply["id"])

    assert reply["parent_id"] == top["id"]
    assert answer["parent_id"] == top["id"]  # still one level deep

    # cat was answered — and @mentioned in the same comment — but hears about it once
    assert [k for k, _ in await _notifs(client, cat["headers"])] == ["reply"]
    # ben was replied to by cat
    assert [k for k, _ in await _notifs(client, ben["headers"])] == ["reply"]
    # ann owns the post: one "comment" per comment by someone else
    assert [k for k, _ in await _notifs(client, ann["headers"])] == ["comment"] * 3


async def test_mentions_notify_and_post_author_not_doubled(client):
    ann = await signup_verified(client, "ann")
    ben = await signup_verified(client, "ben")
    dan = await signup_verified(client, "dan")
    post_id = await _make_post(client, ann["headers"])

    await _comment(client, dan["headers"], post_id, "@ben @ann check this out")

    assert [k for k, _ in await _notifs(client, ben["headers"])] == ["mention"]
    # ann is the post author AND mentioned: the more specific reason wins, once
    assert [k for k, _ in await _notifs(client, ann["headers"])] == ["mention"]
    # self-mention never notifies
    await _comment(client, dan["headers"], post_id, "me again @dan")
    assert await _notifs(client, dan["headers"]) == []


async def test_reply_parent_must_belong_to_the_post(client):
    ann = await signup_verified(client, "ann")
    ben = await signup_verified(client, "ben")
    first = await _make_post(client, ann["headers"], "one")
    second = await _make_post(client, ann["headers"], "two")
    top = await _comment(client, ben["headers"], first, "hi")

    r = await client.post(f"/v1/posts/{second}/comments", headers=ben["headers"],
                          json={"body": "wrong thread", "parent_id": top["id"]})
    assert r.status_code == 404, r.text


async def test_blocked_users_are_not_notified(client):
    ann = await signup_verified(client, "ann")
    ben = await signup_verified(client, "ben")
    cat = await signup_verified(client, "cat")
    post_id = await _make_post(client, ann["headers"])
    top = await _comment(client, ben["headers"], post_id, "first")

    blk = await client.post(f"/v1/blocks?target_id={cat['id']}", headers=ben["headers"])
    assert blk.status_code == 204, blk.text
    await _comment(client, cat["headers"], post_id, "@ben hey", parent_id=top["id"])

    assert await _notifs(client, ben["headers"]) == []


async def test_catalogue_reply_to_a_reply(client, db):
    ann = await signup_verified(client, "ann")
    ben = await signup_verified(client, "ben")
    db.add(Catalogue(sku="TEST-SKU-1", title="Test Figure", norm_title="test figure",
                     brand="Hot Toys", category="figures"))
    await db.commit()
    url = "/v1/catalogue/TEST-SKU-1/comments"

    top = (await client.post(url, headers=ann["headers"], json={"body": "who has this?"})).json()
    reply = await client.post(url, headers=ben["headers"], json={"body": "me", "parent_id": top["id"]})
    assert reply.status_code == 201, reply.text
    answer = await client.post(url, headers=ann["headers"],
                               json={"body": "@ben how is it?", "parent_id": reply.json()["id"]})
    assert answer.status_code == 201, answer.text
    assert answer.json()["parent_id"] == top["id"]

    assert await _notifs(client, ann["headers"]) == [("reply", "replied to your comment: me")]
    assert [k for k, _ in await _notifs(client, ben["headers"])] == ["reply"]
