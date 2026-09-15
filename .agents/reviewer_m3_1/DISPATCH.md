# Task Assignment: Reviewer M3-1 (Backend Billing & Webhook Review)

**Role**: teamwork_preview_reviewer
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\reviewer_m3_1
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Worker Handoff**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m3\handoff.md
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Instructions
1. Independently review the backend billing implementation:
   - `backend/app/api/billing.py`
   - `backend/app/api/payments.py`
   - `backend/tests/unit/test_billing.py`
2. Verify:
   - `stripe.checkout.Session.create` passes `subscription_data` metadata with `restaurant_id` and `plan_id`.
   - Webhook handler updates `restaurants.plan_id` in Supabase upon `customer.subscription.updated` and `customer.subscription.created`.
   - Plan tier normalization maps Starter, Growth/Pro, Enterprise cleanly to `plans` DB schema.
3. Run `pytest backend/tests/unit/test_billing.py -v` using `run_command` in `backend/`.
4. Issue an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
5. Write your findings to `analysis.md` and report your verdict in `handoff.md` and send back via `send_message`.

## 2026-09-14T05:53:56Z
You are reviewer_m3_1. Your working directory is c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\reviewer_m3_1.
Read DISPATCH.md in your working directory, ORIGINAL_REQUEST.md, PROJECT.md, and the worker handoff in .agents/worker_m3/handoff.md.
Review backend/app/api/billing.py, payments.py, and test_billing.py for correctness, subscription_data metadata, webhook updates to restaurants.plan_id in Supabase, and plan mapping.
Run pytest tests in backend/ and report your verdict (APPROVE or REQUEST_CHANGES) in handoff.md and send via send_message to parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
