# Milestone M1 Handoff Report: Supabase Schema & Mock Data Architecture

**From**: `explorer_m1_2` (Teamwork Explorer, Milestone M1)  
**To**: Milestone M1 Lead / Implementer  
**Target Directory**: `.agents/explorer_m1_2/`  
**Status**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

Direct observations from codebase inspection:

1. **Backend Database Schema (`backend/supabase_schema.sql`)**:
   - Lines 10–15: Table `plans` with columns `(id text PK, name text, monthly_cents int, call_limit int)`.
   - Lines 24–34: Table `restaurants` with columns `(id uuid PK default gen_random_uuid(), name text, phone_number text, telnyx_number text unique, plan_id text references plans(id), active boolean default false, ai_instructions text, timezone text default 'Australia/Sydney', created_at timestamptz default now())`.
   - Lines 38–45: Table `restaurant_users` with columns `(id uuid PK, restaurant_id uuid, user_id uuid, role text default 'owner', created_at timestamptz)`.
   - Lines 49–59: Table `menu_items` with columns `(id uuid PK, restaurant_id uuid, name text, description text, price_cents int, category text, available boolean default true, embedding vector(1536), created_at timestamptz)`.
   - Lines 67–77: Table `calls` with columns `(id uuid PK, restaurant_id uuid, caller_number text, state text default 'GREETING', started_at timestamptz, ended_at timestamptz, transcript jsonb default '[]', stt_confidence float, livekit_room text)`.
   - Lines 81–90: Table `orders` with columns `(id uuid PK, call_id uuid, restaurant_id uuid, items jsonb default '[]', total_cents int, state text default 'CONFIRMED', pos_order_id text, created_at timestamptz)`.
   - Lines 94–102: Table `payment_events` with columns `(id uuid PK, order_id uuid, stripe_payment_link text, stripe_session_id text, sent_at timestamptz, paid_at timestamptz, expires_at timestamptz)`.
   - Lines 106–114: Table `subscriptions` with columns `(id uuid PK, restaurant_id uuid, plan_id text, stripe_subscription_id text unique, status text default 'active', current_period_end timestamptz, created_at timestamptz)`.
   - Lines 138–160: RPC function `search_menu(p_restaurant_id uuid, query_embedding vector(1536), match_count int)`.

2. **Backend Call and Order Models (`backend/app/models/call.py`, `backend/app/models/order.py`)**:
   - `CallState` enum (`call.py:11–24`): `'GREETING'`, `'TAKING_ORDER'`, `'CONFIRMING'`, `'CONFIRMED'`, `'PAYMENT_SENT'`, `'COMPLETE'`, `'TRANSFER_TO_HUMAN'`, `'CALL_DROPPED'`, `'POS_FAILED'`, `'PAYMENT_EXPIRED'`.
   - `OrderState` enum (`order.py:20–25`): `'CONFIRMED'`, `'POS_PUSHED'`, `'POS_FAILED'`, `'CANCELLED'`.
   - `OrderItem` model (`order.py:27–33`): `{ name: str, qty: int, price_cents: int }`.

3. **Frontend Project Layout & Environment (`frontend/`)**:
   - `frontend/package.json:18`: `@supabase/supabase-js: "^2.47.0"`.
   - `frontend/.env.example:6–8`: `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test`.
   - No active `.env.local` exists in the repository.
   - `frontend/src/lib/api.ts` exists, but `frontend/src/types/database.types.ts`, `frontend/src/lib/supabase.ts`, and `frontend/src/lib/mockData.ts` are not yet created.

4. **Prototypes Specifications (`talkbyte-restaurant-dashboard.html`, `talkbyte-admin-panel.html`)**:
   - `talkbyte-restaurant-dashboard.html`: 7 operational tabs (`Dashboard`, `Live Calls`, `Orders`, `Menu Management`, `Analytics`, `Billing & Plan`, `Settings`). Key interactions: live active call cards with duration ticker and intercept button, orders pipeline timeline (Placed -> Link Sent -> Paid -> Synced), 24 menu items with 30s AI availability toggle, billing usage bars.
   - `talkbyte-admin-panel.html`: 9 operational pages (`Overview`, `Live Monitor`, `Restaurants`, `Users`, `Revenue`, `Billing`, `Infrastructure`, `Audit Log`, `Analytics`). Key entities: 487-restaurant fleet table with health scores and Square/Lightspeed status, 9 infrastructure telemetry cards (Deepgram latency alert 94ms, Telnyx, GPT-4.1, etc.), security audit log table.

