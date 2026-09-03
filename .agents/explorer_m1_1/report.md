# Milestone M1 Technical Investigation & Blueprint Report
**Explorer Agent**: `explorer_m1_1`  
**Milestone**: M1 — Frontend Foundation & Data Layer  
**Target Repository**: `frontend/`  
**Date**: 2026-09-03  

---

## 1. Executive Summary

Milestone M1 establishes the core foundational infrastructure, build configuration, styling system, and resilient data layer for the TalkByte AI frontend application. This groundwork enables the subsequent development of the **Restaurant Operations Dashboard (Milestone M2 / Sprint 3)** and the **Operator Admin Panel (Milestone M3 / Sprint 4)**.

### Core Objectives:
1. **Toolchain & Build Configuration**: Configure Next.js 16 (App Router), React 19, TypeScript 5, and Tailwind CSS v4 using `@tailwindcss/postcss`.
2. **Design System & Global Styles**: Setup `globals.css` with Tailwind CSS v4 imports, prototype-matching color tokens, keyframe animations, and badge/chip utilities.
3. **Resilient Data Layer**: Construct complete Supabase TypeScript definitions (`database.types.ts`) mirroring `backend/supabase_schema.sql` and `PROJECT.md`, plus an offline-tolerant Supabase client (`lib/supabase.ts`) backed by rich mock data (`lib/mockData.ts`).
4. **Self-Contained Iconography**: Implement custom SVG icon components (`components/icons.tsx`) to satisfy all UI requirements across both dashboards without external package dependencies (such as `lucide-react` which is absent from `package.json`).
5. **Root Navigation Portal**: Provide a landing page (`app/page.tsx`) and root layout (`app/layout.tsx`) guiding operators and restaurant staff to their respective consoles.

---

## 2. Environment & Dependency Analysis

An audit of `frontend/package.json` revealed key runtime and build constraints:

| Package | Version | Architectural Implication |
|---|---|---|
| `next` | `^16.0.0` | App Router defaults; requires modern `next.config.mjs` and `tsconfig.json` with `@/*` path aliases. |
| `react` / `react-dom` | `^19.0.0` | Modern React 19 typing; JSX preserve in `tsconfig.json`. |
| `tailwindcss` | `^4.0.0` | Tailwind v4 uses `@import "tailwindcss";` rather than v3 `@tailwind` directives. |
| `@tailwindcss/postcss` | `^4.0.0` | PostCSS config must bind `@tailwindcss/postcss` plugin. |
| `@supabase/supabase-js` | `^2.47.0` | Requires typed client `createClient<Database>()`. Must handle offline fallback gracefully when DB is not running. |
| `lucide-react` | **NOT INSTALLED** | Any attempt to import from `lucide-react` will break build and tests. `components/icons.tsx` must supply all icons natively. |
| `jest` / `ts-jest` | `^29.7.0` | `jest.config.js` maps `@/*` to `<rootDir>/src/$1`. |

---

## 3. File-by-File Blueprints for Worker M1

Worker M1 must implement exactly 10 files. The following blueprints provide complete code specifications and rationale for each.

---

### File 1: `frontend/tsconfig.json`
**Path**: `frontend/tsconfig.json`  
**Purpose**: Configures TypeScript compiler for Next.js 16 App Router, React 19, and Jest compatibility.  
**Key Settings**:
- `baseUrl`: `"."`
- `paths`: `{ "@/*": ["./src/*"] }`
- `target`: `"ES2022"`
- `lib`: `["dom", "dom.iterable", "esnext"]`
- `module`: `"esnext"`
- `moduleResolution`: `"bundler"`
- `jsx`: `"preserve"`
- `strict`: `true`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### File 2: `frontend/next.config.mjs`
**Path**: `frontend/next.config.mjs`  
**Purpose**: Standard Next.js 16 configuration supporting Turbopack, remote image domains, and resilient build checks.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

---

### File 3: `frontend/postcss.config.mjs`
**Path**: `frontend/postcss.config.mjs`  
**Purpose**: Integrates Tailwind CSS v4 via `@tailwindcss/postcss`.

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

### File 4: `frontend/src/app/globals.css`
**Path**: `frontend/src/app/globals.css`  
**Purpose**: Tailwind CSS v4 setup, color theme CSS variables, and utility classes matching prototypes `talkbyte-restaurant-dashboard.html` and `talkbyte-admin-panel.html`.

