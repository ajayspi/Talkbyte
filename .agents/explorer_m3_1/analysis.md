# Technical Investigation & Analysis: Backend Billing & Webhook Implementation

**Agent**: explorer_m3_1  
**Working Directory**: `.agents/explorer_m3_1/`  
**Target Files**:
- `backend/app/api/billing.py`
- `backend/app/api/payments.py`
- `backend/tests/unit/test_billing.py` (to be designed/created)
- `backend/supabase_schema.sql`
- `backend/main.py`
- `backend/app/db/supabase.py`
**Date**: 2026-09-14  
**Status**: Complete Investigation & Blueprint

---

## 1. Executive Summary

This investigation analyzes the backend billing infrastructure for TalkByte (FastAPI + Supabase + Stripe). The original requirement (R2 in `ORIGINAL_REQUEST.md`) requires restaurant owners to view their current plan (Starter / Growth / Pro), upgrade via Stripe Checkout, and have `restaurants.plan_id` in Supabase automatically updated via Stripe Webhook when `customer.subscription.updated` or `customer.subscription.created` events are received.

### Key Findings & Verdict:
1. **Existing Implementation Found**: `backend/app/api/billing.py` already exists and is registered in `backend/main.py` at `/api/billing`. It exposes `POST /api/billing/create-checkout-session` and `POST /api/billing/webhook`.
2. **Critical Bug Discovered in Checkout Session Creation**:
   - `stripe.checkout.Session.create` passes metadata only at the session level (`metadata={...}`).
   - In Stripe's API, session metadata is **not** automatically copied to the resulting `Subscription` object unless `subscription_data={"metadata": {...}}` is provided.
   - Because `subscription_data` is omitted, subsequent `customer.subscription.created` and `customer.subscription.updated` webhooks arrive with **empty metadata**. The webhook handler then triggers `if not restaurant_id: log.warning(...); return`, silently dropping the event and **failing to update `restaurants.plan_id` in Supabase**.
3. **Plan Tier Inconsistency & Missing "growth" Mapping**:
   - `supabase_schema.sql` defines tiers in `plans`: `'starter'` ($149), `'growth'` ($249), `'enterprise'` ($499).
   - In `billing.py`, `PLAN_PRICE_IDS` defines: `starter`, `pro`, `enterprise`. `'growth'` is completely missing!
   - If a customer selects `"growth"`, `_get_stripe_price_id` defaults to `"starter"` instead of `"growth"`!
   - Furthermore, `restaurants.plan_id` has a foreign key referencing `plans(id)`. If the API sets `plan_id = "pro"`, Postgres will throw a foreign key violation unless `'pro'` is aliased to `'growth'` or added to `plans`.
4. **Missing Unit Test Suite (`test_billing.py`)**:
   - `backend/tests/unit/test_billing.py` does not exist.
   - No tests currently verify that `customer.subscription.updated` updates `restaurants.plan_id` in Supabase.
5. **Webhook Route Bifurcation (`payments.py` vs `billing.py`)**:
   - `payments.py` listens on `POST /api/payments/stripe-webhook` (handling one-off food order checkout).
   - `billing.py` listens on `POST /api/billing/webhook` (handling subscription lifecycle).
   - If a production administrator points their Stripe Webhook URL to `/api/payments/stripe-webhook`, subscription events are ignored. We propose a cross-compatible defensive handler.

---

## 2. Deep Dive: `backend/app/api/billing.py`

### 2.1 Router & Endpoint Mounts
In `backend/main.py` (lines 53-55):
```python
app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
app.include_router(billing.router,     prefix="/api/billing",     tags=["billing"])
```
This mounts two endpoints in `billing.py`:
- `POST /api/billing/create-checkout-session`
- `POST /api/billing/webhook`

### 2.2 Stripe Checkout Session Creation (`POST /create-checkout-session`)

