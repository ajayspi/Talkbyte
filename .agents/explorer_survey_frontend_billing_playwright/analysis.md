# Technical Analysis: Requirements R2 (SaaS Subscription Billing) & R3 (Playwright E2E Testing Suite)

**Date**: 2026-09-14  
**Agent**: explorer_survey_frontend_billing_playwright  
**Parent**: orchestrator_4  
**Status**: Investigation Complete  

---

## 1. Executive Summary

This investigation surveys the architecture, routing, webhook handling, and testing infrastructure required for:
1. **R2: SaaS Subscription Billing for Restaurants**:
   - Creating a first-class Next.js route at `/dashboard/billing` that returns HTTP 200.
   - Extending `BillingTab` with dynamic tier management (Starter / Growth / Pro / Enterprise), Stripe checkout session integration, and billing history.
   - Implementing backend Stripe webhook processing in `backend/app/api/payments.py` for `customer.subscription.updated` (and `customer.subscription.created`) events to update `restaurants.plan_id` in Supabase.
   - Implementing a robust frontend feature gating system based on `restaurants.plan_id`.
2. **R3: Playwright End-to-End Testing Suite**:
   - Setting up `@playwright/test` and `playwright.config.ts` in `frontend/`.
   - Creating 3 automated, zero-flake, offline-resilient user journey tests:
     1. Restaurant owner login $\rightarrow$ dashboard loads (`owner-login.spec.ts`).
     2. Menu item availability toggle updates correctly (`menu-availability.spec.ts`).
     3. Operator admin login $\rightarrow$ restaurants list loads (`admin-login.spec.ts`).
     4. Bonus journey: `/dashboard/billing` route returns HTTP 200 with plan cards and billing history (`billing.spec.ts`).
   - Ensuring `npx playwright test` exits with code 0.

---

## 2. R2: SaaS Subscription Billing Architecture

### 2.1 Current State Analysis
1. **Frontend Route**:
   - Routing in `frontend/src/app/(restaurant)/dashboard/`:
     - Only `frontend/src/app/(restaurant)/dashboard/page.tsx` exists.
     - Direct GET to `/dashboard/billing` currently returns **HTTP 404** because Next.js App Router lacks a `billing/page.tsx` page.
     - `BillingTab.tsx` exists in `frontend/src/components/restaurant/BillingTab.tsx` and is rendered inside `dashboard/page.tsx` only when client state `activeTab === 'billing'`.
2. **Backend Webhook & Endpoints**:
   - File `backend/app/api/payments.py`:
     - Implements `POST /stripe-webhook`, but only inspects `event["type"] == "checkout.session.completed"` for one-off food orders (`client_reference_id` maps to `order_id`).
     - There is NO handler for `customer.subscription.updated`, `customer.subscription.created`, or subscription-mode checkout sessions.
     - There is NO endpoint for creating subscription checkout sessions (e.g. `POST /create-subscription-checkout`).
   - Database schema (`backend/supabase_schema.sql`):
     - `plans` table defines tiers: `starter` ($149/mo, 500 calls), `growth` ($249/mo, 2000 calls), `enterprise` ($499/mo, 10000 calls).
     - `restaurants.plan_id` defaults to `'starter'` and references `plans(id)`.
     - `subscriptions` table tracks `restaurant_id`, `plan_id`, `stripe_subscription_id`, `status`, `current_period_end`.
3. **Dashboard Feature Gating**:
   - No feature gating currently exists in the frontend. All tabs and features are unconditionally accessible regardless of the restaurant's `plan_id`.

---

### 2.2 Proposed R2 Solution & Blueprint

#### A. `/dashboard/billing` Route (HTTP 200)
Create `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`:
```tsx
'use client';

import React, { useEffect } from 'react';
import { useRestaurant } from '../../layout';
import BillingTab from '@/components/restaurant/BillingTab';

export default function BillingPage() {
  const { setActiveTab } = useRestaurant();

  useEffect(() => {
    setActiveTab('billing');
  }, [setActiveTab]);

  return <BillingTab />;
}
```
In `frontend/src/app/(restaurant)/layout.tsx`:
- Update `handleSelectTab(tab)`: when `tab === 'billing'`, navigate via `router.push('/dashboard/billing')` or keep URL in sync so that sidebar clicking routes cleanly.
- When on `/dashboard/billing`, layout wraps it with the existing sidebar and topbar, rendering `<BillingTab />` inside `<main className="content">`.
- This ensures direct browser visits or curl/HTTP requests to `/dashboard/billing` return HTTP 200.

