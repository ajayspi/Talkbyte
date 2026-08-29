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


-- ── Row-Level Security (RLS) ─────────────────────────────────────────────────
-- Restaurants can only see their own data
alter table restaurants   enable row level security;
alter table menu_items    enable row level security;
alter table calls         enable row level security;
alter table orders        enable row level security;
alter table payment_events enable row level security;

-- Restaurant staff policy (via restaurant_users join)
create policy "restaurant_own_data" on restaurants
  for all using (
    id in (
      select restaurant_id from restaurant_users
      where user_id = auth.uid()
    )
  );

-- Repeat similar policies for other tables (omitted for brevity — add in Sprint 3)


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
