# Handoff Report: R2 (SaaS Subscription Billing) & R3 (Playwright E2E Testing Suite)

**Date**: 2026-09-14  
**Agent**: explorer_survey_frontend_billing_playwright  
**Recipient**: orchestrator_4 (conversation ID: 369fdf0d-a747-423b-8955-66070a006772)  
**Type**: Hard Handoff  

---

## 1. Observation

1. **Dashboard Routing**:
   - `frontend/src/app/(restaurant)/dashboard/` contains only `page.tsx`. There is no `billing/page.tsx` subdirectory.
   - Line 40 in `dashboard/page.tsx`: `{activeTab === 'billing' && <BillingTab />}`.
   - An HTTP GET request to `/dashboard/billing` produces **HTTP 404** because Next.js App Router cannot resolve the route.
2. **Layout & Tab Navigation**:
   - `frontend/src/app/(restaurant)/layout.tsx`:
     - Lines 22–29: `type TabId = 'dashboard' | 'livecalls' | 'orders' | 'menu' | 'analytics' | 'billing' | 'settings';`
     - Line 57: `billing: 'Billing & Plan'`
     - Lines 1016–1020: sidebar nav item clicks `handleSelectTab('billing')` which updates URL param `?tab=billing` but does not route to `/dashboard/billing`.
3. **Billing Component**:
   - `frontend/src/components/restaurant/BillingTab.tsx`:
     - Lines 14–34 define hardcoded `PLANS` with `starter` ($500), `pro` ($1,500), and `enterprise` ($3,500).
     - Lines 52–55: `handleConfirmUpgrade` only displays a toast notification and does not trigger a Stripe checkout session.
4. **Backend Webhook & Endpoints**:
   - `backend/app/api/payments.py`:
     - Lines 16–42: `stripe_webhook` only checks `if event["type"] == "checkout.session.completed":` for order payment.
     - There is no handler for `customer.subscription.updated` or `customer.subscription.created`.
     - There is no endpoint for creating subscription checkout sessions (e.g. `POST /create-subscription-checkout`).
5. **Database Schema**:
   - `backend/supabase_schema.sql`:
     - Lines 9–21 define table `plans` (`starter` $149, `growth` $249, `enterprise` $499).
     - Lines 24–34 define table `restaurants` with column `plan_id text references plans(id) default 'starter'`.
     - Lines 106–115 define table `subscriptions`.
6. **Feature Gating**:
   - `frontend/src/components/restaurant/`: Analytics, Settings, and Menu currently contain no plan check or lock indicators.
7. **Playwright Setup**:
   - `frontend/package.json`: Lines 33–51 lack `@playwright/test`. Lines 5–13 lack Playwright scripts.
   - No `playwright.config.ts` exists in `frontend/`.
   - No E2E tests exist in `frontend/e2e/`.

---

## 2. Logic Chain

1. **Routing (HTTP 200)**:
   - Next.js App Router requires `src/app/(restaurant)/dashboard/billing/page.tsx` to serve `/dashboard/billing` (Obs 1).
   - Creating this file and importing `<BillingTab />` inside the existing `(restaurant)/layout.tsx` guarantees `/dashboard/billing` returns HTTP 200 while sharing the authenticated sidebar and topbar (Obs 1, 2).
2. **Stripe Webhook (Supabase Update)**:
   - Stripe emits `customer.subscription.updated` when a customer upgrades or modifies their subscription.
   - Adding an `elif event["type"] in ("customer.subscription.updated", "customer.subscription.created"):` branch in `payments.py` (Obs 4), extracting `restaurant_id` and `plan_id` from `metadata`, and executing `await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()` fulfills acceptance criterion R2.
3. **Stripe Checkout Session**:
   - Adding `POST /create-subscription-checkout` in `payments.py` creates a Stripe session (`mode="subscription"`) carrying `{"restaurant_id": ..., "plan_id": ...}` in metadata and `subscription_data.metadata`, linking the webhook directly back to the restaurant (Obs 4, 5).
4. **Feature Gating**:
   - Defining `planGating.ts` and `PlanGate.tsx` allows declarative restriction of premium features (Peak Hours Heatmap, ElevenLabs TTS, CSV upload, Website scraper) based on `restaurant.plan_id` with visual lock indicators (`PRO FEATURE`) and upgrade prompts.
5. **Playwright E2E Suite**:
   - Adding `@playwright/test` to `package.json`, creating `playwright.config.ts` with Next.js `webServer`, and writing 3 isolated journey test specs in `frontend/e2e/` (owner login, menu toggle, admin login) ensures automated testing runnable via `npx playwright test` (Obs 7).
   - Mocking Supabase Auth network routes via `page.route()` in the tests ensures 100% deterministic, offline execution without depending on external cloud services.

---

## 3. Caveats

- **Auth Pages Restoration (R4)**: The auth pages (`/login`, `/signup`, `/admin/login`) are being restored by `explorer_survey_git_auth` / R4 worker. The Playwright tests are designed to match standard semantic inputs (`input[type="email"]`, `input[type="password"]`, `button[type="submit"]`), and will run cleanly once R4 is restored.
- **Stripe Secret Configuration**: In CI/local testing where live Stripe API keys are not provisioned, unit tests for the webhook handler in `backend/tests/unit/test_payments.py` utilize `unittest.mock.AsyncMock` to verify Supabase updates without network roundtrips.

---

## 4. Conclusion

The investigation confirms that Requirements R2 and R3 can be implemented cleanly with no breaking architectural changes:
1. **R2**:
   - Create `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` $\rightarrow$ returns HTTP 200.
   - Update `backend/app/api/payments.py` to handle `customer.subscription.updated` and `customer.subscription.created`, updating `restaurants.plan_id` in Supabase.
   - Add endpoint `POST /create-subscription-checkout` in `payments.py`.
   - Implement `frontend/src/lib/planGating.ts` and `frontend/src/components/ui/PlanGate.tsx` to visually gate premium features.
2. **R3**:
   - Install `@playwright/test`, add `"test:e2e": "playwright test"` script.
   - Create `frontend/playwright.config.ts` with local `webServer`.
   - Implement the 3 required journeys in `frontend/e2e/owner-login.spec.ts`, `frontend/e2e/menu-availability.spec.ts`, and `frontend/e2e/admin-login.spec.ts` (plus `billing.spec.ts`).
   - Run `npx playwright test` exiting with code 0.

---

## 5. Verification Method

### 1. Backend Webhook & Unit Tests
Run in `backend/`:
```bash
pytest tests/unit/test_payments.py -v
```
**Expected**: All tests pass with exit code 0, verifying webhook signature verification, `checkout.session.completed`, and `customer.subscription.updated` database update.

### 2. Frontend Build & Route Verification
Run in `frontend/`:
```bash
npm run build
```
**Expected**: Build completes with exit code 0, no TypeScript errors. The route `/dashboard/billing` is compiled into the route manifest.

### 3. Playwright End-to-End Test Suite
Run in `frontend/`:
```bash
npx playwright test
```
**Expected**: All 3 journeys (`owner-login.spec.ts`, `menu-availability.spec.ts`, `admin-login.spec.ts`) pass and the command exits with code 0.