---

## 2. Logic Chain

1. **Premise**: Next.js 16 App Router executes module-level imports and route evaluation during `npm run build`.
2. **Observation**: In CI and standard git checkouts, no live Supabase server runs on `http://localhost:54321`, and production keys are absent.
3. **Inference 1**: Direct client initialization or unhandled Supabase fetches (`supabase.from(...).select(...)`) will reject with network connection errors or authentication failures during build time and unit tests (`npm test`).
4. **Inference 2**: The client module (`src/lib/supabase.ts`) must implement a **dual-tier fallback mechanism**:
   - Check if environment variables are valid (`isSupabaseConfigured`).
   - If not configured, immediately resolve queries with rich mock data from `src/lib/mockData.ts`.
   - If configured, wrap all Supabase queries in `try...catch`; on network timeout or connection rejection, log a non-fatal warning and fall back to `mockData.ts`.
5. **Inference 3**: In offline / mock mode, user interactions like toggling menu availability (`toggleMenuItemAvailability`) must update an in-memory mutable store so the UI state persists during tab navigation.
6. **Inference 4**: Database types in `src/types/database.types.ts` must provide full schema parity with Postgres (`backend/supabase_schema.sql`) while seamlessly supporting the UI properties demanded by both HTML prototypes (e.g. `health_score`, `pos_provider`, `duration_formatted`, `sentiment`, `audit_logs`).

---

## 3. Caveats

1. **Database Migrations / Extensions**: The backend schema in `backend/supabase_schema.sql` does not include an explicit `create table audit_logs` statement (it is designated for later backend sprints). The frontend types and mock data must include `audit_logs` now to support Feature 21 and the Admin Audit view.
2. **Monetary Units**: The backend exclusively uses integer cents (`total_cents`, `price_cents`), while the HTML prototypes format amounts as dollar strings (`$38.50`, `$125.4K`). Helper properties (`price`, `total_amount`) are included in the TypeScript interfaces to bridge this gap cleanly.
3. **pgvector Embeddings**: The vector embedding column (`vector(1536)`) in `menu_items` is omitted from normal frontend queries and UI interfaces as floats are unnecessary and expensive in frontend state.

---

## 4. Conclusion

The data layer architecture is fully specified and ready for immediate implementation by the Milestone M1 builder:

1. **`frontend/src/types/database.types.ts`**: Complete `@supabase/supabase-js` v2 `Database` interface covering all 8 Postgres tables + `audit_logs` + RPC functions + convenience domain model interfaces (`Restaurant`, `MenuItem`, `Call`, `Order`, `AuditLog`, `PlatformKPIs`, `InfraServiceTelemetry`).
2. **`frontend/src/lib/mockData.ts`**: Self-contained in-memory mock dataset containing 6 detailed fleet restaurants, 24 menu items across 4 categories, active live calls with timers, 4-stage orders pipeline, 9 infrastructure telemetry cards, and audit log entries matching both prototypes.
3. **`frontend/src/lib/supabase.ts`**: Robust client factory that exports the typed `supabase` client and resilient data provider functions (`getRestaurant`, `getMenuItems`, `toggleMenuItemAvailability`, `getRecentOrders`, `getLiveCalls`, `getFleetRestaurants`, `getPlatformStats`, `getAuditLogs`, `getInfraTelemetry`) with zero network crash vulnerability.

All detailed type definitions and code implementations are documented in `.agents/explorer_m1_2/report.md`.

---

## 5. Verification Method

To independently verify the recommendations and future implementation:

1. **Module Creation Check**:
   Confirm that the following three files exist in `frontend/`:
   - `frontend/src/types/database.types.ts`
   - `frontend/src/lib/mockData.ts`
   - `frontend/src/lib/supabase.ts`
2. **Offline Build Verification**:
   Execute from repository root:
   ```bash
   cd frontend
   npm run build
   ```
   **Expected**: Exits with code `0` even when no `.env.local` exists and Supabase is completely offline.
3. **Jest Unit Testing**:
   Execute:
   ```bash
   cd frontend
   npm test
   ```
   **Expected**: All test suites pass without network errors or unhandled promise rejections.
4. **Mock Mutation Verification**:
   Import `toggleMenuItemAvailability` from `src/lib/supabase.ts` in a test or component, toggle an item, and call `getMenuItems()`.
   **Expected**: The returned item's `available` field toggles correctly in-memory without error.
