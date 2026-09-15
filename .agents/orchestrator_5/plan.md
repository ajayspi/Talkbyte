# Execution Plan — orchestrator_5

## Objectives & Acceptance Criteria
1. **R4 (Milestone M1): Restore Missing Auth Pages**
   - Restore deleted files from commits `0cb9c98` and `f211cdf`:
     - `frontend/src/app/(auth)/` (including `/login`, `/signup`, `/admin/login`, `/admin/signup`, etc.)
     - `frontend/src/lib/supabase-browser.ts`
     - `frontend/src/lib/supabase-server.ts`
     - `frontend/src/lib/supabase-middleware.ts`
     - `frontend/src/app/auth/callback/route.ts`
     - `frontend/src/proxy.ts`
   - Ensure `/login`, `/signup`, `/admin/login`, and `/admin/signup` return HTTP 200 (not 404).

2. **R1 (Milestone M2): WhatsApp Business API Integration & Telnyx SMS Fallback**
   - Implement `backend/app/services/whatsapp.py` (AU mobile normalization, Meta Cloud API client).
   - Implement `backend/app/services/messaging.py` (unified dispatch layer: attempt WhatsApp, catch any failure/exception, fall back to Telnyx SMS).
   - Implement `backend/app/api/messages.py` (`POST /api/messages/send`) and mount in `backend/main.py`.
   - Update `backend/app/api/payments.py:create_payment_link` to use unified messaging service.
   - Comprehensive unit test suite in `backend/tests/unit/test_messaging.py` verifying WhatsApp delivery and Telnyx SMS fallback on exception/failure.

3. **R2 (Milestone M3): SaaS Subscription Billing for Restaurants**
   - Create route `/dashboard/billing` (`frontend/src/app/(restaurant)/dashboard/billing/page.tsx`) returning HTTP 200.
   - Extend `BillingTab.tsx` with dynamic plan selection (Starter, Growth, Pro, Enterprise), billing history, and Stripe checkout trigger.
   - Add Stripe Webhook handler in `backend/app/api/payments.py` handling `customer.subscription.updated` (and `.created`) updating `restaurants.plan_id` in Supabase.
   - Implement plan feature gating in frontend (`frontend/src/lib/planGating.ts`, `PlanGate.tsx`, gating premium features based on `plan_id`).
   - Unit tests in `backend/tests/unit/test_payments.py` validating webhook updates to `restaurants.plan_id`.

4. **R3 (Milestone M4): Playwright End-to-End Testing Suite**
   - Install/configure `@playwright/test` and `playwright.config.ts` in `frontend/`.
   - Implement 3 critical user journeys in `frontend/e2e/`:
     1. `owner-login.spec.ts`: Restaurant owner login -> dashboard loads.
     2. `menu-availability.spec.ts`: Menu item availability toggle updates correctly.
     3. `admin-login.spec.ts`: Operator admin login -> restaurants list loads.
   - Single command runnable: `npx playwright test` in `frontend/` exiting with code 0.

5. **M5: Full Verification, Production Build & Remote Git Publication**
   - Verify `npm run build` in `frontend/` succeeds with exit code 0.
   - Verify `pip install -r requirements.txt` in `backend/` succeeds with exit code 0.
   - Stage all changes (`git status`), commit cleanly, and push to `origin/claude/talkbyte-project-integration-fad989`.
   - Final audit and handoff to sentinel.

---

## Delegation Strategy
- For each milestone:
  - Worker: implements the code and runs verification tests.
  - Reviewer: verifies code quality, interface contracts, and requirements compliance.
  - Challenger: empirical verification / edge case testing.
  - Auditor: forensic audit verifying authentic implementation and zero cheating.
  - Gate check: approve and advance.