#### B. Frontend `BillingTab.tsx` Upgrades
1. **Dynamic Tier Display**:
   - Read `currentVenue` from `useRestaurant()`.
   - Set current plan from `currentVenue?.plan_id` (supporting `'starter'`, `'growth'`, `'pro'`, `'enterprise'`).
   - Update plans list:
     - Starter: $149/mo, up to 500 calls/mo.
     - Growth / Pro: $249/mo, up to 2,000 calls/mo.
     - Enterprise: $499/mo, unlimited calls + dedicated number.
2. **Stripe Checkout Integration**:
   - In `handleConfirmUpgrade`, dispatch a POST request to `/api/payments/create-subscription-checkout` (or backend API URL) passing `{ restaurant_id, plan_id, success_url, cancel_url }`.
   - If response has `checkout_url`, redirect the browser to Stripe Checkout: `window.location.href = data.checkout_url`.
   - If backend/Stripe is offline (local development/demo), fallback gracefully: update local `currentVenue.plan_id` and display toast confirmation.
3. **Billing History**:
   - Hook into `getSubscriptions()` from `@/lib/supabase` with the existing fallback mock rows for seamless rendering.

#### C. Backend Stripe Webhook & Endpoints (`backend/app/api/payments.py`)
1. **Handle `customer.subscription.updated` and `customer.subscription.created`**:
   ```python
   elif event["type"] in ("customer.subscription.updated", "customer.subscription.created"):
       sub = event["data"]["object"]
       metadata = sub.get("metadata") or {}
       restaurant_id = metadata.get("restaurant_id")
       plan_id = metadata.get("plan_id")
       
       if not plan_id and sub.get("items", {}).get("data"):
           price = sub["items"]["data"][0].get("price", {})
           plan_id = price.get("lookup_key") or price.get("nickname")

       if restaurant_id and plan_id:
           log.info("stripe.subscription_updated", restaurant_id=restaurant_id, plan_id=plan_id)
           db = get_db()
           # Update restaurants.plan_id in Supabase
           await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()
           
           # Record in subscriptions table
           sub_record = {
               "restaurant_id": restaurant_id,
               "plan_id": plan_id,
               "stripe_subscription_id": sub.get("id"),
               "status": sub.get("status", "active"),
           }
           if sub.get("current_period_end"):
               from datetime import datetime, timezone
               sub_record["current_period_end"] = datetime.fromtimestamp(
                   sub["current_period_end"], tz=timezone.utc
               ).isoformat()
           await db.table("subscriptions").upsert(sub_record, on_conflict="stripe_subscription_id").execute()
   ```
2. **Handle `checkout.session.completed` for subscriptions**:
   ```python
   if session.get("mode") == "subscription":
       metadata = session.get("metadata") or {}
       rest_id = metadata.get("restaurant_id") or session.get("client_reference_id")
       p_id = metadata.get("plan_id")
       if rest_id and p_id:
           db = get_db()
           await db.table("restaurants").update({"plan_id": p_id}).eq("id", rest_id).execute()
   ```
3. **Endpoint `POST /create-subscription-checkout`**:
   ```python
   class SubscriptionCheckoutRequest(BaseModel):
       restaurant_id: str
       plan_id: str
       success_url: str = "https://talkbyte.com/dashboard/billing?success=true"
       cancel_url: str = "https://talkbyte.com/dashboard/billing?canceled=true"

   @router.post("/create-subscription-checkout")
   async def create_subscription_checkout(req: SubscriptionCheckoutRequest):
       stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
       
       PLAN_PRICES = {
           "starter": {"name": "TalkByte Starter Plan", "amount": 14900},
           "growth": {"name": "TalkByte Growth Plan", "amount": 24900},
           "pro": {"name": "TalkByte Pro Plan", "amount": 24900},
           "enterprise": {"name": "TalkByte Enterprise Plan", "amount": 49900},
       }
       plan_cfg = PLAN_PRICES.get(req.plan_id.lower())
       if not plan_cfg:
           raise HTTPException(status_code=400, detail=f"Invalid plan_id: {req.plan_id}")

       try:
           session = stripe.checkout.Session.create(
               payment_method_types=["card"],
               mode="subscription",
               line_items=[{
                   "price_data": {
                       "currency": "aud",
                       "product_data": {
                           "name": plan_cfg["name"],
                           "description": f"Monthly SaaS Subscription ({req.plan_id.capitalize()})",
                       },
                       "unit_amount": plan_cfg["amount"],
                       "recurring": {"interval": "month"},
                   },
                   "quantity": 1,
               }],
               metadata={"restaurant_id": req.restaurant_id, "plan_id": req.plan_id},
               subscription_data={"metadata": {"restaurant_id": req.restaurant_id, "plan_id": req.plan_id}},
               client_reference_id=req.restaurant_id,
               success_url=req.success_url,
               cancel_url=req.cancel_url,
           )
           return {"checkout_url": session.url, "session_id": session.id}
       except Exception as e:
           log.error("stripe.subscription_checkout.failed", error=str(e))
           raise HTTPException(status_code=500, detail="Failed to create checkout session")
   ```