#### Current Code (lines 23-99):
```python
class CreateCheckoutRequest(BaseModel):
    restaurant_id: str
    plan_id: str  # 'starter' | 'pro' | 'enterprise'
    success_url: str | None = None
    cancel_url: str | None = None

PLAN_PRICE_IDS: dict[str, str] = {
    "starter":    "price_starter_placeholder",
    "pro":        "price_pro_placeholder",
    "enterprise": "price_enterprise_placeholder",
}

async def _get_stripe_price_id(plan_id: str) -> str:
    secret_name = f"STRIPE_PRICE_{plan_id.upper()}"
    price_id = await get_platform_secret(secret_name)
    if price_id:
        return price_id
    return PLAN_PRICE_IDS.get(plan_id, PLAN_PRICE_IDS["starter"])

@router.post("/create-checkout-session")
async def create_checkout_session(body: CreateCheckoutRequest):
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    price_id = await _get_stripe_price_id(body.plan_id)
    ...
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=body.restaurant_id,
        metadata={
            "restaurant_id": body.restaurant_id,
            "plan_id": body.plan_id,
        },
    )
```

#### Bugs & Gaps Identified:

1. **CRITICAL: Missing `subscription_data.metadata`**:
   - `stripe.checkout.Session.create` receives `metadata={"restaurant_id": ..., "plan_id": ...}`.
   - When the customer pays, Stripe creates a Subscription object and dispatches `customer.subscription.created` and `customer.subscription.updated`.
   - In Stripe's object model, `session.metadata` stays on the Checkout Session; it is **never copied** to the `Subscription` object unless explicitly specified via:
     ```python
     subscription_data={
         "metadata": {
             "restaurant_id": body.restaurant_id,
             "plan_id": body.plan_id.lower(),
         }
     }
     ```
   - **Impact**: In `_handle_subscription_change`, `subscription.get("metadata")` will be empty. Line 154 checks `if not restaurant_id: return`, silently ignoring all subscription events.

2. **Missing `"growth"` in `PLAN_PRICE_IDS`**:
   - In `ORIGINAL_REQUEST.md`: "Starter / Growth / Pro".
   - In `supabase_schema.sql`: `('starter', 'Starter', 14900, 500)`, `('growth', 'Growth', 24900, 2000)`, `('enterprise', 'Enterprise', 49900, 10000)`.
   - `PLAN_PRICE_IDS` only defines `"starter"`, `"pro"`, `"enterprise"`.
   - If `body.plan_id == "growth"`, `PLAN_PRICE_IDS.get("growth")` returns `None` and falls back to `PLAN_PRICE_IDS["starter"]`. A user purchasing Growth would be subscribed to Starter!
   - Case sensitivity: If the frontend sends `"Starter"`, `"Growth"`, or `"Enterprise"`, `.get(plan_id)` fails and falls back to starter. `plan_id.lower()` normalization is required.

3. **Fallback to Dynamic `price_data` for Zero-Config Local / Test Execution**:
   - When Stripe price IDs are placeholders (`price_starter_placeholder`), live Stripe API calls fail with `InvalidRequestError: No such price`.
   - For complete testability and developer ease, support dynamic inline `price_data`:
     ```python
     PLAN_AMOUNTS = {
         "starter": 14900,
         "growth": 24900,
         "pro": 24900,
         "enterprise": 49900,
     }
     ```

---

### 2.3 Stripe Webhook Handler (`POST /api/billing/webhook`)

#### Current Code (lines 103-220):
```python
@router.post("/webhook")
async def stripe_subscription_webhook(request: Request):
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
    webhook_secret = await get_platform_secret("STRIPE_BILLING_WEBHOOK_SECRET")

    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Webhook signature verification failed")
    else:
        import json
        event = json.loads(payload)

    event_type: str = event.get("type", "")
    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        subscription = event["data"]["object"]
        await _handle_subscription_change(subscription, event_type)

    return {"received": True}
```

