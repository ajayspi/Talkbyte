# Handoff Report: Database Schema Survey (R0)

**Date**: 2026-09-19T20:58:00Z  
**Agent**: `explorer_survey_db`  
**Working Directory**: `.agents/explorer_survey_db`  
**Handoff Type**: Hard (Task complete)  

---

## 1. Observation

1. **`database_schema_proposal.md`**:
   - Grep for `database_schema_proposal` across the codebase produced only references in `ORIGINAL_REQUEST.md:94` and `.agents/orchestrator_9/DISPATCH.md:8`.
   - `find_by_name` returned 0 files named `*database_schema_proposal*`.
   - Git commit history search (`git log --all --grep="database_schema_proposal"`) and git log diff search returned 0 matches.
   - Conclusion: The phrase refers to the conceptual specification in `ORIGINAL_REQUEST.md` for `restaurant_integrations` and `restaurant_users`.

2. **Supabase Project & Remote Database State**:
   - Evaluated via Supabase MCP `list_projects`: project id `agafustlankeieewtvck`, name `Talkbyte`, Postgres 17.6.1 in region `ap-southeast-1`.
   - Evaluated via Supabase MCP `list_tables` on `agafustlankeieewtvck`:
     - `public.restaurant_users` table exists: columns `id` (uuid, PK), `restaurant_id` (uuid, FK), `user_id` (uuid, FK to auth.users), `role` (text, default 'owner'), `created_at` (timestamptz). Rows count: 0. `rls_enabled: true`.
     - `public.restaurant_integrations` DOES NOT exist in the database.
     - `public.restaurants` has 1 row: `id: 5b99fb66-e992-489d-86b6-125577af8f55`, name: `Nonna's Pizzeria`.
     - `auth.users` has 4 users, including `demo@talkbyte.ai` (`045fc4ad-451b-4252-86b5-41f168fc2891`) and `ajayspi@gmail.com` (`e838041a-731a-418e-a68d-304b7f11835b`).
     - Querying `pg_policies` for `public.restaurant_users` returned 0 policies.

3. **Codebase Files**:
   - `backend/supabase_schema.sql` (lines 38-45): defines `restaurant_users` (`id`, `restaurant_id`, `user_id`, `role`, `created_at`). Does not define `restaurant_integrations`. Lines 126-132 define policy `restaurant_own_data` on `restaurants` joining `restaurant_users`, but no policies for `restaurant_users` itself.
   - `frontend/src/types/database.types.ts` (lines 31-39): defines `RestaurantUser`. Missing `RestaurantIntegration`.
   - `frontend/src/components/restaurant/SettingsTab.tsx` (lines 47-51, 83-86, 218-300): queries `restaurant_users` via client Supabase (`userRest`), hardcodes mock `staffList`, and hardcodes integration status badges.

4. **Database Execution & Migration Pattern**:
   - `deploy_supabase.py` (line 43): executes `backend/supabase_schema.sql` via docker exec into postgres.
   - Supabase MCP tool `apply_migration` and `execute_sql` exist and are configured for project `agafustlankeieewtvck`.

---

## 2. Logic Chain

1. **Premise 1**: `ORIGINAL_REQUEST.md` R0 requires reviewing and applying the schema updates for `restaurant_integrations` and `restaurant_users`.
2. **Premise 2**: In the live database, `restaurant_integrations` is entirely absent, and `restaurant_users` is empty with RLS enabled but 0 policies.
3. **Premise 3**: Because `restaurant_users` has RLS enabled with no policies, frontend client queries like `supabase.from('restaurant_users')` will return empty results even when authenticated, breaking `SettingsTab.tsx`.
4. **Premise 4**: The table `restaurant_integrations` must accommodate Square POS, Stripe Checkout, Twilio SMS, and Shopify POS with credential storage (API tokens, location IDs, account SIDs), status tracking, and per-restaurant uniqueness.
5. **Premise 5**: In Postgres RLS, naive subqueries on `restaurant_users` (`WHERE restaurant_id IN (SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid())`) create infinite recursion. Therefore, `SECURITY DEFINER` functions (`get_user_restaurant_ids` and `is_restaurant_admin`) are required.
6. **Premise 6**: Frontend staff table requires display of staff Name, Role, and Last Login. Client-side code cannot query `auth.users`. A PostgreSQL view `restaurant_staff_view` joining `restaurant_users` with `auth.users` and `public.users` provides clean access.
7. **Conclusion**: A single consolidated SQL migration must be provided and applied to Supabase, `backend/supabase_schema.sql` must be updated, and `frontend/src/types/database.types.ts` must be extended.

---

## 3. Caveats

1. **Read-Only Protocol**: As an explorer agent, no DDL modifications were applied to the remote Supabase database or source files. The SQL statements and type definitions are prepared in `analysis.md` for immediate execution by the worker/implementer.
2. **Secrets Encryption**: The proposed `credentials` column is a `jsonb` field. In a multi-tenant setup, this is protected by Supabase RLS and server-side service role isolation. For high-compliance enterprise environments, Supabase Vault or pgsodium can be layered in future sprints.

---

## 4. Conclusion

The database requirements for R0 are fully identified and documented.
- **Action Required 1**: Apply migration SQL (detailed in `analysis.md`) to Supabase project `agafustlankeieewtvck` using `apply_migration`.
- **Action Required 2**: Update `backend/supabase_schema.sql` with the new table, triggers, and policies.
- **Action Required 3**: Add `RestaurantIntegration` interface and update `RestaurantUser` in `frontend/src/types/database.types.ts`.
- **Action Required 4**: Seed the initial owner link between `demo@talkbyte.ai` and `Nonna's Pizzeria` (`5b99fb66-e992-489d-86b6-125577af8f55`).

---

## 5. Verification Method

1. **Verify Live Migration Execution**:
   Run Supabase MCP `list_tables` with `project_id: "agafustlankeieewtvck"`:
   - Check that `public.restaurant_integrations` is listed with columns `id`, `restaurant_id`, `provider`, `config`, `credentials`, `status`, `is_active`, `created_at`, `updated_at`.
2. **Verify RLS Policies**:
   Run Supabase MCP `execute_sql`:
   ```sql
   SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('restaurant_integrations', 'restaurant_users');
   ```
   Confirm policies exist for both tables.
3. **Verify Staff View**:
   Run Supabase MCP `execute_sql`:
   ```sql
   SELECT * FROM public.restaurant_staff_view;
   ```
4. **Verify TypeScript Compilation**:
   Run `npm run build` in `frontend` after updating `database.types.ts`.
