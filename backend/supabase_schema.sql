-- TalkByte AI — Supabase / Postgres 16 schema
-- Run in Supabase SQL Editor (Project Settings → SQL Editor)
-- Sprint 1: restaurants, menu_items, calls, orders
-- Sprint 2: payment_events, subscriptions

-- Enable pgvector for menu RAG
create extension if not exists vector;

-- ── Plans ────────────────────────────────────────────────────────────────────
create table plans (
  id            text primary key,          -- 'starter' | 'growth' | 'enterprise'
  name          text not null,
  monthly_cents int  not null,
  call_limit    int  not null              -- calls/month included
);

insert into plans values
  ('starter',    'Starter',    14900, 500),
  ('growth',     'Growth',     24900, 2000),
  ('enterprise', 'Enterprise', 49900, 10000);


-- ── Restaurants ──────────────────────────────────────────────────────────────
create table restaurants (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone_number     text,                   -- restaurant's real phone
  telnyx_number    text unique,            -- AI-answered number
  plan_id          text references plans(id) default 'starter',
  active           boolean default false,
  ai_instructions  text,                   -- custom instructions for AI persona
  timezone         text default 'Australia/Sydney',
  created_at       timestamptz default now()
);


-- ── Restaurant Users (multi-tenant auth) ─────────────────────────────────────
create table restaurant_users (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  role          text default 'owner',      -- 'owner' | 'staff'
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(restaurant_id, user_id)
);


-- ── Menu Items (with pgvector embeddings for RAG) ────────────────────────────
create table menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  price_cents   int  not null,
  category      text,
  available     boolean default true,
  embedding     vector(1536),              -- text-embedding-3-small dimension
  created_at    timestamptz default now()
);

-- Vector similarity index for RAG queries
create index on menu_items using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);


-- ── Calls ────────────────────────────────────────────────────────────────────
create table calls (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid references restaurants(id),
  caller_number   text not null,
  state           text not null default 'GREETING',
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  transcript      jsonb default '[]',
  stt_confidence  float,
  livekit_room    text                     -- LiveKit room name for this call
);


-- ── Orders ───────────────────────────────────────────────────────────────────
create table orders (
  id            uuid primary key default gen_random_uuid(),
  call_id       uuid references calls(id),
  restaurant_id uuid references restaurants(id),
  items         jsonb not null default '[]',  -- [{name, qty, price_cents}]
  total_cents   int  not null,
  state         text not null default 'CONFIRMED',
  pos_order_id  text,                          -- Square / Lightspeed order ID
  created_at    timestamptz default now()
);


-- ── Payment Events ───────────────────────────────────────────────────────────
create table payment_events (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid references orders(id),
  stripe_payment_link  text,
  stripe_session_id    text,
  sent_at              timestamptz,
  paid_at              timestamptz,
  expires_at           timestamptz
);


-- ── Subscriptions ────────────────────────────────────────────────────────────
create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  restaurant_id           uuid references restaurants(id) on delete cascade,
  plan_id                 text references plans(id),
  stripe_subscription_id  text unique,
  status                  text default 'active',   -- 'active' | 'past_due' | 'cancelled'
  current_period_end      timestamptz,
  created_at              timestamptz default now()
);


-- ── Restaurant Integrations ──────────────────────────────────────────────────
create table restaurant_integrations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  provider      text not null,                         -- 'square' | 'stripe' | 'twilio' | 'shopify'
  config        jsonb not null default '{}'::jsonb,       -- non-sensitive: location_id, phone_number, store_domain
  credentials   jsonb not null default '{}'::jsonb,       -- sensitive: access_token, api_key, auth_token, secret_key
  api_key       text,                                  -- direct api_key field if used
  metadata      jsonb not null default '{}'::jsonb,       -- additional metadata
  status        text not null default 'active',          -- 'active' | 'inactive' | 'error' | 'disconnected'
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(restaurant_id, provider)
);

create index idx_restaurant_integrations_restaurant_id on restaurant_integrations(restaurant_id);
create index idx_restaurant_integrations_provider on restaurant_integrations(provider);
create index idx_restaurant_users_restaurant_id on restaurant_users(restaurant_id);
create index idx_restaurant_users_user_id on restaurant_users(user_id);


-- ── Timestamps trigger function ──────────────────────────────────────────────
create or replace function update_modified_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_restaurant_users_modtime
  before update on restaurant_users
  for each row execute function update_modified_column();

