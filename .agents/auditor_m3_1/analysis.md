# Forensic Integrity Analysis: Milestone M3 (SaaS Subscription Billing)

**Auditor**: auditor_m3_1
**Date**: 2026-09-14
**Target Milestone**: M3 — SaaS Subscription Billing for Restaurants (Requirement R2)
**Integrity Mode**: Demo (per `ORIGINAL_REQUEST.md`)

---

## 1. Executive Summary
An exhaustive forensic audit was conducted on all changes delivered by `worker_m3` for Milestone M3 across backend and frontend repositories. 

The audit assessed:
1. `backend/app/api/billing.py` (Stripe Checkout Session creation & Subscription Webhook processing)
2. `backend/app/api/payments.py` (Cross-webhook subscription handling)
3. `backend/tests/unit/test_billing.py` (11 unit tests across checkout and webhook suites)
4. `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` (Canonical `/dashboard/billing` route)
5. `frontend/src/app/(restaurant)/layout.tsx` (Navigation, active tab sync, dynamic plan subtitles)
6. `frontend/src/components/restaurant/BillingTab.tsx` (SaaS plan display, Stripe checkout trigger, dynamic usage meters, billing history)
7. `frontend/src/lib/planGating.ts` (Plan normalization, feature access matrix, `usePlanGating` hook)
8. `frontend/src/components/ui/PlanGate.tsx` (`<PlanGate>` overlay/inline UI and `<PlanUpgradeModal>`)
9. `frontend/src/components/restaurant/AnalyticsTab.tsx` (Feature gating on 30d, custom timeframe, peak hours heatmap)
10. `frontend/src/components/restaurant/SettingsTab.tsx` (Feature gating on ElevenLabs TTS, manual takeover, Shopify POS, multi-staff)
11. `frontend/src/components/restaurant/MenuTab.tsx` (Feature gating on CSV upload and Web Scraper, with menu availability toggle strictly UNGATED)

**Audit Verdict**: **`CLEAN`** — No hardcoded test values, no facade implementations, no fabricated outputs, and no test evasion detected.

---

## 2. Forensic Phase 1: Mode-Agnostic Investigation (Observations)

### 2.1 Backend Implementation (`backend/app/api/billing.py`)
- **Checkout Session Creation**:
  - `create_checkout_session` accepts `CreateCheckoutRequest(restaurant_id, plan_id, success_url, cancel_url)`.
  - Verifies presence of `STRIPE_SECRET_KEY` from Supabase `platform_secrets` table via `get_platform_secret`. Raises HTTP 500 if missing.
  - Dynamically resolves Price ID via `_get_stripe_price_id`, querying `platform_secrets` (`STRIPE_PRICE_{TIER}`) with fallback to dictionary mapping.
  - Passes `client_reference_id=body.restaurant_id`, `metadata={"restaurant_id": ..., "plan_id": ...}`, and crucially:
    ```python
    subscription_data={
        "metadata": {
            "restaurant_id": body.restaurant_id,
            "plan_id": plan_normalized,
        }
    }
    ```
    *Forensic note*: Attaching metadata inside `subscription_data` is required by Stripe's API for the created `Subscription` object to inherit metadata, enabling downstream webhook handlers to identify the venue and plan without relying solely on ephemeral session data.
  - Returns dynamic response: `{"checkout_url": session.url, "session_id": session.id}`.
  - Properly catches `stripe.StripeError` (returns 502) and generic `Exception` (returns 500).

- **Webhook Handling & Supabase Database Updates**:
  - `POST /api/billing/webhook` handles:
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - Validates webhook signature via `stripe.Webhook.construct_event` when `STRIPE_BILLING_WEBHOOK_SECRET` or `STRIPE_WEBHOOK_SECRET` is configured.
  - In local development / CI (when no secret is configured), parses JSON safely and issues an informational log.
  - In `_handle_subscription_change`:
    - Reads `restaurant_id` and `plan_id` from subscription metadata.
    - Fallback: derives `plan_id` from price metadata or nickname if omitted from subscription metadata.
    - Normalizes `plan_id` and maps alias `'pro'` to `'growth'`.
      *Forensic note*: `backend/supabase_schema.sql` defines `plans(id)` with primary keys `'starter'`, `'growth'`, `'enterprise'`, and `restaurants.plan_id` has a foreign key constraint referencing `plans(id)`. Mapping `'pro'` to `'growth'` prevents database FK violation errors.
    - Fallback: if `restaurant_id` is omitted in metadata, looks up `restaurant_id` from the `subscriptions` table using `stripe_subscription_id`.
    - Upserts into `subscriptions` table:
      `await db.table("subscriptions").upsert({...}, on_conflict="stripe_subscription_id").execute()`
    - Updates `restaurants` table:
      `await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()`
    - Inserts event into `billing_events` table inside an isolated `try...except` block, ensuring missing optional schema tables do not rollback or abort the primary `restaurants.plan_id` update.
    - In `_handle_subscription_deleted`: downgrades `restaurants.plan_id` to `'starter'` and sets `subscriptions.status = 'cancelled'`.

