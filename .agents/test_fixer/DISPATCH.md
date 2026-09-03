# DISPATCH: Test Alignment & Fixer

**Working Directory**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\test_fixer`
**Project Root**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989`
**Authoritative Request**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md`
**Reviewer Report**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\reviewer_final\handoff.md`

## Assignment: Align Test Suite Assertions to Component DOM
You are assigned to update `frontend/__tests__/restaurant-dashboard.test.tsx` and `frontend/__tests__/admin-panel.test.tsx` so that all assertions query the exact text, buttons, placeholders, and structure rendered by the components.

### Detailed Reviewer Feedback to Fix:
1. In `frontend/__tests__/restaurant-dashboard.test.tsx`:
   - `DashboardTab`:
     - Change "Today's Calls" -> "Calls Today"
     - Change "Today's Revenue" -> "Revenue Today"
     - Change "AI Completion" -> "AI Answer Rate"
     - Change "Live Call In Progress" -> "Active Calls"
     - Change button "Take Over Call" -> "Take Over"
     - Change post-click "Call Transferred" -> "Staff Speaking ✓"
   - `LiveCallsTab`:
     - Change "Live Active Calls (2)" -> "Live (2)" (or regex `/Live/i`)
     - Change unmasked phone "+61 412 893 210" -> masked phone `+61 4•• ••• 847`
     - Change unmasked phone "+61 498 765 432" -> masked phone `+61 2•• ••• 312`
     - Remove nonexistent "Recent Completed Calls (Today)" or query "Recent Completed" / history table
   - `OrdersTab`:
     - Change "Orders & Payment Pipeline" -> "All Orders — Today"
     - Change placeholder "Search order # or phone..." -> "Search orders..."
   - `MenuTab`:
     - Change "Live Menu Availability" -> "Menu Management"
     - Change item "Margherita Classica" -> "Margherita"
     - Remove or replace nonexistent "Truffle & Mushroom" with an actual item like "Pepperoni" or "Garlic Bread"
   - `AnalyticsTab`:
     - Change "Hourly Peak Volume Distribution" -> "Peak Hours Heatmap (Calls/Hour)"
     - Change "Total Revenue" -> "Revenue"
     - Change "Avg Order Value" -> "Avg Handle Time"
     - Remove nonexistent "Performance & Revenue Analytics" or query actual title
   - `BillingTab`:
     - Change "Calls Processed" -> "Calls Used"
     - Change "AI Voice Minutes" -> "AI Minutes"
     - Remove nonexistent "Plan & Billing Management" or query actual title
   - `SettingsTab`:
     - Change "AI Voice Assistant Configuration" -> "AI Voice Settings"
     - Remove nonexistent "Restaurant Profile & POS Integration" or query actual title

2. In `frontend/__tests__/admin-panel.test.tsx`:
   - `OverviewView`:
     - Change "Total Venues" -> "Active Restaurants"
     - Change "Active Calls Now" -> "Calls Today" (or "live now")
     - Change "Platform MRR" -> "MRR"
     - Change "Top Performing Restaurants" -> "Top Restaurants by Orders Today"
   - `LiveMonitorView`:
     - Change "Active Live Calls (23)" -> "Live Call Monitor" or "Active Calls"
     - Change "Recent Completed Calls (Today)" -> "Recent Completed Calls"
   - `RestaurantsView`:
     - Change placeholder "Search restaurant, suburb, state..." -> "Search restaurants…"
     - Change button "+ Add Restaurant" -> "Add Restaurant"
   - `UsersView`:
     - Change "User Directory" -> "User Management"
     - Change placeholder "Search user name, email, restaurant..." -> "Search users or venues…"
     - Change button "+ Invite User" -> "Invite User"
   - `RevenueView`:
     - Change "Monthly Recurring Revenue" -> "MRR"
     - Change "Per-Minute Unit Economics (COGS)" -> "Cost Breakdown (per minute)"
     - Query "Margin: 31%" instead of standalone "Gross Margin"
   - `BillingView`:
     - Change "Subscription Health" -> "Subscription Lifecycle"
     - Change "Invoice History" -> "Recent Invoices"
   - `InfraView`:
     - Change "Infrastructure & Telemetry" -> "Infrastructure Health"
     - Change "Telnyx SIP Inbound" -> "📡 Telnyx SIP"
     - Change "Deepgram Flux STT" -> "🔊 Deepgram Flux (STT)"
     - Change "OpenAI GPT-4.1" -> "🧠 OpenAI GPT-4.1"
     - Change "ElevenLabs Streaming" -> "🗣️ ElevenLabs TTS"
   - `AuditView`:
     - Change "Platform Audit Log" -> "Audit Log"
     - Change placeholder "Search actor, details, IP, resource..." -> "Filter events…"
   - `AnalyticsView`:
     - Change "Platform Performance Analytics" -> "Platform Analytics"
     - Change "Total Calls Processed" -> "Total Calls (7d)"

### Verification:
Read the component source files in `frontend/src/components/restaurant/` and `frontend/src/components/admin/` directly to ensure 100% accuracy of all selectors and text before finishing.
Write your report in `.agents/test_fixer/handoff.md`.
