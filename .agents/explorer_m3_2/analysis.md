# Technical Analysis: Frontend Billing Route & Checkout Integration (M3-2)

**Agent**: explorer_m3_2  
**Date**: 2026-09-14  
**Target Milestone**: M3 (SaaS Subscription Billing for Restaurants - R2)  
**Parent**: orchestrator_4 (`b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  

---

## 1. Executive Summary

This investigation analyzed the frontend billing route, the billing UI components, and the navigation flow across the TalkByte codebase, specifically focusing on:
1. `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`
2. `frontend/src/app/(restaurant)/dashboard/page.tsx`
3. `frontend/src/app/(restaurant)/billing/page.tsx`
4. `frontend/src/components/restaurant/BillingTab.tsx`
5. `frontend/src/app/(restaurant)/layout.tsx`
6. `backend/app/api/billing.py`

### Key Verdict
- **Route `/dashboard/billing`**: **Returns HTTP 404** (FAILS acceptance criteria). No page exists at `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`. A billing page was mistakenly placed at `frontend/src/app/(restaurant)/billing/page.tsx` which maps only to `/billing`.
- **Plan Cards**: Display outdated prototype values ($500, $1,500, $3,500) rather than the official SaaS plan values ($149 Starter, $249 Growth/Pro, $499 Enterprise) defined in `backend/supabase_schema.sql` and `PROJECT.md`.
- **Stripe Checkout Trigger**: `BillingTab.tsx` (rendered on `/dashboard?tab=billing`) has **NO Stripe checkout integration**; it only triggers a static client toast. In contrast, `frontend/src/app/(restaurant)/billing/page.tsx` contains a working implementation targeting `POST /api/billing/create-checkout-session`, but is stranded at `/billing`.
- **Billing History**: `BillingTab.tsx` contains static hardcoded mock rows; it does not query Supabase `billing_events` or `subscriptions`.
- **Navigation in `layout.tsx`**: Clicking "Billing & Plan" calls `handleSelectTab('billing')`, which updates the client query param `/dashboard?tab=billing` without navigating to `/dashboard/billing`.

---

## 2. Deep Dive: Route `/dashboard/billing` & Next.js App Router

### 2.1 Direct Observation
- **Missing File**: `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` does **not exist**.
- **Existing Directory Layout**:
  ```
  frontend/src/app/(restaurant)/
  ├── layout.tsx                     (Common shell: sidebar, topbar, user profile)
  ├── dashboard/
  │   └── page.tsx                   (Renders tab switch based on activeTab state)
  └── billing/
      └── page.tsx                   (Self-contained billing screen, 457 lines)
  ```
- **Next.js App Router Behavior**:
  - `(restaurant)` is a route group enclosed in parentheses, meaning it is excluded from URL path segments.
  - `(restaurant)/dashboard/page.tsx` resolves strictly to `/dashboard`.
  - `(restaurant)/billing/page.tsx` resolves strictly to `/billing`.
  - When an incoming HTTP request hits `GET /dashboard/billing`, Next.js searches for `src/app/dashboard/billing/page.tsx` or `src/app/(restaurant)/dashboard/billing/page.tsx`.
  - Since neither exists, and `next.config.mjs` contains no rewrites for `/dashboard/billing`, Next.js **returns HTTP 404 Not Found**.

### 2.2 Requirement Mismatch
- `ORIGINAL_REQUEST.md` Acceptance Criteria §SaaS Billing (R2):
  > "- [ ] `/dashboard/billing` route returns HTTP 200."
- This is a critical blocker for Milestone M3 and automated E2E tests (`billing.spec.ts`).

---

## 3. Deep Dive: `BillingTab.tsx` vs `(restaurant)/billing/page.tsx`

Two parallel billing implementations exist in the frontend codebase. They are out of sync:

| Feature | `components/restaurant/BillingTab.tsx` | `app/(restaurant)/billing/page.tsx` | Target Contract (`PROJECT.md` / DB) |
|---|---|---|---|
| **Mount Location** | Mounted in `dashboard/page.tsx` when `activeTab === 'billing'` | Mounted at `/billing` route | Must be mounted at `/dashboard/billing` |
| **Starter Tier** | `$500/mo`, 3,000 calls | `$500/mo`, 3,000 calls | **$149/mo**, 500 calls |
| **Growth / Pro Tier**| `$1,500/mo`, 10,000 calls | `$1,500/mo`, 10,000 calls | **$249/mo**, 2,000 calls |
| **Enterprise Tier** | `$3,500/mo`, unlimited | `$3,500/mo`, unlimited | **$499/mo**, 10,000 calls |
| **Active Plan State**| Hardcoded `useState('pro')` (line 37) | Dynamically loaded via `currentVenue?.plan_id` / `getRestaurant()` (lines 142-152) | Must reflect `restaurants.plan_id` |
| **Upgrade Action** | Mock toast only (lines 52-55): `showToast(...)` | Real API POST to `/api/billing/create-checkout-session` & `window.location.href = checkout_url` (lines 189-226) | Must trigger Stripe Checkout session |
| **Billing History** | Static hardcoded table rows (lines 198-228) | Dynamic query to Supabase `billing_events` table with fallback (lines 155-176) | Must display real or mock billing events |
| **Usage Metrics** | Static hardcoded meters (4,841 calls, 11,183 mins, 3,920 SMS) | None (focuses on plan selection and history) | Dynamic usage meters based on plan limit |

### 3.1 Code Comparison: Upgrade Action

**In `BillingTab.tsx` (Lines 52-55):**
```typescript
const handleConfirmUpgrade = () => {
  setUpgradeModalOpen(false);
  showToast(`✓ Plan changed to ${selectedPlan.toUpperCase()}. Stripe subscription updated.`);
};
```
*Issue*: No network call is made. Stripe is completely uncontacted.

**In `(restaurant)/billing/page.tsx` (Lines 194-218):**
```typescript
const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin.replace(/:\d+$/, ':8000')
    : 'http://localhost:8000');

