# Analysis Report: Milestone M3 Backend Billing & Webhook Review

**Reviewer**: reviewer_m3_1 (Teamwork Roles: reviewer, critic)  
**Date**: 2026-09-14  
**Target Files**:
- `backend/app/api/billing.py`
- `backend/app/api/payments.py`
- `backend/tests/unit/test_billing.py`
- `backend/supabase_schema.sql` (schema reference)
- `backend/main.py` (router integration reference)

---

## 1. Executive Summary & Verdict

**Verdict**: **APPROVE**  
**Integrity Status**: **CLEAN (No integrity violations detected)**  
**Overall Risk Assessment**: **LOW**

The backend implementation for Milestone M3 (SaaS Subscription Billing for Restaurants — Requirement R2) is correct, robust, and well-architected. It directly addresses the root causes of the prior Stripe webhook metadata disconnection, ensures schema-compliant plan tier normalization, and provides cross-webhook resilience and thorough unit test coverage.

---

## 2. Integrity Verification

As required by the Reviewer and Adversarial Critic persona, an active check for integrity violations was conducted:
1. **Hardcoded test results or expected outputs in source code**: None found. All endpoints and helper functions dynamically parse payloads, query platform secrets, call Stripe APIs, and perform real Supabase database mutations.
2. **Dummy or facade implementations**: None found. Real async database queries via Supabase client (`upsert`, `update`, `select`), real Stripe SDK invocations, and realistic fallback branches.
3. **Shortcuts bypassing intended tasks**: None found. The implementation does not bypass Stripe validation or Supabase updates; it handles checkout sessions, webhooks, signature verification, and plan state transitions end-to-end.
4. **Fabricated verification outputs or logs**: None found. The test suite in `backend/tests/unit/test_billing.py` contains 16 concrete unit test methods using FastAPI `TestClient`, asserting exact call parameters, database payloads, and status codes.
5. **Self-certifying work without independent verification**: None found. Test assertions strictly validate inputs, outputs, and side-effects.

---

## 3. Detailed Review Findings

### 3.1 Checkout Session Metadata & `subscription_data`
- **Location**: `backend/app/api/billing.py` (lines 78–96)
- **Evaluation**: PASS
- **Observation**:
  ```python
  session = stripe.checkout.Session.create(
      mode="subscription",
      line_items=[{"price": price_id, "quantity": 1}],
      success_url=success_url,
      cancel_url=cancel_url,
      client_reference_id=body.restaurant_id,
      metadata={
          "restaurant_id": body.restaurant_id,
          "plan_id": plan_normalized,
      },
      subscription_data={
          "metadata": {
              "restaurant_id": body.restaurant_id,
              "plan_id": plan_normalized,
          }
      },
  )
  ```
- **Analysis**:
  In Stripe Checkout for recurring subscriptions (`mode="subscription"`), metadata passed at the top-level session object is not propagated to the resulting `Subscription` (`sub_...`) object. By explicitly supplying `subscription_data={"metadata": {"restaurant_id": ..., "plan_id": ...}}`, Stripe copies these fields directly onto the Subscription entity. Consequently, downstream webhook events (`customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`) reliably retain `restaurant_id` and `plan_id`.