4. **Unit Test Verification (`backend/tests/unit/test_payments.py`)**:
   Implement comprehensive tests with `unittest.mock.AsyncMock` verifying:
   - Webhook signature error returns 400.
   - `customer.subscription.updated` event extracts `restaurant_id` & `plan_id` and executes `db.table("restaurants").update({"plan_id": "growth"}).eq("id", "rest-1")`.
   - `create-subscription-checkout` returns valid checkout URL.

#### D. Feature Gating Architecture
1. **Utility `frontend/src/lib/planGating.ts`**:
   - Defines plan hierarchy: `starter` (Tier 1) < `growth` / `pro` (Tier 2) < `enterprise` (Tier 3).
   - Functions: `getPlanTier(planId)`, `canAccessFeature(userPlan, requiredTier)`.
2. **Visual Gating Component `frontend/src/components/ui/PlanGate.tsx`**:
   - Encapsulates UI elements with conditional access.
   - For locked features: shows subtle lock badge (`PRO` / `ENTERPRISE`), disables actions, and displays upgrade tooltip or opens upgrade modal.
3. **Gated Features**:
   - **Analytics**: 30-day view, Custom date range, and Peak Hours Heatmap gated to Growth/Pro+.
   - **Settings**: ElevenLabs high quality TTS provider, Manual Takeover, and Shopify POS gated to Growth/Pro+.
   - **Menu**: Website scraper menu import gated to Enterprise; CSV upload gated to Growth/Pro+.
   - **Export**: Global Export modal gated to Growth/Pro+.

---

## 3. R3: Playwright End-to-End Testing Suite Architecture

### 3.1 Current State Analysis
1. `frontend/package.json` does NOT include `@playwright/test`.
2. No `playwright.config.ts` exists.
3. Existing tests in `frontend/__tests__/` are Jest unit tests using JSDOM.
4. R4 is restoring the authentication pages (`/login`, `/signup`, `/admin/login`, `/admin/signup`).

---

### 3.2 Proposed R3 Solution & Blueprint

#### A. Playwright Configuration (`frontend/playwright.config.ts`)
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### B. Resilient Test Mocking Strategy (Zero-Flake Offline/CI)
To guarantee that `npx playwright test` never fails due to unreachable external Supabase or Stripe network calls:
1. In `playwright.config.ts` or test fixtures, use Playwright's `page.route()` to intercept Supabase Auth calls (`**/auth/v1/**`):
   - Returns HTTP 200 with valid mock session and user tokens.
2. In frontend application code:
   - `frontend/src/lib/supabase.ts` already has built-in offline fallbacks (`isSupabaseConnected()`, `withTimeout()`, and `localMenuItems`).
   - If Supabase is unreachable, queries seamlessly fall back to `MOCK_RESTAURANT`, `localMenuItems`, and `MOCK_FLEET_RESTAURANTS`.
3. In restored auth pages (`/login`, `/admin/login`):
   - Form submission calls Supabase sign-in, which resolves via route mock (or fallback) and routes to `/dashboard` or `/admin`.

#### C. The 3 Required Test Journeys

##### Journey 1: Restaurant Owner Login $\rightarrow$ Dashboard Loads
- **File**: `frontend/e2e/owner-login.spec.ts`
- **Steps**:
  1. Intercept `**/auth/v1/**` with mock auth response for owner `owner@mamaspizzeria.com.au`.
  2. Navigate to `/login`.
  3. Expect login form with Email and Password inputs.
  4. Fill email (`owner@mamaspizzeria.com.au`) and password (`TestPassword123!`).
  5. Click submit button ("Sign In" / "Log In").
  6. Assert navigation to `/dashboard`.
  7. Assert key dashboard components:
     - Venue name `"Mama's Pizzeria"`.
     - Page title `"Dashboard"`.
     - KPI cards (`"Calls Today"`, `"Revenue Today"`).
     - Recent orders and active calls widgets.

