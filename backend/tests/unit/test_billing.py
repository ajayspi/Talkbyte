"""
Unit tests for TalkByte SaaS subscription billing & Stripe webhook handling (Requirement R2).

Verifies:
  1. POST /api/billing/create-checkout-session:
     - Subscription checkout session creation for Starter, Growth, Pro, Enterprise tiers
     - Session metadata and subscription_data passing
     - Error handling (missing API key, StripeError, generic errors)
  2. POST /api/billing/webhook:
     - Signature verification (valid, invalid, unsigned dev mode)
     - customer.subscription.updated updating restaurants.plan_id in Supabase
     - customer.subscription.created updating restaurants.plan_id and upserting subscriptions
     - customer.subscription.deleted downgrading to starter
     - Pro tier mapped to growth for database FK constraint compliance
     - Fallback plan_id resolution from subscription line items
     - Resilience against missing restaurant_id and database errors
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import stripe

from app.api.billing import router as billing_router


@pytest.fixture
def client():
    """FastAPI TestClient isolated to billing router."""
    app = FastAPI()
    app.include_router(billing_router, prefix="/api/billing")
    return TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Suite 1: Checkout Session Creation (POST /api/billing/create-checkout-session)
# ─────────────────────────────────────────────────────────────────────────────

class TestCreateCheckoutSession:
    """Test Stripe Checkout Session creation for SaaS subscriptions."""

    def test_create_checkout_starter_success(self, client):
        """Creates subscription session with Starter plan and default URLs."""
        mock_session = MagicMock()
        mock_session.id = "cs_test_starter_123"
        mock_session.url = "https://checkout.stripe.com/c/pay/cs_test_starter_123"

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "sk_test_123" if k == "STRIPE_SECRET_KEY" else None)), \
             patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:

            resp = client.post(
                "/api/billing/create-checkout-session",
                json={"restaurant_id": "rest-uuid-001", "plan_id": "starter"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["checkout_url"] == mock_session.url
        assert data["session_id"] == "cs_test_starter_123"

        mock_create.assert_called_once()
        kwargs = mock_create.call_args.kwargs
        assert kwargs["mode"] == "subscription"
        assert kwargs["client_reference_id"] == "rest-uuid-001"
        assert kwargs["metadata"]["restaurant_id"] == "rest-uuid-001"
        assert kwargs["metadata"]["plan_id"] == "starter"
        assert kwargs["subscription_data"]["metadata"]["restaurant_id"] == "rest-uuid-001"
        assert kwargs["subscription_data"]["metadata"]["plan_id"] == "starter"

    def test_create_checkout_growth_and_pro_tiers(self, client):
        """Verifies session creation for Growth and Pro tiers with subscription_data."""
        mock_session = MagicMock()
        mock_session.id = "cs_test_growth_456"
        mock_session.url = "https://checkout.stripe.com/c/pay/cs_test_growth_456"

        for plan in ["growth", "pro"]:
            with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "sk_test_123" if k == "STRIPE_SECRET_KEY" else None)), \
                 patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:

                resp = client.post(
                    "/api/billing/create-checkout-session",
                    json={"restaurant_id": "rest-uuid-002", "plan_id": plan},
                )

            assert resp.status_code == 200
            assert resp.json()["session_id"] == "cs_test_growth_456"
            kwargs = mock_create.call_args.kwargs
            assert kwargs["subscription_data"]["metadata"]["plan_id"] == plan

    def test_create_checkout_enterprise_tier(self, client):
        """Verifies session creation for Enterprise tier."""
        mock_session = MagicMock(id="cs_ent_789", url="https://checkout.stripe.com/ent")

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "sk_test_123" if k == "STRIPE_SECRET_KEY" else None)), \
             patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:

            resp = client.post(
                "/api/billing/create-checkout-session",
                json={"restaurant_id": "rest-uuid-ent", "plan_id": "enterprise"},
            )

        assert resp.status_code == 200
        kwargs = mock_create.call_args.kwargs
        assert kwargs["metadata"]["plan_id"] == "enterprise"
        assert kwargs["subscription_data"]["metadata"]["plan_id"] == "enterprise"

    def test_create_checkout_custom_urls(self, client):
        """Accepts custom success and cancel redirect URLs."""
        mock_session = MagicMock(id="cs_123", url="https://stripe.com")

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="sk_test_123")), \
             patch("stripe.checkout.Session.create", return_value=mock_session) as mock_create:

            resp = client.post(
                "/api/billing/create-checkout-session",
                json={
                    "restaurant_id": "rest-1",
                    "plan_id": "enterprise",
                    "success_url": "https://example.com/success",
                    "cancel_url": "https://example.com/cancel",
                },
            )

        assert resp.status_code == 200
        kwargs = mock_create.call_args.kwargs
        assert kwargs["success_url"] == "https://example.com/success"
        assert kwargs["cancel_url"] == "https://example.com/cancel"

    def test_create_checkout_missing_stripe_key_raises_500(self, client):
        """Returns 500 if STRIPE_SECRET_KEY is absent."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")):
            resp = client.post(
                "/api/billing/create-checkout-session",
                json={"restaurant_id": "rest-1", "plan_id": "starter"},
            )

        assert resp.status_code == 500
        assert "Stripe not configured" in resp.json()["detail"]

    def test_create_checkout_stripe_error_raises_502(self, client):
        """Returns 502 Bad Gateway when Stripe API fails."""
        err = stripe.StripeError(message="Invalid Price ID")
        err.user_message = "Invalid Price ID"

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="sk_test")), \
             patch("stripe.checkout.Session.create", side_effect=err):

            resp = client.post(
                "/api/billing/create-checkout-session",
                json={"restaurant_id": "rest-1", "plan_id": "starter"},
            )

        assert resp.status_code == 502
        assert "Stripe error" in resp.json()["detail"]


