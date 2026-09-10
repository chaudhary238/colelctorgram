"""In-process cache of the feed's candidate window (the newest ≤500 published
posts per filter combo).

The candidate query is viewer-independent — blocks, prefs, follows and scoring
are applied per-user in Python afterwards — so one cached window serves every
viewer for the TTL. This removes the dominant CPU cost of GET /feed (500-row
fetch + ORM hydration per request). Counters on cached rows (likes_count, …)
can lag up to the TTL on feed cards; detail pages always re-query.

Single-process only, same constraint as app.ws.manager — move both to Redis
before running multiple workers/instances.
"""
import time

from app.models.post import Post

TTL_SECONDS = 45.0
_MAX_KEYS = 64  # distinct (category, type, tag) combos; oldest evicted beyond

_cache: dict[tuple, tuple[float, list[Post]]] = {}


def get(key: tuple) -> list[Post] | None:
    hit = _cache.get(key)
    if hit and time.monotonic() - hit[0] < TTL_SECONDS:
        return hit[1]
    return None


def put(key: tuple, posts: list[Post]) -> None:
    if len(_cache) >= _MAX_KEYS:
        _cache.pop(min(_cache, key=lambda k: _cache[k][0]), None)
    _cache[key] = (time.monotonic(), posts)


def invalidate() -> None:
    """Drop every window. Called when a post is created, edited, removed or
    approved, so the change is visible immediately instead of after the TTL —
    an author must see their own new post in the feed right away."""
    _cache.clear()
