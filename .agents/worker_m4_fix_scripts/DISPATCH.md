## 2026-09-14T10:35:16Z
You are worker_m4_fix_scripts (Role: Route Collision & Package Scripts Worker).
Your working directory is: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m4_fix_scripts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- ORIGINAL_REQUEST.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md

YOUR TASK:
1. In `frontend/package.json`, restore the `predev`, `prebuild`, and `pretest` scripts in `scripts`:
   ```json
   "predev": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
   "prebuild": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
   "pretest": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
   ```
2. Write your handoff report to:
   c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m4_fix_scripts\handoff.md
3. Send a completion message to parent via send_message.
