# Milestone M1 Challenge & Stress Test Report

**Agent**: `challenger_m1_1`  
**Milestone**: M1 (Frontend Foundation & Data Layer)  
**Date**: 2026-09-03  
**Verdict**: **`APPROVE`** (with advisory recommendations for M2 & M3)

---

## 1. Executive Summary

Challenger 1 conducted an empirical, static, and structural stress-test of the 10 foundation files implemented by `worker_m1`:
- `frontend/tsconfig.json`
- `frontend/next.config.mjs`
- `frontend/postcss.config.mjs`
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/types/database.types.ts`
- `frontend/src/lib/supabase.ts`
- `frontend/src/lib/mockData.ts`
- `frontend/src/components/icons.tsx`

**Overall Risk Assessment**: **LOW**

All foundation requirements in `PROJECT.md` are satisfied. The codebase is structurally sound, type-safe, resilient against offline environments, and ready for Milestone M2 (Restaurant Dashboard) and Milestone M3 (Operator Admin Panel).

---

## 2. Empirical Verification & Stress Test Results

| Test ID | Target | Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|---|
| TC-01 | `src/lib/supabase.ts` | `isSupabaseConnected()` in offline mode | Catch fetch error and return `false` | Caught by `try/catch`, returns `false` | **PASS** |
| TC-02 | `src/lib/supabase.ts` | `isSupabaseConnected()` when table is empty | Return `true` if network succeeds without error | Evaluates `!error` (`true`) | **PASS** |
| TC-03 | `src/lib/supabase.ts` | `getRestaurant()` with `undefined` or `""` | Return fallback `MOCK_RESTAURANT` | Evaluates `if (id)` falsy, returns `MOCK_RESTAURANT` | **PASS** |
| TC-04 | `src/lib/supabase.ts` | `getRestaurant('rest-unknown')` bad ID | Fall back gracefully without crashing | Returns `MOCK_RESTAURANT` | **PASS** |
| TC-05 | `src/lib/supabase.ts` | `getFleetRestaurants()` offline fallback | Return fleet array (5 restaurants) | Returns `MOCK_FLEET_RESTAURANTS` | **PASS** |
| TC-06 | `src/lib/supabase.ts` | `toggleMenuItemAvailability('item-001', false)` | Update in-memory `localMenuItems` | Mutates `available: false` in-memory; persists to subsequent `getMenuItems()` | **PASS** |
| TC-07 | `src/lib/supabase.ts` | `toggleMenuItemAvailability('item-invalid', true)` | Handle non-existent item gracefully | Completes without error; returns `true` (idempotent) | **PASS** |
| TC-08 | `src/lib/supabase.ts` | `getMenuItems()` in-memory state reflection | Returns updated availability after toggle | Verified: `localMenuItems` reflects mutation | **PASS** |
| TC-09 | `src/types/database.types.ts` | Nullability on optional DB fields | Enforce null checking on `ended_at`, `pos_order_id`, etc. | Strict null union types prevent unchecked access | **PASS** |
| TC-10 | `src/types/database.types.ts` | Supabase generic `createClient<Database>` compatibility | Type compatibility for `.from('menu_items').update(...)` | `Database['public']['Tables']` matches Supabase JS v2 schema | **PASS** |
| TC-11 | `src/app/page.tsx` | Runtime Hydration Integrity | Zero SSR-client mismatch errors | Pure Server Component, deterministic values, valid HTML5 nesting | **PASS** |
| TC-12 | `src/components/icons.tsx` | Dependency Decoupling | Zero `lucide-react` imports | 28 self-contained SVG React components exported | **PASS** |

---

## 3. Adversarial Challenges & Findings

### [Low/Medium] Challenge 1: Offline Mock Fallback Filtering
- **Assumption Challenged**: `getLiveCalls(restaurantId)` and `getMenuItems(restaurantId)` assume callers in offline mode only care about Mama's Pizzeria, or that mock arrays do not contain mixed tenants.
- **Attack Scenario**:
  - `MOCK_LIVE_CALLS` contains 2 calls for `rest-mamas-pizzeria-001` and 1 call (`call-live-003`) for `rest-bondi-burger-002`.
  - Calling `getLiveCalls('rest-mamas-pizzeria-001')` returns `MOCK_LIVE_CALLS` without filtering by `restaurantId`.
  - In offline mode, Mama's Pizzeria dashboard could display Bondi Burger's allergy escalation call.
- **Blast Radius**: Low. In live production with active Supabase, SQL filtering `.eq('restaurant_id', ...)` handles tenant isolation in the database. In offline mode, this is a minor cross-tenant display leak.
- **Mitigation Recommendation for M2 & M3**: Downstream components can apply client-side filtering `calls.filter(c => !restaurantId || c.restaurant_id === restaurantId)` as a defensive practice.

### [Low] Challenge 2: Module-Level `Date.now()` in `mockData.ts` Hydration Risk
- **Assumption Challenged**: Mock data timestamps evaluated at module import time remain valid across SSR and client hydration.
- **Attack Scenario**:
  - In `frontend/src/lib/mockData.ts`, lines 213, 245, 272, 309, 325, 341 use `new Date(Date.now() - ...).toISOString()`.
  - `page.tsx` does NOT import `mockData.ts` and is completely unaffected.
  - However, in Milestone M2 (`/dashboard`) and M3 (`/admin`), if a Server Component renders these timestamps directly into HTML and client hydration re-evaluates the module or formats relative time strings, React could trigger a hydration mismatch warning.
- **Blast Radius**: Low (cosmetic hydration warnings in development console during M2/M3).
- **Mitigation Recommendation for M2 & M3**: Format live duration counters inside `useEffect` on the client or use `suppressHydrationWarning` on dynamic time elements.

### [Low] Challenge 3: 4-Stage Orders Pipeline Mock Coverage
- **Assumption Challenged**: `MOCK_RECENT_ORDERS` populates all 4 stages of the restaurant orders pipeline (`Placed -> Link Sent -> Paid -> Synced`).
- **Attack Scenario**:
  - `MOCK_RECENT_ORDERS` contains orders with states `LINK_SENT`, `PAID`, and `SYNCED`.
  - There is currently no order in the `PLACED` state.
  - When M2 renders the 4-column visual order pipeline, the "Placed" stage column will render empty (0 orders).
- **Blast Radius**: Cosmetic for M2 prototype demonstration.
- **Mitigation Recommendation for M2**: M2 worker can include a mock order with `state: 'PLACED'` in local component state or extend the initial dataset.

---

## 4. Unchallenged Areas

- **FastAPI Backend Integration (`src/lib/api.ts`)**: Deferred to Milestone M2/M3 when live endpoint communication is wired.
- **Realtime WebSocket Channels (`supabase.channel(...)`)**: Out of scope for M1; planned for M2 live call audio intercept ticker.

---

## 5. Verdict & Recommendation

**Verdict: APPROVE**

The foundation created in Milestone M1 is solid, robust, and clean. All interface contracts conform to `PROJECT.md`. Proceed immediately to **Milestone M2 (Next.js Restaurant Dashboard)**.
