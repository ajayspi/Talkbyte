import base64
import hashlib
import hmac
import time

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from app.api.webhook_security import verify_stripe_signature, verify_telnyx_signature


def test_stripe_signature_accepts_current_valid_signature():
    payload = b'{"id":"evt_test"}'
    timestamp = str(int(time.time()))
    secret = "whsec_test"
    digest = hmac.new(secret.encode(), f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()

    assert verify_stripe_signature(payload, f"t={timestamp},v1={digest}", secret)


def test_stripe_signature_rejects_tampered_payload():
    timestamp = str(int(time.time()))
    secret = "whsec_test"
    digest = hmac.new(secret.encode(), f"{timestamp}.".encode() + b"{}", hashlib.sha256).hexdigest()

    assert not verify_stripe_signature(b'{"tampered":true}', f"t={timestamp},v1={digest}", secret)


def test_telnyx_signature_accepts_current_valid_signature():
    payload = b'{"data":{"event_type":"call.initiated"}}'
    timestamp = str(int(time.time()))
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key().public_bytes(
        serialization.Encoding.Raw,
        serialization.PublicFormat.Raw,
    )
    signature = private_key.sign(f"{timestamp}.".encode() + payload)

    assert verify_telnyx_signature(
        payload,
        base64.b64encode(signature).decode(),
        timestamp,
        base64.b64encode(public_key).decode(),
    )


def test_telnyx_signature_rejects_missing_credentials():
    assert not verify_telnyx_signature(b"{}", "", "", "")
