## 2026-09-14T11:10:25Z
You are worker_victory_remediation (Role: Victory Remediation Worker).
Your working directory is: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_victory_remediation

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- ORIGINAL_REQUEST.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
- Victory Auditor Report: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\victory_auditor_2\handoff.md
- Explorer 1 Report (Type Safety & Build): c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_remediation_1\handoff.md
- Explorer 2 Report (Git & Route Removal): c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_remediation_2\handoff.md
- Explorer 3 Report (Verification Checklist): c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_remediation_3\handoff.md

YOUR 6 REMEDIATION TASKS:
1. In `frontend/next.config.mjs`:
   - Set `typescript: { ignoreBuildErrors: false }` (or omit typescript block).
   - Remove the `legacyStubs` filesystem deletion loop (lines 7–24).
   Keep clean standard next config with `reactStrictMode: true` and `images: { unoptimized: true }`.
2. In `frontend/src/components/restaurant/BillingTab.tsx`:
   - In lines ~140–146, replace `supabase.table('billing_events')` with `(supabase as any).from('billing_events')`.
3. In `frontend/src/types/database.types.ts`:
   - Add `BillingEvent` interface and add `billing_events: { Row: BillingEvent; Insert: Partial<BillingEvent>; Update: Partial<BillingEvent>; }` to `Database['public']['Tables']`.
4. In `frontend/__tests__/plan-gating-adversarial.test.tsx`:
   - Update `jest.mock('@/lib/supabase', ...)` to provide both `from` and `table` returning the query chain.
5. In `frontend/src/app/page.tsx`:
   - Change `const containerRef = useRef(null);` to `const containerRef = useRef<HTMLDivElement>(null);`.
6. In `frontend/package.json`:
   - Remove `predev`, `prebuild`, and `pretest` temporary deletion hooks from `scripts`.
   Ensure standard scripts: dev, build, start, lint, test, test:watch, test:coverage, test:e2e.
7. Git Operations:
   - Execute `git rm -rf --ignore-unmatch frontend/src/app/login "frontend/src/app/(admin)/admin/login"` via `run_command` in repo root.
   - Run `npx tsc --noEmit` in `frontend/` to verify zero TypeScript errors.
   - Run `npm test` in `frontend/` to verify all tests pass.
   - Run `npx playwright test` in `frontend/` to verify all 4 journeys pass.
   - Run `npm run build` in `frontend/` to verify production build succeeds with exit code 0 and NO type errors.
   - Run `git add -A`
   - Run `git commit -m "fix(remediation): enable strict TypeScript verification, cleanly remove legacy route stubs from git, and verify clean production build"`
   - Run `git push origin claude/talkbyte-project-integration-fad989`
   - Run `git status` to verify clean working tree.
8. Write your handoff report to:
   c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_victory_remediation\handoff.md
9. Send a message to parent with command outputs and status.
