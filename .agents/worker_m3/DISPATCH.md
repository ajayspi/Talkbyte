## 2026-09-03T06:59:15Z

# Milestone M3 Worker Dispatch: Next.js Operator Admin Panel (R2)

Read `ORIGINAL_REQUEST.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
Read `PROJECT.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
Read `talkbyte-admin-panel.html` at project root (the authoritative visual and interactive prototype).
Read the Spec Miner Report:
`c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\spec_miner_admin_survey\report.md`

Your Exclusive File Write Ownership:
1. `frontend/src/app/(admin)/layout.tsx`
2. `frontend/src/app/(admin)/admin/page.tsx`
3. `frontend/src/components/admin/OverviewView.tsx`
4. `frontend/src/components/admin/LiveMonitorView.tsx`
5. `frontend/src/components/admin/RestaurantsView.tsx`
6. `frontend/src/components/admin/UsersView.tsx`
7. `frontend/src/components/admin/RevenueView.tsx`
8. `frontend/src/components/admin/BillingView.tsx`
9. `frontend/src/components/admin/InfraView.tsx`
10. `frontend/src/components/admin/AuditView.tsx`
11. `frontend/src/components/admin/AnalyticsView.tsx`

Requirements:
1. Implement the complete Operator Admin Panel in Next.js 16 with 100% visual and functional fidelity to `talkbyte-admin-panel.html`.
2. All 9 views must be fully interactive and cleanly switchable:
   - Overview: 8 KPI metric cards, Call Volume chart, MRR Growth chart, Top 5 restaurants leaderboard, and 4 at-risk venues with triage action buttons (`Contact`, `Debug`, `Invoice`, `Review AI`).
   - Live Monitor: Active call cards with ticking live timers, recent completed calls table with sentiment badges and duration.
   - Restaurants: 487-tenant fleet directory table with search, plan filter, status filter, health score progress bars (`fill-green`, `fill-yellow`, `fill-red`), POS status badges, and `+ Add Restaurant` modal.
   - Users: Tenant user directory with RBAC roles (Owner, Staff, Readonly), venue assignment, and status badges.
   - Revenue: Financial summary, tier distribution breakdown (Enterprise, Pro, Starter), itemized per-minute unit economics breakdown ($0.062/min total cost, 31% margin), and revenue trend chart.
   - Billing: Subscription health table, failed payment retries, invoice history, Stripe sync status.
   - Infrastructure: 9 service cards (Telnyx, Deepgram, GPT-4.1, ElevenLabs, Stripe, Supabase, Redis, Square, LiveKit) with status badges and metrics; Deepgram latency spike alert banner.
   - Audit Log: Multi-category event ledger (`ORDER`, `ESCALATION`, `BILLING`, `RESTAURANT`, `SYSTEM`, `POS`, `AUTH`) with actor, resource, detail, IP, and timestamp.
   - Analytics: 7-day KPIs, daily orders vs calls chart, cuisine completion chart, top abandonment reasons table, and payment conversion funnel table.
3. Import icons from `@/components/icons` (DO NOT import from `lucide-react`).
4. Import data functions from `@/lib/supabase` (handles both Supabase and mock fallback seamlessly).
5. Ensure `'use client'` directive is used appropriately for interactive components.
6. Run validation in `frontend/` (e.g. `cmd /c "npm run build"` or type check) and document verification.
7. Write your execution report and `handoff.md` in `.agents/worker_m3/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