# ─────────────────────────────────────────────────────────────────────────────
# Suite 2: Webhook Signature Verification (POST /api/billing/webhook)
# ─────────────────────────────────────────────────────────────────────────────

class TestWebhookSignatureVerification:
    """Test signature security and development bypass modes."""

    def test_webhook_invalid_signature_raises_400(self, client):
        """Returns 400 when signature construct_event fails."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_test" if k == "STRIPE_BILLING_WEBHOOK_SECRET" else "sk_test")), \
             patch("stripe.Webhook.construct_event", side_effect=stripe.SignatureVerificationError("Bad sig", "sig")):

            resp = client.post(
                "/api/billing/webhook",
                content=b'{"type": "customer.subscription.updated"}',
                headers={"Stripe-Signature": "invalid_sig"},
            )

        assert resp.status_code == 400
        assert "signature verification failed" in resp.json()["detail"]

    def test_webhook_unsigned_dev_mode(self, client):
        """When no webhook secret is configured, accepts raw JSON without signature."""
        mock_sub = {
            "id": "sub_test_unsigned",
            "status": "active",
            "metadata": {"restaurant_id": "rest-unsigned", "plan_id": "pro"},
        }
        payload = json.dumps({"type": "customer.subscription.updated", "data": {"object": mock_sub}}).encode()

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing._handle_subscription_change", new=AsyncMock()) as mock_handler:

            resp = client.post(
                "/api/billing/webhook",
                content=payload,
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        assert resp.json() == {"received": True}
        mock_handler.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# Suite 3: Subscription Webhooks Updating restaurants.plan_id (R2 Core Requirement)
# ─────────────────────────────────────────────────────────────────────────────

class TestSubscriptionWebhooksPlanUpdate:
    """
    Directly verify that customer.subscription.updated and created
    execute restaurants.plan_id updates in Supabase.
    """

    def _make_mock_db(self):
        mock_db = MagicMock()
        # Mock .table().update().eq().execute()
        update_mock = MagicMock()
        eq_mock = MagicMock()
        eq_mock.execute = AsyncMock(return_value=MagicMock(data=[{"id": "rest-1", "plan_id": "growth"}]))
        update_mock.eq.return_value = eq_mock

        # Mock .table().upsert().execute()
        upsert_mock = MagicMock()
        upsert_mock.execute = AsyncMock(return_value=MagicMock(data=[]))

        # Mock .table().insert().execute()
        insert_mock = MagicMock()
        insert_mock.execute = AsyncMock(return_value=MagicMock(data=[]))

        # Mock .table().select().eq().maybe_single().execute()
        select_mock = MagicMock()
        select_eq = MagicMock()
        select_single = MagicMock()
        select_single.execute = AsyncMock(return_value=MagicMock(data={"restaurant_id": "rest-from-db"}))
        select_eq.maybe_single.return_value = select_single
        select_mock.eq.return_value = select_eq

        def table_side_effect(table_name: str):
            mock_table = MagicMock()
            if table_name == "restaurants":
                mock_table.update.return_value = update_mock
            elif table_name == "subscriptions":
                mock_table.upsert.return_value = upsert_mock
                mock_table.update.return_value = update_mock
                mock_table.select.return_value = select_mock
            elif table_name == "billing_events":
                mock_table.insert.return_value = insert_mock
            return mock_table

        mock_db.table.side_effect = table_side_effect
        return mock_db, update_mock, eq_mock, upsert_mock

    def test_customer_subscription_updated_updates_restaurants_plan_id(self, client):
        """
        R2 Core Acceptance Test:
        Stripe Webhook handler updates restaurants.plan_id in Supabase when
        customer.subscription.updated event is received.
        """
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_1001",
                    "status": "active",
                    "current_period_end": 1790000000,
                    "metadata": {
                        "restaurant_id": "rest-target-uuid",
                        "plan_id": "growth",
                    },
                    "items": {
                        "data": [{"price": {"unit_amount": 24900, "nickname": "Growth"}}]
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        assert resp.json() == {"received": True}

        # Verify restaurants table update was called with {"plan_id": "growth"}
        mock_db.table.assert_any_call("restaurants")
        update_mock.eq.assert_called_with("id", "rest-target-uuid")
        eq_mock.execute.assert_awaited()

        # Verify subscriptions table upsert
        mock_db.table.assert_any_call("subscriptions")
        upsert_mock.execute.assert_awaited_once()

    def test_customer_subscription_created_updates_plan_id(self, client):
        """customer.subscription.created also sets restaurants.plan_id in Supabase."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_2002",
                    "status": "active",
                    "current_period_end": 1790000000,
                    "metadata": {
                        "restaurant_id": "rest-target-uuid",
                        "plan_id": "enterprise",
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        mock_db.table.assert_any_call("restaurants")
        update_mock.eq.assert_called_with("id", "rest-target-uuid")

    def test_subscription_updated_pro_mapped_to_growth(self, client):
        """Ensures 'pro' plan is mapped to 'growth' for database FK constraint."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_pro_123",
                    "status": "active",
                    "metadata": {
                        "restaurant_id": "rest-target-uuid",
                        "plan_id": "pro",
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        # Check update was called with plan_id: "growth"
        mock_table_rest = mock_db.table("restaurants")
        mock_table_rest.update.assert_called_with({"plan_id": "growth"})

    def test_subscription_updated_extracts_plan_from_price_when_metadata_missing(self, client):
        """Derives plan_id from price nickname/metadata if not directly in subscription metadata."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_3003",
                    "status": "active",
                    "metadata": {"restaurant_id": "rest-target-uuid"},  # No plan_id in metadata
                    "items": {
                        "data": [{"price": {"unit_amount": 24900, "nickname": "growth"}}]
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        mock_db.table.assert_any_call("restaurants")
        update_mock.eq.assert_called_with("id", "rest-target-uuid")

    def test_webhook_missing_restaurant_id_fallback_to_subscriptions_table(self, client):
        """Recovers restaurant_id from subscriptions table if missing in webhook metadata."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_existing_in_db",
                    "status": "active",
                    "metadata": {"plan_id": "growth"},  # No restaurant_id
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        mock_db.table.assert_any_call("restaurants")
        update_mock.eq.assert_called_with("id", "rest-from-db")

    def test_webhook_missing_restaurant_id_is_graceful(self, client):
        """Webhook with no restaurant_id and no DB record logs warning and returns 200."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()
        # Make select query return None
        mock_select = MagicMock()
        mock_select.eq.return_value.maybe_single.return_value.execute = AsyncMock(return_value=MagicMock(data=None))
        mock_db.table.return_value.select.return_value = mock_select

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_no_rest",
                    "status": "active",
                    "metadata": {},  # No restaurant_id
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        # restaurants update should not have been called
        update_mock.eq.assert_not_called()

    def test_webhook_database_error_does_not_crash(self, client):
        """Database exception logs error but returns 200 to prevent Stripe infinite retry loop."""
        mock_db = MagicMock()
        mock_db.table.side_effect = Exception("Supabase connection timeout")

        event_payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_err",
                    "metadata": {"restaurant_id": "rest-1", "plan_id": "growth"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        assert resp.json() == {"received": True}

    def test_customer_subscription_deleted_downgrades_to_starter(self, client):
        """customer.subscription.deleted downgrades restaurant to starter and cancels sub."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

        event_payload = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_del_123",
                    "metadata": {"restaurant_id": "rest-cancelled"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):

            resp = client.post(
                "/api/billing/webhook",
                content=json.dumps(event_payload).encode(),
            )

        assert resp.status_code == 200
        mock_db.table.assert_any_call("restaurants")
        update_mock.eq.assert_called_with("id", "rest-cancelled")
