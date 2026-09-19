import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from main import app
from app.api.integrations import mask_api_key

client = TestClient(app)



@pytest.fixture
def mock_db():
    with patch("app.api.integrations.get_db") as mock_get_db:
        mock = MagicMock()
        mock_get_db.return_value = mock
        yield mock


def test_mask_api_key_helper():
    """Verify mask_api_key masks secrets safely without leaking raw tokens."""
    assert mask_api_key(None) == ""
    assert mask_api_key("") == ""
    assert mask_api_key("short") == "********"

    # Square format
    masked_sq = mask_api_key("sq0atp-1234567890abcdef")
    assert masked_sq.startswith("sq0atp-")
    assert masked_sq.endswith("cdef")
    assert "1234567890" not in masked_sq
    assert "****" in masked_sq

    # Stripe format
    masked_stripe = mask_api_key("sk_test_51MzAbcDefGhiJkl1234")
    assert masked_stripe.startswith("sk_t")
    assert masked_stripe.endswith("1234")
    assert "AbcDef" not in masked_stripe
    assert "****" in masked_stripe


def test_save_square_integration(mock_db):
    """Test saving Square POS integration credentials."""
    mock_upsert = MagicMock()
    mock_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[{"id": "int-1"}]))
    mock_db.table.return_value = mock_upsert

    response = client.post(
        "/api/integrations",
        json={
            "restaurant_id": "rest-uuid-123",
            "provider": "square",
            "api_key": "sq0atp-sensitive-token-9988",
            "metadata": {
                "location_id": "L12345",
                "environment": "sandbox"
            }
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["provider"] == "square"
    assert data["connected"] is True

    # Verify db upsert called with credentials
    mock_db.table.assert_called_with("restaurant_integrations")
    args, kwargs = mock_upsert.upsert.call_args
    saved_record = args[0]
    assert saved_record["restaurant_id"] == "rest-uuid-123"
    assert saved_record["provider"] == "square"
    assert saved_record["status"] == "connected"
    assert saved_record["is_active"] is True
    assert saved_record["api_key"] == "sq0atp-sensitive-token-9988"
    assert saved_record["metadata"]["location_id"] == "L12345"


def test_save_stripe_and_twilio_integrations(mock_db):
    """Test saving Stripe and Twilio integrations."""
    mock_upsert = MagicMock()
    mock_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_db.table.return_value = mock_upsert

    # Stripe
    res_stripe = client.post(
        "/api/integrations",
        json={
            "restaurant_id": "rest-uuid-123",
            "provider": "stripe",
            "api_key": "sk_test_stripe_secret_key_8899",
            "metadata": {"account_id": "acct_123"}
        }
    )
    assert res_stripe.status_code == 200
    assert res_stripe.json()["provider"] == "stripe"
    assert res_stripe.json()["connected"] is True

    # Twilio
    res_twilio = client.post(
        "/api/integrations",
        json={
            "restaurant_id": "rest-uuid-123",
            "provider": "twilio",
            "api_key": "auth_token_secret_1234",
            "config": {"phone_number": "+61400111222"}
        }
    )
    assert res_twilio.status_code == 200
    assert res_twilio.json()["provider"] == "twilio"
    assert res_twilio.json()["connected"] is True


def test_save_unsupported_provider_rejected(mock_db):
    """Test that attempting to configure an unsupported provider returns 400 Bad Request."""
    response = client.post(
        "/api/integrations",
        json={
            "restaurant_id": "rest-uuid-123",
            "provider": "unsupported_pos_system",
            "api_key": "key123"
        }
    )
    assert response.status_code == 400
    assert "Unsupported provider" in response.json()["detail"]


def test_get_integrations_masks_api_keys(mock_db):
    """Test GET /api/integrations returns masked API keys and unconfigured defaults."""
    mock_select = MagicMock()
    mock_select.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {
                "id": "int-1",
                "restaurant_id": "rest-uuid-123",
                "provider": "square",
                "api_key": "sq0atp-plaintext-secret-token-7766",
                "status": "connected",
                "is_active": True,
                "metadata": {"location_id": "LOC_99"}
            },
            {
                "id": "int-2",
                "restaurant_id": "rest-uuid-123",
                "provider": "stripe",
                "api_key": "sk_test_my_stripe_token_5544",
                "status": "connected",
                "is_active": True,
                "metadata": {}
            }
        ])
    )
    mock_db.table.return_value = mock_select

    response = client.get("/api/integrations?restaurant_id=rest-uuid-123")
    assert response.status_code == 200
    data = response.json()
    assert "integrations" in data
    integrations = data["integrations"]

    # All 4 providers present
    for p in ("square", "stripe", "twilio", "shopify"):
        assert p in integrations

    # Square is connected and key is masked
    sq = integrations["square"]
    assert sq["connected"] is True
    assert sq["status"] == "connected"
    assert sq["masked_key"].startswith("sq0atp-")
    assert sq["masked_key"].endswith("7766")
    assert "plaintext-secret-token" not in response.text

    # Stripe is connected and key is masked
    st = integrations["stripe"]
    assert st["connected"] is True
    assert st["masked_key"].startswith("sk_t")
    assert st["masked_key"].endswith("5544")
    assert "my_stripe_token" not in response.text

    # Twilio and Shopify default to unconfigured
    assert integrations["twilio"]["connected"] is False
    assert integrations["twilio"]["status"] == "unconfigured"
    assert integrations["shopify"]["connected"] is False
    assert integrations["shopify"]["status"] == "unconfigured"


def test_delete_integration(mock_db):
    """Test DELETE /api/integrations/{provider} removes integration."""
    mock_delete = MagicMock()
    mock_delete.delete.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    mock_db.table.return_value = mock_delete

    response = client.delete("/api/integrations/square?restaurant_id=rest-uuid-123")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["provider"] == "square"
    assert data["connected"] is False