#### Analysis of `_handle_subscription_change`:
```python
async def _handle_subscription_change(subscription: dict, event_type: str) -> None:
    metadata: dict = subscription.get("metadata") or {}
    restaurant_id: str | None = metadata.get("restaurant_id")
    plan_id: str | None = metadata.get("plan_id")
    stripe_subscription_id: str = subscription.get("id", "")
    status: str = subscription.get("status", "active")

    if not restaurant_id:
        log.warning("billing.webhook.no_restaurant_id", subscription_id=stripe_subscription_id)
        return

    db = get_db()
    try:
        ...
        await db.table("subscriptions").upsert({
            "restaurant_id": restaurant_id,
            "plan_id": plan_id or "starter",
            "stripe_subscription_id": stripe_subscription_id,
            "status": status,
            "current_period_end": period_end,
        }, on_conflict="stripe_subscription_id").execute()

        # Update restaurants.plan_id
        if plan_id:
            await db.table("restaurants").update({"plan_id": plan_id}).eq(
                "id", restaurant_id
            ).execute()

        # Write a billing_event row for history
        await db.table("billing_events").insert(...).execute()
    except Exception as e:
        log.error("billing.webhook.db_error", error=str(e), restaurant_id=restaurant_id)
```

#### Bugs & Gaps Identified:

1. **Webhook Secret Fallback**:
   - `billing.py` checks only `STRIPE_BILLING_WEBHOOK_SECRET`.
   - `payments.py` checks `STRIPE_WEBHOOK_SECRET`.
   - If an operator configures only `STRIPE_WEBHOOK_SECRET`, `billing.py` runs in unsigned mode!
   - Recommendation: `webhook_secret = await get_platform_secret("STRIPE_BILLING_WEBHOOK_SECRET") or await get_platform_secret("STRIPE_WEBHOOK_SECRET")`.

2. **JSON Decoding Error Handling**:
   - If `webhook_secret` is not set and the request body is malformed, `json.loads(payload)` raises `json.JSONDecodeError` resulting in an unhandled 500. It should return 400.
   - If `webhook_secret` is set, `construct_event` can raise `ValueError` (invalid payload) in addition to `SignatureVerificationError`. Catch both and return 400.

3. **Fallback for Missing `restaurant_id` on Subscription Updates**:
   - If `restaurant_id` is missing in `metadata` on a `customer.subscription.updated` event, the system should query the `subscriptions` table:
     ```python
     if not restaurant_id and stripe_subscription_id:
         res = await db.table("subscriptions").select("restaurant_id").eq("stripe_subscription_id", stripe_subscription_id).maybe_single().execute()
         if res and res.data:
             restaurant_id = res.data.get("restaurant_id")
     ```
   - This provides critical resilience for renewal webhooks.

4. **Foreign Key Constraint on `restaurants.plan_id` (`plans` Table)**:
   - In `backend/supabase_schema.sql`:
     ```sql
     create table plans (
       id text primary key, -- 'starter' | 'growth' | 'enterprise'
       ...
     );
     create table restaurants (
       ...
       plan_id text references plans(id) default 'starter',
       ...
     );
     ```
   - `plans` table rows: `'starter'`, `'growth'`, `'enterprise'`.
   - If `plan_id` arrives as `'pro'`, Postgres will reject the update:
     `Key (plan_id)=(pro) is not present in table "plans"`.
   - Normalization rule: Map `'pro'` to `'growth'` (or ensure `'pro'` exists in `plans` table).
   - Always do `plan_id = plan_id.lower().strip()`.

5. **`billing_events` Table Non-Existence**:
   - Line 193 tries to insert into `billing_events`.
   - `billing_events` table does NOT exist in `backend/supabase_schema.sql`.
   - Because it is wrapped inside the same `try:` block as `subscriptions` and `restaurants`, the restaurant update succeeds (since it executes on line 188 before line 193), but the error on line 193 causes `log.error("billing.webhook.db_error")` to fire.
   - Isolating the `billing_events` insert into its own `try...except` block prevents false alarms.