### 2.2 Cross-Webhook Handling (`backend/app/api/payments.py`)
- In `payments.py::stripe_webhook`:
  - Handles `checkout.session.completed` when `mode == "subscription"` by extracting `restaurant_id` and `plan_id` and updating `restaurants.plan_id`.
  - Handles `customer.subscription.created` and `customer.subscription.updated` by delegating to `_handle_subscription_change` from `billing.py`.
  - Guarantees subscription synchronization regardless of which webhook endpoint the Stripe webhook is configured to call.

### 2.3 Unit Test Suite (`backend/tests/unit/test_billing.py`)
- Suite contains 11 tests in 3 test classes:
  1. `TestCreateCheckoutSession` (6 tests):
     - `test_create_checkout_starter_success`: Verifies parameters passed to `stripe.checkout.Session.create`, including `mode="subscription"`, `client_reference_id`, and `subscription_data`.
     - `test_create_checkout_growth_and_pro_tiers`: Verifies tier metadata for Growth and Pro.
     - `test_create_checkout_enterprise_tier`: Verifies Enterprise tier metadata.
     - `test_create_checkout_custom_urls`: Verifies custom success and cancel redirect URLs.
     - `test_create_checkout_missing_stripe_key_raises_500`: Verifies missing secret handling.
     - `test_create_checkout_stripe_error_raises_502`: Verifies StripeError exception handling.
  2. `TestWebhookSignatureVerification` (2 tests):
     - `test_webhook_invalid_signature_raises_400`: Verifies signature validation failure rejection.
     - `test_webhook_unsigned_dev_mode`: Verifies dev mode fallback when secret is empty.
  3. `TestSubscriptionWebhooksPlanUpdate` (8 tests):
     - `test_customer_subscription_updated_updates_restaurants_plan_id`: Directly verifies R2 acceptance criterion: `mock_db.table.assert_any_call("restaurants")`, `update_mock.eq.assert_called_with("id", "rest-target-uuid")`, and `upsert_mock.execute.assert_awaited_once()`.
     - `test_customer_subscription_created_updates_plan_id`: Verifies creation updates `plan_id`.
     - `test_subscription_updated_pro_mapped_to_growth`: Verifies `"pro"` maps to `"growth"` (`mock_table_rest.update.assert_called_with({"plan_id": "growth"})`).
     - `test_subscription_updated_extracts_plan_from_price_when_metadata_missing`: Verifies fallback price nickname extraction.
     - `test_webhook_missing_restaurant_id_fallback_to_subscriptions_table`: Verifies DB lookup fallback.
     - `test_webhook_missing_restaurant_id_is_graceful`: Verifies no unhandled crash when metadata is empty.
     - `test_webhook_database_error_does_not_crash`: Verifies DB timeouts return 200 to prevent Stripe infinite retries.
     - `test_customer_subscription_deleted_downgrades_to_starter`: Verifies cancellation downgrades to `'starter'`.
- *Forensic Assessment of Tests*:
  - Tests do NOT use self-certifying tautologies (e.g. `assert True` or inspecting static variables).
  - Tests exercise real FastAPI routes with `TestClient(app)`, parsing real JSON payloads, passing through request validators, and asserting on mock calls to Stripe SDK and Supabase client.

### 2.4 Frontend Route & UI (`frontend/src/app/(restaurant)/dashboard/billing/page.tsx` & `BillingTab.tsx`)
- Canonical Route `/dashboard/billing`:
  - `page.tsx` exists and sets `activeTab` to `'billing'`, rendering `<BillingTab />`. Resolves HTTP GET `/dashboard/billing` with HTTP 200.
- `BillingTab.tsx`:
  - Configured with official SaaS tiers:
    - Starter: $149 AUD/mo (500 calls/mo)
    - Growth: $249 AUD/mo (2,000 calls/mo)
    - Enterprise: $499 AUD/mo (10,000 calls/mo)
  - Interactivity:
    - "Switch to Plan" / "Upgrade" triggers confirmation modal.
    - Submitting calls `POST /api/billing/create-checkout-session`. If `checkout_url` is returned, redirects browser via `window.location.href`. In offline/demo fallback, displays toast notification.
  - Dynamic usage meters scale according to active tier limit (e.g. 500 limit for Starter vs 2,000 for Growth vs 10,000 for Enterprise).
  - Billing history queries Supabase `billing_events` table with AUD currency formatting.

