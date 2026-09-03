# Handoff Report — Restaurant Dashboard Specification Mining

## 1. Observation
- Analyzed `talkbyte-restaurant-dashboard.html` (771 lines) at project root:
  - Sidebar navigation contains 7 core operational views across 3 groupings:
    - Operations: `Dashboard` (`onclick="show('dashboard',this)"`, lines 196-198), `Live Calls` (`onclick="show('livecalls',this)"`, lines 199-202), `Orders` (`onclick="show('orders',this)"`, lines 203-206).
    - Management: `Menu` (`onclick="show('menu',this)"`, lines 208-210), `Analytics` (`onclick="show('analytics',this)"`, lines 211-213).
    - Account: `Billing & Plan` (`onclick="show('billing',this)"`, lines 215-217), `Settings` (`onclick="show('settings',this)"`, lines 218-220).
  - Live Audio Interception & Monitoring features observed at lines 305-321, 370-396 (`.call-btn-intercept` "Take Over Call", `.call-btn-monitor` "Monitor Only", and "End Call").
  - Orders pipeline observed at lines 414-479 with a 3-step visual dot-and-line pipeline (`.order-timeline`, lines 106-113, 439-444) tracking `Order Placed -> Link Sent -> Paid -> POS Synced`.
  - Menu catalog with instantaneous availability toggles (`.toggle.on`, lines 120-124, 510-514) explicitly annotated: `"Changes go live to AI agent within 30 seconds"` (line 486).
  - Business and AI persona configuration observed at lines 673-739 (Business Name, DID Phone Number `+61 2 9999 1234`, Timezone selector, Holiday Closure mode, Square POS/Stripe/Twilio/Shopify integrations, Voice Persona Name `"Aria"`, Greeting Script textarea, manual takeover toggle, confidence transfer threshold toggle, and staff table).
  - Analytics visual components observed at lines 562-616, 757-767: hourly call bar chart (`#callsChart`), 7-day call volume line chart (`#weekChart`), 7-day revenue line chart (`#revenueChart`), 14x7 peak hours heatmap, and top ordered items leaderboard.
  - Quota usage indicators observed at lines 640-655: Calls (`4,841 / 10,000`), AI Minutes (`11,183 / 25,000`), SMS Sent (`3,920 / 10,000`).
- Inspected existing backend schema in `backend/supabase_schema.sql` (161 lines):
  - Tables: `plans`, `restaurants`, `restaurant_users`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`.
  - Stored function: `search_menu` for pgvector RAG embeddings (`vector(1536)`).
- Inspected backend API routes in `backend/app/api/`:
  - `restaurants.py` (menu updating with OpenAI embeddings, restaurant profile endpoints).
  - `orders.py` (order fetching by ID and restaurant list).
  - `payments.py` (Stripe checkout session creation, Telnyx SMS dispatch via `send_payment_sms`, and webhook handler).
  - `voice.py` (LiveKit WebRTC token generation and session handling).

## 2. Logic Chain
1. **Observation 1** establishes that the HTML prototype is a single-page application tabbed dashboard with 7 distinct operational views, each serving a specific restaurant workflow.
2. **Observation 2** identifies that Live Calls requires WebRTC integration for real-time audio monitor/intercept (`call-btn-intercept`, `call-btn-monitor`), tying directly to LiveKit rooms defined in the `calls` table (`calls.livekit_room`).
3. **Observation 3** shows that orders are generated via calls and transition through a multi-stage payment pipeline (`orders`, `payment_events`), confirming the need for real-time state tracking in Next.js (Supabase Realtime).
4. **Observation 4** reveals that menu availability toggles must immediately update `menu_items.available`, which is used in `backend/supabase_schema.sql:157` (`where restaurant_id = p_restaurant_id and available = true`) so that AI responses dynamically omit 86'd items.
5. **Observation 5** demonstrates that Settings directly mutates `restaurants.name`, `restaurants.timezone`, and `restaurants.ai_instructions` (system prompt injection in `backend/app/models/restaurant.py:27`).
6. Therefore, the implementation in `frontend/src/app/(restaurant)` can be cleanly mapped to Next.js 16 App Router pages and client components integrated with the existing FastAPI backend and Supabase schema.

## 3. Caveats
- The prototype uses a single client-side tab state function (`show(id, navEl)`) with hardcoded mock datasets. In Next.js 16, this can either be implemented as separate nested routes (e.g. `/dashboard`, `/dashboard/orders`, `/dashboard/menu`) or client tabs to avoid disrupting ongoing LiveKit audio monitoring.
- The prototype mocks Chart.js 4.4.1. In Next.js 16, Recharts or Chart.js (with dynamic client imports) should be used to prevent SSR hydration mismatches.
- Staff role invitations currently display a visual placeholder ("+ Invite Staff") without a full modal form. A modal dialog component must be implemented.

## 4. Conclusion
The feature surface, user interactions, metrics, charts, and domain models of `talkbyte-restaurant-dashboard.html` have been thoroughly discovered, cataloged, and mapped to the Supabase database and FastAPI backend. The detailed specification report is documented at `.agents/spec_miner_restaurant_survey/report.md`.

## 5. Verification Method
- Inspect the generated specification report:
  `view_file` on `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\spec_miner_restaurant_survey\report.md`
- Verify parity of all 39 discovered features against `talkbyte-restaurant-dashboard.html`:
  Cross-check lines cited in Section 7 of `report.md`.
- Invalidation Conditions:
  - If additional tabs or hidden modal views exist in other files not referenced in `talkbyte-restaurant-dashboard.html`.
  - If backend schema changes invalidate the mapping of `calls`, `orders`, `menu_items`, or `restaurants`.
