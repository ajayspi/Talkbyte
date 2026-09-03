# Handoff Report — Operator Admin Panel Specification Discovery

**Agent:** `spec_miner_admin_survey` (`teamwork_preview_spec_miner`)  
**Target:** `parent` (Orchestrator, ID: `2f1fa4e2-ff2c-4958-be1e-7fd459e382ce`)  
**Date:** 2026-09-03T06:45:00Z  
**Working Directory:** `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\spec_miner_admin_survey`  
**Primary Deliverable:** `report.md` (Admin Panel Feature & Data Specification)

---

### 1. Observation
- **Authoritative Prototype Source:** `talkbyte-admin-panel.html` (972 lines, 55,535 bytes) inspected at project root.
  - Sidebar lines 38–52, 188–217: 9 views grouped under Platform (`overview`, `live`), Management (`restaurants`, `users`), Finance (`revenue`, `billing`), and System (`infra`, `audit`, `analytics`).
  - Topbar lines 54–64, 220–227: Dynamic page title, pulsing live call counter (`.live-badge`), AEST timestamp, operator avatar (`AJ`).
  - Overview View lines 229–338: 8 KPI cards, 2 charts (`#callsChart`, `#mrrChart`), Top 5 restaurants leaderboard, and 4 at-risk venues with intervention buttons (`Contact`, `Debug`, `Invoice`, `Review AI`).
  - Live Monitor View lines 340–434: State/State filters, 5 live counters, 6 active call cards with live timer ticker, recent completed calls table (last 30m).
  - Restaurants View lines 436–550: Fleet directory (487 tenants), search box, plan filter, status filter, `+ Add Restaurant` button, 11 table columns including health bars (`fill-green`, `fill-yellow`, `fill-red`), POS status (`Square ✓`, `Lightspeed ✓`, `Email only`, `Square ✗ errors`), and action buttons (`View`, `Debug`).
  - Revenue View lines 552–615: Financial KPIs, Plan distribution (Enterprise, Pro, Starter), itemized per-minute unit economics ($0.062/min total cost, 31% margin), dual-axis trend chart (`#revenueChart`).
  - Infrastructure View lines 617–724: 9 service cards (Telnyx, Deepgram, GPT-4.1, ElevenLabs, Stripe, Supabase, Redis, Square, LiveKit) with status badges and metrics; red alert banner for Deepgram latency spike.
  - Audit Log View lines 726–799: Multi-type event table (`ORDER`, `ESCALATION`, `BILLING`, `RESTAURANT`, `SYSTEM`, `POS`, `AUTH`, `ONBOARD`) with actor, resource, detail, and IP.
  - Analytics View lines 801–847: 7-day KPIs, daily orders vs calls chart (`#analyticsChart`), cuisine completion chart (`#cuisineChart`), top abandonment reasons table, and payment conversion funnel table.
  - Placeholder Views lines 849–852: `users` (1,243 users across 487 restaurants, RBAC: Owner, Staff, Readonly) and `billing` (487 active Stripe subscriptions).
  - JavaScript Runtime lines 856–969: Page router function `showPage(id)`, 5 Chart.js instances, and interval ticking every 1,000ms incrementing `.live-timer` values.
