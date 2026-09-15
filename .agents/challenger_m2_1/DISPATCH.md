# Task Assignment: Challenger M2-1 (Phone Normalization & WhatsApp Adversarial Verifier)

**Role**: teamwork_preview_challenger
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m2_1
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Worker Handoff**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2\handoff.md
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Instructions
1. Empirically and adversarially test the phone normalization and WhatsApp delivery logic in `backend/app/services/whatsapp.py` and `backend/app/services/messaging.py`.
2. Generate corner-case inputs:
   - Malformed numbers, numbers with mixed spaces/dots/hyphens/brackets/international prefixes.
   - Meta Graph API failure scenarios: HTTP 400 with code #131026, HTTP 401 unauthorized, HTTP 500 server error, rate-limits, socket timeouts, DNS failures.
   - Verify that Telnyx SMS fallback executes 100% of the time on WhatsApp failure without dropping any payment links.
3. Run tests using `run_command` in `backend/`.
4. Issue an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
5. Document your tests and results in `analysis.md` and report your verdict in `handoff.md` and send back via `send_message`.

## 2026-09-14T05:31:23Z
You are challenger_m2_1. Your working directory is c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m2_1.
Read DISPATCH.md in your working directory, ORIGINAL_REQUEST.md, PROJECT.md, and the worker handoff in .agents/worker_m2/handoff.md.
Adversarially test phone normalization and WhatsApp delivery error codes/exceptions to verify that Telnyx SMS fallback is 100% resilient.
Run empirical tests in backend/ and report your verdict (APPROVE or REQUEST_CHANGES) in handoff.md and send via send_message to parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
