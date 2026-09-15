# Handoff Report: Explorer M3-2 (Frontend Billing Route & Checkout Integration)

**Task**: Investigate frontend billing route and checkout UI  
**Agent**: explorer_m3_2  
**Recipient**: parent (`b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  
**Date**: 2026-09-14  

---

## 1. Observation

1. **Absence of `/dashboard/billing` Route File**:
   - `list_dir` on `frontend/src/app/(restaurant)/dashboard/` revealed only `page.tsx` (1,288 bytes).
   - No `billing` subfolder or `billing/page.tsx` file exists under `frontend/src/app/(restaurant)/dashboard/`.
   - `find_by_name` for `page.tsx` under `frontend/src/app/` returned 15 pages:
     - `(restaurant)/dashboard/page.tsx`
     - `(restaurant)/billing/page.tsx`
     - There is no `(restaurant)/dashboard/billing/page.tsx` or `dashboard/billing/page.tsx`.

2. **Existing Mislocated Route File `frontend/src/app/(restaurant)/billing/page.tsx`**:
   - `view_file` on `frontend/src/app/(restaurant)/billing/page.tsx` (457 lines, 16,344 bytes) shows that a standalone billing page was implemented at `app/(restaurant)/billing/page.tsx`.
   - Because `(restaurant)` is a Next.js route group, this maps to the URL `/billing`, NOT `/dashboard/billing`.
   - Lines 31-53 define plan prices as:
     - Starter: `$500`, "Up to 3,000 calls/mo"
     - Pro: `$1,500`, "Up to 10,000 calls/mo"
     - Enterprise: `$3,500`, "Unlimited · Dedicated number"
   - Lines 200-218 trigger a POST request to `${apiBase}/api/billing/create-checkout-session` and redirect to `checkout_url`.
   - Lines 155-176 query Supabase table `billing_events` for billing history.

3. **Existing Component `frontend/src/components/restaurant/BillingTab.tsx`**:
   - `view_file` on `frontend/src/components/restaurant/BillingTab.tsx` (284 lines, 10,299 bytes):
     - Lines 14-34 define hardcoded `PLANS`:
       - Starter: `$500`, "Up to 3,000 calls/mo"
       - Pro: `$1,500`, "Up to 10,000 calls/mo"
       - Enterprise: `$3,500`, "Unlimited · Dedicated number"
     - Line 37 hardcodes default plan: `const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');`. It is not bound to `currentVenue?.plan_id`.
     - Lines 52-55 implement `handleConfirmUpgrade`:
       ```typescript
       const handleConfirmUpgrade = () => {
         setUpgradeModalOpen(false);
         showToast(`✓ Plan changed to ${selectedPlan.toUpperCase()}. Stripe subscription updated.`);
       };
       ```
       No API request is made, and no Stripe Checkout redirect occurs.
     - Lines 198-228 render hardcoded static table rows for billing history (Aug 2026: $1,500 Due 1 Sep, Jul 2026: $1,500 Paid, Jun 2026: $1,500 Paid, May 2026: $500 Paid).
     - Lines 120-181 render hardcoded static usage bars (4,841 calls, 11,183 mins, 3,920 SMS).

4. **Sidebar Navigation in `frontend/src/app/(restaurant)/layout.tsx`**:
   - Lines 1016-1020:
     ```tsx
     <div
       className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
       onClick={() => handleSelectTab('billing')}
     >
       <span className="nav-icon">💳</span> Billing & Plan
     </div>
     ```
   - Lines 109-116 define `handleSelectTab`:
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
     Clicking "Billing & Plan" sets client state `activeTab = 'billing'` and updates URL to `/dashboard?tab=billing`. It does NOT route to `/dashboard/billing`.
   - Line 67 hardcodes topbar subtitle: `billing: 'Pro Plan · $1,500/mo'`.

5. **Backend Database & API Contracts**:
   - `backend/supabase_schema.sql` (lines 18-20) defines official SaaS tiers:
     ```sql
     insert into plans values
       ('starter',    'Starter',    14900, 500),
       ('growth',     'Growth',     24900, 2000),
       ('enterprise', 'Enterprise', 49900, 10000);
     ```
   - `backend/app/api/billing.py` implements:
     - `POST /api/billing/create-checkout-session` (lines 53-99)
     - `POST /api/billing/webhook` (lines 103-219) which updates `restaurants.plan_id` in Supabase and logs to `billing_events`.

---

## 2. Logic Chain

1. **Premise**: Next.js App Router route resolution is determined strictly by the file path under `src/app/`.
2. **Observation**: No file exists at `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` or `src/app/dashboard/billing/page.tsx` (Observation 1).
3. **Deduction**: An HTTP GET request to `/dashboard/billing` cannot match any route handler or page component, and Next.js will return HTTP 404 Not Found.
4. **Premise**: R2 Acceptance Criteria explicitly specifies: "`/dashboard/billing` route returns HTTP 200".
5. **Deduction**: The frontend currently fails R2 acceptance criteria until a page is created at `src/app/(restaurant)/dashboard/billing/page.tsx`.
6. **Observation**: `frontend/src/components/restaurant/BillingTab.tsx` is what renders on `/dashboard` when `activeTab === 'billing'`. Its `handleConfirmUpgrade` only invokes `showToast` and does not call any API or redirect (Observation 3).
7. **Observation**: In contrast, `frontend/src/app/(restaurant)/billing/page.tsx` implements full Stripe Checkout session creation against `POST /api/billing/create-checkout-session` and Supabase billing events history (Observation 2).
8. **Observation**: Both frontend files show prototype prices ($500, $1500, $3500) rather than the official schema prices ($149 Starter, $249 Growth/Pro, $499 Enterprise) (Observations 2, 3, 5).
9. **Conclusion**: Worker M3 must consolidate these two implementations by creating `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`, updating `BillingTab.tsx` with official $149/$249/$499 pricing, binding active plan to `currentVenue?.plan_id`, wiring the Stripe checkout API call, and updating `layout.tsx` navigation.

---

## 3. Caveats

1. **Read-Only Inspection**: In accordance with the Explorer role and parent instruction, no interactive browser automation or build commands were executed during this turn; findings are derived directly from AST and file inspection.
2. **Backward Compatibility**: A standalone page currently exists at `/billing`. Worker M3 should consider either redirecting `/billing` to `/dashboard/billing` or keeping both functional so existing bookmarks/links do not break.
3. **Stripe Keys in Local/Demo Environment**: When Stripe API keys are unset or placeholder in local demo mode, backend `create-checkout-session` or frontend fetch must handle fallbacks gracefully with user-friendly toast messages.

---

## 4. Conclusion

1. Direct requests to `/dashboard/billing` currently return **HTTP 404** due to the missing `dashboard/billing/page.tsx`.
2. Plan cards in `BillingTab.tsx` and `(restaurant)/billing/page.tsx` display obsolete prototype pricing ($500/$1500/$3500) instead of the database-defined SaaS plans: **Starter ($149)**, **Growth/Pro ($249)**, and **Enterprise ($499)**.
3. `BillingTab.tsx` lacks Stripe Checkout triggering and dynamic Supabase billing history integration.
4. `layout.tsx` manipulates query parameters (`/dashboard?tab=billing`) rather than navigating to `/dashboard/billing`.

---

## 5. Verification Method

To independently verify these findings:

1. **Inspect Route Path Existence**:
   ```powershell
   Test-Path "frontend/src/app/(restaurant)/dashboard/billing/page.tsx"
   # Output: False
   ```
2. **Inspect Plan Card Prices in `BillingTab.tsx`**:
   Search lines 14-34 of `frontend/src/components/restaurant/BillingTab.tsx` to verify $500, $1,500, $3,500 strings.
3. **Inspect Upgrade Handler in `BillingTab.tsx`**:
   Search lines 52-56 of `frontend/src/components/restaurant/BillingTab.tsx` to verify absence of `fetch` or Stripe session logic.
4. **Post-Implementation Invalidation Condition**:
   Once Worker M3 creates `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` and updates `BillingTab.tsx`:
   - Running `curl -I http://localhost:3000/dashboard/billing` returns `HTTP/1.1 200 OK`.
   - Running Playwright test `npx playwright test tests/e2e/billing.spec.ts` passes with exit code 0.