create trigger update_restaurant_integrations_modtime
  before update on restaurant_integrations
  for each row execute function update_modified_column();


-- ── Helper Security Definer Functions ────────────────────────────────────────
create or replace function get_user_restaurant_ids(p_user_id uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select restaurant_id from restaurant_users where user_id = p_user_id;
$$;

create or replace function is_restaurant_admin(p_restaurant_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from restaurant_users
    where restaurant_id = p_restaurant_id
      and user_id = p_user_id
      and lower(role) in ('owner', 'manager')
  );
$$;


-- ── Row-Level Security (RLS) ─────────────────────────────────────────────────
-- Restaurants can only see their own data
alter table restaurants             enable row level security;
alter table menu_items              enable row level security;
alter table calls                   enable row level security;
alter table orders                  enable row level security;
alter table payment_events          enable row level security;
alter table restaurant_users        enable row level security;
alter table restaurant_integrations enable row level security;

-- Restaurant staff policy (via restaurant_users join)
create policy "restaurant_own_data" on restaurants
  for all using (
    id in (
      select restaurant_id from restaurant_users
      where user_id = auth.uid()
    )
  );

-- restaurant_users policies
create policy "restaurant_users_select_policy" on restaurant_users
  for select using (
    user_id = auth.uid()
    or restaurant_id in (select get_user_restaurant_ids(auth.uid()))
  );

create policy "restaurant_users_insert_policy" on restaurant_users
  for insert with check (
    is_restaurant_admin(restaurant_id, auth.uid())
  );

create policy "restaurant_users_update_policy" on restaurant_users
  for update using (
    is_restaurant_admin(restaurant_id, auth.uid())
  );

create policy "restaurant_users_delete_policy" on restaurant_users
  for delete using (
    is_restaurant_admin(restaurant_id, auth.uid())
  );

-- restaurant_integrations policies
create policy "restaurant_integrations_select_policy" on restaurant_integrations
  for select using (
    restaurant_id in (select get_user_restaurant_ids(auth.uid()))
  );

create policy "restaurant_integrations_insert_policy" on restaurant_integrations
  for insert with check (
    is_restaurant_admin(restaurant_id, auth.uid())
  );

create policy "restaurant_integrations_update_policy" on restaurant_integrations
  for update using (
    is_restaurant_admin(restaurant_id, auth.uid())
  );

create policy "restaurant_integrations_delete_policy" on restaurant_integrations
  for delete using (
    is_restaurant_admin(restaurant_id, auth.uid())
  );


-- ── Staff Management View ────────────────────────────────────────────────────
create or replace view restaurant_staff_view as
select
  ru.id,
  ru.restaurant_id,
  ru.user_id,
  ru.role,
  ru.created_at,
  ru.updated_at,
  coalesce(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
  au.email as email,
  au.last_sign_in_at as last_login
from restaurant_users ru
left join auth.users au on ru.user_id = au.id;

grant select on restaurant_staff_view to authenticated, service_role, anon;


-- ── Menu RAG helper function ─────────────────────────────────────────────────
create or replace function search_menu(
  p_restaurant_id uuid,
  query_embedding vector(1536),
  match_count     int default 5
)
returns table (
  id          uuid,
  name        text,
  description text,
  price_cents int,
  category    text,
  similarity  float
)
language sql stable as $$
  select
    id, name, description, price_cents, category,
    1 - (embedding <=> query_embedding) as similarity
  from menu_items
  where restaurant_id = p_restaurant_id
    and available = true
  order by embedding <=> query_embedding
  limit match_count;
$$;

--  Billing Events 
create table billing_events (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid references restaurants(id) on delete cascade,
  plan_id           text references plans(id),
  amount_cents      int not null,
  status            text default 'due', -- 'paid' | 'due' | 'failed'
  stripe_invoice_id text,
  created_at        timestamptz default now()
);
alter table billing_events enable row level security;

--  Staff Invites 
create table restaurant_invites (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid references restaurants(id) on delete cascade,
  email             text not null,
  role              user_role default 'staff',
  invited_by        uuid references auth.users(id),
  status            text default 'pending', -- 'pending' | 'accepted' | 'expired'
  created_at        timestamptz default now()
);
alter table restaurant_invites enable row level security;
