"""Regression tests for Security Audit #1 — item privacy on GET /items/{id}.

Covers the pure authorization rule `_item_view_allowed` for every privacy tier and
viewer relationship. The async Follow lookup is exercised at the route level; this
locks down the decision logic so the IDOR can't silently regress.
"""
import uuid

from app.routers.items import _item_view_allowed

OWNER = uuid.uuid4()
OTHER = uuid.uuid4()


def test_owner_always_sees_own_item():
    # Owner sees their item regardless of privacy or follow state.
    for privacy in ("public", "followers", "private", "anything"):
        assert _item_view_allowed(OWNER, privacy, OWNER, is_follower=False) is True


def test_public_item_visible_to_anyone():
    assert _item_view_allowed(OWNER, "public", OTHER, is_follower=False) is True


def test_private_item_hidden_from_non_owner():
    assert _item_view_allowed(OWNER, "private", OTHER, is_follower=True) is False


def test_unknown_privacy_defaults_to_hidden():
    # Fail closed: an unrecognised privacy value is treated as private.
    assert _item_view_allowed(OWNER, "weird", OTHER, is_follower=True) is False


def test_followers_item_visible_only_to_followers():
    assert _item_view_allowed(OWNER, "followers", OTHER, is_follower=True) is True
    assert _item_view_allowed(OWNER, "followers", OTHER, is_follower=False) is False
