## 2026-09-19T21:00:27Z
You are worker_m1_1.
Your working directory is: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1_1`.
Parent orchestrator conversation ID: `b87ce451-d3cf-4526-818f-49b010cd25db`.

MANDATORY FIRST STEP: Read `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md` (specifically the section `Follow-up — 2026-09-19T20:52:08Z` and R0: Apply Database Schema).
Also read:
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_db\analysis.md`
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_db\handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE OF OWNERSHIP:
You exclusively own:
- Database schema execution on Supabase project `agafustlankeieewtvck`
- `backend/supabase_schema.sql`
- `frontend/src/types/database.types.ts`

TASK OBJECTIVES:
1. Execute the SQL schema migration outlined in `explorer_survey_db/analysis.md` against the Supabase database project `agafustlankeieewtvck` using the available Supabase MCP tool (`execute_sql` or `apply_migration`).
   - Create `restaurant_integrations` table with all necessary columns (`id`, `restaurant_id`, `provider`, `config`, `credentials`, `api_key`, `metadata`, `status`, `is_active`, `created_at`, `updated_at`, unique(`restaurant_id`, `provider`)).
   - Ensure `restaurant_users` table has appropriate RLS policies and indexes.
   - Create helper view `restaurant_staff_view` joining `restaurant_users` with `public.users`.
   - Seed initial link for demo restaurant (`5b99fb66-e992-489d-86b6-125577af8f55`) with demo user (`045fc4ad-451b-4252-86b5-41f168fc2891`).
2. Update `backend/supabase_schema.sql` to include `restaurant_integrations`, policies, and views so future deployments match.
3. Update `frontend/src/types/database.types.ts` to export `RestaurantIntegration` and add `restaurant_integrations` and `restaurant_staff_view` to the `Database` interface.
4. Run verification:
   - Check Supabase MCP `list_tables` or `execute_sql` to confirm tables exist and query successfully.
   - Run `npm run build` in `frontend` to verify TypeScript builds with exit code 0.
5. Record your changes in your working directory and write `handoff.md`.
6. Send completion message via `send_message` to parent `b87ce451-d3cf-4526-818f-49b010cd25db`.
