# Milestone M1 Technical Investigation Report: Supabase Data Layer & Mock Architecture

**Date**: 2026-09-03  
**Agent**: `explorer_m1_2` (Milestone M1 Data Layer Investigation)  
**Status**: Completed  
**Target Files in Scope**:
- `backend/supabase_schema.sql` (Reference Schema)
- `frontend/src/types/database.types.ts` (Type Definitions)
- `frontend/src/lib/supabase.ts` (Resilient Supabase Client)
- `frontend/src/lib/mockData.ts` (Offline Mock Data Store)

---

## 1. Executive Summary

This investigation establishes the complete technical blueprint for the data layer of the TalkByte AI Next.js 16 frontend. The frontend must interact seamlessly with the Supabase Postgres backend while maintaining **100% offline resilience** during static builds (`npm run build`), Jest automated testing (`npm test`), and local development without active credentials.

### Key Discoveries:
1. **Schema Ground Truth**: `backend/supabase_schema.sql` defines 8 primary tables (`plans`, `restaurants`, `restaurant_users`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`) plus a pgvector `search_menu` RPC function. In addition, the Operator Admin panel and `PROJECT.md` specify an `audit_logs` ledger and infrastructure telemetry entities.
2. **Monetary Convention**: The backend schema stores all monetary values strictly as integers in cents (`monthly_cents`, `price_cents`, `total_cents`). Frontend types must support both `_cents` fields and dollar-denominated aliases (`monthly_price`, `price`, `total_amount`) to satisfy UI rendering without runtime type mismatches.
3. **Build Resilience Requirement**: Environment variable templates (`.env.example`) specify default local ports (`http://localhost:54321`) or placeholders. If Next.js App Router attempts live network requests during static prerendering or build-time evaluation, builds fail. A transparent dual-tier fallback client factory is mandatory.
4. **Interactive Mock State**: To support prototype interactions (such as the 30-second AI menu item availability toggle and live call status updates) without an active database, the mock store must be stateful in-memory.

---

## 2. Supabase Database Schema Analysis

The Postgres 16 database defined in `backend/supabase_schema.sql` (and extended by backend models in `backend/app/models/`) is structured as follows:

### 2.1 Table Specifications

#### 1. `plans`
- **Primary Key**: `id` (`text`) — `'starter' | 'growth' | 'enterprise'` (or `'pro'`)
- **Columns**:
  - `id`: `text` (PK)
  - `name`: `text` (`NOT NULL`)
  - `monthly_cents`: `int` (`NOT NULL`, e.g. 14900, 24900, 49900)
  - `call_limit`: `int` (`NOT NULL`, included calls/month)
- **UI Projections**: Prototype displays `$500/mo` (Starter), `$1,500/mo` (Pro), `$3,500/mo` (Enterprise) and usage limits for calls, AI minutes, and SMS.

#### 2. `restaurants`
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `name`: `text` (`NOT NULL`)
  - `phone_number`: `text` (`NULLABLE`, venue's physical phone)
  - `telnyx_number`: `text` (`UNIQUE`, AI inbound DID)
  - `plan_id`: `text` (`REFERENCES plans(id)`, default `'starter'`)
  - `active`: `boolean` (default `false`)
  - `ai_instructions`: `text` (`NULLABLE`, system prompt injected into voice agent)
  - `timezone`: `text` (default `'Australia/Sydney'`)
  - `created_at`: `timestamptz` (default `now()`)
- **Extended Fleet & Admin Attributes** (from `talkbyte-admin-panel.html` & `PROJECT.md`):
  - `health_score`: `int` (0 to 100, color-coded green ≥80, yellow 50-79, red <50)
  - `pos_provider`: `'Square' | 'Lightspeed' | 'Clover' | 'Email only' | 'None'`
  - `pos_status`: `'Active' | 'Syncing' | 'Error' | 'None'`
  - `status`: `'active' | 'at_risk' | 'churning' | 'trial' | 'suspended'`
  - `mrr`: `number` (monthly recurring revenue)
  - `calls_month`: `number`
  - `orders_month`: `number`
  - `completion_rate`: `number` (percentage)

#### 3. `restaurant_users` (Multi-tenant RBAC)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `restaurant_id`: `uuid` (`REFERENCES restaurants(id) ON DELETE CASCADE`)
  - `user_id`: `uuid` (`REFERENCES auth.users(id) ON DELETE CASCADE`)
  - `role`: `text` (default `'owner'`, supports `'owner' | 'manager' | 'staff' | 'readonly'`)
  - `created_at`: `timestamptz` (default `now()`)
  - `UNIQUE(restaurant_id, user_id)`

#### 4. `menu_items` (with pgvector for RAG)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `restaurant_id`: `uuid` (`REFERENCES restaurants(id) ON DELETE CASCADE`)
  - `name`: `text` (`NOT NULL`)
  - `description`: `text` (`NULLABLE`)
  - `price_cents`: `int` (`NOT NULL`)
  - `category`: `text` (`NULLABLE`, e.g. `'Pizzas' | 'Sides' | 'Drinks' | 'Desserts'`)
  - `available`: `boolean` (default `true`, 86 toggle)
  - `embedding`: `vector(1536)` (OpenAI `text-embedding-3-small` dimension, indexed via `ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`)
  - `created_at`: `timestamptz` (default `now()`)

#### 5. `calls` (Call State Machine & Telemetry)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `restaurant_id`: `uuid` (`REFERENCES restaurants(id)`)
  - `caller_number`: `text` (`NOT NULL`)
  - `state`: `text` (`NOT NULL`, default `'GREETING'`)
    - Valid state values: `'GREETING'`, `'TAKING_ORDER'`, `'CONFIRMING'`, `'CONFIRMED'`, `'PAYMENT_SENT'`, `'COMPLETE'`, `'TRANSFER_TO_HUMAN'`, `'CALL_DROPPED'`, `'POS_FAILED'`, `'PAYMENT_EXPIRED'`
  - `started_at`: `timestamptz` (default `now()`)
  - `ended_at`: `timestamptz` (`NULLABLE`)
  - `transcript`: `jsonb` (default `'[]'`, array of `{role: string, text: string, time?: string}`)
  - `stt_confidence`: `float` (`NULLABLE`, e.g. 0.97)
  - `livekit_room`: `text` (`NULLABLE`, LiveKit RTC room ID)
- **Computed / UI Fields**:
  - `duration_seconds`: `number` (or `duration_formatted` e.g. `"2:14"`)
  - `sentiment`: `'positive' | 'neutral' | 'negative'`

#### 6. `orders` (Order Capture & POS Pipeline)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `call_id`: `uuid` (`REFERENCES calls(id)`, `NULLABLE`)
  - `restaurant_id`: `uuid` (`REFERENCES restaurants(id)`)
  - `items`: `jsonb` (`NOT NULL`, default `'[]'`, shape: `[{name: string, qty: number, price_cents: number}]`)
  - `total_cents`: `int` (`NOT NULL`)
  - `state`: `text` (`NOT NULL`, default `'CONFIRMED'`)
    - Valid backend values: `'CONFIRMED'`, `'POS_PUSHED'`, `'POS_FAILED'`, `'CANCELLED'`
    - UI pipeline states: `'Placed' | 'Link Sent' | 'Paid' | 'Synced' | 'Failed' | 'Expired'`
  - `pos_order_id`: `text` (`NULLABLE`, Square / Lightspeed external order ID)
  - `created_at`: `timestamptz` (default `now()`)

#### 7. `payment_events` (SMS Stripe Flow)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `order_id`: `uuid` (`REFERENCES orders(id)`)
  - `stripe_payment_link`: `text` (`NULLABLE`)
  - `stripe_session_id`: `text` (`NULLABLE`)
  - `sent_at`: `timestamptz` (`NULLABLE`)
  - `paid_at`: `timestamptz` (`NULLABLE`)
  - `expires_at`: `timestamptz` (`NULLABLE`, 30 min window)
- **Extended Attributes**:
  - `status`: `'pending' | 'paid' | 'expired' | 'failed'`
  - `amount_cents`: `int`

#### 8. `subscriptions` (Stripe Billing Lifecycle)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `restaurant_id`: `uuid` (`REFERENCES restaurants(id) ON DELETE CASCADE`)
  - `plan_id`: `text` (`REFERENCES plans(id)`)
  - `stripe_subscription_id`: `text` (`UNIQUE`, `NULLABLE`)
  - `status`: `text` (default `'active'`, `'active' | 'past_due' | 'cancelled' | 'trialing'`)
  - `current_period_end`: `timestamptz` (`NULLABLE`)
  - `created_at`: `timestamptz` (default `now()`)

#### 9. `audit_logs` (Operator Security Ledger — PROJECT.md §Feature 21)
- **Primary Key**: `id` (`uuid`, default `gen_random_uuid()`)
- **Columns**:
  - `id`: `uuid`
  - `timestamp`: `timestamptz` (default `now()`)
  - `event_type`: `text` (`NOT NULL`, `'ORDER' | 'ESCALATION' | 'BILLING' | 'RESTAURANT' | 'SYSTEM' | 'POS' | 'AUTH' | 'ONBOARD'`)
  - `actor`: `text` (`NOT NULL`, e.g. `'AI Agent'`, `'aj@designjoom.in'`, `'Monitoring'`)
  - `resource`: `text` (`NOT NULL`, e.g. `"Mama's Pizzeria"`, `'Deepgram Flux'`)
  - `details`: `text` (`NOT NULL`)
  - `ip_address`: `text` (`NULLABLE`, e.g. `'203.x.x.x'`, `'system'`)

---

## 3. TypeScript Data Layer Architecture (`src/types/database.types.ts`)

The TypeScript definition file must export the complete `Database` interface matching `@supabase/supabase-js` schema structure, enabling end-to-end type inference for `.from('tableName').select(...)`.

### Proposed Implementation for `frontend/src/types/database.types.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CallState =
  | 'GREETING'
  | 'TAKING_ORDER'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'PAYMENT_SENT'
  | 'COMPLETE'
  | 'TRANSFER_TO_HUMAN'
  | 'CALL_DROPPED'
  | 'POS_FAILED'
  | 'PAYMENT_EXPIRED';

export type OrderState =
  | 'CONFIRMED'
  | 'POS_PUSHED'
  | 'POS_FAILED'
  | 'CANCELLED'
  | 'Placed'
  | 'Link Sent'
  | 'Paid'
  | 'Synced'
  | 'Expired';

export type UserRole = 'owner' | 'manager' | 'staff' | 'readonly';

export type RestaurantStatus = 'active' | 'at_risk' | 'churning' | 'trial' | 'suspended';

export type POSProvider = 'Square' | 'Lightspeed' | 'Clover' | 'Email only' | 'None';

export type POSStatus = 'Connected' | 'Syncing' | 'Error' | 'None';

export interface OrderItem {
  name: string;
  qty: number;
  price_cents: number;
  price?: number;
}

export interface CallTranscriptItem {
  role: 'assistant' | 'user' | 'system';
  text: string;
  time?: string;
}

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          name: string;
          monthly_cents: number;
          call_limit: number;
          monthly_price?: number;
          features?: string[];
        };
        Insert: {
          id: string;
          name: string;
          monthly_cents: number;
          call_limit: number;
          monthly_price?: number;
          features?: string[];
        };
        Update: {
          id?: string;
          name?: string;
          monthly_cents?: number;
          call_limit?: number;
          monthly_price?: number;
          features?: string[];
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          phone_number: string | null;
          telnyx_number: string | null;
          plan_id: string | null;
          active: boolean;
          ai_instructions: string | null;
          timezone: string;
          created_at: string;
          // UI / Fleet Extended attributes
          health_score?: number;
          pos_provider?: POSProvider;
          pos_status?: POSStatus;
          status?: RestaurantStatus;
          location?: string;
          mrr?: number;
          calls_month?: number;
          orders_month?: number;
          completion_rate?: number;
        };
        Insert: {
          id?: string;
          name: string;
          phone_number?: string | null;
          telnyx_number?: string | null;
          plan_id?: string | null;
          active?: boolean;
          ai_instructions?: string | null;
          timezone?: string;
          created_at?: string;
          health_score?: number;
          pos_provider?: POSProvider;
          pos_status?: POSStatus;
          status?: RestaurantStatus;
          location?: string;
          mrr?: number;
        };
        Update: {
          id?: string;
          name?: string;
          phone_number?: string | null;
          telnyx_number?: string | null;
          plan_id?: string | null;
          active?: boolean;
          ai_instructions?: string | null;
          timezone?: string;
          created_at?: string;
          health_score?: number;
          pos_provider?: POSProvider;
          pos_status?: POSStatus;
          status?: RestaurantStatus;
          location?: string;
          mrr?: number;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "plans";
            referencedColumns: ["id"];
          }
        ];
      };
      restaurant_users: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
          name?: string;
          email?: string;
          last_login?: string;
          restaurant_name?: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
          name?: string;
          email?: string;
          last_login?: string;
          restaurant_name?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
          name?: string;
          email?: string;
          last_login?: string;
          restaurant_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_users_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          price?: number;
          category: string | null;
          available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          price_cents: number;
          price?: number;
          category?: string | null;
          available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          price?: number;
          category?: string | null;
          available?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      calls: {
        Row: {
          id: string;
          restaurant_id: string;
          caller_number: string;
          caller_phone?: string;
          state: CallState;
          started_at: string;
          ended_at: string | null;
          transcript: CallTranscriptItem[];
          stt_confidence: number | null;
          livekit_room: string | null;
          duration_seconds?: number;
          duration_formatted?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          items_ordered?: string;
          restaurant_name?: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          caller_number: string;
          caller_phone?: string;
          state?: CallState;
          started_at?: string;
          ended_at?: string | null;
          transcript?: CallTranscriptItem[];
          stt_confidence?: number | null;
          livekit_room?: string | null;
          duration_seconds?: number;
          duration_formatted?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          items_ordered?: string;
          restaurant_name?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          caller_number?: string;
          caller_phone?: string;
          state?: CallState;
          started_at?: string;
          ended_at?: string | null;
          transcript?: CallTranscriptItem[];
          stt_confidence?: number | null;
          livekit_room?: string | null;
          duration_seconds?: number;
          duration_formatted?: string;
          sentiment?: 'positive' | 'neutral' | 'negative';
          items_ordered?: string;
          restaurant_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calls_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          call_id: string | null;
          restaurant_id: string;
          items: OrderItem[];
          total_cents: number;
          total_amount?: number;
          state: OrderState;
          pos_order_id: string | null;
          created_at: string;
          order_number?: string;
          payment_status?: 'Paid' | 'Pending' | 'Expired' | 'Failed';
          pos_status?: 'Synced' | 'Waiting' | 'Failed' | 'Pending';
        };
        Insert: {
          id?: string;
          call_id?: string | null;
          restaurant_id: string;
          items: OrderItem[];
          total_cents: number;
          total_amount?: number;
          state?: OrderState;
          pos_order_id?: string | null;
          created_at?: string;
          order_number?: string;
          payment_status?: 'Paid' | 'Pending' | 'Expired' | 'Failed';
          pos_status?: 'Synced' | 'Waiting' | 'Failed' | 'Pending';
        };
        Update: {
          id?: string;
          call_id?: string | null;
          restaurant_id?: string;
          items?: OrderItem[];
          total_cents?: number;
          total_amount?: number;
          state?: OrderState;
          pos_order_id?: string | null;
          created_at?: string;
          order_number?: string;
          payment_status?: 'Paid' | 'Pending' | 'Expired' | 'Failed';
          pos_status?: 'Synced' | 'Waiting' | 'Failed' | 'Pending';
        };
        Relationships: [
          {
            foreignKeyName: "orders_call_id_fkey";
            columns: ["call_id"];
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_events: {
        Row: {
          id: string;
          order_id: string;
          stripe_payment_link: string | null;
          stripe_session_id: string | null;
          sent_at: string | null;
          paid_at: string | null;
          expires_at: string | null;
          status?: 'pending' | 'paid' | 'expired' | 'failed';
          amount_cents?: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          stripe_payment_link?: string | null;
          stripe_session_id?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          expires_at?: string | null;
          status?: 'pending' | 'paid' | 'expired' | 'failed';
          amount_cents?: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          stripe_payment_link?: string | null;
          stripe_session_id?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          expires_at?: string | null;
          status?: 'pending' | 'paid' | 'expired' | 'failed';
          amount_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          restaurant_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey";
            columns: ["restaurant_id"];
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "plans";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          event_type: 'ORDER' | 'ESCALATION' | 'BILLING' | 'RESTAURANT' | 'SYSTEM' | 'POS' | 'AUTH' | 'ONBOARD';
          actor: string;
          resource: string;
          details: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          event_type: 'ORDER' | 'ESCALATION' | 'BILLING' | 'RESTAURANT' | 'SYSTEM' | 'POS' | 'AUTH' | 'ONBOARD';
          actor: string;
          resource: string;
          details: string;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          timestamp?: string;
          event_type?: 'ORDER' | 'ESCALATION' | 'BILLING' | 'RESTAURANT' | 'SYSTEM' | 'POS' | 'AUTH' | 'ONBOARD';
          actor?: string;
          resource?: string;
          details?: string;
          ip_address?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      search_menu: {
        Args: {
          p_restaurant_id: string;
          query_embedding: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          category: string | null;
          similarity: number;
        }[];
      };
    };
    Enums: {};
  };
}

// Convenience Model Types
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Call = Database['public']['Tables']['calls']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type PaymentEvent = Database['public']['Tables']['payment_events']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Plan = Database['public']['Tables']['plans']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type RestaurantUser = Database['public']['Tables']['restaurant_users']['Row'];

export interface InfraServiceTelemetry {
  name: string;
  status: 'operational' | 'elevated' | 'down';
  statusLabel: string;
  latency: string;
  metrics: { label: string; value: string; color?: string }[];
  healthPercentage: number;
}

export interface PlatformKPIs {
  activeRestaurants: number;
  activeRestaurantsDelta: string;
  mrr: string;
  mrrDelta: string;
  callsToday: number;
  callsTodayDelta: string;
  churnRate: string;
  churnRateDelta: string;
  orderCompletionRate: string;
  orderCompletionDelta: string;
  paymentConversion: string;
  paymentConversionDelta: string;
  avgLatency: string;
  avgLatencyDelta: string;
  escalationRate: string;
  escalationRateDelta: string;
}
```

---

## 4. Resilient Supabase Client & Mock Architecture

### 4.1 Fallback Rationale & Build Protection
Next.js 16 performs route analysis and static rendering at build time (`next build`). If any imported module tries to execute unhandled network queries against `http://localhost:54321` or a missing Supabase host, the build immediately aborts with `TypeError: fetch failed` or `ECONNREFUSED`.

To guarantee zero-crash execution:
1. **Instantiation Safety**: If `NEXT_PUBLIC_SUPABASE_URL` is undefined, empty, or placeholder, initialize `@supabase/supabase-js` with a dummy valid URL (`http://127.0.0.1:54321`) and key so that the exported `supabase` client remains valid without throwing constructor errors.
2. **Dual-Tier Service Layer**: All UI components interact through typed data helper functions (`getRestaurant`, `getMenuItems`, `toggleMenuItemAvailability`, `getRecentOrders`, `getLiveCalls`, `getPlatformStats`, `getAuditLogs`).
   - Tier 1: Check `isSupabaseConfigured`. If false, immediately return data from `src/lib/mockData.ts`.
   - Tier 2: If `isSupabaseConfigured` is true, attempt the live Supabase query inside `try...catch`. On any network error, timeout, or missing table, log a graceful warning and fall back to `mockData.ts`.
3. **Stateful In-Memory Mutations**: `mockData.ts` holds in-memory mutable data stores (such as the menu item list with availability toggles). Calling `toggleMenuItemAvailability(id, boolean)` immediately flips the boolean in memory, allowing interactive toggles to persist across tab switches in the offline prototype.

### 4.2 Proposed Implementation for `frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type {
  Database,
  Restaurant,
  MenuItem,
  Call,
  Order,
  AuditLog,
  PlatformKPIs,
  InfraServiceTelemetry
} from '@/types/database.types';
import {
  MOCK_RESTAURANT,
  MOCK_FLEET_RESTAURANTS,
  MOCK_MENU_ITEMS,
  MOCK_RECENT_ORDERS,
  MOCK_LIVE_CALLS,
  MOCK_PLATFORM_KPIS,
  MOCK_AUDIT_LOGS,
  MOCK_INFRA_SERVICES,
  toggleMockMenuItemAvailability
} from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect whether valid production or active local Supabase credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder' &&
  !supabaseAnonKey.endsWith('.test')
);