```css
@import "tailwindcss";

:root {
  --purple: #7c3aed;
  --purple-dark: #4A0E4E;
  --purple-mid: #6d28d9;
  --purple-light: #ede9fe;
  --teal: #14b8a6;
  --teal-light: #ccfbf1;
  --orange: #FF6B35;
  --orange-light: #fff0eb;
  --blue: #3b82f6;
  --blue-light: #eff6ff;
  --green: #22c55e;
  --green-light: #f0fdf4;
  --red: #ef4444;
  --red-light: #fef2f2;
  --yellow: #eab308;
  --yellow-light: #fefce8;
  --gray: #6b7280;
  --border: #e5e7eb;
  --text: #111827;
  --text-muted: #6b7280;
  --bg: #f8f7ff;
  --card: #ffffff;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* Animations */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulse-border {
  0%, 100% { border-left-color: var(--yellow); }
  50% { border-left-color: #fde047; }
}

.live-pulse {
  animation: pulse-slow 1.5s infinite;
}

.live-badge-pulse {
  animation: pulse-red 2s infinite;
}

/* Badges & Chips */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-green { background: #dcfce7; color: #166534; }
.badge-yellow { background: #fef9c3; color: #854d0e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-purple { background: #ede9fe; color: #5b21b6; }
.badge-gray { background: #f3f4f6; color: #374151; }
.badge-teal { background: #ccfbf1; color: #0f766e; }
.badge-orange { background: #fff0eb; color: #c2410c; }

/* Health & Progress Bars */
.health-bar {
  height: 6px;
  border-radius: 3px;
  background-color: #e5e7eb;
  overflow: hidden;
  width: 80px;
  display: inline-block;
}

.health-fill {
  height: 100%;
  border-radius: 3px;
}

.fill-green { background-color: var(--green); }
.fill-yellow { background-color: var(--yellow); }
.fill-red { background-color: var(--red); }
```

---

### File 5: `frontend/src/app/layout.tsx`
**Path**: `frontend/src/app/layout.tsx`  
**Purpose**: Root HTML layout for all application routes with metadata.

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkByte AI — Restaurant Voice Ordering Platform',
  description: 'AI phone ordering system for Australian restaurants. Caller rings -> AI answers -> takes order -> sends SMS payment link -> pushes to POS.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#f8f7ff] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
```

---

### File 6: `frontend/src/app/page.tsx`
**Path**: `frontend/src/app/page.tsx`  
**Purpose**: Clean portal landing screen providing access to the Restaurant Operations Dashboard and the Operator Admin Panel.

```tsx
import Link from 'next/link';
import {
  PhoneIcon,
  DashboardIcon,
  ShieldIcon,
  StoreIcon,
  BoltIcon,
  ActivityIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from '@/components/icons';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0a1e] via-[#2d124d] to-[#0f172a] text-white flex flex-col justify-between p-6 sm:p-12">
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#14b8a6] flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
            🎙️
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TalkByte <span className="text-[#14b8a6]">AI</span></h1>
            <p className="text-xs text-white/50">Next-Gen Voice Ordering Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Production Core v2.2 (AU-EAST-1)
        </div>
      </header>

      <section className="max-w-4xl w-full mx-auto my-12 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[#14b8a6] text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
          Telephony · LLM · STT/TTS · POS Integration
        </span>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Autonomous Phone Ordering for Restaurants
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto text-base sm:text-lg mb-10">
          Direct caller connection via Telnyx SIP, real-time LiveKit audio processing, Deepgram Flux STT, GPT-4.1 menu RAG, ElevenLabs natural voices, and Square POS sync.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Restaurant Dashboard Card */}
          <Link
            href="/dashboard"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-2xl p-7 transition-all duration-200 shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                  <StoreIcon size={24} />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-1 rounded-md">
                  Venue Staff Portal
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                Restaurant Dashboard
                <ChevronRightIcon size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-white/60 mb-6">
                Operations console for Mama's Pizzeria. Real-time call monitor, 4-stage order pipeline, 30s live menu RAG toggle, analytics, and billing.
              </p>
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50">
              <span>7 Operational Tabs</span>
              <span className="text-purple-400 font-semibold group-hover:underline">Launch Dashboard &rarr;</span>
            </div>
          </Link>

          {/* Operator Admin Panel Card */}
          <Link
            href="/admin"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/50 rounded-2xl p-7 transition-all duration-200 shadow-xl hover:shadow-teal-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                  <ShieldIcon size={24} />
                </div>
                <span className="text-xs bg-teal-500/20 text-teal-300 font-semibold px-2.5 py-1 rounded-md">
                  Platform Operator
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-teal-300 transition-colors flex items-center gap-2">
                Operator Admin Panel
                <ChevronRightIcon size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-white/60 mb-6">
                Platform control center across 487 venues. Live call monitoring, unit economics ($0.062/min pipeline COGS), infrastructure health, and audit logs.
              </p>
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50">
              <span>9 Administrative Views</span>
              <span className="text-teal-400 font-semibold group-hover:underline">Open Admin Console &rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      <footer className="max-w-6xl w-full mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <div>TalkByte AI Pty Ltd · Sydney, Australia</div>
        <div className="flex items-center gap-6">
          <span>FastAPI Backend: localhost:8000</span>
          <span>Supabase Postgres + pgvector</span>
        </div>
      </footer>
    </main>
  );
}
```

---

### File 7: `frontend/src/types/database.types.ts`
**Path**: `frontend/src/types/database.types.ts`  
**Purpose**: Defines exact TypeScript interfaces matching Supabase Postgres tables (`restaurants`, `restaurant_users`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`, `plans`, `audit_logs`) and the generic `Database` interface required by `@supabase/supabase-js`.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Restaurant {
  id: string;
  name: string;
  phone_number: string | null;
  telnyx_number: string | null;
  plan_id: 'starter' | 'growth' | 'enterprise' | string;
  active: boolean;
  ai_instructions: string | null;
  timezone: string;
  health_score?: number;
  pos_provider?: 'square' | 'lightspeed' | 'kounta' | string;
  pos_status?: 'connected' | 'syncing' | 'error' | 'disconnected' | string;
  created_at: string;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'staff' | 'readonly' | string;
  created_at: string;
  email?: string;
  name?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  price?: number; // Helper property in AUD dollars
  category: string | null;
  available: boolean;
  embedding?: number[] | null;
  created_at: string;
}