const res = await fetch(`${apiBase}/api/billing/create-checkout-session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    restaurant_id: currentVenue?.id ?? 'mock-restaurant',
    plan_id: targetPlan,
  }),
});

if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
}

const { checkout_url } = (await res.json()) as { checkout_url?: string };
if (checkout_url) {
  window.location.href = checkout_url;
}
```
*Analysis*: This matches `backend/app/api/billing.py` perfectly.

---

## 4. Deep Dive: Navigation in `layout.tsx`

In `frontend/src/app/(restaurant)/layout.tsx`:

1. **Sidebar Navigation Item** (Lines 1016-1020):
   ```tsx
   <div
     className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
     onClick={() => handleSelectTab('billing')}
   >
     <span className="nav-icon">💳</span> Billing & Plan
   </div>
   ```
2. **Tab Selection Handler** (Lines 109-116):
   ```tsx
   const handleSelectTab = (tab: TabId) => {
     setActiveTab(tab);
     if (typeof window !== 'undefined') {
       const url = new URL(window.location.href);
       url.searchParams.set('tab', tab);
       window.history.replaceState({}, '', url.toString());
     }
   };
   ```
3. **Observation**:
   - Clicking "Billing & Plan" updates the query parameter to `?tab=billing` without changing the route pathname.
   - If the user is on `/dashboard`, the URL becomes `/dashboard?tab=billing`.
   - If the user reloads `/dashboard/billing` or copies the link, the server 404s.
   - For proper Next.js App Router routing:
     - The sidebar navigation should navigate to `/dashboard/billing` (e.g. using `router.push('/dashboard/billing')` or `<Link href="/dashboard/billing">`), OR
     - `handleSelectTab` should support routing when tab is `'billing'`, while retaining tab state synchronization.

---

## 5. Backend Alignment (`backend/app/api/billing.py` & Supabase)

### 5.1 Endpoints Available
- `POST /api/billing/create-checkout-session`:
  - Request body: `{ restaurant_id: str, plan_id: str, success_url?: str, cancel_url?: str }`
  - Valid `plan_id` values: `"starter"`, `"pro"`, `"enterprise"`
  - Response: `{ checkout_url: str, session_id: str }`
- `POST /api/billing/webhook`:
  - Listens for `customer.subscription.created` and `customer.subscription.updated`
  - Updates `restaurants.plan_id` in Supabase:
    ```python
    await db.table("restaurants").update({"plan_id": plan_id}).eq("id", restaurant_id).execute()
    ```
  - Inserts event into `billing_events` table for audit/history.

### 5.2 Database Schema Alignment (`backend/supabase_schema.sql`)
- Table `plans`:
  - `'starter'`: $149 (14,900 cents), 500 calls/mo
  - `'growth'` / `'pro'`: $249 (24,900 cents), 2,000 calls/mo
  - `'enterprise'`: $499 (49,900 cents), 10,000 calls/mo
- Column `restaurants.plan_id`: references `plans(id)`, default `'starter'`.

---

## 6. Actionable Blueprint for Worker M3

To achieve full compliance with R2 acceptance criteria:

### Step 1: Create Route `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`
Create the file so that `GET /dashboard/billing` returns HTTP 200.
```tsx
'use client';

import React, { useEffect } from 'react';
import { useRestaurant } from '../../layout';
import BillingTab from '@/components/restaurant/BillingTab';

export default function DashboardBillingPage() {
  const { setActiveTab } = useRestaurant();

  useEffect(() => {
    setActiveTab('billing');
  }, [setActiveTab]);

  return <BillingTab />;
}
```

### Step 2: Refactor `frontend/src/components/restaurant/BillingTab.tsx`
1. **Update Plan Definitions to Official Pricing**:
   ```typescript
   export const PLANS = [
     {
       id: 'starter',
       name: 'Starter',
       price: '$149',
       sub: 'Up to 500 calls/mo',
       callLimit: 500,
       features: ['500 inbound calls/month', 'AI voice ordering', 'Standard voice engine', 'Email support'],
     },
     {
       id: 'pro',
       name: 'Pro', // Or 'Growth / Pro'
       price: '$249',
       sub: 'Up to 2,000 calls/mo',
       callLimit: 2000,
       features: ['2,000 inbound calls/month', 'Priority AI routing', 'Advanced analytics', 'SMS receipts & WhatsApp'],
     },
     {
       id: 'enterprise',
       name: 'Enterprise',
       price: '$499',
       sub: 'Up to 10,000 calls/mo · Dedicated number',
       callLimit: 10000,
       features: ['10,000 inbound calls/month', 'Dedicated Telnyx number', 'Custom voice persona', 'POS integrations', 'Dedicated CSM'],
     },
   ];
   ```
2. **Bind Active Plan to `currentVenue?.plan_id`**:
   Read `currentVenue` from `useRestaurant()`. Default to `currentVenue?.plan_id || 'starter'`.
3. **Implement Real Stripe Checkout Call**:
   In `handleConfirmUpgrade`, call `POST /api/billing/create-checkout-session` passing `{ restaurant_id: currentVenue?.id, plan_id: selectedPlan }`. If `checkout_url` is returned, redirect with `window.location.href = checkout_url`. Provide resilient offline/demo fallback toast if API is unreachable.
4. **Wire Billing History to Supabase `billing_events`**:
   Import `supabase` and load `billing_events` ordered by `created_at desc`, falling back to mock rows when offline.

### Step 3: Update `frontend/src/app/(restaurant)/layout.tsx`
1. When clicking `Billing & Plan`, route to `/dashboard/billing` using Next.js `useRouter().push('/dashboard/billing')` while syncing `activeTab = 'billing'`.
2. Update the topbar subtitle for `billing` from static `Pro Plan · $1,500/mo` to dynamically reflect `currentVenue?.plan_id`.

### Step 4: Ensure Route Compatibility
Keep `frontend/src/app/(restaurant)/billing/page.tsx` or redirect `/billing` to `/dashboard/billing` so that both `/billing` and `/dashboard/billing` resolve cleanly without 404s.