- **Backend Schema & API State:**
  - `backend/supabase_schema.sql` (161 lines): Contains definitions for `plans`, `restaurants`, `restaurant_users`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`, and menu search RAG function. Lacks explicit `audit_logs` table, `pos_provider` column, and call outcome/duration fields.
  - `backend/app/api/admin.py` (25 lines): Contains stubbed endpoints `GET /api/admin/stats`, `GET /api/admin/restaurants`, and `GET /api/admin/calls/live`.
  - `frontend/package.json` (44 lines): Configured with Next.js 16 (`next: ^16.0.0`), React 19, `@supabase/supabase-js: ^2.47.0`, `@tanstack/react-query: ^5.62.0`, `zustand: ^5.0.2`, `recharts: ^2.13.3`, `date-fns: ^4.1.0`, and Tailwind CSS v4 (`tailwindcss: ^4.0.0`).
  - `frontend/src/app/(admin)`: Currently empty directory ready for implementation.

---

### 2. Logic Chain
1. *From Prototype Structure to Next.js Architecture:*  
   The prototype uses a static single-page tab switcher (`showPage(id)`) hiding and showing `.page` divs. In Next.js 16 App Router, this should be organized under `frontend/src/app/(admin)/` using a shared `layout.tsx` (holding sidebar, operational footer, topbar) with sub-routes:
   - `overview/page.tsx`
   - `live/page.tsx`
   - `restaurants/page.tsx`
   - `restaurants/[id]/page.tsx`
   - `users/page.tsx`
   - `revenue/page.tsx`
   - `billing/page.tsx`
   - `infra/page.tsx`
   - `audit/page.tsx`
   - `analytics/page.tsx`
2. *From Prototype Data Requirements to Supabase Schema Mapping:*  
   The prototype displays operational fields not currently stored in `backend/supabase_schema.sql`:
   - `restaurants`: Suburb, state, POS integration status (`Square ✓`, `Lightspeed ✓`, `Email only`, `errors`), health score (0–100), and churn risk tag.
   - `calls`: Call duration in seconds, outcome (`ordered`, `abandoned`, `escalated`), abandonment reason, and live cart items.
   - `payment_events`: Link open timestamp (`opened_at`) to compute conversion funnel (Calls → Confirmed → Sent → Opened → Paid → Synced).
   - New table required: `audit_logs` storing platform events with timestamp, event type, actor, resource, detail, and IP address.
3. *From Real-Time Prototype Features to Tech Stack:*  
   The live call monitor requires continuous updates (the prototype notes "Updated every 3s" and uses a 1s timer ticker). This maps cleanly to Supabase Realtime subscriptions on the `calls` table and Redis session state queries via Upstash / FastAPI. Recharts (`recharts: ^2.13.3` in `package.json`) will replace Chart.js for all 5 charts.

---

### 3. Caveats
- **Placeholder Pages in Prototype:** `users` and `billing` were brief placeholders in `talkbyte-admin-panel.html:850-851`. Comprehensive tables, filter bars, and modal actions were inferred and fully specified based on Supabase Auth, `restaurant_users`, `plans`, and Stripe subscription mechanics.
- **Revenue Metric Dual Meaning:** The overview displays MRR as $125.4K, while the plan distribution in the Revenue view aggregates Enterprise ($150.5K) + Pro ($276K) + Starter ($130K) = $556.5K. The implementation should clarify that $556.5K represents total platform GMV or annualized tier run-rate, while $125.4K is net SaaS subscription ARR/12.
- **No Direct Mutation Code in Spec:** In accordance with the role, no frontend or backend production code was modified during this survey.

---

### 4. Conclusion
The administrative surface area of TalkByte AI is fully mapped and documented in `report.md`. The design represents 33 discovered features across 9 functional views, 4 core modal/drawer workflows, 8 data tables, 5 analytical charts, 9 infrastructure telemetry monitors, and 7 Supabase data models. The frontend team can proceed directly to scaffolding `(admin)` routes in Next.js 16 with TanStack Query and Supabase clients using the specifications in `report.md`.

---

### 5. Verification Method
1. **Report Completeness Inspection:**
   - Inspect `.agents/spec_miner_admin_survey/report.md` to confirm all 6 prompt-mandated sections and 2 system-prompt tables (`## Features Discovered`, `## Edge Cases`) are populated.
2. **Schema & Code Alignment:**
   - Review `backend/supabase_schema.sql` against Section 7 of `report.md` to verify compatibility of proposed schema additions.
3. **Route & Dependency Feasibility:**
   - Check `frontend/package.json` to verify that `next: ^16.0.0`, `recharts`, `@tanstack/react-query`, and `@supabase/supabase-js` satisfy all component requirements.
