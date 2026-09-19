## 2026-09-19T22:42:57Z

You are worker_m3_1.
Your working directory is: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m3_1`.
Parent orchestrator conversation ID: `b87ce451-d3cf-4526-818f-49b010cd25db`.

MANDATORY FIRST STEP: Read `ORIGINAL_REQUEST.md` (specifically the section `Follow-up — 2026-09-19T20:52:08Z` and R1, R2, R3).
Also read:
- `.agents/explorer_survey_frontend/analysis.md`
- `.agents/explorer_survey_frontend/handoff.md`
- `.agents/worker_m2_2/handoff.md` (backend endpoints `POST /api/voice/generate-greeting`, `POST /api/staff/invite`, `GET /api/staff`, `POST /api/integrations`, `GET /api/integrations` are implemented and mounted)
- `.agents/worker_m1_1/handoff.md` (database types and schema are applied)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE OF OWNERSHIP:
You exclusively own:
- `frontend/src/components/restaurant/SettingsTab.tsx`
- `frontend/src/components/restaurant/IntegrationConfigModal.tsx`
- `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/supabase.ts`

TASK OBJECTIVES:
1. Update `frontend/src/lib/api.ts`:
   - Add typed helper functions:
     - `generateGreetingScript(restaurantName: string, persona: string)` calling `POST /api/voice/generate-greeting` (or `/api/voice/greeting`)
     - `inviteStaff(restaurantId: string, name: string, email: string, role: string)` calling `POST /api/staff/invite`
     - `getStaff(restaurantId: string)` calling `GET /api/staff?restaurant_id={restaurantId}`
     - `saveIntegration(restaurantId: string, provider: string, apiKey?: string, metadata?: Record<string, any>)` calling `POST /api/integrations`
     - `getIntegrations(restaurantId: string)` calling `GET /api/integrations?restaurant_id={restaurantId}`
2. Staff Management Integration (R1) in `SettingsTab.tsx`:
   - Replace mocked React state `staffList` with dynamic data loading:
     - On mount, load staff from `getStaff(restaurantId)` or Supabase `restaurant_staff_view` / `restaurant_users`. Maintain initial/mock fallback if DB/backend query returns empty or errors, so offline builds and existing unit tests (`frontend/__tests__/restaurant-dashboard.test.tsx`) pass.
     - Submitting the Invite Staff form must call `inviteStaff(...)` (via `api.ts`), display a loading spinner / state during submission, add the returned/invited staff member to the table on success, and close the modal.
3. Integrations Routing & Configuration (R2):
   - Build `IntegrationConfigModal.tsx` in `frontend/src/components/restaurant/IntegrationConfigModal.tsx`:
     - Modal dialog supporting the 4 providers:
       - Square: Location ID & Access Token
       - Stripe: Publishable Key & Secret Key
       - Twilio: Account SID & Auth Token
       - Shopify: Shop Domain & Admin Access Token
     - Inputs collect these keys, display clear labels, placeholders, and a "Save & Connect" button.
     - On submit: calls `saveIntegration(...)` with required payload, updates status badge to "Connected", and closes modal.
   - Build dedicated route at `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx`:
     - Allows direct navigation (e.g. `/dashboard/integrations/square`, `/dashboard/integrations/stripe`, etc.).
     - Renders integration configuration form with back link to `/dashboard?tab=settings`.
   - Update Integrations section in `SettingsTab.tsx`:
     - Each integration (Square POS, Stripe Checkout, Twilio SMS, Shopify POS) must reflect real status from `getIntegrations(restaurantId)` or Supabase.
     - Unconfigured integrations have a "Connect" button that opens `IntegrationConfigModal` (or links to the route). Configured integrations show connected badge and a "Configure" button to edit keys.
4. AI Greeting Script Generator (R3) in `SettingsTab.tsx`:
   - In the Voice Settings section, wire the "Generate with AI" button:
     - When clicked, calls `generateGreetingScript(businessName || "our restaurant", voicePersona)`.
     - Displays active loading state on the button (e.g. `isGenerating` true, button disabled, showing spinner or "Generating...").
     - On success: dynamically updates the `greetingScript` textarea state with the generated script without crashing.
     - Handles errors gracefully without crashing.
5. Preserve Existing Tests & UI Compatibility:
   - Ensure existing tests in `frontend/__tests__/restaurant-dashboard.test.tsx` continue to pass (e.g. checking presence of "Square POS", "Stripe Checkout", "Twilio SMS", "Shopify POS", "Staff Access", "John Rossi", "Sarah M.", "AI Voice Settings", etc.).
6. Build & Type Verification:
   - Run `npm run build` in `frontend/` directory and ensure it succeeds with exit code 0 and 0 TypeScript errors.
   - Run `npm test` in `frontend/` and ensure all tests pass.
7. Record changes in working directory, write `handoff.md`, and notify parent `b87ce451-d3cf-4526-818f-49b010cd25db` via `send_message`.
