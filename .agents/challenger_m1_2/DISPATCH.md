# Task Assignment: Milestone M1 Challenger 2 (Auth Forms & Route Logic Stress Test)

**Role**: teamwork_preview_challenger
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m1_2
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md

## Objective
Adversarially challenge and stress-test the authentication pages and callback route:
1. Verify behavior of all 4 auth pages:
   - `/login`: Empty inputs, invalid password, rate-limited auth response, network offline fallback.
   - `/signup`: Missing restaurant name, short password, duplicate email.
   - `/admin/login`: Non-operator credentials, invalid token.
   - `/admin/signup`: Missing or malformed invite code.
2. Verify `auth/callback/route.ts`:
   - Missing `code` query param.
   - Malformed `code`.
   - Missing `next` query param (verifying default `/dashboard`).
3. Render an explicit gate verdict: APPROVE or REJECT.
Write your findings to `analysis.md` and `handoff.md` and notify orchestrator via `send_message`.

## 2026-09-14T00:53:00Z
You are challenger_m1_2, a Challenger subagent for TalkByte.
Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m1_2
Read your assignment in c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\challenger_m1_2\DISPATCH.md.
MANDATORY: Read the authoritative user request at c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md before starting work.
Also read c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md.

Task:
Adversarially test and challenge the 4 auth pages (/login, /signup, /admin/login, /admin/signup) and callback route:
- Form boundary cases, invalid inputs, empty states, offline demo redirects.
- Callback route parameter omission (missing code, missing next).
Deliver an explicit gate verdict: APPROVE or REJECT.
Write analysis.md and handoff.md in your working directory and notify the orchestrator via send_message.