### 3.2 Webhook Handler & Supabase `restaurants.plan_id` Synchronization
- **Location**: `backend/app/api/billing.py` (lines 116–262)
- **Evaluation**: PASS
- **Observation**:
  - `POST /api/billing/webhook` handles `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
  - In `_handle_subscription_change`:
    1. Extracts `restaurant_id` and `plan_id` from `subscription.metadata`.
    2. Fallback: If `plan_id` is absent, inspects `subscription.items.data[0].price.metadata.plan_id` or `price.nickname`.
    3. Normalization: Lowercases and strips whitespace; maps alias `'pro'` to `'growth'` to prevent Postgres foreign key constraint violations against `plans(id)`.
    4. Fallback: If `restaurant_id` is missing in metadata, queries `subscriptions` table by `stripe_subscription_id`.
    5. Upserts subscription record in `subscriptions` table.
    6. Updates `restaurants.plan_id` in `restaurants` table:
       ```python
       if plan_id:
           await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()
       ```
    7. Inserts record into `billing_events` table within an isolated `try...except` block so that missing tables or optional logging do not crash or abort the transaction.
  - In `_handle_subscription_deleted`:
    - Updates `subscriptions.status = "cancelled"`.
    - Downgrades `restaurants.plan_id` to `"starter"`.

### 3.3 Plan Tier Normalization & Foreign Key Integrity
- **Location**: `backend/app/api/billing.py` (lines 35–55, 183–188) & `backend/supabase_schema.sql` (lines 10–22, 29)
- **Evaluation**: PASS
- **Observation**:
  - `backend/supabase_schema.sql` defines:
    ```sql
    create table plans (
      id            text primary key, -- 'starter' | 'growth' | 'enterprise'
      name          text not null,
      monthly_cents int  not null,
      call_limit    int  not null
    );
    ```
    and `restaurants.plan_id text references plans(id) default 'starter'`.
  - The database only allows `'starter'`, `'growth'`, and `'enterprise'`.
  - The code maps `'pro'` (frequently used as synonym for `'growth'` in marketing copy and prompt instructions) to `'growth'` consistently across:
    - `PLAN_PRICE_IDS` dictionary: maps `"pro": "price_growth_placeholder"`.
    - `_get_stripe_price_id`: checks `STRIPE_PRICE_PRO` / `STRIPE_PRICE_GROWTH` cross-fallbacks.
    - `_handle_subscription_change`: maps `"pro"` to `"growth"`.
    - `payments.py`: maps `"pro"` to `"growth"`.
  - This prevents SQL foreign key constraint failures (`violates foreign key constraint "restaurants_plan_id_fkey"`).

### 3.4 Cross-Webhook Routing & Backward Compatibility
- **Location**: `backend/app/api/payments.py` (lines 32–61)
- **Evaluation**: PASS
- **Observation**:
  - In `POST /api/payments/stripe-webhook`:
    - If `checkout.session.completed` has `mode == "subscription"`, updates `restaurants.plan_id`.
    - If `checkout.session.completed` has `mode != "subscription"`, executes standard order completion and triggers Celery POS push (`push_order_to_pos.delay`).
    - If `customer.subscription.created` or `customer.subscription.updated` events arrive at this endpoint, delegates directly to `app.api.billing._handle_subscription_change`.
  - This prevents regressions in existing payment link flows while ensuring resilience regardless of which webhook endpoint the Stripe webhook is configured to target.

### 3.5 Unit Test Suite (`backend/tests/unit/test_billing.py`)
- **Location**: `backend/tests/unit/test_billing.py` (502 lines, 16 test methods)
- **Evaluation**: PASS
- **Coverage**:
  - `TestCreateCheckoutSession`:
    1. `test_create_checkout_starter_success`: Verifies Starter session creation, `mode="subscription"`, `client_reference_id`, top-level `metadata`, and `subscription_data.metadata`.
    2. `test_create_checkout_growth_and_pro_tiers`: Verifies Growth and Pro tiers.
    3. `test_create_checkout_enterprise_tier`: Verifies Enterprise tier.
    4. `test_create_checkout_custom_urls`: Verifies custom `success_url` and `cancel_url`.
    5. `test_create_checkout_missing_stripe_key_raises_500`: Verifies 500 error when Stripe key is unconfigured.
    6. `test_create_checkout_stripe_error_raises_502`: Verifies 502 error when Stripe throws `StripeError`.
  - `TestWebhookSignatureVerification`:
    7. `test_webhook_invalid_signature_raises_400`: Verifies 400 rejection for bad signature header.
    8. `test_webhook_unsigned_dev_mode`: Verifies fallback parsing when secrets are not configured.
  - `TestSubscriptionWebhooksPlanUpdate`:
    9. `test_customer_subscription_updated_updates_restaurants_plan_id`: Verifies R2 core acceptance criterion (Stripe webhook updates `restaurants.plan_id` in Supabase).
    10. `test_customer_subscription_created_updates_plan_id`: Verifies plan update on subscription creation.
    11. `test_subscription_updated_pro_mapped_to_growth`: Verifies normalization of `'pro'` to `'growth'`.
    12. `test_subscription_updated_extracts_plan_from_price_when_metadata_missing`: Verifies fallback plan derivation from line items price metadata/nickname.
    13. `test_webhook_missing_restaurant_id_fallback_to_subscriptions_table`: Verifies fallback lookup from `subscriptions` table.
    14. `test_webhook_missing_restaurant_id_is_graceful`: Verifies no unhandled crash when restaurant is unknown.
    15. `test_webhook_database_error_does_not_crash`: Verifies 200 return on DB error to prevent infinite retry loops from Stripe.
    16. `test_customer_subscription_deleted_downgrades_to_starter`: Verifies downgrade to `'starter'` on subscription deletion.

---

## 4. Adversarial Stress-Testing & Edge Cases

| Scenario / Attack Vector | Predicted / Tested Behavior | Result | Notes |
|---|---|---|---|
| **Missing `subscription_data` in checkout** | Mitigated: `subscription_data` explicitly populated with `restaurant_id` and `plan_id`. | PASS | Stripe will copy metadata directly to `Subscription` entity. |
| **User sends `'pro'` or uppercase `'GROWTH'`** | Mitigated: `.lower().strip()` applied; `'pro'` mapped to `'growth'`. | PASS | Matches `plans` table PKs. |
| **Invalid Stripe webhook signature** | Mitigated: `stripe.Webhook.construct_event` raises 400. | PASS | Protected against webhook spoofing in production. |
| **Supabase DB downtime during webhook** | Mitigated: Caught by `try...except`, logs error, returns HTTP 200 `{"received": True}`. | PASS | Prevents Stripe exponential backoff retry storm from overwhelming recovery. |
| **Missing `billing_events` table** | Mitigated: Handled in dedicated `try...except` block, logged at debug level. | PASS | Primary `restaurants.plan_id` update succeeds regardless. |
| **Webhook dispatched to `/api/payments/stripe-webhook`** | Mitigated: Cross-delegated to `_handle_subscription_change`. | PASS | Tolerates misconfigured Stripe webhook URL. |
| **Subscription cancelled / refunded** | Mitigated: `customer.subscription.deleted` sets `plan_id = "starter"` and `status = "cancelled"`. | PASS | Automatically revokes premium access upon cancellation. |
| **Unknown arbitrary plan string (e.g. `'custom'`)** | Handled: Defaults to `'starter'` in fallback; invalid DB insert caught gracefully. | PASS | Suggestion noted for explicit whitelist guard. |

---

## 5. Minor Suggestions (Non-Blocking)

1. **Explicit Plan Whitelist Guard**:
   In `_handle_subscription_change`, add an explicit whitelist check:
   ```python
   VALID_PLANS = {"starter", "growth", "enterprise"}
   if plan_id not in VALID_PLANS:
       plan_id = "starter"
   ```
   This would guarantee that arbitrary metadata never triggers an FK error in PostgreSQL.
2. **Post-Checkout Redirect Sync**:
   When users return from Stripe Checkout to `/dashboard/billing?checkout=success`, an optimistic toast or polling could refresh the venue context in case the webhook arrives slightly after the browser redirect.

---

## 6. Conclusion

All Milestone M3 backend billing and webhook requirements are completely satisfied. The code is clean, robust, adheres to project architecture, and passes all review criteria.
