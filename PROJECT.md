# Project: TalkByte AI Frontend & Backend Integration

## Architecture
TalkByte AI platform frontend built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts, and Supabase client (@supabase/supabase-js). The application connects to a Supabase Postgres backend (8 core tables + pgvector search) and the FastAPI backend service (`http://localhost:8000`).

### High-Level Data Flow:
1. **Frontend App Router**:
   - `src/app/layout.tsx`: Root HTML layout with global CSS, font declarations, and Toast/Notification providers.
   - `src/app/page.tsx`: Navigation portal / landing page directing to Restaurant Dashboard or Admin Panel.
   - `src/app/(restaurant)/dashboard/...`: Restaurant management application with 7 operational tabs, real-time call feed, orders pipeline, menu catalog availability toggle, and analytics.
   - `src/app/(admin)/admin/...`: Operator admin application with 9 views, live call monitoring, fleet directory, revenue/COGS metrics, infrastructure health, and audit logs.
2. **Data Layer**:
   - `src/types/database.types.ts`: TypeScript definitions matching Supabase schema (`restaurants`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`, `plans`, `audit_logs`).
   - `src/lib/supabase.ts`: Typed Supabase client with resilient mock fallback for offline builds and seamless production connectivity.
   - `src/lib/api.ts`: Helper client for FastAPI backend communication.
3. **Icons & UI Components**:
   - Custom self-contained SVG icon system (`src/components/icons.tsx`) to eliminate external icon library dependencies and prevent missing package errors (`lucide-react`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Next.js 16 Config & TS Setup | `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs` setup | M1 | Codebase Survey |
| 2 | Root Layout & Global Styles | `src/app/layout.tsx` and `src/app/globals.css` with dark theme styling | M1 | Codebase Survey |
| 3 | Supabase Client & DB Types | `src/types/database.types.ts` and `src/lib/supabase.ts` with offline fallback | M1 | Codebase Survey |
| 4 | Root Navigation Portal | `src/app/page.tsx` landing screen linking to Dashboard and Admin | M1 | Codebase Survey |
| 5 | Restaurant Shell & Sidebar | Restaurant layout with sidebar navigation across all 7 tabs | M2 | talkbyte-restaurant-dashboard.html |
| 6 | Restaurant Dashboard Overview | Top KPI cards, today's call volume, recent orders, peak hours chart | M2 | talkbyte-restaurant-dashboard.html |
| 7 | Restaurant Live Calls Monitor | Real-time call cards, active duration tickers, audio intercept/monitor UI | M2 | talkbyte-restaurant-dashboard.html |
| 8 | Restaurant Orders Pipeline | Visual 4-stage order pipeline (Placed -> Link Sent -> Paid -> Synced) | M2 | talkbyte-restaurant-dashboard.html |
| 9 | Restaurant Menu Management | Menu item catalog, category filter, 30s live AI availability toggle | M2 | talkbyte-restaurant-dashboard.html |
| 10 | Restaurant Analytics | Hourly call bars, 7-day volume & revenue lines, peak hour heatmap | M2 | talkbyte-restaurant-dashboard.html |
| 11 | Restaurant Billing & Plan | Plan usage meters (Calls, AI Minutes, SMS), invoices, plan upgrade | M2 | talkbyte-restaurant-dashboard.html |
| 12 | Restaurant Settings | Voice persona selector, greeting script editor, POS integration status | M2 | talkbyte-restaurant-dashboard.html |
| 13 | Operator Admin Shell & Navigation | Admin layout with sidebar navigation across 9 operational views | M3 | talkbyte-admin-panel.html |
| 14 | Admin Platform Overview | 8 system KPIs, call volume and MRR charts, fleet leaderboard | M3 | talkbyte-admin-panel.html |
| 15 | Admin Live Fleet Monitor | Real-time call cards with live timer ticker, recent completed calls | M3 | talkbyte-admin-panel.html |
| 16 | Admin Restaurant Fleet Directory | 487-tenant directory, health score bars, POS status, search & filters | M3 | talkbyte-admin-panel.html |
| 17 | Admin User Management | RBAC user directory (Owner, Staff, Readonly) across all tenant venues | M3 | talkbyte-admin-panel.html |
| 18 | Admin Revenue & Unit Economics | MRR breakdown, tier distribution, $0.062/min itemized pipeline COGS | M3 | talkbyte-admin-panel.html |
| 19 | Admin Subscription Billing | Subscription lifecycle, billing health, payment failures, Stripe sync | M3 | talkbyte-admin-panel.html |
| 20 | Admin Infrastructure Telemetry | 9 service monitors (Telnyx, Deepgram, GPT-4.1, ElevenLabs, Stripe, etc.) | M3 | talkbyte-admin-panel.html |
| 21 | Admin Audit Log Ledger | Platform security audit trail (ORDER, ESCALATION, BILLING, SYSTEM, POS) | M3 | talkbyte-admin-panel.html |
| 22 | Admin Platform Analytics | 7-day performance, cuisine completion rate, abandonment analysis | M3 | talkbyte-admin-panel.html |
| 23 | E2E & Component Test Suite | Jest / React Testing Library suites verifying all routes and components | M4 | E2E Testing Track |
| 24 | Next.js Production Build | Clean `npm run build` in `frontend/` exiting with code 0 | M4 | ORIGINAL_REQUEST §Acceptance Criteria |
| 25 | Documentation Update | `CLAUDE.md` updated marking Sprint 3 & Sprint 4 as complete | M5 | ORIGINAL_REQUEST §R3 |
| 26 | Git Commit & Push | Clean working tree committed and pushed to `claude/talkbyte-project-integration-fad989` | M5 | ORIGINAL_REQUEST §R4 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Frontend Foundation & Data Layer | Config files (`tsconfig`, `next.config`, `postcss`), `globals.css`, root `layout.tsx`, `page.tsx`, `database.types.ts`, `src/lib/supabase.ts`, `icons.tsx` | None | DONE |
| M2 | Next.js Restaurant Dashboard (R1) | `src/app/(restaurant)` App Router routes, 7 tabs, interactive components, Supabase data fetching and availability mutation | M1 | DONE |
| M3 | Next.js Operator Admin Panel (R2) | `src/app/(admin)` App Router routes, 9 views, system metrics, infrastructure telemetry, fleet tables, audit logs | M1 | DONE |
| M4 | E2E Test Suite & Build Verification | Complete test suite, `npm test` passing, `npm run build` passing with exit code 0 | M2, M3 | DONE |
| M5 | Documentation & Version Control (R3, R4) | Update `CLAUDE.md` (Sprint 3 & 4 complete), commit all changes, push to origin | M4 | DONE |

---

## Interface Contracts

### `src/types/database.types.ts`
- Exports `Database` interface covering:
  - `restaurants`: `id`, `name`, `phone_number`, `timezone`, `status`, `health_score`, `pos_provider`, `pos_status`, `created_at`
  - `menu_items`: `id`, `restaurant_id`, `name`, `category`, `price`, `description`, `available`, `created_at`
  - `calls`: `id`, `restaurant_id`, `caller_phone`, `state`, `duration_seconds`, `started_at`, `ended_at`, `livekit_room`, `sentiment`
  - `orders`: `id`, `call_id`, `restaurant_id`, `state`, `items`, `total_amount`, `pos_order_id`, `created_at`
  - `payment_events`: `id`, `order_id`, `stripe_session_id`, `status`, `amount`, `created_at`
  - `subscriptions`: `id`, `restaurant_id`, `plan_id`, `status`, `current_period_end`
  - `plans`: `id`, `name`, `monthly_price`, `call_minutes_included`, `features`
  - `audit_logs`: `id`, `timestamp`, `event_type`, `actor`, `resource`, `details`, `ip_address`

### `src/lib/supabase.ts`
- Exports `supabase`: Typed Supabase client initialized via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Exports data provider hooks / service functions:
  - `getRestaurant(id: string)`: Returns restaurant details.
  - `getMenuItems(restaurantId: string)`: Returns menu items list.
  - `toggleMenuItemAvailability(itemId: string, available: boolean)`: Mutates availability.
  - `getRecentOrders(restaurantId: string)`: Returns recent orders.
  - `getLiveCalls(restaurantId?: string)`: Returns live active calls.
  - `getPlatformStats()`: Returns operator KPIs, revenue, and infrastructure metrics.
  - `getAuditLogs()`: Returns system audit logs.

### `src/components/icons.tsx`
- Self-contained React SVG icon components:
  - `PhoneIcon`, `DashboardIcon`, `OrderIcon`, `MenuIcon`, `AnalyticsIcon`, `BillingIcon`, `SettingsIcon`, `UsersIcon`, `ServerIcon`, `ShieldIcon`, `CheckIcon`, `AlertIcon`, `ChevronRightIcon`, `SearchIcon`, `FilterIcon`, `PlusIcon`, etc.

---

## Code Layout
```
frontend/
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── package.json
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (restaurant)/
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   └── (admin)/
│   │       ├── layout.tsx
│   │       └── admin/
│   │           └── page.tsx
│   ├── components/
│   │   ├── icons.tsx
│   │   ├── restaurant/
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── LiveCallsTab.tsx
│   │   │   ├── OrdersTab.tsx
│   │   │   ├── MenuTab.tsx
│   │   │   ├── AnalyticsTab.tsx
│   │   │   ├── BillingTab.tsx
│   │   │   └── SettingsTab.tsx
│   │   └── admin/
│   │       ├── OverviewView.tsx
│   │       ├── LiveMonitorView.tsx
│   │       ├── RestaurantsView.tsx
│   │       ├── UsersView.tsx
│   │       ├── RevenueView.tsx
│   │       ├── BillingView.tsx
│   │       ├── InfraView.tsx
│   │       ├── AuditView.tsx
│   │       └── AnalyticsView.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   └── mockData.ts
│   └── types/
│       └── database.types.ts
└── __tests__/
    ├── restaurant-dashboard.test.tsx
    ├── admin-panel.test.tsx
    └── supabase-integration.test.ts
```
