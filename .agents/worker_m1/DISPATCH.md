# Milestone M1 Worker Dispatch: Frontend Foundation & Data Layer

Read `ORIGINAL_REQUEST.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
Read `PROJECT.md` at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md

Read Explorer reports and blueprints:
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_1\report.md`
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_2\report.md`
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_3\report.md`

Your Exclusive File Write Ownership:
1. `frontend/tsconfig.json`
2. `frontend/next.config.mjs`
3. `frontend/postcss.config.mjs`
4. `frontend/src/app/globals.css`
5. `frontend/src/app/layout.tsx`
6. `frontend/src/app/page.tsx`
7. `frontend/src/types/database.types.ts`
8. `frontend/src/lib/supabase.ts`
9. `frontend/src/lib/mockData.ts`
10. `frontend/src/components/icons.tsx`

Instructions:
1. Implement all 10 files using the blueprints provided in the Explorer reports.
2. Ensure `tsconfig.json` has `"moduleResolution": "bundler"`, `"skipLibCheck": true`, and path mapping `@/*` -> `./src/*`.
3. Ensure `postcss.config.mjs` uses `@tailwindcss/postcss`.
4. Ensure `src/components/icons.tsx` contains clean inline SVG components so no external icon package is needed.
5. In `frontend/src/lib/supabase.ts`, implement resilient fallback to `mockData.ts` if Supabase environment variables are missing or default test strings.
6. Verify your implementation by running build/typecheck in `frontend/` (e.g. `npx tsc --noEmit` or `npm run build` or `npm test`).
7. Write your execution report and `handoff.md` in `.agents/worker_m1/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-03T06:46:02Z
You are a teamwork_preview_worker subagent for Milestone M1.
Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1

Read ORIGINAL_REQUEST.md at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
Read PROJECT.md at project root:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
Read your dispatch:
c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1\DISPATCH.md

Read Explorer reports:
- c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_1\report.md
- c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_2\report.md
- c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m1_3\report.md

Implement all 10 files in your exclusive write ownership:
1. `frontend/tsconfig.json`
2. `frontend/next.config.mjs`
3. `frontend/postcss.config.mjs`
4. `frontend/src/app/globals.css`
5. `frontend/src/app/layout.tsx`
6. `frontend/src/app/page.tsx`
7. `frontend/src/types/database.types.ts`
8. `frontend/src/lib/supabase.ts`
9. `frontend/src/lib/mockData.ts`
10. `frontend/src/components/icons.tsx`

Run builds/tests in `frontend/` to verify.
Write your report and handoff.md in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Send a message to parent when done.
