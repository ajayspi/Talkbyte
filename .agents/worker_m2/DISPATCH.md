# Milestone M2 Worker Dispatch: Next.js Restaurant Dashboard (R1)

Read `ORIGINAL_REQUEST.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
Read `PROJECT.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
Read `talkbyte-restaurant-dashboard.html` at project root (the authoritative visual and interactive prototype).
Read the Spec Miner Report:
`c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\spec_miner_restaurant_survey\report.md`

Your Exclusive File Write Ownership:
1. `frontend/src/app/(restaurant)/layout.tsx`
2. `frontend/src/app/(restaurant)/dashboard/page.tsx`
3. `frontend/src/components/restaurant/DashboardTab.tsx`
4. `frontend/src/components/restaurant/LiveCallsTab.tsx`
5. `frontend/src/components/restaurant/OrdersTab.tsx`
6. `frontend/src/components/restaurant/MenuTab.tsx`
7. `frontend/src/components/restaurant/AnalyticsTab.tsx`
8. `frontend/src/components/restaurant/BillingTab.tsx`
9. `frontend/src/components/restaurant/SettingsTab.tsx`

Requirements:
1. Implement the complete Restaurant Dashboard in Next.js 16 with 100% visual and functional fidelity to `talkbyte-restaurant-dashboard.html`.
2. All 7 tabs must be fully interactive:
   - Dashboard: Today's KPIs, hourly call volume chart (Recharts or SVG), recent orders table, peak hours summary.
   - Live Calls: Real-time call cards, duration tickers incrementing every second, audio monitor & "Take Over Call" / "Monitor Only" intercept buttons.
   - Orders: Order pipeline with visual 4-stage timeline (`Placed -> Link Sent -> Paid -> Synced`), search, filter by status, and order detail drawer.
   - Menu: Category navigation, menu item cards/table with prices, descriptions, and instantaneous 30s AI availability toggle calling `toggleMenuItemAvailability` from `src/lib/supabase.ts`.
   - Analytics: Hourly calls chart, 7-day trend volume and revenue lines, 14x7 peak hours heatmap, top-selling items.
   - Billing & Plan: Quota usage meters (Calls, AI Minutes, SMS), active plan card, payment method, billing invoice history.
   - Settings: Voice persona selector (Aria, etc.), greeting script editor, manual takeover threshold, POS integration badges (Square, Lightspeed, Stripe, Twilio), and staff access table with "+ Invite Staff" modal.
3. Import icons from `@/components/icons` (DO NOT import from `lucide-react`).
4. Import data functions from `@/lib/supabase` (handles both Supabase and mock fallback seamlessly).
5. Ensure `'use client'` directive is used appropriately for interactive components.
6. Run validation in `frontend/` (e.g. `cmd /c "npm run build"` or type check) and document verification.
7. Write your execution report and `handoff.md` in `.agents/worker_m2/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-03T06:59:15Z
Implement all 9 files in your exclusive write ownership:
1. `frontend/src/app/(restaurant)/layout.tsx`
2. `frontend/src/app/(restaurant)/dashboard/page.tsx`
3. `frontend/src/components/restaurant/DashboardTab.tsx`
4. `frontend/src/components/restaurant/LiveCallsTab.tsx`
5. `frontend/src/components/restaurant/OrdersTab.tsx`
6. `frontend/src/components/restaurant/MenuTab.tsx`
7. `frontend/src/components/restaurant/AnalyticsTab.tsx`
8. `frontend/src/components/restaurant/BillingTab.tsx`
9. `frontend/src/components/restaurant/SettingsTab.tsx`
Ensure all 7 tabs are fully functional with icons from `@/components/icons` and data from `@/lib/supabase`.

