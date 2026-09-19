# Scope: TalkByte Restaurant Dashboard Functional Configuration

## Architecture
TalkByte configuration interface updates:
- Supabase Database: `restaurant_integrations` and `restaurant_users` tables with recursion-safe RLS, staff view, and constraints.
- Backend (FastAPI):
  - `POST /api/voice/generate-greeting` in `backend/app/api/voice.py`
  - `POST /api/staff/invite` and `GET /api/staff` in `backend/app/api/staff.py`
  - `POST /api/integrations` and `GET /api/integrations` in `backend/app/api/integrations.py`
- Frontend (Next.js 16 App Router):
  - `frontend/src/components/restaurant/SettingsTab.tsx` (Staff Management, Integrations connect modals, AI greeting button)
  - `frontend/src/components/restaurant/IntegrationConfigModal.tsx`
  - `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx`
  - `frontend/src/types/database.types.ts`
  - `frontend/src/lib/api.ts` & `frontend/src/lib/supabase.ts`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database Schema for Integrations & Staff (R0) | Review & apply SQL schema for `restaurant_integrations` and `restaurant_users` with RLS, triggers, views | M1 | ORIGINAL_REQUEST §R0 |
| 2 | Backend API Endpoints (R1, R2, R3) | Implement FastAPI endpoints for voice greeting, staff invite, and integrations config | M2 | ORIGINAL_REQUEST §R1-R3 |
| 3 | Frontend Configuration Interfaces (R1, R2, R3) | Wire SettingsTab.tsx, IntegrationConfigModal, integrations route, AI script generator | M3 | ORIGINAL_REQUEST §R1-R3 |
| 4 | Full Verification, Build & Testing | Verify `npm run build`, `pip install -r requirements.txt`, unit tests, gate checks | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema & Migration (R0) | Execute SQL migration on Supabase `agafustlankeieewtvck`, update `backend/supabase_schema.sql`, update `frontend/src/types/database.types.ts` | Survey | DONE |
| M2 | Backend API Endpoints (R1, R2, R3) | Implement `backend/app/api/voice.py`, `backend/app/api/staff.py`, `backend/app/api/integrations.py`, register in `backend/main.py`, unit tests in `backend/tests/unit/` | M1 | DONE |
| M3 | Frontend Configuration Interfaces (R1, R2, R3) | Wire staff table & modal to DB and backend, connect integrations modals/routes with API key inputs, connect AI greeting button to backend with loading state | M1, M2 | DONE |
| M4 | End-to-End Verification & Gate Approval | Run frontend build, backend requirements check, run test suites, reviewer, challenger, and forensic auditor verification | M1, M2, M3 | DONE |

## Interface Contracts

### `POST /api/voice/generate-greeting`
- Request: `{ "restaurant_name": string, "persona": string }`
- Response: `{ "status": "success", "greeting": string, "provider": string }`

### `POST /api/staff/invite`
- Request: `{ "restaurant_id": string, "name": string, "email": string, "role": "Owner" | "Manager" | "Staff" }`
- Response: `{ "status": "success", "user_id": string, "message": string }`

### `GET /api/staff`
- Query params: `restaurant_id: string`
- Response: `{ "staff": Array<{ id: string, name: string, email: string, role: string, lastLogin: string }> }`

### `POST /api/integrations`
- Request: `{ "restaurant_id": string, "provider": "square" | "stripe" | "twilio" | "shopify", "api_key": string, "metadata": object }`
- Response: `{ "status": "success", "provider": string, "connected": boolean }`

### `GET /api/integrations`
- Query params: `restaurant_id: string`
- Response: `{ "integrations": Record<string, { connected: boolean, status: string, masked_key: string, metadata: object }> }`
