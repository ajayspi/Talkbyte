# Execution Plan — Orchestrator 6

## Objective
Execute and verify the remaining TalkByte milestones (M2, M3, M4, M5) to achieve 100% completion of user requirements in `ORIGINAL_REQUEST.md`, passing all unit/integration tests, production builds, and pushing to the remote git branch.

## Execution Sequence

### Phase 1: Milestone M2 — WhatsApp Business API Integration & Telnyx SMS Fallback
1. **Worker Dispatch (`worker_m2_whatsapp`)**:
   - Inputs: `.agents/explorer_survey_backend_whatsapp/analysis.md`, `ORIGINAL_REQUEST.md`.
   - Deliverables:
     - `backend/app/services/whatsapp.py`: Meta WhatsApp Business Cloud API client, Australian mobile normalization (`is_au_mobile`, `format_whatsapp_number`), message sending with error handling.
     - `backend/app/services/messaging.py`: Multi-channel dispatcher attempting WhatsApp first for eligible numbers, falling back to Telnyx SMS on any error or non-WhatsApp numbers.
     - `backend/app/api/messages.py`: Internal messaging endpoint `POST /api/messages/send`.
     - Router integration in `backend/main.py`.
     - Update `backend/app/api/payments.py:create_payment_link` to use `send_payment_message`.
     - Comprehensive unit test suite in `backend/tests/unit/test_messaging.py` covering WhatsApp success, fallback on API error, non-AU number routing, etc.
     - Worker must run pytest and report passing results.
2. **Reviewers & Challengers**:
   - Reviewer 1 & Reviewer 2: Conformance, code quality, edge cases, error handling.
   - Challenger 1 & Challenger 2: Adversarial stress testing of phone normalization and fallback mechanisms.
3. **Forensic Auditor**:
   - Integrity check verifying genuine Meta API client & fallback logic (no hardcoded stubs).
4. **Gate Evaluation**:
   - PASS -> advance to M3.

### Phase 2: Milestone M3 — SaaS Subscription Billing for Restaurants
1. **Worker Dispatch (`worker_m3_billing`)**:
   - Inputs: `.agents/explorer_survey_frontend_billing_playwright/analysis.md`, `ORIGINAL_REQUEST.md`.
   - Deliverables:
     - `frontend/src/app/(restaurant)/dashboard/billing/page.tsx`: Returning HTTP 200, rendering billing management view.
     - Wire Starter/Growth/Pro plan selection, Stripe Checkout session trigger, plan status.
     - Backend Stripe Webhook update for `customer.subscription.updated` / `customer.subscription.created` updating `restaurants.plan_id` in Supabase.
     - Feature gating: `planGating.ts` / `PlanGate.tsx` gating premium features based on `plan_id`.
     - Tests for webhook and billing endpoints.
2. **Verification & Gate**:
   - Reviewers, Challengers, Auditor -> Gate PASS.

### Phase 3: Milestone M4 — Playwright End-to-End Testing Suite
1. **Worker/Test Writer Dispatch (`worker_m4_playwright`)**:
   - Configure `@playwright/test`, `playwright.config.ts`.
   - Implement 3 required user journeys in `frontend/e2e/`:
     1. Restaurant owner login -> dashboard loads.
     2. Menu item availability toggle updates correctly.
     3. Operator admin login -> restaurants list loads.
   - Verify `npx playwright test` runs and passes with exit code 0.
2. **Verification & Gate**:
   - Reviewers, Challengers, Auditor -> Gate PASS.

### Phase 4: Milestone M5 — Build, Full Verification & Git Push
1. **Worker Dispatch (`worker_m5_deploy`)**:
   - Run `npm run build` in `frontend/` (must exit 0).
   - Run `pip install -r requirements.txt` in `backend/` (must exit 0).
   - Verify git status is clean.
   - Commit changes and push to `origin/claude/talkbyte-project-integration-fad989`.
2. **Final Auditor & Human Report**:
   - Full integrity check of git diff and branch state.
   - Send completion message to parent.