##### Journey 2: Menu Item Availability Toggle Updates Correctly
- **File**: `frontend/e2e/menu-availability.spec.ts`
- **Steps**:
  1. Navigate to `/dashboard?tab=menu`.
  2. Wait for `.menu-item-card` elements to be visible.
  3. Select the first menu item card (e.g. "Margherita").
  4. Inspect the availability badge: initially contains `"Available"` with `.badge-green`.
  5. Click the toggle switch (`.toggle`).
  6. Assert badge text immediately updates to `"Unavailable"` with `.badge-red`.
  7. Assert toast notification appears: `"✓ Out of stock: AI voice agent synced in <30s."`.
  8. Click the toggle switch a second time.
  9. Assert badge text flips back to `"Available"` with `.badge-green`.
  10. Assert toast notification reflects `"Available"`.

##### Journey 3: Operator Admin Login $\rightarrow$ Restaurants List Loads
- **File**: `frontend/e2e/admin-login.spec.ts`
- **Steps**:
  1. Intercept `**/auth/v1/**` with mock auth response for admin `admin@talkbyte.com.au`.
  2. Navigate to `/admin/login`.
  3. Fill admin email and password.
  4. Click submit button.
  5. Assert navigation to `/admin` or `/admin?tab=restaurants`.
  6. Click "Restaurant Fleet" / "Restaurants" in sidebar if on overview.
  7. Wait for table to load.
  8. Assert fleet restaurants are visible in table rows:
     - `"Mama's Pizzeria"`
     - `"Thai Express"`
     - `"Burger Palace"`
  9. Assert fleet table columns: `"Calls/mo"`, `"MRR"`, `"Status"`.

##### Bonus Journey 4: SaaS Billing Route & Plan Gating
- **File**: `frontend/e2e/billing.spec.ts`
- **Steps**:
  1. Navigate to `/dashboard/billing`.
  2. Assert HTTP response status is 200.
  3. Assert page title is `"Billing & Plan"`.
  4. Assert 3 plan cards are displayed: `"Starter"`, `"Growth"` / `"Pro"`, `"Enterprise"`.
  5. Assert `"Usage This Month"` and `"Billing History"` cards are visible.
  6. Click plan card to open confirmation modal.

---

## 4. Exact File Modification Plan

| File | Component | Action | Details |
|---|---|---|---|
| `frontend/package.json` | Dependencies | Edit | Add `@playwright/test: "^1.50.0"` in `devDependencies`, add `"test:e2e": "playwright test"` in `scripts`. |
| `frontend/playwright.config.ts` | E2E Config | Create | Define base URL, single worker, chromium project, webServer config. |
| `frontend/e2e/owner-login.spec.ts` | E2E Test | Create | Journey 1: Owner login $\rightarrow$ dashboard loads. |
| `frontend/e2e/menu-availability.spec.ts` | E2E Test | Create | Journey 2: Menu toggle updates correctly. |
| `frontend/e2e/admin-login.spec.ts` | E2E Test | Create | Journey 3: Operator admin login $\rightarrow$ restaurants list. |
| `frontend/e2e/billing.spec.ts` | E2E Test | Create | Journey 4: `/dashboard/billing` HTTP 200 and billing components. |
| `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` | Next.js Page | Create | First-class route returning HTTP 200 and rendering `BillingTab`. |
| `frontend/src/app/(restaurant)/layout.tsx` | Navigation | Edit | Wire sidebar billing click to route cleanly and reflect active state. |
| `frontend/src/components/restaurant/BillingTab.tsx` | Billing UI | Edit | Update plan tiers, connect to current restaurant plan, wire checkout trigger. |
| `frontend/src/lib/planGating.ts` | Gating Logic | Create | Plan tier definitions, hierarchy, and access checkers. |
| `frontend/src/components/ui/PlanGate.tsx` | Gating UI | Create | Lock badge, upgrade overlay, and upgrade modal trigger. |
| `frontend/src/components/restaurant/AnalyticsTab.tsx` | Feature Gating | Edit | Gate 30d/custom timeframes and peak hours heatmap. |
| `frontend/src/components/restaurant/SettingsTab.tsx` | Feature Gating | Edit | Gate ElevenLabs TTS, manual takeover, and Shopify POS connector. |
| `frontend/src/components/restaurant/MenuTab.tsx` | Feature Gating | Edit | Gate web scraper import and CSV upload. |
| `backend/app/api/payments.py` | Stripe Webhook | Edit | Add `customer.subscription.updated`, `customer.subscription.created`, and `create-subscription-checkout` endpoint. |
| `backend/tests/unit/test_payments.py` | Unit Tests | Create | Unit tests verifying Stripe webhook updates `restaurants.plan_id` in Supabase. |
