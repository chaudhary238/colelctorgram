"""GET /v1/cities — the dynamic canonical city list behind CityField.

Founder 2026-09-06: the list must live in the DB (adding a city = an insert,
not a frontend deploy). Locks the ranking contract the frontend relies on:
empty q → metros by popularity; alias starts-with outranks contains; the value
returned is always the canonical name (never the alias typed).
"""
import pytest

from app.models.place import City
from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio


async def _seed_cities(db):
    db.add_all([
        City(name="Mumbai", region="Maharashtra", country="India", aliases="bombay", popularity=100),
        City(name="Bengaluru", region="Karnataka", country="India", aliases="bangalore,blr", popularity=98),
        City(name="Navi Mumbai", region="Maharashtra", country="India", popularity=0),
        City(name="Kochi", region="Kerala", country="India", aliases="cochin,ernakulam", popularity=0),
        City(name="Tokyo", region="Kantō", country="Japan", popularity=10),
    ])
    await db.commit()


async def test_empty_query_returns_metros_by_popularity(client, db):
    u = await signup_verified(client, "citydefault")
    await _seed_cities(db)
    r = await client.get("/v1/cities", headers=u["headers"])
    assert r.status_code == 200
    names = [c["name"] for c in r.json()["cities"]]
    assert names[:2] == ["Mumbai", "Bengaluru"]


async def test_alias_resolves_to_canonical_name(client, db):
    # "banglore"-class typos are the whole point of a fed list: "bangalore"
    # must land on the one canonical "Bengaluru" value.
    u = await signup_verified(client, "cityalias")
    await _seed_cities(db)
    r = await client.get("/v1/cities?q=bangalore", headers=u["headers"])
    cities = r.json()["cities"]
    assert cities[0]["name"] == "Bengaluru"
    assert cities[0]["country"] == "India"


async def test_startswith_outranks_contains(client, db):
    # "mum" starts Mumbai but only appears inside "Navi Mumbai".
    u = await signup_verified(client, "cityrank")
    await _seed_cities(db)
    names = [c["name"] for c in (await client.get("/v1/cities?q=mum", headers=u["headers"])).json()["cities"]]
    assert names.index("Mumbai") < names.index("Navi Mumbai")


async def test_region_and_country_match(client, db):
    u = await signup_verified(client, "cityregion")
    await _seed_cities(db)
    kerala = [c["name"] for c in (await client.get("/v1/cities?q=kerala", headers=u["headers"])).json()["cities"]]
    assert kerala == ["Kochi"]
    japan = [c["name"] for c in (await client.get("/v1/cities?q=japan", headers=u["headers"])).json()["cities"]]
    assert japan == ["Tokyo"]


async def test_requires_auth(client):
    r = await client.get("/v1/cities")
    assert r.status_code in (401, 403)