export interface CallTranscriptEntry {
  role: 'ai' | 'customer' | 'system';
  text: string;
  time?: string;
}

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
  | 'PAYMENT_EXPIRED'
  | string;

export interface Call {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  caller_number: string;
  caller_phone?: string;
  state: CallState;
  started_at: string;
  ended_at: string | null;
  duration_seconds?: number;
  transcript: CallTranscriptEntry[] | Json;
  stt_confidence: number | null;
  livekit_room: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | string;
  order_items_preview?: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price_cents: number;
  modifiers?: string[];
}

export type OrderState =
  | 'PLACED'
  | 'LINK_SENT'
  | 'PAID'
  | 'SYNCED'
  | 'CONFIRMED'
  | 'FAILED'
  | string;

export interface Order {
  id: string;
  call_id: string | null;
  restaurant_id: string;
  items: OrderItem[] | Json;
  total_cents: number;
  total_amount?: number; // Helper in dollars
  state: OrderState;
  pos_order_id: string | null;
  customer_phone?: string;
  customer_name?: string;
  created_at: string;
}

export interface PaymentEvent {
  id: string;
  order_id: string;
  stripe_payment_link: string | null;
  stripe_session_id: string | null;
  sent_at: string | null;
  paid_at: string | null;
  expires_at: string | null;
  status?: 'pending' | 'completed' | 'expired' | 'failed' | string;
  amount_cents?: number;
}

export interface Plan {
  id: 'starter' | 'growth' | 'enterprise' | string;
  name: string;
  monthly_cents: number;
  monthly_price?: number;
  call_limit: number;
  call_minutes_included?: number;
  features?: string[];
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  plan_id: string;
  plan_name?: string;
  stripe_subscription_id: string | null;
  status: 'active' | 'past_due' | 'cancelled' | string;
  current_period_end: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event_type: 'ORDER' | 'ESCALATION' | 'BILLING' | 'SYSTEM' | 'POS' | 'AUTH' | string;
  actor: string;
  resource: string;
  details: string;
  ip_address: string;
  status: 'success' | 'warning' | 'error' | 'info' | string;
}

export interface PlatformStats {
  activeCallsCount: number;
  totalVenues: number;
  todayCallsCount: number;
  todayOrdersCount: number;
  todayRevenueCents: number;
  mrrCents: number;
  grossMarginPercent: number;
  avgCallDurationSeconds: number;
  cogsPerMinuteAud: number;
  sttAccuracyPercent: number;
  uptimePercent: number;
}

