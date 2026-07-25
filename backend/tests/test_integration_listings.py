"""T-01 integration — C-06 saved-listing price/status alerts (MK-09).

A user who saved a listing gets a price_drop notification when the seller lowers
the price, and a listing_sold notification when it's marked sold. The seller never
self-notifies, and the recipient's `price_drops` toggle gates it.
"""
import pytest

from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio


async def _seller_listing(client, seller_headers, price=100000) -> str:
    item = await client.post("/v1/items", json={
        "custom_title": "Grail Figure", "value": price, "cover_url": "https://img.test/cover.png",
    }, headers=seller_headers)
    assert item.status_code == 201, item.text
    item_id = item.json()["id"]
    listing = await client.post("/v1/listings", json={
        "item_id": item_id, "price": price, "condition": "Sealed",
    }, headers=seller_headers)
    assert listing.status_code == 201, listing.text
    return listing.json()["id"]


async def _notif_kinds(client, headers) -> list:
    r = await client.get("/v1/notifications", headers=headers)
    assert r.status_code == 200, r.text
    return [n["kind"] for n in r.json()]


async def test_saver_gets_price_drop_alert(client):
    seller = await signup_verified(client, "seller1")
    buyer = await signup_verified(client, "buyer1")
    lid = await _seller_listing(client, seller["headers"], price=100000)

    # buyer saves it
    assert (await client.post(f"/v1/listings/{lid}/save", headers=buyer["headers"])).status_code == 204

    # seller drops the price
    r = await client.patch(f"/v1/listings/{lid}", json={"price": 80000}, headers=seller["headers"])
    assert r.status_code == 200, r.text

    # buyer is alerted; seller is not self-notified
    assert "price_drop" in await _notif_kinds(client, buyer["headers"])
    assert "price_drop" not in await _notif_kinds(client, seller["headers"])


async def test_price_increase_does_not_alert(client):
    seller = await signup_verified(client, "seller2")
    buyer = await signup_verified(client, "buyer2")
    lid = await _seller_listing(client, seller["headers"], price=50000)
    await client.post(f"/v1/listings/{lid}/save", headers=buyer["headers"])

    # raising the price must NOT fire a price_drop
    await client.patch(f"/v1/listings/{lid}", json={"price": 60000}, headers=seller["headers"])
    assert "price_drop" not in await _notif_kinds(client, buyer["headers"])


async def test_saver_gets_sold_alert(client):
    seller = await signup_verified(client, "seller3")
    buyer = await signup_verified(client, "buyer3")
    lid = await _seller_listing(client, seller["headers"], price=50000)
    await client.post(f"/v1/listings/{lid}/save", headers=buyer["headers"])

    await client.patch(f"/v1/listings/{lid}", json={"status": "sold"}, headers=seller["headers"])
    assert "listing_sold" in await _notif_kinds(client, buyer["headers"])


async def test_price_drops_toggle_off_suppresses_alert(client):
    seller = await signup_verified(client, "seller4")
    buyer = await signup_verified(client, "buyer4")
    # buyer turns off the "price drops on saved" toggle
    off = await client.patch("/v1/users/me", json={"notif_prefs": {"price_drops": False}}, headers=buyer["headers"])
    assert off.status_code == 200, off.text

    lid = await _seller_listing(client, seller["headers"], price=100000)
    await client.post(f"/v1/listings/{lid}/save", headers=buyer["headers"])
    await client.patch(f"/v1/listings/{lid}", json={"price": 70000}, headers=seller["headers"])

    assert "price_drop" not in await _notif_kinds(client, buyer["headers"])