// Fallback dummy credentials to prevent createClient constructor crash if env is missing
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'http://127.0.0.1:54321';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key-for-static-build';

export const supabase = createClient<Database>(safeUrl, safeKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ── Data Provider Service Functions ──────────────────────────────────────────

export async function getRestaurant(id: string): Promise<Restaurant> {
  if (!isSupabaseConfigured) {
    return MOCK_RESTAURANT;
  }
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.warn('Supabase getRestaurant failed, using mock data:', error?.message);
      return MOCK_RESTAURANT;
    }
    return data as Restaurant;
  } catch (err) {
    console.warn('Supabase getRestaurant network error, using mock data:', err);
    return MOCK_RESTAURANT;
  }
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  if (!isSupabaseConfigured) {
    return MOCK_MENU_ITEMS.filter((item) => !restaurantId || item.restaurant_id === restaurantId || true);
  }
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase getMenuItems failed, using mock data:', error?.message);
      return MOCK_MENU_ITEMS;
    }
    return data as MenuItem[];
  } catch (err) {
    console.warn('Supabase getMenuItems network error, using mock data:', err);
    return MOCK_MENU_ITEMS;
  }
}

export async function toggleMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<{ success: boolean; available: boolean }> {
  // Always update in-memory mock store for immediate UI responsiveness
  toggleMockMenuItemAvailability(itemId, available);

  if (!isSupabaseConfigured) {
    return { success: true, available };
  }
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ available })
      .eq('id', itemId);

    if (error) {
      console.warn('Supabase toggleMenuItemAvailability failed, kept mock update:', error.message);
    }
    return { success: !error, available };
  } catch (err) {
    console.warn('Supabase toggleMenuItemAvailability network error:', err);
    return { success: true, available };
  }
}

