-- ── TalkByte Admin / Operator Schema ──────────────────────────────────────────

-- 1. Platform Configuration (Failovers & Global Settings)
create table platform_config (
  id             uuid primary key default gen_random_uuid(),
  key            text unique not null,
  value          jsonb not null,
  description    text,
  updated_at     timestamptz default now(),
  updated_by     uuid references auth.users(id)
);

insert into platform_config (key, value, description) values
  ('routing_llm', '{"primary": "openai", "fallback": "anthropic"}', 'Global LLM routing configuration'),
  ('routing_tts', '{"primary": "cartesia", "fallback": "elevenlabs"}', 'Global TTS routing configuration');

-- 2. Admin Users (Strictly Controlled Operator Access)
create table admin_users (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade unique not null,
  role           text default 'operator', -- 'superadmin', 'operator', 'auditor'
  granted_at     timestamptz default now(),
  granted_by     uuid references auth.users(id)
);

-- 3. Audit Logs (Append-Only Ledger)
create table audit_logs (
  id             uuid primary key default gen_random_uuid(),
  timestamp      timestamptz default now(),
  actor_id       uuid references auth.users(id), -- Null if system
  actor_email    text,
  event_type     text not null, -- 'SYSTEM', 'BILLING', 'RESTAURANT', 'AUTH', 'ESCALATION'
  resource_type  text,
  resource_id    text,
  detail         text not null,
  ip_address     text
);

-- Prevent deletion or updates on audit_logs
create rule prevent_audit_update as on update to audit_logs do instead nothing;
create rule prevent_audit_delete as on delete to audit_logs do instead nothing;

-- 4. Call Costs & Unit Economics
create table call_costs (
  id                   uuid primary key default gen_random_uuid(),
  call_id              uuid references calls(id) on delete cascade unique not null,
  restaurant_id        uuid references restaurants(id) on delete cascade,
  duration_seconds     int not null,
  
  -- Locked Historical Costs
  telnyx_cost_cents    float not null,
  stt_cost_cents       float not null,
  llm_cost_cents       float not null,
  tts_cost_cents       float not null,
  infra_cost_cents     float not null,
  
  total_cost_cents     float generated always as (telnyx_cost_cents + stt_cost_cents + llm_cost_cents + tts_cost_cents + infra_cost_cents) stored,
  
  calculated_at        timestamptz default now()
);

-- 5. System Health Logs
create table system_health_logs (
  id             uuid primary key default gen_random_uuid(),
  service        text not null, -- 'telnyx', 'deepgram', 'openai', 'elevenlabs', 'redis', 'livekit'
  status         text not null, -- 'operational', 'degraded', 'down'
  latency_ms     int,
  error_rate     float,
  checked_at     timestamptz default now()
);

-- Index for fast time-series queries
create index on system_health_logs (service, checked_at desc);

-- ── RLS Policies for Admins ──────────────────────────────────────────────────
-- Enable RLS on new tables
alter table platform_config enable row level security;
alter table admin_users enable row level security;
alter table audit_logs enable row level security;
alter table call_costs enable row level security;
alter table system_health_logs enable row level security;

-- Only superadmins can manage admin_users
create policy "Superadmins manage admin_users" on admin_users
  for all using (
    exists (select 1 from admin_users au where au.user_id = auth.uid() and au.role = 'superadmin')
  );

-- Admins can read everything
create policy "Admins read platform config" on platform_config for select using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "Admins read audit logs" on audit_logs for select using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "Admins read call costs" on call_costs for select using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "Admins read system health" on system_health_logs for select using (exists (select 1 from admin_users where user_id = auth.uid()));

-- Global RLS Bypass for Admin Users on core tables (Restaurants, Calls, etc.)
create policy "Admins access all restaurants" on restaurants for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "Admins access all calls" on calls for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "Admins access all orders" on orders for all using (exists (select 1 from admin_users where user_id = auth.uid()));
