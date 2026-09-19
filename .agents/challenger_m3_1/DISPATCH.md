# Task Assignment: Challenger M3-1 (Stripe Webhook & DB Resilience Adversarial Testing)

**Role**: teamwork_preview_challenger
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m3_1
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Worker Handoff**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m3\handoff.md
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Instructions
1. Empirically and adversarially test the Stripe webhook handling in `backend/app/api/billing.py` and `backend/app/api/payments.py`.
2. Generate adversarial test scenarios:
   - Malformed webhook payloads, missing signature headers, replay attacks, unknown event types.
   - Subscription events with missing metadata, null plan IDs, or unknown plans (e.g. "free", "ultra").
   - Database update failures / timeouts.
   - Verify that `restaurants.plan_id` is updated accurately without data corruption.
3. Run tests using `run_command` in `backend/`.
4. Issue an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
5. Document your tests and results in `analysis.md` and report your verdict in `handoff.md` and send back via `send_message`.

## 2026-09-14T05:54:00Z
You are challenger_m3_1. Your working directory is c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m3_1.
Read DISPATCH.md in your working directory, ORIGINAL_REQUEST.md, PROJECT.md, and the worker handoff in .agents/worker_m3/handoff.md.
Adversarially test Stripe webhook event handling, missing metadata, database error recovery, and plan tier constraints in backend/app/api/billing.py.
Run empirical tests in backend/ and report your verdict (APPROVE or REQUEST_CHANGES) in handoff.md and send via send_message to parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
