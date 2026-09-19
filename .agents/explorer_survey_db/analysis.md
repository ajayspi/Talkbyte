# Database Schema & Existing Structure Survey (R0)

**Date**: 2026-09-19  
**Agent**: `explorer_survey_db`  
**Milestone**: Database Schema Survey (R0) for Sprint Feature Implementation  

---

## 1. Executive Summary

This investigation analyzed the database schema requirements (R0) outlined in `ORIGINAL_REQUEST.md` (Follow-up 2026-09-19T20:52:08Z) for the TalkByte restaurant voice ordering SaaS platform. The requirements demand reviewing and applying the schema for two critical tables: `restaurant_integrations` and `restaurant_users`.

By inspecting git history, existing codebase files (`backend/supabase_schema.sql`, `frontend/src/types/database.types.ts`), deployment scripts, and querying the live Supabase PostgreSQL database (`agafustlankeieewtvck`) via MCP, the current state and exact requirements were identified:

1. **`database_schema_proposal.md`**: No standalone markdown file named `database_schema_proposal.md` exists in the repository or git history. It was introduced as a conceptual artifact in `ORIGINAL_REQUEST.md` specifying `restaurant_integrations` and `restaurant_users`.
2. **`restaurant_users` table**: Already exists in the database and in `backend/supabase_schema.sql` (`id uuid`, `restaurant_id uuid`, `user_id uuid`, `role text`, `created_at timestamptz`), but currently has **0 rows**. Crucially, **RLS is enabled, but ZERO RLS policies exist on `restaurant_users`**, which blocks all client-side queries (e.g. `supabaseBrowser().from('restaurant_users')` in `SettingsTab.tsx`). In addition, `updated_at` is missing.
3. **`restaurant_integrations` table**: Does **NOT exist** in the live database or in `backend/supabase_schema.sql`. It must be created to support Square POS, Stripe Checkout, Twilio SMS, and Shopify POS configuration and API key storage.
4. **Migration & Execution Flow**:
   - Production / Remote DB: Migrations are applied via Supabase MCP (`apply_migration`) or direct SQL execution.
   - Codebase Single Source of Truth: `backend/supabase_schema.sql` tracks all DDL and is mounted/executed on fresh environment spins.
   - Frontend Type Safety: `frontend/src/types/database.types.ts` must export `RestaurantIntegration` and update `RestaurantUser`.

---

## 2. Investigation Details & Findings

### 2.1 Artifact & Git Search (`database_schema_proposal.md`)
- Executed `find_by_name`, `grep_search`, `git log --all -S"database_schema_proposal"`, and scanned `.agents/` and stashes.
- **Finding**: The file `database_schema_proposal.md` does not physically exist. The prompt's reference in line 94 ("review and apply the SQL schema updates outlined in the `database_schema_proposal.md` artifact to the Supabase database. This schema defines the `restaurant_integrations` and `restaurant_users` tables") describes the required schema deliverables.

