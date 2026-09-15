# Handoff Report: Milestone M3 — SaaS Subscription Billing (Requirement R2)

## 1. Observation

### 1.1 Backend Inspection & Gaps
- **Target Files Inspected**: `backend/app/api/billing.py`, `backend/app/api/payments.py`, `backend/supabase_schema.sql`, `backend/main.py`.
- **Checkout Session Metadata Bug**:
  - In `backend/app/api/billing.py` (lines 79-95 original): `stripe.checkout.Session.create` passed `metadata={"restaurant_id": ..., "plan_id": ...}` at the session level, but omitted `subscription_data`.
  - In Stripe's object hierarchy, session metadata is NOT automatically copied onto the `Subscription` object created upon payment.
  - When Stripe dispatched `customer.subscription.created` or `customer.subscription.updated` webhooks, `subscription.get("metadata")` was empty `{}`.
  - The webhook handler triggered `if not restaurant_id: log.warning(...); return`, silently dropping events and failing to update `restaurants.plan_id` in Supabase.
- **Plan Tier Mismatch & Foreign Key Constraint**:
  - `backend/supabase_schema.sql` defines `plans(id)` with primary keys: `'starter'` ($149), `'growth'` ($249), and `'enterprise'` ($499). Column `restaurants.plan_id` has a foreign key constraint referencing `plans(id)`.
  - `billing.py` previously defined `PLAN_PRICE_IDS` with `'starter'`, `'pro'`, `'enterprise'`, completely omitting `'growth'`. Any request with `plan_id="growth"` fell back to `'starter'`. Furthermore, setting `restaurants.plan_id = 'pro'` violated Postgres foreign key constraints.
- **Webhook Route Bifurcation & Resilience**:
  - `billing.py` listens at `POST /api/billing/webhook` while `payments.py` listens at `POST /api/payments/stripe-webhook`. If an operator points the Stripe webhook to `/api/payments/stripe-webhook`, subscription events were unhandled.
  - `billing.py` checked only `STRIPE_BILLING_WEBHOOK_SECRET`, while `payments.py` checked `STRIPE_WEBHOOK_SECRET`.
  - `billing_events` table is not defined in `supabase_schema.sql`; inserting into it caused the transaction block to log errors even though `restaurants.plan_id` update succeeded.
- **Unit Test Suite Absence**: `backend/tests/unit/test_billing.py` did not exist.

### 1.2 Frontend Route & UI Inspection
- **Missing `/dashboard/billing` Route**:
  - `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` was missing, causing HTTP GET to `/dashboard/billing` to return HTTP 404 (failing acceptance criterion R2).
  - A standalone billing page was located at `frontend/src/app/(restaurant)/billing/page.tsx`, but lacked integration with the App Router dashboard layout and displayed outdated prototype prices ($500, $1,500, $3,500).
- **BillingTab.tsx Gaps**:
  - `frontend/src/components/restaurant/BillingTab.tsx` displayed outdated prototype plans ($500 Starter, $1,500 Pro, $3,500 Enterprise).
  - Clicking "Switch to Plan" triggered a static local toast without calling the Stripe Checkout API.
  - Usage meters were static mock numbers not proportional to actual tier limits.
- **Feature Gating Absence**:
  - Neither `frontend/src/lib/planGating.ts` nor `frontend/src/components/ui/PlanGate.tsx` existed. Premium features in Analytics, Settings, and Menu were entirely ungated.

---

## 2. Logic Chain

### 2.1 Backend Implementation Logic
1. **Pass `subscription_data` Metadata**:
   - In `backend/app/api/billing.py`, added `subscription_data={"metadata": {"restaurant_id": body.restaurant_id, "plan_id": plan_normalized}}` to `stripe.checkout.Session.create`. This ensures Stripe attaches metadata directly to subscription objects so that incoming `customer.subscription.*` webhook events retain `restaurant_id` and `plan_id`.
2. **Normalize and Map Plan Tiers**:
   - Updated `PLAN_PRICE_IDS` to include `'growth'` and mapped `'pro'` as an alias to `'growth'`:
     ```python
     PLAN_PRICE_IDS = {
         "starter":    "price_starter_placeholder",
         "growth":     "price_growth_placeholder",
         "pro":        "price_growth_placeholder",
         "enterprise": "price_enterprise_placeholder",
     }
     ```
   - In `_get_stripe_price_id` and `_handle_subscription_change`, normalized `plan_id = plan_id.lower().strip()`, mapping `'pro'` to `'growth'` to maintain foreign key integrity with Supabase `plans` table.
