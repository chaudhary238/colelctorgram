"""B-68 — sliding-window rate limiter unit tests (services/ratelimit.py).

Pure-logic tests on `_hit` (same style as test_item_privacy.py): limits enforced,
window expiry frees the key, keys are isolated, unknown kinds get the default.
"""
import time
from unittest.mock import patch

from app.services import ratelimit
from app.services.ratelimit import RATE_LIMITS, _hit, _store


def setup_function():
    _store.clear()


def test_allows_up_to_limit_then_blocks():
    limit, _ = RATE_LIMITS["auth"]
    for _i in range(limit):
        assert _hit("k1", "auth") is True
    assert _hit("k1", "auth") is False  # over the limit


def test_keys_are_isolated():
    limit, _ = RATE_LIMITS["auth"]
    for _i in range(limit):
        assert _hit("ip:auth:1.1.1.1", "auth") is True
    # a different key is unaffected
    assert _hit("ip:auth:2.2.2.2", "auth") is True


def test_window_expiry_frees_the_key():
    limit, window = RATE_LIMITS["auth"]
    start = time.time()
    with patch.object(ratelimit.time, "time", return_value=start):
        for _i in range(limit):
            _hit("k2", "auth")
        assert _hit("k2", "auth") is False
    # just past the window, hits have expired
    with patch.object(ratelimit.time, "time", return_value=start + window + 1):
        assert _hit("k2", "auth") is True


def test_unknown_kind_uses_default_limit():
    # default is (30, 60)
    for _i in range(30):
        assert _hit("k3", "nope") is True
    assert _hit("k3", "nope") is False


def test_every_wired_kind_has_a_limit():
    # The kinds the routers reference must exist (typo guard).
    for kind in ("auth", "email", "post", "listing", "message", "report"):
        assert kind in RATE_LIMITS
