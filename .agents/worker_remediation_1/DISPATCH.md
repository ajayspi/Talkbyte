## 2026-09-19T22:54:13Z

You are worker_remediation_1.
Your working directory is: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_remediation_1`.
Parent orchestrator conversation ID: `b87ce451-d3cf-4526-818f-49b010cd25db`.

MANDATORY FIRST STEP: Read `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md` (specifically the section `Follow-up — 2026-09-19T20:52:08Z` and acceptance criteria).
Also read:
- `.agents/reviewer_1/handoff.md` and `analysis.md`
- `.agents/challenger_1/handoff.md` and `report.md`
- `.agents/orchestrator_9/GATE_STATUS.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE OF OWNERSHIP:
You exclusively own:
- `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx`
- `frontend/src/components/restaurant/IntegrationConfigModal.tsx`
- `frontend/src/components/restaurant/SettingsTab.tsx`
- `frontend/src/lib/supabase.ts`

TASK OBJECTIVES:
Fix the 6 concrete defects identified in Gate Iteration 1:
1. Fix TS2724 build error:
   In `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx` and `frontend/src/components/restaurant/IntegrationConfigModal.tsx`, remove the import of non-existent `LockIcon` from `@/components/icons`. If a lock icon is desired, use an inline SVG or `ShieldIcon`.
2. Fix UUID syntax error (Postgres 22P02) in `[provider]/page.tsx`:
   Line 169 has `restaurantId: 'rest-mamas-pizzeria-001'`. Replace this with dynamic UUID resolution from the user's restaurant via Supabase/auth or fall back to the demo restaurant UUID (`5b99fb66-e992-489d-86b6-125577af8f55`), so database insertion into `restaurant_integrations.restaurant_id` succeeds.
3. Fix Jest unit test regression in `SettingsTab.tsx`:
   Ensure the Invite button has the accessible name `"Invite"` (e.g. `<button ...>Invite</button>`) matching `frontend/__tests__/restaurant-dashboard.test.tsx` (`getByRole('button', { name: /invite/i })`).
4. Fix Modal Dismissal & Loading state in `SettingsTab.tsx`:
   In `handleInviteStaff`, do NOT close the modal synchronously before `await inviteStaff(...)`. Instead, keep the modal open, show the loading spinner on the submit button while `isInvitingStaff` is true, and only close the modal and update the list upon successful resolution. If an error occurs, display the error in the modal without closing it.
5. Fix secret leakage in `frontend/src/lib/supabase.ts`:
   In `getRestaurantIntegrations`, change `.select('*')` to select only safe public columns (`id, restaurant_id, provider, status, is_active, metadata, created_at, updated_at`), omitting raw credentials/api_key.
6. Fix initial integrations state in `SettingsTab.tsx`:
   Default integrations to unconfigured (`connected: false, status: 'unconfigured'`) until loaded from the API / Supabase, so "Connect" is shown on initial render.
7. Verification:
   - Run `npm run build` in `frontend/` directory and ensure it succeeds with exit code 0 and 0 TypeScript errors.
   - Run `npx jest --watchAll=false` or test specific suites (`__tests__/restaurant-dashboard.test.tsx` and `__tests__/settings-integration.test.tsx`) to ensure 100% of tests pass.
8. Write `handoff.md` and send a completion message via `send_message` to parent `b87ce451-d3cf-4526-818f-49b010cd25db`.
