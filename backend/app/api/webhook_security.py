"""Provider webhook signature verification."""

import base64
import binascii
import hashlib
import hmac
import time

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


def verify_stripe_signature(payload: bytes, header: str, secret: str, tolerance: int = 300) -> bool:
    """Verify Stripe's timestamped HMAC-SHA256 signature."""
    if not header or not secret:
        return False
    values = dict(part.split("=", 1) for part in header.split(",") if "=" in part)
    timestamp = values.get("t")
    signature = values.get("v1")
    if not timestamp or not signature:
        return False
    try:
        timestamp_int = int(timestamp)
    except ValueError:
        return False
    if abs(time.time() - timestamp_int) > tolerance:
        return False
    expected = hmac.new(secret.encode(), f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_telnyx_signature(payload: bytes, signature: str, timestamp: str, public_key: str, tolerance: int = 300) -> bool:
    """Verify Telnyx's Ed25519 signature over ``timestamp.payload``."""
    if not signature or not timestamp or not public_key:
        return False
    try:
        timestamp_int = int(timestamp)
        if abs(time.time() - timestamp_int) > tolerance:
            return False
        key_bytes = base64.b64decode(public_key)
        signature_bytes = base64.b64decode(signature)
        Ed25519PublicKey.from_public_bytes(key_bytes).verify(
            signature_bytes,
            f"{timestamp}.".encode() + payload,
        )
        return True
    except (binascii.Error, ValueError, TypeError):
        return False