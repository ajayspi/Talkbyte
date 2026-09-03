# E2E Test Infra: TalkByte AI Frontend & Backend Integration

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md`, `talkbyte-restaurant-dashboard.html`, and `talkbyte-admin-panel.html`.
- Verification of screen rendering, navigation between tabs/views, Supabase client data calls, state toggles, and production build artifact generation (`npm run build`).
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory & Test Coverage Targets
| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|--------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Configuration & Root Layout | Survey / Next.js | 5 | 5 | ✓ | ✓ |
| 2 | Supabase Client & Types | backend/supabase_schema.sql | 5 | 5 | ✓ | ✓ |
| 3 | Restaurant Dashboard Shell & Tabs | talkbyte-restaurant-dashboard.html | 5 | 5 | ✓ | ✓ |
| 4 | Restaurant Orders Pipeline & Modals | talkbyte-restaurant-dashboard.html | 5 | 5 | ✓ | ✓ |
| 5 | Restaurant Menu & AI Availability Toggle | talkbyte-restaurant-dashboard.html | 5 | 5 | ✓ | ✓ |
| 6 | Restaurant Settings & Integrations | talkbyte-restaurant-dashboard.html | 5 | 5 | ✓ | ✓ |
| 7 | Operator Admin Shell & Navigation | talkbyte-admin-panel.html | 5 | 5 | ✓ | ✓ |
| 8 | Operator Fleet & Tenant Health Directory | talkbyte-admin-panel.html | 5 | 5 | ✓ | ✓ |
| 9 | Operator Live Calls & Infrastructure Telemetry | talkbyte-admin-panel.html | 5 | 5 | ✓ | ✓ |
| 10 | Operator Revenue & Audit Trail | talkbyte-admin-panel.html | 5 | 5 | ✓ | ✓ |
| 11 | Production Build & Integration | ORIGINAL_REQUEST.md | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Jest with `ts-jest` and `jsdom` (`frontend/jest.config.js`), and Next.js compiler build validation (`next build`).
- Invocation: `npm test` and `npm run build` inside `frontend/`.
- Pass/Fail Semantics: 100% assertions pass, zero unhandled errors, build exits with code 0.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Restaurant Manager Daily Opening Flow | Check KPI cards, toggle 86'd menu items, monitor live morning calls | Medium |
| 2 | Call Intercept & Order Fulfillment Flow | Live call card triggers intercept audio, order created, transitions Placed -> Paid -> Synced | High |
| 3 | Operator Fleet Triage & POS Error Debug | Review at-risk tenant, filter fleet by POS error, view debug drawer | Medium |
| 4 | Infrastructure Latency Spike Alert Handling | Observe Deepgram latency badge in Infra tab, inspect audit log for fallback | Medium |
| 5 | End-to-End Production Deployment Build | Fresh build compilation with Next.js App Router, CSS bundling, strict TypeScript checks | High |

## Coverage Thresholds
- Tier 1: ≥5 test cases per feature area
- Tier 2: ≥5 boundary/edge test cases per feature area
- Tier 3: Pairwise interaction coverage
- Tier 4: ≥5 realistic workflow scenarios