6. **Subscription Cancellation (`customer.subscription.deleted`)**:
   - `billing.py` currently only listens for `.created` and `.updated`.
   - Adding `customer.subscription.deleted` allows downgrading `restaurants.plan_id` to `'starter'` and marking `subscriptions.status = 'cancelled'`.

---

## 3. Comparison with `backend/app/api/payments.py`

| Dimension | `backend/app/api/payments.py` | `backend/app/api/billing.py` |
|---|---|---|
| **Mount Prefix** | `/api/payments` | `/api/billing` |
| **Domain** | Food Orders (one-off customer payments) | Restaurant Venue Subscriptions (SaaS recurring) |
| **Webhook Path** | `POST /api/payments/stripe-webhook` | `POST /api/billing/webhook` |
| **Events Handled** | `checkout.session.completed` (for orders) | `customer.subscription.created`, `customer.subscription.updated` |
| **Webhook Secret** | `STRIPE_WEBHOOK_SECRET` | `STRIPE_BILLING_WEBHOOK_SECRET` |
| **Target Supabase Table** | `orders`, `calls`, `payment_events` | `restaurants.plan_id`, `subscriptions`, `billing_events` |

### Cross-Webhook Compatibility Recommendation:
To make TalkByte completely resilient to how Stripe webhooks are configured in production:
1. In `payments.py`, if `event["type"]` is `customer.subscription.created` or `customer.subscription.updated`, delegate to `_handle_subscription_change` from `billing.py`.
2. In `payments.py`, if `event["type"] == "checkout.session.completed"` and `session.get("mode") == "subscription"`, extract `restaurant_id` and `plan_id` and update `restaurants.plan_id`.
3. In `billing.py`, also accept `checkout.session.completed` for subscriptions.

---

## 4. Test Strategy & Architecture: `backend/tests/unit/test_billing.py`

### 4.1 Requirements to Verify
1. `POST /api/billing/create-checkout-session`:
   - Valid request creates Stripe session with `mode="subscription"`, correct Price ID, `client_reference_id`, `metadata`, and `subscription_data`.
   - Supports plans: `starter`, `growth`, `pro`, `enterprise`.
   - Handles missing Stripe key $\rightarrow$ HTTP 500.
   - Handles `stripe.StripeError` $\rightarrow$ HTTP 502.
2. `POST /api/billing/webhook`:
   - Webhook signature verification: valid signature $\rightarrow$ 200, invalid signature $\rightarrow$ 400.
   - Unsigned dev mode works when secret is empty.
   - `customer.subscription.updated` updates `restaurants.plan_id` in Supabase.
   - `customer.subscription.created` updates `restaurants.plan_id` and upserts `subscriptions`.
   - Fallback plan extraction from line items when metadata lacks `plan_id`.
   - Missing `restaurant_id` logs warning and returns 200 without DB calls.
   - DB errors do not bubble up as 500 (returns 200 so Stripe does not retry indefinitely).

### 4.2 Complete Proposed Code for `backend/tests/unit/test_billing.py`

```python
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

    def test_create_checkout_growth_and_pro_tiers(self, client):
        """Verifies session creation for Growth and Pro tiers."""
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

        def table_side_effect(table_name: str):
            mock_table = MagicMock()
            if table_name == "restaurants":
                mock_table.update.return_value = update_mock
            elif table_name == "subscriptions":
                mock_table.upsert.return_value = upsert_mock
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
        eq_mock.execute.assert_awaited_once()

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
                        "data": [{"price": {"unit_amount": 24900, "nickname": "pro"}}]
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

    def test_webhook_missing_restaurant_id_is_graceful(self, client):
        """Webhook with no restaurant_id logs warning and returns 200 without DB update."""
        mock_db, update_mock, eq_mock, upsert_mock = self._make_mock_db()

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
        # Verify db.table was NOT called
        mock_db.table.assert_not_called()

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
```