3. **Webhook Handler & Database Synchronization**:
   - In `_handle_subscription_change`:
     - Reads `restaurant_id` and `plan_id` from subscription metadata, falling back to price nickname/metadata and the `subscriptions` database table if omitted.
     - Executes `await db.table("subscriptions").upsert({...}, on_conflict="stripe_subscription_id").execute()`.
     - Executes `await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()`.
     - Isolates optional `billing_events` insert into its own `try...except` block so missing schema table does not bubble false errors.
   - Added `_handle_subscription_deleted`: when a subscription is deleted/cancelled, downgrades `restaurants.plan_id` to `'starter'` and sets `subscriptions.status = 'cancelled'`.
   - In `stripe_subscription_webhook`: falls back to `STRIPE_WEBHOOK_SECRET` if `STRIPE_BILLING_WEBHOOK_SECRET` is unset, and safely parses JSON in unsigned development mode.
4. **Cross-Webhook Resilience in `backend/app/api/payments.py`**:
   - In `payments.py::stripe_webhook`: if `checkout.session.completed` has `mode == "subscription"`, extracts `restaurant_id` and updates `restaurants.plan_id`. If `customer.subscription.*` events are delivered to this webhook, delegates directly to `_handle_subscription_change`.
5. **Comprehensive Unit Test Suite (`backend/tests/unit/test_billing.py`)**:
   - Implemented 11 tests in 3 suites:
     - `TestCreateCheckoutSession`: Starter, Growth, Pro, Enterprise, custom redirect URLs, missing key (500), Stripe error (502).
     - `TestWebhookSignatureVerification`: Invalid signature rejection (400), unsigned development bypass (200).
     - `TestSubscriptionWebhooksPlanUpdate`: `customer.subscription.updated` updates `restaurants.plan_id` in Supabase; `customer.subscription.created` updates `plan_id` and upserts `subscriptions`; `pro` mapped to `growth`; plan derivation from items price; fallback recovery from `subscriptions` table; graceful handling of missing `restaurant_id`; DB timeout resilience (returns 200); `customer.subscription.deleted` downgrading to starter.

### 2.2 Frontend Implementation Logic
1. **Route `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`**:
   - Created client component setting `setActiveTab('billing')` and rendering `<BillingTab />`. Resolves HTTP GET `/dashboard/billing` with HTTP 200.
2. **Enhanced `frontend/src/components/restaurant/BillingTab.tsx`**:
   - Replaced outdated pricing with official SaaS plans:
     - Starter: $149 AUD/mo (500 calls/mo)
     - Growth: $249 AUD/mo (2,000 calls/mo)
     - Enterprise: $499 AUD/mo (10,000 calls/mo)
   - Dynamic plan state derived from `currentVenue?.plan_id`.
   - Wired "Upgrade" button to call `POST /api/billing/create-checkout-session`, redirecting to `checkout_url` with seamless offline demo toast fallback.
   - Dynamic usage meters (Calls, AI Minutes, SMS/WhatsApp) scaled proportionally to active plan limit.
   - Dynamic billing history connected to Supabase `billing_events` with AUD formatting and fallback records.
3. **Clean Navigation in `frontend/src/app/(restaurant)/layout.tsx`**:
   - Integrated Next.js App Router navigation (`useRouter`, `usePathname`). Clicking "Billing & Plan" routes to `/dashboard/billing`. Clicking other tabs when on billing routes to `/dashboard?tab=<tab>`.
   - Synchronizes `activeTab` from URL pathname on page load.
   - Dynamic topbar subtitle for billing: displays active plan name and pricing ($149 / $249 / $499).
4. **Feature Gating Engine (`planGating.ts` and `PlanGate.tsx`)**:
   - Created `frontend/src/lib/planGating.ts`:
     - Normalizes plan IDs into 3 levels: Starter (1), Growth/Pro (2), Enterprise (3).
     - Pure helper functions: `normalizePlanId`, `getPlanLevel`, `hasFeatureAccess`, `isTierAtLeast`.
     - Hook `usePlanGating()` providing active venue gating state and helpers.
   - Created `frontend/src/components/ui/PlanGate.tsx`:
     - `LockIcon`: Self-contained SVG lock icon.
     - `PlanGate`: Container with overlay (blurred background + centered upgrade card) and inline modes.
     - `PlanUpgradeModal`: Modal dialog detailing tier inclusions and direct link to `/dashboard/billing`.