### 2.5 Navigation & Dynamic Subtitles (`frontend/src/app/(restaurant)/layout.tsx`)
- Clicking "Billing & Plan" navigates to `/dashboard/billing`.
- Synchronizes `activeTab` from URL pathname on mount and navigation.
- Topbar subtitle for billing dynamically reflects active venue's plan (`venue?.plan_id`):
  - Starter: "Starter Plan · $149/mo"
  - Growth: "Growth Plan · $249/mo"
  - Enterprise: "Enterprise Plan · $499/mo"

### 2.6 Feature Gating System (`planGating.ts` & `PlanGate.tsx`)
- Gating Engine:
  - `normalizePlanId`: canonicalizes `'starter'`, `'growth'`, `'enterprise'` (mapping `'pro'` to `'growth'`).
  - `getPlanLevel`: maps Starter -> 1, Growth -> 2, Enterprise -> 3.
  - `hasFeatureAccess`, `isTierAtLeast`, `usePlanGating` hook.
- UI Gating Component:
  - `<PlanGate feature="...">` supporting `overlay` (blurred content + lock badge + CTA), `inline` (interceptor lock badge), and `hide`.
  - `<PlanUpgradeModal>` explaining feature tier inclusions and providing direct CTA to `/dashboard/billing`.
- Operational Gating Integration:
  - `AnalyticsTab.tsx`: Gated 30-day view, custom range, and Peak Hours Heatmap.
  - `SettingsTab.tsx`: Gated ElevenLabs neural TTS, manual call takeover toggle, Shopify POS connector, and multi-staff invite.
  - `MenuTab.tsx`: Gated Web Scraper (Enterprise) and Bulk CSV Upload (Growth).
  - **CRITICAL OPERATIONAL VERIFICATION**: The menu item availability toggle (`handleToggleAvailability` in `MenuTab.tsx`) and "Add Item" remain **100% UNGATED** across all plans. This ensures that Playwright Journey 2 (`menu-availability.spec.ts`) runs without obstruction.

---

## 3. Forensic Phase 2: Mode-Specific Flagging (Demo Mode)

Evaluating Phase 1 observations against the prohibited patterns for **Demo Mode**:

| Prohibited Pattern | Evaluation | Status |
|---|---|:---:|
| **Hardcoded test results** | No hardcoded returns, dummy mock responses, or bypasses found in production code. | **CLEAN** |
| **Facade implementations** | All endpoints and frontend components execute real logic, database mutations, and state management. | **CLEAN** |
| **Fabricated verification outputs** | No pre-existing test result logs or attestation files detected in the repository. | **CLEAN** |
| **Self-certifying tests** | Test suite asserts mock database calls and Stripe SDK invocations through genuine FastAPI TestClient requests. | **CLEAN** |
| **Copied core logic from external projects** | Logic was designed and tailored specifically for TalkByte's FastAPI and Supabase architecture. | **CLEAN** |
| **Delegated core work to external tools** | Implementation was written directly by the agent in Python and TypeScript. | **CLEAN** |

---

## 4. Requirement Verification Matrix

| Requirement | Description | Status | Evidence |
|---|---|:---:|---|
| **R2.1** | Billing screen at `/dashboard/billing` returning HTTP 200 | **PASS** | `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` renders `<BillingTab />` inside layout |
| **R2.2** | View current plan (Starter / Growth / Pro) and billing history | **PASS** | `BillingTab.tsx` derives active plan from `currentVenue.plan_id`, displays pricing ($149 / $249 / $499) and billing history from `billing_events` |
| **R2.3** | Upgrade via Stripe Checkout Session | **PASS** | `POST /api/billing/create-checkout-session` calls `stripe.checkout.Session.create` with `subscription_data.metadata`, returns `checkout_url` |
| **R2.4** | Stripe Webhook updates `restaurants.plan_id` in Supabase | **PASS** | `_handle_subscription_change` executes `db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id)`, tested in `test_billing.py` |
| **R2.5** | Premium dashboard features gated based on `plan_id` | **PASS** | `planGating.ts` and `PlanGate.tsx` gate Analytics (heatmap, 30d), Settings (ElevenLabs, takeover, Shopify), and Menu (scraper, CSV) |
| **R2.6** | Menu item availability toggle remains UNGATED | **PASS** | `handleToggleAvailability` in `MenuTab.tsx` is ungated (Level 1), preserving E2E Journey 2 |

---

## 5. Verdict
**CLEAN** — No integrity violations found.
All acceptance criteria for Requirement R2 are authentically satisfied.
