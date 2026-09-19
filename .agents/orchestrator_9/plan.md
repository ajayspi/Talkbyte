# Implementation Plan: TalkByte Restaurant Dashboard Functional Configuration

## Objectives
Implement functional configuration interfaces for the TalkByte Restaurant Dashboard replacing current UI mockups:
1. **R0. Database Schema**: Review and apply SQL schema updates for `restaurant_integrations` and `restaurant_users` to Supabase.
2. **R1. Staff Management**: Wire up Staff Access table and Invite Modal in `SettingsTab.tsx` to Supabase (`restaurant_users` joined with `auth.users` / profiles table) and backend endpoint to send invite / create user.
3. **R2. Integrations Routing & Configuration**: Refactor Integrations section (Square POS, Stripe Checkout, Twilio SMS, Shopify POS) with "Connect" buttons opening dedicated modal or route (e.g. `/dashboard/integrations/square`) to securely collect and save required API keys to backend.
4. **R3. AI Greeting Script Generator**: New FastAPI endpoint accepting restaurant name & persona, calling configured LLM, returning custom AI greeting script. Wire frontend button in Voice Settings with loading state.
5. **Acceptance Criteria**:
   - `npm run build` in `frontend` succeeds with exit code 0.
   - `pip install -r requirements.txt` in `backend` succeeds with exit code 0.
   - Staff Management loads from DB and invite POSTs to backend.
   - Integrations form opens with required API key fields and saves to DB.
   - AI greeting script generates dynamically and updates textarea without crashing.

## Phase 0: Survey & Specification Mapping
- Spawn 3 parallel Explorers:
  - Explorer 1: Database schema proposal investigation, existing Supabase schema, migration mechanism, and Supabase MCP tools.
  - Explorer 2: Frontend architecture investigation (`SettingsTab.tsx`, `database.types.ts`, `supabase.ts`, routing, modals, API client).
  - Explorer 3: Backend architecture investigation (FastAPI routes, LLM integration, staff invite endpoint, integrations endpoint).

## Phase 1: Database Schema & Migration (R0)
- Apply schema for `restaurant_integrations` and `restaurant_users`.
- Update frontend database types (`database.types.ts`).

## Phase 2: Staff Management Integration (R1)
- Backend endpoint for staff invite/creation.
- Frontend hook & UI wiring in `SettingsTab.tsx` with real data fetch and invite submission.

## Phase 3: Integrations Routing & Configuration (R2)
- Backend endpoints / Supabase client storage for integration credentials (Square, Stripe, Twilio, Shopify).
- Frontend UI / modal / route for entering API keys and connecting integrations.

## Phase 4: AI Greeting Script Generator (R3)
- FastAPI endpoint for generating greeting script via LLM.
- Frontend button in Voice Settings with loading state and dynamic population.

## Phase 5: Verification & End-to-End Validation
- Build tests (`npm run build`, `pip install -r requirements.txt`).
- Unit & integration verification.
- Reviewer, Challenger, and Forensic Auditor verification.