export interface InfraService {
  name: string;
  category: 'voice' | 'ai' | 'infra' | 'payment' | 'pos';
  status: 'operational' | 'degraded' | 'outage';
  latencyMs: number;
  uptimePercent: number;
  errorRatePercent: number;
  metricLabel: string;
  metricValue: string;
}

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: Partial<Restaurant>;
        Update: Partial<Restaurant>;
      };
      restaurant_users: {
        Row: RestaurantUser;
        Insert: Partial<RestaurantUser>;
        Update: Partial<RestaurantUser>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem>;
        Update: Partial<MenuItem>;
      };
      calls: {
        Row: Call;
        Insert: Partial<Call>;
        Update: Partial<Call>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
      };
      payment_events: {
        Row: PaymentEvent;
        Insert: Partial<PaymentEvent>;
        Update: Partial<PaymentEvent>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
      };
      plans: {
        Row: Plan;
        Insert: Partial<Plan>;
        Update: Partial<Plan>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_menu: {
        Args: {
          p_restaurant_id: string;
          query_embedding: number[];
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
  };
}
```

---

### File 8: `frontend/src/lib/supabase.ts`
**Path**: `frontend/src/lib/supabase.ts`  
**Purpose**: Typed Supabase client with graceful offline fallback. Connects to real Supabase Postgres backend when available; otherwise serves mock data seamlessly without crashing builds or tests.

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database, Restaurant, MenuItem, Call, Order, AuditLog, PlatformStats, InfraService, Subscription, RestaurantUser } from '@/types/database.types';
import {
  MOCK_RESTAURANT,
  MOCK_FLEET_RESTAURANTS,
  MOCK_MENU_ITEMS,
  MOCK_LIVE_CALLS,
  MOCK_RECENT_ORDERS,
  MOCK_PLATFORM_STATS,
  MOCK_INFRA_SERVICES,
  MOCK_AUDIT_LOGS,
  MOCK_SUBSCRIPTIONS,
  MOCK_USERS,
} from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Checks if Supabase client can reach the live backend.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const { error } = await supabase.from('restaurants').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// In-memory store for local updates when offline
let localMenuItems = [...MOCK_MENU_ITEMS];

export async function getRestaurant(id?: string): Promise<Restaurant> {
  try {
    if (id) {
      const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
  } catch {
    // Fall back to mock
  }
  return MOCK_RESTAURANT;
}

export async function getFleetRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase.from('restaurants').select('*').order('name');
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_FLEET_RESTAURANTS;
}

export async function getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
  try {
    const query = supabase.from('menu_items').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await query.order('category');
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return localMenuItems;
}

export async function toggleMenuItemAvailability(itemId: string, available: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ available })
      .eq('id', itemId);
    if (!error) {
      localMenuItems = localMenuItems.map(item => item.id === itemId ? { ...item, available } : item);
      return true;
    }
  } catch {
    // Fall back to mock
  }
  localMenuItems = localMenuItems.map(item => item.id === itemId ? { ...item, available } : item);
  return true;
}

export async function getLiveCalls(restaurantId?: string): Promise<Call[]> {
  try {
    const query = supabase.from('calls').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await query.order('started_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_LIVE_CALLS;
}

export async function getRecentOrders(restaurantId?: string, limit: number = 20): Promise<Order[]> {
  try {
    const query = supabase.from('orders').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_RECENT_ORDERS;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  // Can aggregate from database if available, else return calibrated prototype stats
  return MOCK_PLATFORM_STATS;
}

export async function getInfraServices(): Promise<InfraService[]> {
  return MOCK_INFRA_SERVICES;
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(limit);
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_AUDIT_LOGS;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_SUBSCRIPTIONS;
}

export async function getUsers(): Promise<RestaurantUser[]> {
  try {
    const { data, error } = await supabase.from('restaurant_users').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch {
    // Fall back to mock
  }
  return MOCK_USERS;
}
```

---

### File 9: `frontend/src/lib/mockData.ts`
**Path**: `frontend/src/lib/mockData.ts`  
**Purpose**: Rich, realistic mock data matching the prototype HTML files (`talkbyte-restaurant-dashboard.html` and `talkbyte-admin-panel.html`). Covers restaurant venues, menu items, live calls, orders, platform stats, infrastructure telemetry, and audit logs.

```typescript
import type { Restaurant, MenuItem, Call, Order, PlatformStats, InfraService, AuditLog, Subscription, RestaurantUser } from '@/types/database.types';

export const MOCK_RESTAURANT: Restaurant = {
  id: 'rest-mamas-pizzeria-001',
  name: "Mama's Pizzeria",
  phone_number: '+61 2 8399 1234',
  telnyx_number: '+61 2 8123 4567',
  plan_id: 'growth',
  active: true,
  ai_instructions: 'Warm Italian greeting. Recommend Truffle Mushroom pizza and Tiramisu. Offer sparkling or still water for drinks.',
  timezone: 'Australia/Sydney',
  health_score: 98,
  pos_provider: 'Square POS',
  pos_status: 'connected',
  created_at: '2026-06-15T08:30:00Z',
};

export const MOCK_FLEET_RESTAURANTS: Restaurant[] = [
  MOCK_RESTAURANT,
  {
    id: 'rest-bondi-burger-002',
    name: 'Bondi Burger Co',
    phone_number: '+61 2 9130 5522',
    telnyx_number: '+61 2 8123 4568',
    plan_id: 'enterprise',
    active: true,
    ai_instructions: 'Casual beach vibe. Ask about combo meals.',
    timezone: 'Australia/Sydney',
    health_score: 95,
    pos_provider: 'Lightspeed',
    pos_status: 'connected',
    created_at: '2026-05-10T11:00:00Z',
  },
  {
    id: 'rest-little-italy-003',
    name: 'Little Italy Carlton',
    phone_number: '+61 3 9347 1199',
    telnyx_number: '+61 3 8123 4569',
    plan_id: 'growth',
    active: true,
    ai_instructions: 'Traditional Italian tone. Check daily specials.',
    timezone: 'Australia/Melbourne',
    health_score: 92,
    pos_provider: 'Square POS',
    pos_status: 'connected',
    created_at: '2026-06-01T09:15:00Z',
  },
  {
    id: 'rest-dragon-dumpling-004',
    name: 'Golden Dragon Dumplings',
    phone_number: '+61 7 3252 8844',
    telnyx_number: '+61 7 8123 4570',
    plan_id: 'starter',
    active: true,
    ai_instructions: 'Fast and efficient. Recommend soup dumplings.',
    timezone: 'Australia/Brisbane',
    health_score: 88,
    pos_provider: 'Kounta',
    pos_status: 'syncing',
    created_at: '2026-07-20T14:45:00Z',
  },
  {
    id: 'rest-byron-burrito-005',
    name: 'Byron Bay Burritos',
    phone_number: '+61 2 6685 4321',
    telnyx_number: '+61 2 8123 4571',
    plan_id: 'growth',
    active: true,
    ai_instructions: 'Friendly surfer vibe. Highlight vegan options.',
    timezone: 'Australia/Sydney',
    health_score: 79,
    pos_provider: 'Square POS',
    pos_status: 'error',
    created_at: '2026-08-05T16:20:00Z',
  },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-001',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Margherita Classica',
    description: 'San Marzano tomatoes, buffalo mozzarella, fresh basil, extra virgin olive oil',
    price_cents: 2200,
    price: 22.0,
    category: 'Pizza',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-002',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Diavola Piccante',
    description: 'Spicy calabrese salami, fior di latte, chilli flakes, hot honey drizzle',
    price_cents: 2600,
    price: 26.0,
    category: 'Pizza',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-003',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Truffle & Mushroom',
    description: 'Wild portobello mushrooms, black truffle cream, thyme, fior di latte',
    price_cents: 2800,
    price: 28.0,
    category: 'Pizza',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-004',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Quattro Formaggi',
    description: 'Gorgonzola dolce, aged parmesan, taleggio, buffalo mozzarella',
    price_cents: 2500,
    price: 25.0,
    category: 'Pizza',
    available: false,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-005',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Rigatoni Carbonara',
    description: 'Crispy guanciale, pecorino romano, fresh egg yolk, cracked black pepper',
    price_cents: 2400,
    price: 24.0,
    category: 'Pasta',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-006',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: "Penne all'Arrabbiata",
    description: 'Garlic, fiery red chillies, crushed Roma tomatoes, fresh parsley',
    price_cents: 2100,
    price: 21.0,
    category: 'Pasta',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-007',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Garlic Rosemary Focaccia',
    description: 'Woodfired flatbread, sea salt flakes, roasted garlic oil, fresh rosemary',
    price_cents: 1200,
    price: 12.0,
    category: 'Starters',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'item-008',
    restaurant_id: 'rest-mamas-pizzeria-001',
    name: 'Traditional Tiramisu',
    description: 'Savoiardi soaked in espresso, mascarpone mousse, cocoa powder',
    price_cents: 1400,
    price: 14.0,
    category: 'Desserts',
    available: true,
    created_at: '2026-06-15T09:00:00Z',
  },
];

export const MOCK_LIVE_CALLS: Call[] = [
  {
    id: 'call-live-001',
    restaurant_id: 'rest-mamas-pizzeria-001',
    restaurant_name: "Mama's Pizzeria",
    caller_number: '+61 412 893 210',
    caller_phone: '+61 412 893 210',
    state: 'TAKING_ORDER',
    started_at: new Date(Date.now() - 102000).toISOString(),
    ended_at: null,
    duration_seconds: 102,
    transcript: [
      { role: 'ai', text: "Buonasera! Welcome to Mama's Pizzeria. What can I get started for pickup tonight?", time: '00:02' },
      { role: 'customer', text: 'Hi! Can I order two Margherita pizzas and one garlic focaccia please?', time: '00:15' },
      { role: 'ai', text: "Wonderful! That's two Margheritas and one Garlic Rosemary Focaccia. Would you like to add any drinks or dessert?", time: '00:28' },
    ],
    stt_confidence: 0.98,
    livekit_room: 'room_mamas_8921',
    sentiment: 'positive',
    order_items_preview: '2x Margherita, 1x Garlic Focaccia',
  },
  {
    id: 'call-live-002',
    restaurant_id: 'rest-mamas-pizzeria-001',
    restaurant_name: "Mama's Pizzeria",
    caller_number: '+61 498 765 432',
    caller_phone: '+61 498 765 432',
    state: 'CONFIRMING',
    started_at: new Date(Date.now() - 54000).toISOString(),
    ended_at: null,
    duration_seconds: 54,
    transcript: [
      { role: 'ai', text: "I have 1x Rigatoni Carbonara and 1x Traditional Tiramisu. Total is $38.00. Ready for payment?", time: '00:42' },
      { role: 'customer', text: 'Yes, that sounds great.', time: '00:48' },
    ],
    stt_confidence: 0.96,
    livekit_room: 'room_mamas_8922',
    sentiment: 'positive',
    order_items_preview: '1x Carbonara, 1x Tiramisu',
  },
  {
    id: 'call-live-003',
    restaurant_id: 'rest-bondi-burger-002',
    restaurant_name: 'Bondi Burger Co',
    caller_number: '+61 423 111 222',
    caller_phone: '+61 423 111 222',
    state: 'TRANSFER_TO_HUMAN',
    started_at: new Date(Date.now() - 135000).toISOString(),
    ended_at: null,
    duration_seconds: 135,
    transcript: [
      { role: 'customer', text: 'Does your gluten-free bun contain sesame seeds? Severe allergy.', time: '00:30' },
      { role: 'ai', text: 'Because of your severe allergy, I am connecting you immediately with a duty manager. Please stay on the line.', time: '00:42' },
    ],
    stt_confidence: 0.94,
    livekit_room: 'room_bondi_8923',
    sentiment: 'neutral',
    order_items_preview: 'Allergy Inquiry Escalation',
  },
];

export const MOCK_RECENT_ORDERS: Order[] = [
  {
    id: 'ord-8921',
    call_id: 'call-hist-101',
    restaurant_id: 'rest-mamas-pizzeria-001',
    items: [
      { name: 'Margherita Classica', qty: 2, price_cents: 2200 },
      { name: 'Garlic Rosemary Focaccia', qty: 1, price_cents: 1200 },
    ],
    total_cents: 5600,
    total_amount: 56.0,
    state: 'LINK_SENT',
    pos_order_id: null,
    customer_phone: '+61 412 893 210',
    customer_name: 'Sarah M.',
    created_at: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: 'ord-8920',
    call_id: 'call-hist-100',
    restaurant_id: 'rest-mamas-pizzeria-001',
    items: [
      { name: 'Diavola Piccante', qty: 1, price_cents: 2600 },
      { name: 'Traditional Tiramisu', qty: 1, price_cents: 1400 },
    ],
    total_cents: 4000,
    total_amount: 40.0,
    state: 'PAID',
    pos_order_id: 'sq_ord_9011a',
    customer_phone: '+61 498 765 432',
    customer_name: 'David K.',
    created_at: new Date(Date.now() - 720000).toISOString(),
  },
  {
    id: 'ord-8919',
    call_id: 'call-hist-099',
    restaurant_id: 'rest-mamas-pizzeria-001',
    items: [
      { name: 'Truffle & Mushroom', qty: 2, price_cents: 2800 },
      { name: 'Rigatoni Carbonara', qty: 1, price_cents: 2400 },
    ],
    total_cents: 8000,
    total_amount: 80.0,
    state: 'SYNCED',
    pos_order_id: 'sq_ord_9010b',
    customer_phone: '+61 455 332 110',
    customer_name: 'Liam T.',
    created_at: new Date(Date.now() - 1140000).toISOString(),
  },
];

export const MOCK_PLATFORM_STATS: PlatformStats = {
  activeCallsCount: 23,
  totalVenues: 487,
  todayCallsCount: 3412,
  todayOrdersCount: 1894,
  todayRevenueCents: 6843000,
  mrrCents: 9480000,
  grossMarginPercent: 87.2,
  avgCallDurationSeconds: 98,
  cogsPerMinuteAud: 0.062,
  sttAccuracyPercent: 96.8,
  uptimePercent: 99.98,
};

export const MOCK_INFRA_SERVICES: InfraService[] = [
  {
    name: 'Telnyx SIP Inbound & Media',
    category: 'voice',
    status: 'operational',
    latencyMs: 34,
    uptimePercent: 99.99,
    errorRatePercent: 0.01,
    metricLabel: 'Audio Jitter',
    metricValue: '4.2ms',
  },
  {
    name: 'Deepgram Flux STT (AU English)',
    category: 'voice',
    status: 'operational',
    latencyMs: 62,
    uptimePercent: 99.98,
    errorRatePercent: 0.02,
    metricLabel: 'Time To First Token',
    metricValue: '58ms',
  },
  {
    name: 'OpenAI GPT-4.1 Reasoning & Tools',
    category: 'ai',
    status: 'operational',
    latencyMs: 240,
    uptimePercent: 99.95,
    errorRatePercent: 0.05,
    metricLabel: 'Inference Latency',
    metricValue: '215ms',
  },
  {
    name: 'ElevenLabs Streaming TTS',
    category: 'voice',
    status: 'operational',
    latencyMs: 180,
    uptimePercent: 99.97,
    errorRatePercent: 0.03,
    metricLabel: 'Audio Synthesis',
    metricValue: '172ms',
  },
  {
    name: 'LiveKit Cloud WebRTC Cluster',
    category: 'voice',
    status: 'operational',
    latencyMs: 28,
    uptimePercent: 100,
    errorRatePercent: 0.0,
    metricLabel: 'Packet Loss',
    metricValue: '0.04%',
  },
  {
    name: 'Stripe SMS Payment Links',
    category: 'payment',
    status: 'operational',
    latencyMs: 85,
    uptimePercent: 100,
    errorRatePercent: 0.0,
    metricLabel: 'Webhook Dispatch',
    metricValue: '92ms',
  },
  {
    name: 'Supabase Postgres + pgvector',
    category: 'infra',
    status: 'operational',
    latencyMs: 18,
    uptimePercent: 99.99,
    errorRatePercent: 0.0,
    metricLabel: 'RAG Cosine Query',
    metricValue: '12ms',
  },
  {
    name: 'Upstash Redis Session Store',
    category: 'infra',
    status: 'operational',
    latencyMs: 4,
    uptimePercent: 100,
    errorRatePercent: 0.0,
    metricLabel: 'Session Read',
    metricValue: '3.8ms',
  },
  {
    name: 'Square POS Webhook Dispatcher',
    category: 'pos',
    status: 'operational',
    latencyMs: 142,
    uptimePercent: 99.91,
    errorRatePercent: 0.09,
    metricLabel: 'Push Sync Time',
    metricValue: '138ms',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-09-03T11:58:22Z',
    event_type: 'ORDER',
    actor: 'AI_AGENT_MAMAS',
    resource: 'Order #TB-8921',
    details: 'Order confirmed with 2 items ($56.00 AUD). Payment link SMS dispatched via Telnyx.',
    ip_address: '13.239.12.84',
    status: 'success',
  },
  {
    id: 'log-102',
    timestamp: '2026-09-03T11:56:10Z',
    event_type: 'ESCALATION',
    actor: 'AI_AGENT_BONDI',
    resource: 'Call #call-live-003',
    details: 'Escalation triggered: caller mentioned severe allergy keyword. Live call transferred to venue manager phone.',
    ip_address: '13.239.12.85',
    status: 'warning',
  },
  {
    id: 'log-103',
    timestamp: '2026-09-03T11:45:00Z',
    event_type: 'POS',
    actor: 'CELERY_SYNC_WORKER',
    resource: 'Order #TB-8919',
    details: 'Square POS push succeeded. Order #sq_ord_9010b printed in kitchen.',
    ip_address: '10.0.4.12',
    status: 'success',
  },
  {
    id: 'log-104',
    timestamp: '2026-09-03T11:30:15Z',
    event_type: 'BILLING',
    actor: 'STRIPE_WEBHOOK',
    resource: 'Subscription #sub_mamas_01',
    details: 'Monthly Growth plan renewed ($249.00 AUD). Invoice paid successfully.',
    ip_address: '54.187.205.235',
    status: 'success',
  },
  {
    id: 'log-105',
    timestamp: '2026-09-03T11:15:40Z',
    event_type: 'SYSTEM',
    actor: 'HEALTH_CHECK_CRON',
    resource: 'Telnyx SIP Trunk',
    details: 'Synthetic SIP ping response 34ms. All 12 trunks healthy.',
    ip_address: '127.0.0.1',
    status: 'info',
  },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-001',
    restaurant_id: 'rest-mamas-pizzeria-001',
    restaurant_name: "Mama's Pizzeria",
    plan_id: 'growth',
    plan_name: 'Growth ($249/mo)',
    stripe_subscription_id: 'sub_live_mamas991',
    status: 'active',
    current_period_end: '2026-09-30T00:00:00Z',
    created_at: '2026-06-15T08:30:00Z',
  },
  {
    id: 'sub-002',
    restaurant_id: 'rest-bondi-burger-002',
    restaurant_name: 'Bondi Burger Co',
    plan_id: 'enterprise',
    plan_name: 'Enterprise ($499/mo)',
    stripe_subscription_id: 'sub_live_bondi882',
    status: 'active',
    current_period_end: '2026-09-30T00:00:00Z',
    created_at: '2026-05-10T11:00:00Z',
  },
];

export const MOCK_USERS: RestaurantUser[] = [
  {
    id: 'usr-001',
    restaurant_id: 'rest-mamas-pizzeria-001',
    user_id: 'auth-user-001',
    name: 'Marco Rossi',
    email: 'marco@mamaspizzeria.com.au',
    role: 'owner',
    created_at: '2026-06-15T08:30:00Z',
  },
  {
    id: 'usr-002',
    restaurant_id: 'rest-mamas-pizzeria-001',
    user_id: 'auth-user-002',
    name: 'Lucia Rossi',
    email: 'lucia@mamaspizzeria.com.au',
    role: 'staff',
    created_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 'usr-003',
    restaurant_id: 'rest-bondi-burger-002',
    user_id: 'auth-user-003',
    name: 'Jack Miller',
    email: 'jack@bondiburger.com.au',
    role: 'owner',
    created_at: '2026-05-10T11:00:00Z',
  },
];
```

---

### File 10: `frontend/src/components/icons.tsx`
**Path**: `frontend/src/components/icons.tsx`  
**Purpose**: Self-contained, typed React SVG icon library eliminating any need for external packages (`lucide-react`, `@heroicons/react`). All icons accept standard SVG attributes plus `size?: number`.

```tsx
import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const defaultProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const PhoneIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const DashboardIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const ShoppingCartIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

export const UtensilsIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
    <path d="M15 2v18" />
    <path d="M4 2v6a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V2" />
    <path d="M8 11v9" />
  </svg>
);

export const BarChartIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <line x1="12" x2="12" y1="20" y2="10" />
    <line x1="18" x2="18" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="16" />
  </svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const StoreIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const ServerIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
  </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const DollarIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const HeadsetIcon: React.FC<IconProps> = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} {...defaultProps} className={className} {...props}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);
```

---

## 4. Downstream Module Interfaces (M2 & M3)

### For Milestone M2 (Restaurant Dashboard):
- `src/app/(restaurant)/dashboard/page.tsx` will import:
  - `getRestaurant`, `getMenuItems`, `toggleMenuItemAvailability`, `getLiveCalls`, `getRecentOrders` from `@/lib/supabase`
  - Icons (`BoltIcon`, `PhoneIcon`, `ShoppingCartIcon`, `UtensilsIcon`, `BarChartIcon`, `CreditCardIcon`, `SettingsIcon`) from `@/components/icons`
  - Types (`MenuItem`, `Call`, `Order`, `Restaurant`) from `@/types/database.types`
- Interactive states:
  - Menu toggle triggers `toggleMenuItemAvailability(itemId, nextState)` with instant optimistic UI update.
  - Active call ticker updates live duration.

### For Milestone M3 (Operator Admin Panel):
- `src/app/(admin)/admin/page.tsx` will import:
  - `getPlatformStats`, `getFleetRestaurants`, `getLiveCalls`, `getInfraServices`, `getAuditLogs`, `getSubscriptions`, `getUsers` from `@/lib/supabase`
  - Icons (`DashboardIcon`, `ActivityIcon`, `StoreIcon`, `UsersIcon`, `DollarIcon`, `CreditCardIcon`, `ServerIcon`, `ShieldIcon`, `BarChartIcon`) from `@/components/icons`
  - Types (`PlatformStats`, `InfraService`, `AuditLog`, `Subscription`, `RestaurantUser`) from `@/types/database.types`

---

## 5. Verification & Test Strategy

To verify Milestone M1 completion without manual interaction:
1. **TypeScript Typecheck**:
   Ensure `src/types/database.types.ts`, `src/lib/supabase.ts`, `src/lib/mockData.ts`, `src/components/icons.tsx`, `src/app/layout.tsx`, and `src/app/page.tsx` compile cleanly.
2. **Path Alias Resolution**:
   Validate that `@/*` resolves to `./src/*` across both Next.js and Jest.
3. **Offline Fallback Resilience**:
   Ensure calling `getRestaurant()`, `getMenuItems()`, and `toggleMenuItemAvailability()` does not throw exceptions when Supabase backend is unreachable.
4. **Jest Suite Execution**:
   Run `npm test` in `frontend/` to confirm all current unit tests continue to pass.