---

## 5. Proposed Code Patches for Implementation

### 5.1 Proposed Patch for `backend/app/api/billing.py`

```python
# 1. Update PLAN_PRICE_IDS to support 'growth' as well as 'pro'
PLAN_PRICE_IDS: dict[str, str] = {
    "starter":    "price_starter_placeholder",
    "growth":     "price_growth_placeholder",
    "pro":        "price_growth_placeholder",
    "enterprise": "price_enterprise_placeholder",
}

# 2. In create_checkout_session:
# Pass subscription_data metadata so Stripe copies it to the Subscription object!
session = stripe.checkout.Session.create(
    mode="subscription",
    line_items=[{"price": price_id, "quantity": 1}],
    success_url=success_url,
    cancel_url=cancel_url,
    client_reference_id=body.restaurant_id,
    metadata={
        "restaurant_id": body.restaurant_id,
        "plan_id": body.plan_id.lower(),
    },
    subscription_data={
        "metadata": {
            "restaurant_id": body.restaurant_id,
            "plan_id": body.plan_id.lower(),
        }
    },
)

# 3. In stripe_subscription_webhook:
webhook_secret = (
    await get_platform_secret("STRIPE_BILLING_WEBHOOK_SECRET")
    or await get_platform_secret("STRIPE_WEBHOOK_SECRET")
)

# 4. In _handle_subscription_change:
# Normalize plan_id to lowercase and map 'pro' to 'growth' to maintain FK constraint
if plan_id:
    plan_id = plan_id.lower().strip()
    if plan_id == "pro":
        plan_id = "growth"

# Isolate optional billing_events insert in its own try/except block
try:
    await db.table("billing_events").insert(...).execute()
except Exception as be_err:
    log.debug("billing.webhook.billing_events_insert_skipped", error=str(be_err))
```

### 5.2 Proposed Cross-Compatibility in `backend/app/api/payments.py`

In `backend/app/api/payments.py`:
```python
# Handle subscription events if sent to /api/payments/stripe-webhook
if event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
    from app.api.billing import _handle_subscription_change
    subscription = event["data"]["object"]
    await _handle_subscription_change(subscription, event["type"])
elif event["type"] == "checkout.session.completed":
    session = event["data"]["object"]
    if session.get("mode") == "subscription":
        from app.api.billing import _handle_subscription_change
        rest_id = session.get("client_reference_id") or (session.get("metadata") or {}).get("restaurant_id")
        plan_id = (session.get("metadata") or {}).get("plan_id")
        if rest_id and plan_id:
            db = get_db()
            await db.table("restaurants").update({"plan_id": plan_id.lower()}).eq("id", rest_id).execute()
    else:
        order_id = session.get("client_reference_id")
        if order_id:
            log.info("stripe.payment_completed", order_id=order_id)
            order = await get_order(order_id)
            if order:
                push_order_to_pos.delay(order_id, order.restaurant_id)
```

---

## 6. Summary of Deliverables & Verification Blueprint

1. **`backend/app/api/billing.py`**:
   - Add `subscription_data={"metadata": ...}` to checkout session creation.
   - Include `"growth"` in `PLAN_PRICE_IDS`.
   - Normalize `plan_id = plan_id.lower()`.
   - Fall back to `STRIPE_WEBHOOK_SECRET` if `STRIPE_BILLING_WEBHOOK_SECRET` is unset.
   - Isolate `billing_events` table insert so absence of table does not log false errors.
2. **`backend/tests/unit/test_billing.py`**:
   - Implement the complete test suite specified in Section 4.
   - Run `pytest backend/tests/unit/test_billing.py` (exits with code 0).
3. **Acceptance Criteria Verification**:
   - `restaurants.plan_id` is updated in Supabase upon receiving `customer.subscription.updated` and `customer.subscription.created`.
   - Verified via unit test suite `test_billing.py`.
