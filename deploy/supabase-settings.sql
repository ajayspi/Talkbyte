-- =====================================================================
-- ProstudioX — Supabase settings table
-- Run in the Supabase SQL Editor (as the project owner).
-- =====================================================================

-- 1) Settings table (key/value). The FastAPI backend reads/writes this
--    with the service_role key via PostgREST.
create table if not exists public.settings (
    key        text primary key,
    value      text not null,
    updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- No permissive policies on purpose: only service_role (the backend) can
-- read or write, mirroring the public.videos table.
