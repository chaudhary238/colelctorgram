"""T-01 — auth token unit tests (services/auth.py).

Round-trips for access/refresh/reset tokens, type confusion (a refresh token must
not pass as an access token and vice versa), and the reset-token single-use
property (bound to the password_hash fingerprint — changing the password
invalidates outstanding reset links).
"""
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_access_token,
    decode_refresh_token,
    decode_reset_token,
    hash_password,
    password_fingerprint,
    verify_password,
)

USER_ID = "0b8f8f0a-6a3e-4b9f-9a0e-8a1f2c3d4e5f"


def test_password_hash_roundtrip():
    h = hash_password("s3cret-pw!")
    assert h != "s3cret-pw!"
    assert verify_password("s3cret-pw!", h) is True
    assert verify_password("wrong", h) is False


def test_access_token_roundtrip():
    payload = decode_access_token(create_access_token(USER_ID))
    assert payload is not None
    assert payload["sub"] == USER_ID


def test_refresh_token_roundtrip():
    payload = decode_refresh_token(create_refresh_token(USER_ID))
    assert payload is not None
    assert payload["sub"] == USER_ID


def test_token_type_confusion_rejected():
    # a refresh token is NOT a valid access token, and vice versa
    assert decode_access_token(create_refresh_token(USER_ID)) is None
    assert decode_refresh_token(create_access_token(USER_ID)) is None


def test_garbage_tokens_rejected():
    assert decode_access_token("not-a-jwt") is None
    assert decode_refresh_token("") is None
    assert decode_reset_token("junk") is None


def test_reset_token_roundtrip_and_fingerprint_binding():
    pw_hash = hash_password("old-password")
    token = create_reset_token(USER_ID, pw_hash)
    payload = decode_reset_token(token)
    assert payload is not None
    assert payload["sub"] == USER_ID
    # single-use: the embedded fingerprint matches the CURRENT hash only —
    # once the password changes, the fingerprint no longer matches.
    assert payload["fp"] == password_fingerprint(pw_hash)
    new_hash = hash_password("new-password")
    assert payload["fp"] != password_fingerprint(new_hash)


def test_reset_token_not_valid_as_access_token():
    token = create_reset_token(USER_ID, hash_password("x"))
    assert decode_access_token(token) is None
