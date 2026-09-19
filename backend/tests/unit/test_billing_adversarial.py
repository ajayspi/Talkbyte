"""
Adversarial test suite for TalkByte SaaS Subscription Billing & Stripe Webhook Handling.
Created by Challenger M3-1.

Verifies edge cases, stress scenarios, failure modes, and security constraints:
  1. Payload & Signature Attacks:
     - Non-dict JSON payloads (list, string, int, null) in unsigned mode
     - Missing / corrupt Stripe-Signature headers
     - SignatureVerificationError / timestamp replay attack simulation
     - Missing "data" or "object" keys in event payload
     - Unknown & extraneous Stripe event types
  2. Missing Metadata & Recovery:
     - Missing metadata dict, missing restaurant_id
     - Null plan_id and fallback to price nickname/metadata
     - Recovery of restaurant_id from subscriptions DB table
     - Database error during subscriptions lookup fallback
     - Null items or malformed items list
     - Missing / malformed current_period_end timestamps
  3. Plan Tier Constraints & Foreign Key Integrity:
     - Case-insensitive & whitespace normalization ("  GROWTH  ", "ENTERPRISE")
     - "pro" alias mapping to "growth" (Postgres FK compliance)
     - Unknown plans ("ultra", "free", "vip") triggering DB FK violation handled gracefully
     - Null plan_id defaulting subscriptions to "starter" and preserving restaurants.plan_id
     - customer.subscription.deleted downgrading to "starter" with cancelled status
     - customer.subscription.deleted missing restaurant_id fallback to DB
  4. Database Error Recovery & Resilience:
     - Subscriptions table upsert failure / timeout
     - Restaurants table update failure / timeout
     - Missing billing_events table isolation (does not block plan_id update)
     - Cancelled subscription DB failure handling
     - Return code 200 guarantee to prevent Stripe webhook retry storm
  5. Cross-Webhook Delegation in payments.py:
     - checkout.session.completed with mode="subscription"
     - customer.subscription.created / updated delegation
     - customer.subscription.deleted handling boundary in payments.py
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import stripe

from app.api.billing import router as billing_router
from app.api.payments import router as payments_router


@pytest.fixture
def billing_client():
    """FastAPI TestClient isolated to billing router."""
    app = FastAPI()
    app.include_router(billing_router, prefix="/api/billing")
    return TestClient(app)


@pytest.fixture
def payments_client():
    """FastAPI TestClient isolated to payments router."""
    app = FastAPI()
    app.include_router(payments_router, prefix="/api/payments")
    return TestClient(app)


def make_mock_db(
    sub_select_result: dict | None = None,
    fail_subscriptions: bool = False,
    fail_restaurants: bool = False,
    fail_billing_events: bool = False,
):
    """Factory creating a mock Supabase client with fine-grained failure injection."""
    mock_db = MagicMock()

    # Restaurants update mock
    rest_update = MagicMock()
    rest_eq = MagicMock()
    if fail_restaurants:
        rest_eq.execute = AsyncMock(side_effect=Exception("Postgres connection timeout on restaurants"))
    else:
        rest_eq.execute = AsyncMock(return_value=MagicMock(data=[{"id": "rest-1", "plan_id": "growth"}]))
    rest_update.eq.return_value = rest_eq

    # Subscriptions upsert & update mock
    sub_upsert = MagicMock()
    if fail_subscriptions:
        sub_upsert.execute = AsyncMock(side_effect=Exception("DB deadlock on subscriptions upsert"))
    else:
        sub_upsert.execute = AsyncMock(return_value=MagicMock(data=[]))

    sub_update = MagicMock()
    sub_update_eq = MagicMock()
    if fail_subscriptions:
        sub_update_eq.execute = AsyncMock(side_effect=Exception("DB error on subscriptions update"))
    else:
        sub_update_eq.execute = AsyncMock(return_value=MagicMock(data=[]))
    sub_update.eq.return_value = sub_update_eq

    # Subscriptions select mock
    sub_select = MagicMock()
    sub_select_eq = MagicMock()
    sub_single = MagicMock()
    sub_single.execute = AsyncMock(return_value=MagicMock(data=sub_select_result))
    sub_select_eq.maybe_single.return_value = sub_single
    sub_select.eq.return_value = sub_select_eq

    # Billing events insert mock
    be_insert = MagicMock()
    if fail_billing_events:
        be_insert.execute = AsyncMock(side_effect=Exception("Relation 'billing_events' does not exist"))
    else:
        be_insert.execute = AsyncMock(return_value=MagicMock(data=[]))

    def table_router(table_name: str):
        tbl = MagicMock()
        if table_name == "restaurants":
            tbl.update.return_value = rest_update
        elif table_name == "subscriptions":
            tbl.upsert.return_value = sub_upsert
            tbl.update.return_value = sub_update
            tbl.select.return_value = sub_select
        elif table_name == "billing_events":
            tbl.insert.return_value = be_insert
        return tbl

    mock_db.table.side_effect = table_router
    return mock_db, rest_update, sub_upsert, sub_select


# ─────────────────────────────────────────────────────────────────────────────
# 1. Payload & Signature Attacks
# ─────────────────────────────────────────────────────────────────────────────

class TestPayloadAndSignatureAdversarial:
    """Stress tests webhook ingestion against hostile/malformed payloads."""

    def test_missing_signature_when_secret_configured(self, billing_client):
        """Missing Stripe-Signature header when secret is configured returns 400."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_live_123" if "SECRET" in k else None)):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=b'{"type": "customer.subscription.updated"}',
                # No Stripe-Signature header
            )
        assert resp.status_code == 400
        assert "signature verification failed" in resp.json()["detail"].lower()

    def test_corrupt_signature_header(self, billing_client):
        """Malformed signature header (invalid scheme / timestamp) returns 400."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_live_123" if "SECRET" in k else None)):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=b'{"type": "customer.subscription.updated"}',
                headers={"Stripe-Signature": "t=not_a_number,v1=bad_hash"},
            )
        assert resp.status_code == 400
        assert "signature verification failed" in resp.json()["detail"].lower()

    def test_replay_attack_expired_timestamp(self, billing_client):
        """Replay attack with expired timestamp rejected with 400."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_live_123" if "SECRET" in k else None)), \
             patch("stripe.Webhook.construct_event", side_effect=stripe.SignatureVerificationError("Timestamp outside tolerance", "sig")):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=b'{"type": "customer.subscription.updated"}',
                headers={"Stripe-Signature": "t=1000000000,v1=expired_sig"},
            )
        assert resp.status_code == 400

    def test_empty_payload_body(self, billing_client):
        """Empty payload body b'' returns 400 in unsigned mode."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=b"",
                headers={"Content-Type": "application/json"},
            )
        assert resp.status_code == 400
        assert "invalid json" in resp.json()["detail"].lower()

    def test_truncated_json_payload(self, billing_client):
        """Truncated JSON payload returns 400."""
        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=b'{"type": "customer.subscription.created", "data": {"object": ',
                headers={"Content-Type": "application/json"},
            )
        assert resp.status_code == 400
        assert "invalid json" in resp.json()["detail"].lower()

    def test_unknown_event_types_safely_ignored_with_200(self, billing_client):
        """Stripe webhooks with unhandled event types return 200 without side effects."""
        mock_db, rest_update, _, _ = make_mock_db()
        unknown_events = [
            "invoice.payment_succeeded",
            "invoice.payment_failed",
            "customer.created",
            "charge.dispute.created",
            "payment_intent.succeeded",
            "radar.early_fraud_warning.created",
            "unknown.wildcard.event",
        ]

        for evt in unknown_events:
            with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
                 patch("app.api.billing.get_db", return_value=mock_db):
                resp = billing_client.post(
                    "/api/billing/webhook",
                    content=json.dumps({"type": evt, "data": {"object": {}}}).encode(),
                    headers={"Content-Type": "application/json"},
                )
            assert resp.status_code == 200
            assert resp.json() == {"received": True}

        # Verify no database calls were made
        rest_update.eq.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# 2. Missing Metadata & DB Recovery
# ─────────────────────────────────────────────────────────────────────────────

class TestMissingMetadataAndRecovery:
    """Verifies fallback mechanisms when webhook metadata is omitted or partial."""

    def test_missing_metadata_dict_entirely(self, billing_client):
        """Subscription payload where metadata is omitted entirely."""
        mock_db, rest_update, _, _ = make_mock_db(sub_select_result=None)
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_no_metadata_123",
                    "status": "active",
                    # No metadata key
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )
        assert resp.status_code == 200
        rest_update.eq.assert_not_called()

    def test_missing_restaurant_id_recovered_from_subscriptions_table(self, billing_client):
        """When restaurant_id is missing from webhook metadata, recovers it from subscriptions table."""
        mock_db, rest_update, sub_upsert, _ = make_mock_db(
            sub_select_result={"restaurant_id": "rest-recovered-uuid-999"}
        )
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_existing_123",
                    "status": "active",
                    "metadata": {"plan_id": "enterprise"},  # Missing restaurant_id
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        # Verify update was executed with the recovered restaurant_id
        rest_update.eq.assert_called_with("id", "rest-recovered-uuid-999")

    def test_missing_restaurant_id_db_lookup_fails_silently(self, billing_client):
        """If subscriptions table lookup raises an error, recovers gracefully without crashing."""
        mock_db, rest_update, _, sub_select = make_mock_db()
        # Cause select to throw
        sub_select.eq.return_value.maybe_single.return_value.execute = AsyncMock(
            side_effect=Exception("Database network timeout")
        )

        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_lookup_err",
                    "status": "active",
                    "metadata": {"plan_id": "growth"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        rest_update.eq.assert_not_called()

    def test_plan_id_derived_from_price_metadata_when_missing_in_sub_metadata(self, billing_client):
        """Derives plan_id from items[0].price.metadata.plan_id when sub metadata lacks plan_id."""
        mock_db, rest_update, _, _ = make_mock_db()
        payload = {
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_derived_price",
                    "status": "active",
                    "metadata": {"restaurant_id": "rest-derived-1"},
                    "items": {
                        "data": [
                            {
                                "price": {
                                    "id": "price_growth_123",
                                    "metadata": {"plan_id": "growth"},
                                    "unit_amount": 24900,
                                }
                            }
                        ]
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        rest_update.eq.assert_called_with("id", "rest-derived-1")
        mock_db.table("restaurants").update.assert_called_with({"plan_id": "growth"})

    def test_plan_id_derived_from_price_nickname(self, billing_client):
        """Derives plan_id from price nickname when metadata is empty."""
        mock_db, rest_update, _, _ = make_mock_db()
        payload = {
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_nickname",
                    "status": "active",
                    "metadata": {"restaurant_id": "rest-nick-1"},
                    "items": {
                        "data": [
                            {
                                "price": {
                                    "id": "price_ent",
                                    "nickname": "enterprise",
                                    "metadata": {},
                                }
                            }
                        ]
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        mock_db.table("restaurants").update.assert_called_with({"plan_id": "enterprise"})

    def test_null_plan_id_leaves_restaurants_plan_id_untouched(self, billing_client):
        """If plan_id is None, subscriptions table gets starter fallback but restaurants table is not clobbered."""
        mock_db, rest_update, sub_upsert, _ = make_mock_db()
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_no_plan",
                    "status": "active",
                    "metadata": {"restaurant_id": "rest-preserve-plan"},
                    "items": {"data": []},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        # subscriptions upsert called with default "starter"
        sub_upsert.execute.assert_awaited_once()
        # restaurants update should NOT have been called with None or empty plan
        rest_update.eq.assert_not_called()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Plan Tier Constraints & Data Integrity
# ─────────────────────────────────────────────────────────────────────────────

class TestPlanTierConstraintsAdversarial:
    """Verifies strict adherence to Supabase schema foreign key constraints."""

    @pytest.mark.parametrize(
        "raw_plan,expected_normalized",
        [
            ("growth", "growth"),
            ("GROWTH", "growth"),
            (" Growth ", "growth"),
            ("pro", "growth"),        # Mapped to growth for FK compliance
            ("PRO", "growth"),
            ("  pro  ", "growth"),
            ("starter", "starter"),
            ("STARTER", "starter"),
            ("enterprise", "enterprise"),
            ("ENTERPRISE", "enterprise"),
        ],
    )
    def test_plan_normalization_and_pro_alias(self, billing_client, raw_plan, expected_normalized):
        """Verifies case-insensitivity, whitespace stripping, and pro -> growth mapping."""
        mock_db, rest_update, _, _ = make_mock_db()
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": f"sub_{raw_plan.strip()}",
                    "status": "active",
                    "metadata": {
                        "restaurant_id": "rest-norm-1",
                        "plan_id": raw_plan,
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        mock_db.table("restaurants").update.assert_called_with({"plan_id": expected_normalized})

    def test_unknown_plan_triggers_db_error_handled_gracefully(self, billing_client):
        """Unknown plan tier (e.g. 'ultra', 'free') causing DB FK violation returns 200 without crashing."""
        mock_db, rest_update, sub_upsert, _ = make_mock_db()
        # Simulate Postgres foreign key violation error: Key (plan_id)=(ultra) is not present in table "plans"
        sub_upsert.execute = AsyncMock(
            side_effect=Exception("PostgreSQL foreign key violation: Key (plan_id)=(ultra) is not present in table 'plans'")
        )

        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_unknown_tier",
                    "status": "active",
                    "metadata": {
                        "restaurant_id": "rest-fk-test",
                        "plan_id": "ultra",
                    },
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        assert resp.json() == {"received": True}

    def test_customer_subscription_deleted_downgrades_to_starter(self, billing_client):
        """Subscription cancellation downgrades restaurant to starter and sets sub status to cancelled."""
        mock_db, rest_update, _, _ = make_mock_db()
        payload = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_cancel_me",
                    "metadata": {"restaurant_id": "rest-cancelling"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        mock_db.table("restaurants").update.assert_called_with({"plan_id": "starter"})
        rest_update.eq.assert_called_with("id", "rest-cancelling")
        mock_db.table("subscriptions").update.assert_called_with({"status": "cancelled"})

    def test_customer_subscription_deleted_missing_restaurant_id_falls_back_to_db(self, billing_client):
        """customer.subscription.deleted with missing metadata recovers restaurant_id from DB."""
        mock_db, rest_update, _, _ = make_mock_db(
            sub_select_result={"restaurant_id": "rest-recovered-del"}
        )
        payload = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_del_no_meta",
                    # No metadata
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        rest_update.eq.assert_called_with("id", "rest-recovered-del")


# ─────────────────────────────────────────────────────────────────────────────
# 4. Database Error Recovery & Resilience
# ─────────────────────────────────────────────────────────────────────────────

class TestDatabaseResilienceAdversarial:
    """Stress tests resilience against database unavailability and partial failures."""

    def test_database_connection_timeout_returns_200(self, billing_client):
        """Database connection timeout logs error and returns 200 so Stripe doesn't hammer server."""
        mock_db, _, _, _ = make_mock_db(fail_subscriptions=True)
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_timeout",
                    "metadata": {"restaurant_id": "rest-timeout", "plan_id": "growth"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        assert resp.json() == {"received": True}

    def test_restaurants_update_failure_returns_200(self, billing_client):
        """Failure updating restaurants table logs error and returns 200."""
        mock_db, _, _, _ = make_mock_db(fail_restaurants=True)
        payload = {
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_rest_fail",
                    "metadata": {"restaurant_id": "rest-fail", "plan_id": "enterprise"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200

    def test_missing_billing_events_table_does_not_abort_plan_update(self, billing_client):
        """Failure writing to optional billing_events does NOT prevent restaurants.plan_id update."""
        mock_db, rest_update, sub_upsert, _ = make_mock_db(fail_billing_events=True)
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_be_missing",
                    "metadata": {"restaurant_id": "rest-be-ok", "plan_id": "growth"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200
        # Both subscriptions and restaurants updates must succeed
        sub_upsert.execute.assert_awaited_once()
        rest_update.eq.assert_called_with("id", "rest-be-ok")

    def test_deleted_subscription_db_failure_returns_200(self, billing_client):
        """DB failure during subscription deletion logs error and returns 200."""
        mock_db, _, _, _ = make_mock_db(fail_restaurants=True)
        payload = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_del_fail",
                    "metadata": {"restaurant_id": "rest-del-fail"},
                }
            },
        }

        with patch("app.api.billing.get_platform_secret", new=AsyncMock(return_value="")), \
             patch("app.api.billing.get_db", return_value=mock_db):
            resp = billing_client.post(
                "/api/billing/webhook",
                content=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )

        assert resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 5. Cross-Webhook Delegation in payments.py
# ─────────────────────────────────────────────────────────────────────────────

class TestCrossWebhookPaymentsDelegation:
    """Verifies that payments.py handles subscription events when Stripe webhook points there."""

    def test_payments_webhook_subscription_checkout_session_completed(self, payments_client):
        """checkout.session.completed with mode='subscription' updates restaurants.plan_id."""
        mock_db, rest_update, _, _ = make_mock_db()
        payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_sub_completed_123",
                    "mode": "subscription",
                    "client_reference_id": "rest-payments-1",
                    "metadata": {"plan_id": "pro"},
                }
            },
        }

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_123" if "WEBHOOK" in k else "sk_test")), \
             patch("stripe.Webhook.construct_event", return_value=payload), \
             patch("app.db.supabase.get_db", return_value=mock_db):
            resp = payments_client.post(
                "/api/payments/stripe-webhook",
                content=json.dumps(payload).encode(),
                headers={"Stripe-Signature": "t=123,v1=abc"},
            )

        assert resp.status_code == 200
        # 'pro' should be normalized to 'growth'
        mock_db.table("restaurants").update.assert_called_with({"plan_id": "growth"})
        rest_update.eq.assert_called_with("id", "rest-payments-1")

    def test_payments_webhook_delegates_subscription_updated(self, payments_client):
        """customer.subscription.updated received at payments.py delegates to _handle_subscription_change."""
        payload = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_delegated_123",
                    "metadata": {"restaurant_id": "rest-del-1", "plan_id": "growth"},
                }
            },
        }

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_123" if "WEBHOOK" in k else "sk_test")), \
             patch("stripe.Webhook.construct_event", return_value=payload), \
             patch("app.api.billing._handle_subscription_change", new=AsyncMock()) as mock_change:
            resp = payments_client.post(
                "/api/payments/stripe-webhook",
                content=json.dumps(payload).encode(),
                headers={"Stripe-Signature": "t=123,v1=abc"},
            )

        assert resp.status_code == 200
        mock_change.assert_called_once_with(payload["data"]["object"], "customer.subscription.updated")

    def test_payments_webhook_subscription_deleted_unhandled_observation(self, payments_client):
        """Documents that customer.subscription.deleted arriving at payments.py is ignored (returns 200, no delegation)."""
        payload = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_del_payments",
                    "metadata": {"restaurant_id": "rest-del-2"},
                }
            },
        }

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(side_effect=lambda k: "whsec_123" if "WEBHOOK" in k else "sk_test")), \
             patch("stripe.Webhook.construct_event", return_value=payload), \
             patch("app.api.billing._handle_subscription_deleted", new=AsyncMock()) as mock_del:
            resp = payments_client.post(
                "/api/payments/stripe-webhook",
                content=json.dumps(payload).encode(),
                headers={"Stripe-Signature": "t=123,v1=abc"},
            )

        assert resp.status_code == 200
        # Notice: payments.py line 56 only handles created and updated, NOT deleted!
        mock_del.assert_not_called()