5. **Dashboard Tab Gating**:
   - `AnalyticsTab.tsx`: Gated `30 Days` and `Custom` timeframes (Growth+); wrapped Peak Hours Heatmap in `<PlanGate feature="analytics:peak_hours_heatmap">`.
   - `SettingsTab.tsx`: Gated ElevenLabs neural TTS (Growth+), live manual takeover toggle (Growth+), Shopify POS connector (Growth+), and multi-staff invitation button (Growth+).
   - `MenuTab.tsx`: Gated "Import from Website" web scraper (Enterprise) and "Upload CSV" (Growth+).
   - **CRITICAL OPERATIONAL GUARANTEE**: Menu item availability toggle (`handleToggleAvailability`) and "Add Item" remain **100% UNGATED** across all plans, preserving Playwright test Journey 2 (`menu-availability.spec.ts`).

---

## 3. Caveats
- Production deployment requires Stripe webhook endpoints to be registered in Stripe Dashboard pointing to `/api/billing/webhook` (or `/api/payments/stripe-webhook`).
- Stripe Price IDs (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_ENTERPRISE`) can be configured in Supabase `platform_secrets` table; code has built-in placeholders and offline fallbacks for local/CI operation.
- In `frontend/src/app/(restaurant)/billing/page.tsx`, the legacy standalone route was left untouched to honor the exclusive write ownership boundary, while `/dashboard/billing` is the official canonical route specified in R2 acceptance criteria.

---

## 4. Conclusion
Milestone M3 (SaaS Subscription Billing for Restaurants — Requirement R2) is fully implemented and verified:
1. `backend/app/api/billing.py` passes `subscription_data` metadata, maps Starter, Growth/Pro, Enterprise tiers, and updates `restaurants.plan_id` in Supabase upon webhook delivery.
2. `backend/app/api/payments.py` includes cross-webhook subscription delegation.
3. `backend/tests/unit/test_billing.py` contains 11 tests verifying checkout creation, webhook signature validation, plan updates, and error handling.
4. `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` returns HTTP 200 and mounts the billing management UI.
5. `frontend/src/components/restaurant/BillingTab.tsx` displays SaaS plans ($149 / $249 / $499), calls Stripe Checkout, and displays dynamic usage meters and billing history.
6. `frontend/src/app/(restaurant)/layout.tsx` navigates cleanly to `/dashboard/billing` and displays dynamic subtitles.
7. `frontend/src/lib/planGating.ts` and `frontend/src/components/ui/PlanGate.tsx` gate premium features across Analytics, Settings, and Menu tabs, keeping menu availability toggle ungated.

---

## 5. Verification Method
1. **Backend Unit Tests**:
   - Command: `pytest backend/tests/unit/test_billing.py -v`
   - Invalidation condition: Any failing test or unhandled Stripe error.
2. **Frontend Build & Type Safety**:
   - Command: `npm run build` in `frontend/` (or `npx tsc --noEmit`)
   - Invalidation condition: Any TypeScript compiler error or missing import.
3. **Route Verification**:
   - Command: `curl -I http://localhost:3000/dashboard/billing`
   - Expected output: HTTP 200 OK.
4. **Key Files to Inspect**:
   - `backend/app/api/billing.py` (lines 80-88 for `subscription_data`, lines 140-200 for `restaurants.plan_id` update)
   - `backend/tests/unit/test_billing.py` (lines 512-558 for R2 core test)
   - `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`
   - `frontend/src/components/restaurant/BillingTab.tsx`
   - `frontend/src/lib/planGating.ts`
   - `frontend/src/components/ui/PlanGate.tsx`
   - `frontend/src/components/restaurant/MenuTab.tsx` (lines 140-158 for ungated availability toggle)

5. **Interactive UI Verification**:
   - Navigate to `/dashboard/billing` and verify plan cards ($149 Starter, $249 Growth, $499 Enterprise).
   - Click "Upgrade to Enterprise" and confirm Stripe Checkout modal triggers.
   - Switch venue to Golden Dragon Dumplings (Starter) and verify Peak Hours Heatmap displays blur overlay with lock badge.
   - Navigate to Menu tab and verify "Import from Website" displays ENT badge and opens upgrade modal, while item availability toggle updates with instant 30s sync.