export async function getRecentOrders(restaurantId: string, limit = 10): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    return MOCK_RECENT_ORDERS.slice(0, limit);
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      console.warn('Supabase getRecentOrders failed, using mock data:', error?.message);
      return MOCK_RECENT_ORDERS.slice(0, limit);
    }
    return data as Order[];
  } catch (err) {
    console.warn('Supabase getRecentOrders network error, using mock data:', err);
    return MOCK_RECENT_ORDERS.slice(0, limit);
  }
}

export async function getLiveCalls(restaurantId?: string): Promise<Call[]> {
  if (!isSupabaseConfigured) {
    return restaurantId
      ? MOCK_LIVE_CALLS.filter((c) => c.restaurant_id === restaurantId)
      : MOCK_LIVE_CALLS;
  }
  try {
    let query = supabase
      .from('calls')
      .select('*')
      .in('state', ['GREETING', 'TAKING_ORDER', 'CONFIRMING', 'PAYMENT_SENT']);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return restaurantId
        ? MOCK_LIVE_CALLS.filter((c) => c.restaurant_id === restaurantId)
        : MOCK_LIVE_CALLS;
    }
    return data as Call[];
  } catch (err) {
    console.warn('Supabase getLiveCalls network error, using mock data:', err);
    return MOCK_LIVE_CALLS;
  }
}