### 2.2 Live Database Audit (Supabase Project `agafustlankeieewtvck`)
Using Supabase MCP tools (`list_projects`, `list_tables`, `execute_sql`):
- **Host**: `db.agafustlankeieewtvck.supabase.co` (PostgreSQL 17.6.1, Region: `ap-southeast-1`)
- **Existing Tables in `public`**:
  - `plans` (3 rows: starter, growth, enterprise)
  - `restaurants` (1 row: Nonna's Pizzeria, id: `5b99fb66-e992-489d-86b6-125577af8f55`, plan_id: `starter`, telnyx_number: `+61255501234`)
  - `restaurant_users` (**0 rows**, RLS enabled: `true`, policies: **none**)
  - `menu_items` (6 rows)
  - `calls` (1 row)
  - `orders` (1 row)
  - `payment_events` (0 rows)
  - `subscriptions` (0 rows)
  - `operators` (0 rows)
  - `users` (4 rows synced from `auth.users`)
- **Users in `auth.users`**:
  - `demo@talkbyte.ai` (`045fc4ad-451b-4252-86b5-41f168fc2891`)
  - `ajayspi@gmail.com` (`e838041a-731a-418e-a68d-304b7f11835b`)
  - `admin@clipped.ai`, `admin@prostudio.com`
- **Critical Data Gap**: Because `restaurant_users` is empty:
  - The RLS policy on `restaurants` (`id in (select restaurant_id from restaurant_users where user_id = auth.uid())`) prevents logged-in users like `demo@talkbyte.ai` from seeing `Nonna's Pizzeria`.
  - The frontend `SettingsTab.tsx` currently fails to load business settings because `userRest` returns `null`.

### 2.3 Existing Schema Code Analysis
- `backend/supabase_schema.sql`:
  - Defines `restaurant_users` lines 38-45:
    ```sql
    create table restaurant_users (
      id            uuid primary key default gen_random_uuid(),
      restaurant_id uuid references restaurants(id) on delete cascade,
      user_id       uuid references auth.users(id) on delete cascade,
      role          text default 'owner',      -- 'owner' | 'staff'
      created_at    timestamptz default now(),
      unique(restaurant_id, user_id)
    );
    ```
  - Has RLS enabled for `restaurants`, `menu_items`, `calls`, `orders`, `payment_events`, but omitted `restaurant_users` policies.
  - Does NOT define `restaurant_integrations`.

- `frontend/src/types/database.types.ts`:
  - Contains `RestaurantUser` interface (lines 31-39):
    ```typescript
    export interface RestaurantUser {
      id: string;
      restaurant_id: string;
      user_id: string;
      role: 'owner' | 'manager' | 'staff' | 'readonly' | string;
      created_at: string;
      email?: string;
      name?: string;
    }
    ```
  - Missing `RestaurantIntegration` interface and table definition.

### 2.4 Application Requirements Mapping

#### A. Staff Management (`restaurant_users` + `auth.users` / `public.users`)
- `SettingsTab.tsx` needs to display:
  - `Name` (from `public.users.name` or `auth.users.raw_user_meta_data->>'name'` or fallback email prefix)
  - `Role` ('Owner' | 'Manager' | 'Staff')
  - `Last Login` (from `auth.users.last_sign_in_at`)
- Requirement R1: The staff table must fetch real staff members from `restaurant_users` joined with `auth.users` (or a profiles table). The invite modal must trigger a backend endpoint to invite/create a user and insert into `restaurant_users`.
- Backend endpoints run with `supabase_service_role_key` via `get_db()`, giving them full access to both schemas.
- For client-side Supabase reads or clean database querying, a PostgreSQL View `restaurant_staff_view` provides this join cleanly.

#### B. Integrations Configuration (`restaurant_integrations`)
- Third-party integrations in scope:
  - **Square POS**: `location_id`, `access_token`, `environment` ('sandbox' | 'production')
  - **Stripe Checkout**: `publishable_key`, `secret_key`, `webhook_secret`
  - **Twilio SMS / Telnyx**: `account_sid`, `auth_token`, `phone_number`
  - **Shopify POS**: `shop_domain`, `access_token`
- Needs to support storing both public configuration (`config jsonb`) and sensitive credentials/tokens (`credentials jsonb`), with status tracking (`status` and `is_active`).

---

## 3. Proposed SQL Schema Migration

This complete SQL migration script applies the schema updates, triggers, indexes, RLS policies, staff view, and seed data.

```sql
-- ============================================================================
-- TALKBYTE DATABASE MIGRATION: R0 Schema Update
-- Tables: restaurant_integrations, restaurant_users
-- ============================================================================

-- 1. Helper function for updated_at timestamps
create or replace function public.update_modified_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Update restaurant_users table
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'restaurant_users' and column_name = 'updated_at'
  ) then
    alter table public.restaurant_users add column updated_at timestamptz default now();
  end if;
end $$;

drop trigger if exists update_restaurant_users_modtime on public.restaurant_users;
create trigger update_restaurant_users_modtime
  before update on public.restaurant_users
  for each row execute function public.update_modified_column();

create index if not exists idx_restaurant_users_restaurant_id on public.restaurant_users(restaurant_id);
create index if not exists idx_restaurant_users_user_id on public.restaurant_users(user_id);

-- 3. Create restaurant_integrations table
create table if not exists public.restaurant_integrations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  provider      text not null,                         -- 'square' | 'stripe' | 'twilio' | 'shopify'
  config        jsonb not null default '{}'::jsonb,       -- non-sensitive: location_id, phone_number, store_domain
  credentials   jsonb not null default '{}'::jsonb,       -- sensitive: access_token, api_key, auth_token, secret_key
  status        text not null default 'active',          -- 'active' | 'inactive' | 'error' | 'disconnected'
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint restaurant_integrations_restaurant_provider_key unique (restaurant_id, provider)
);

drop trigger if exists update_restaurant_integrations_modtime on public.restaurant_integrations;
create trigger update_restaurant_integrations_modtime
  before update on public.restaurant_integrations
  for each row execute function public.update_modified_column();

create index if not exists idx_restaurant_integrations_restaurant_id on public.restaurant_integrations(restaurant_id);
create index if not exists idx_restaurant_integrations_provider on public.restaurant_integrations(provider);

-- 4. Helper Security Definer Functions (Avoids RLS infinite recursion)
create or replace function public.get_user_restaurant_ids(p_user_id uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select restaurant_id from public.restaurant_users where user_id = p_user_id;
$$;

create or replace function public.is_restaurant_admin(p_restaurant_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.restaurant_users
    where restaurant_id = p_restaurant_id
      and user_id = p_user_id
      and lower(role) in ('owner', 'manager')
  );
$$;

-- 5. Row-Level Security: restaurant_users
alter table public.restaurant_users enable row level security;

drop policy if exists "restaurant_users_select_policy" on public.restaurant_users;
create policy "restaurant_users_select_policy" on public.restaurant_users
  for select using (
    user_id = auth.uid()
    or restaurant_id in (select public.get_user_restaurant_ids(auth.uid()))
  );

drop policy if exists "restaurant_users_insert_policy" on public.restaurant_users;
create policy "restaurant_users_insert_policy" on public.restaurant_users
  for insert with check (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

drop policy if exists "restaurant_users_update_policy" on public.restaurant_users;
create policy "restaurant_users_update_policy" on public.restaurant_users
  for update using (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

drop policy if exists "restaurant_users_delete_policy" on public.restaurant_users;
create policy "restaurant_users_delete_policy" on public.restaurant_users
  for delete using (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

-- 6. Row-Level Security: restaurant_integrations
alter table public.restaurant_integrations enable row level security;

drop policy if exists "restaurant_integrations_select_policy" on public.restaurant_integrations;
create policy "restaurant_integrations_select_policy" on public.restaurant_integrations
  for select using (
    restaurant_id in (select public.get_user_restaurant_ids(auth.uid()))
  );

drop policy if exists "restaurant_integrations_insert_policy" on public.restaurant_integrations;
create policy "restaurant_integrations_insert_policy" on public.restaurant_integrations
  for insert with check (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

drop policy if exists "restaurant_integrations_update_policy" on public.restaurant_integrations;
create policy "restaurant_integrations_update_policy" on public.restaurant_integrations
  for update using (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

drop policy if exists "restaurant_integrations_delete_policy" on public.restaurant_integrations;
create policy "restaurant_integrations_delete_policy" on public.restaurant_integrations
  for delete using (
    public.is_restaurant_admin(restaurant_id, auth.uid())
  );

-- 7. Staff Management View (Joins restaurant_users with profiles / auth)
create or replace view public.restaurant_staff_view as
select
  ru.id,
  ru.restaurant_id,
  ru.user_id,
  ru.role,
  ru.created_at,
  ru.updated_at,
  coalesce(pu.name, au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
  coalesce(pu.email, au.email) as email,
  au.last_sign_in_at as last_login
from public.restaurant_users ru
left join auth.users au on ru.user_id = au.id
left join public.users pu on ru.user_id = pu.id;

-- 8. Default Seed Association
-- Associate demo user demo@talkbyte.ai with Nonna's Pizzeria as owner
insert into public.restaurant_users (restaurant_id, user_id, role)
select 
  r.id as restaurant_id,
  u.id as user_id,
  'owner' as role
from public.restaurants r
cross join auth.users u
where r.name = 'Nonna''s Pizzeria'
  and u.email = 'demo@talkbyte.ai'
  and not exists (
    select 1 from public.restaurant_users ru 
    where ru.restaurant_id = r.id and ru.user_id = u.id
  );
```

---

## 4. Frontend Type Definitions Update

In `frontend/src/types/database.types.ts`:

### Add `RestaurantIntegration` Interface:
```typescript
export interface RestaurantIntegration {
  id: string;
  restaurant_id: string;
  provider: 'square' | 'stripe' | 'twilio' | 'shopify' | string;
  config: Json;
  credentials: Json;
  status: 'active' | 'inactive' | 'error' | 'disconnected' | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Update `RestaurantUser` Interface:
```typescript
export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'readonly' | string;
  created_at: string;
  updated_at?: string;
  email?: string;
  name?: string;
}
```

### Add to `Database.public.Tables`:
```typescript
      restaurant_integrations: {
        Row: RestaurantIntegration;
        Insert: Partial<RestaurantIntegration>;
        Update: Partial<RestaurantIntegration>;
      };
```

---

## 5. Migration Execution Strategy

1. **Remote Cloud Supabase (`agafustlankeieewtvck`)**:
   - The implementer will execute the DDL using `call_mcp_tool` with server `supabase` and tool `apply_migration` (or `execute_sql`).
   - Migration name: `20260920000000_add_restaurant_integrations_and_users_rls`.

2. **Repository Consistency**:
   - Update `backend/supabase_schema.sql` to append the `restaurant_integrations` table, updated `restaurant_users` triggers, RLS policies, and view.
   - This ensures local Docker development (`docker compose up`) and server deployments (`deploy_supabase.py`) remain completely reproducible.

3. **Post-Migration Verification**:
   - Query `list_tables` to confirm `restaurant_integrations` is active with RLS enabled.
   - Query `restaurant_users` to verify the demo user is seeded and linked to `Nonna's Pizzeria`.
   - Verify `pg_policies` shows active policies for `restaurant_users` and `restaurant_integrations`.
