# Task Assignment: Worker M3 (SaaS Subscription Billing Implementation)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m3
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Explorer Reports**:
- `.agents/explorer_m3_1/analysis.md`
- `.agents/explorer_m3_2/analysis.md`
- `.agents/explorer_m3_3/analysis.md`
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Exclusive Write Ownership
You exclusively own:
- `backend/app/api/billing.py`
- `backend/app/api/payments.py`
- `backend/tests/unit/test_billing.py`
- `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`
- `frontend/src/app/(restaurant)/layout.tsx`
- `frontend/src/components/restaurant/BillingTab.tsx`
- `frontend/src/lib/planGating.ts`
- `frontend/src/components/ui/PlanGate.tsx`
- `frontend/src/components/restaurant/AnalyticsTab.tsx`
- `frontend/src/components/restaurant/SettingsTab.tsx`
- `frontend/src/components/restaurant/MenuTab.tsx`

## Instructions
1. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
2. Read the explorer reports carefully.
3. Backend Implementation:
   - In `backend/app/api/billing.py`:
     - Fix `create_checkout_session` to pass `subscription_data={"metadata": {"restaurant_id": body.restaurant_id, "plan_id": body.plan_id.lower()}}` so `subscription.metadata` is populated when webhook fires.
     - Ensure plan ID mapping handles Starter, Growth/Pro, Enterprise, mapping to DB plans (`starter`, `growth`, `enterprise`).
     - Ensure webhook handler updates `restaurants.plan_id` in Supabase when `customer.subscription.updated` and `customer.subscription.created` events are received.
   - Create `backend/tests/unit/test_billing.py` adopting the comprehensive unit test suite from `explorer_m3_1/analysis.md`.
   - Run `pytest backend/tests/unit/test_billing.py -v` using `run_command` and ensure all tests pass.
4. Frontend Implementation:
   - Create `frontend/src/app/(restaurant)/dashboard/billing/page.tsx` ensuring HTTP GET to `/dashboard/billing` returns HTTP 200 and renders the billing management UI.
   - In `frontend/src/components/restaurant/BillingTab.tsx`:
     - Display Starter ($149), Growth ($249), Enterprise ($499) plan cards.
     - Wire upgrade button to call Stripe Checkout session creation (`/api/billing/create-checkout-session`), with graceful fallback.
     - Display usage metrics and billing history.
   - In `frontend/src/app/(restaurant)/layout.tsx`:
     - Ensure clicking Billing in the sidebar navigates cleanly to `/dashboard/billing` (or syncs tab state).
   - Create `frontend/src/lib/planGating.ts` and `frontend/src/components/ui/PlanGate.tsx`:
     - Implement feature gating based on `restaurants.plan_id`.
     - Gate premium features in `AnalyticsTab.tsx` (30d view, peak hours heatmap for Growth+), `SettingsTab.tsx` (ElevenLabs TTS, manual takeover, Shopify POS for Growth+), `MenuTab.tsx` (web scraper for Enterprise).
     - IMPORTANT: Keep menu item availability toggle ungated so core operational journeys and Playwright tests continue to work.
5. Verification:
   - Verify frontend builds with no TypeScript errors: run `npm run build` in `frontend/` (or `npx tsc --noEmit`).
   - Verify backend unit tests: `pytest backend/tests/unit/test_billing.py -v` and `pytest backend/tests/unit/test_messaging.py -v`.
6. Document implementation and test outputs in `handoff.md` and report back via `send_message`.
## 2026-09-14T05:42:27Z
You are worker_m3. Your working directory is c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m3.
Read DISPATCH.md in your working directory, ORIGINAL_REQUEST.md, PROJECT.md, and the explorer reports in .agents/explorer_m3_1/analysis.md, .agents/explorer_m3_2/analysis.md, and .agents/explorer_m3_3/analysis.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement Milestone M3:
1. Fix backend/app/api/billing.py: Pass subscription_data metadata, ensure plan mapping for Starter/Growth/Enterprise, and ensure customer.subscription.updated / created updates restaurants.plan_id in Supabase.
2. Create backend/tests/unit/test_billing.py and run pytest to ensure all billing tests pass.
3. Create frontend/src/app/(restaurant)/dashboard/billing/page.tsx returning HTTP 200.
4. Update frontend/src/components/restaurant/BillingTab.tsx with SaaS plans ($149 Starter, $249 Growth, $499 Enterprise), Stripe Checkout trigger, usage metrics, and billing history.
5. Update frontend/src/app/(restaurant)/layout.tsx for clean billing navigation.
6. Create frontend/src/lib/planGating.ts and frontend/src/components/ui/PlanGate.tsx, gating premium features in AnalyticsTab, SettingsTab, and MenuTab, while keeping menu item availability toggle ungated.
7. Run build/test verification (pytest in backend, TypeScript check or build in frontend).
8. Write detailed handoff.md and send completion report back to parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