export async function getFleetRestaurants(): Promise<Restaurant[]> {
  if (!isSupabaseConfigured) {
    return MOCK_FLEET_RESTAURANTS;
  }
  try {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error || !data || data.length === 0) {
      return MOCK_FLEET_RESTAURANTS;
    }
    return data as Restaurant[];
  } catch (err) {
    console.warn('Supabase getFleetRestaurants network error, using mock data:', err);
    return MOCK_FLEET_RESTAURANTS;
  }
}

export async function getPlatformStats(): Promise<PlatformKPIs> {
  // Real platform stats require aggregation across tables; fallback to rich mock KPIs
  return MOCK_PLATFORM_KPIS;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) {
    return MOCK_AUDIT_LOGS;
  }
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return MOCK_AUDIT_LOGS;
    }
    return data as AuditLog[];
  } catch (err) {
    console.warn('Supabase getAuditLogs network error, using mock data:', err);
    return MOCK_AUDIT_LOGS;
  }
}

export async function getInfraTelemetry(): Promise<InfraServiceTelemetry[]> {
  return MOCK_INFRA_SERVICES;
}
```

---

## 5. Mock Data Architecture (`src/lib/mockData.ts`)

The mock data file must provide comprehensive, fully-typed domain objects matching the exact figures and labels in `talkbyte-restaurant-dashboard.html` and `talkbyte-admin-panel.html`.

### 5.1 Entities Specification in `mockData.ts`

1. **Restaurant Tenant**:
   - ID: `'rest-mamas-pizzeria-001'`
   - Name: `"Mama's Pizzeria"`
   - Address/Location: `"Carlton VIC / Newtown, Sydney"`
   - Phone: `"+61 2 9999 1234"` (TalkByte DID)
   - Real Phone: `"+61 2 9555 4321"`
   - Plan: `'pro'` (`$1,500/mo`, up to 10,000 calls/mo)
   - Status: `'active'`, Health: `98`
   - POS: `Square POS` (Status: `Connected`, Newtown branch)
2. **Fleet Tenants (6 Detailed Admin Records)**:
   - Mama's Pizzeria (Enterprise, VIC, 2,847 calls/mo, 74% completion, Health 98, Square, Active, $3,500 MRR)
   - Thai Express (Pro, NSW, 1,543 calls/mo, 77% completion, Health 95, Square, Active, $1,500 MRR)
   - Burger Palace (Pro, QLD, 1,287 calls/mo, 74% completion, Health 92, Lightspeed, Active, $1,500 MRR)
   - Spaghetti Junction (Starter, VIC, 512 calls/mo, 56% completion, Health 61, Email only, At Risk, $500 MRR)
   - Sakura Sushi (Starter, VIC, 89 calls/mo, 46% completion, Health 34, None, Churning, $500 MRR)
   - The Greek Place (Starter, VIC, 341 calls/mo, 63% completion, Health 58, Square error, At Risk, $500 MRR)
3. **Menu Catalog (24 items across 4 categories)**:
   - **Pizzas (10)**: Margherita ($18.50), Pepperoni Supreme ($22.00), Quattro Formaggi ($24.00, `available: false`), Veggie Special ($21.50), Quattro Stagioni ($26.00), BBQ Meatlovers ($25.00), Capricciosa ($22.50), Diavola ($23.00), Hawaiian ($20.00), Marinara Seafood ($27.00)
   - **Sides (6)**: Garlic Bread ($7.00), Truffle Fries ($9.50), Arancini Balls ($12.00), Rocket Salad ($11.00), Buffalo Mozzarella Caprese ($14.00), Olives & Focaccia ($8.50)
   - **Drinks (5)**: Coke 375ml ($4.50), Coke Zero 375ml ($4.50), San Pellegrino Sparkling 500ml ($5.50), Italian Lemon Soda ($5.00), Peroni Red 330ml ($9.00)
   - **Desserts (3)**: Classic Tiramisu ($9.50), Nutella Pizza Pocket ($12.50), Cannoli Siciliani ($8.00)
4. **Active Live Calls (6 Fleet Cards, 2 Venue Cards)**:
   - Call 1: Mama's Pizzeria, Caller `+61 412 *** 847`, Carlton VIC, STT 97%, state `TAKING_ORDER`, items `"2× Margherita · 1× Garlic Bread"`, timer `"2:14"`
   - Call 2: Thai Express, Caller `+61 438 *** 221`, Newtown NSW, STT 95%, state `TAKING_ORDER`, items `"Pad Thai large · Green curry"`, timer `"1:32"`
   - Call 3: Burger Palace, Caller `+61 404 *** 119`, South Bank QLD, STT 98%, state `CONFIRMING`, items `"3× Beef Burger · 3× Chips · 2× Vanilla Shake"`, timer `"3:47"`
   - Call 4 (Escalating): Spaghetti Junction, Caller `+61 421 *** 034`, Richmond VIC, STT 71%, state `TRANSFER_TO_HUMAN`, alert `"3rd misunderstanding, transferring to human"`, timer `"5:12"`
   - Call 5: Noodle House, Caller `+61 455 *** 662`, Chinatown NSW, STT 96%, state `TAKING_ORDER`, items `"Ramen large · Spring rolls ×2"`, timer `"0:58"`
   - Call 6: The Curry Leaf, Caller `+61 448 *** 777`, Fitzroy VIC, STT 94%, state `PAYMENT_SENT`, items `"Butter chicken · Biryani · Naan ×3"`, timer `"4:01"`
5. **Orders Pipeline (Recent Orders)**:
   - Order #1047: 14:22, `"Margherita L, Extra Cheese, Garlic ×2, Coke"`, `$38.50`, Payment: Paid, POS: Synced
   - Order #1046: 14:08, `"Pepperoni XL, Coke ×3"`, `$54.00`, Payment: Link Sent, POS: Pending (Resend action)
   - Order #1045: 13:55, `"Veggie Special, Tiramisu"`, `$42.80`, Payment: Paid, POS: Synced
   - Order #1044: 13:41, `"Quattro Stagioni"`, `$28.00`, Payment: Expired, POS: Failed (Retry action)
6. **Platform KPIs & Cost Breakdown**:
   - Active Restaurants: 487 (↑ 12 this week)
   - MRR: $125.4K (↑ 5.5% MoM, ARR $1.51M)
   - Calls Today: 2,847 (↑ 18%, 23 live now)
   - Churn Rate: 2.1%
   - Completion Rate: 74.2%
   - Payment Conversion: 82.7%
   - Avg E2E Latency: 387ms (target <500ms)
   - Escalation Rate: 11.4% (target ≤15%)
   - Unit Economics ($0.062/min COGS): Telnyx $0.018, Deepgram $0.007, GPT-4.1 $0.012, ElevenLabs $0.012, SMS $0.005, Infra $0.008. Margin: 31%.
7. **Infrastructure Health (9 Monitored Services)**:
   - Telnyx SIP (Operational, 12ms latency, 0.01% loss)
   - Deepgram Flux STT (Elevated Latency 94ms vs 70ms baseline, yellow warning)
   - OpenAI GPT-4.1 (Operational, 312ms TTFT, 4.2K tok/s)
   - ElevenLabs TTS (Operational, 180ms TTFA, 1.24M chars)
   - Stripe (Operational, 82.7% conversion, $68,440 GMV today)
   - Supabase Postgres (Operational, P95 8ms, 127/500 conns, 84 vector queries/s)
   - Upstash Redis (Operational, 2ms latency, 99.4% hit rate)
   - Square POS API (Operational, 98.1% sync rate, 340ms sync)
   - LiveKit Voice Agent (Operational, 23 active rooms, 50/50 pool, 387ms P95)
8. **Audit Logs Ledger (8 Records)**:
   - ORDER (AI Agent, Mama's Pizzeria, Order #4821 confirmed $47.50)
   - ESCALATION (AI Agent, Spaghetti Junction, 3 failed STT attempts transferred to human)
   - BILLING (aj@designjoom.in, Thai Express, Upgraded Starter -> Pro $1,500/mo)
   - RESTAURANT (aj@designjoom.in, Noodle House, Menu updated, pgvector re-indexed)
   - SYSTEM (Monitoring, Deepgram Flux, TTFT latency alert 94ms)
   - POS (System, The Greek Place, Square sync failed 3 retries, fallback email sent)
   - AUTH (owner@mamaspizza.com, Restaurant Dashboard, Supabase Auth session)
   - ONBOARD (aj@designjoom.in, Sakura Sushi, Telnyx DID assigned)

---

## 6. Data Access Recommendations for M2 and M3

### 6.1 Consumption Patterns in Next.js 16 App Router

1. **Client-Side Data Management**:
   The interactive dashboards require local state, sub-second live timer updates, live audio monitor toggles, and tab switches without full page reload. All tabs in `(restaurant)/dashboard` and `(admin)/admin` should be Client Components (`'use client'`) consuming the data layer through custom React hooks or `@tanstack/react-query` (already present in `package.json`).

2. **Recommended Hook Architecture**:
   Implement custom React hooks in `frontend/src/lib/hooks.ts` or directly within the component directories:
   - `useRestaurant(restaurantId: string)`: fetches venue details, plan limits, and integration status.
   - `useMenuItems(restaurantId: string)`: provides filtered items and the `toggleAvailability` handler with optimistic UI updates.
   - `useOrders(restaurantId: string)`: provides recent orders, pipeline stages, and CSV export logic.
   - `useLiveCalls(restaurantId?: string)`: provides active calls and a 1-second interval timer ticker for duration displays (`m:ss`).
   - `useAdminFleet()`: provides the 487-tenant directory with client-side text search, plan filter, and status filter.
   - `useInfraHealth()`: provides real-time system monitor cards and alert banners.
   - `useAuditLogs()`: provides platform event ledger with category filtering.

3. **Real-Time Polling Strategy**:
   - Active Live Calls: Poll every 3,000ms (matching the prototype's `"Updated every 3s"` indicator) or simulate with local interval timer when running offline.
   - Orders & Menu: Revalidate on user mutation (e.g. immediately after toggling item availability).
   - In production with real Supabase credentials, `supabase.channel('public:calls')` can be subscribed to for WebSocket push updates.

4. **FastAPI Integration vs Direct Supabase**:
   - Read-heavy and UI-state views (fleet tables, menu items, orders history, audit logs) read directly through `src/lib/supabase.ts`.
   - Voice agent orchestration, live call take-over/audio interception, and manual POS re-syncs route through `src/lib/api.ts` to the FastAPI backend endpoints (`/api/orders`, `/api/restaurants`, `/api/admin`).

---

## 7. Next Steps for Milestone M1 Implementation

1. Create `frontend/src/types/database.types.ts` containing the full `Database` interface and helper types.
2. Create `frontend/src/lib/mockData.ts` with complete domain datasets mirroring both HTML prototypes.
3. Create `frontend/src/lib/supabase.ts` with the dual-tier fallback client factory and data access functions.
4. Verify by running `npm test` and ensuring `__tests__/example.test.ts` passes with zero type or module resolution errors.
