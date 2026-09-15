---
name: nextjs-turbopack-middleware
description: Strict constraints for utility files in Next.js 16 to prevent accidental middleware bundling.
---

# Next.js 16 Turbopack Middleware Quirk

When working in Next.js 16 (especially with Turbopack):
- **NEVER** place utility files with a `default` export (e.g., `proxy.ts`, `api.ts`) directly in the `src/` root directory.
- Next.js can mistakenly bundle these files as if they were `middleware.ts`, causing them to intercept all requests, which often leads to infinite proxy loops (HTTP 431/502).
- **ALWAYS** place utility files inside `src/lib/` or `src/utils/`. The only files that should live directly in `src/` or the app root are explicitly reserved Next.js files (like `middleware.ts` if intended).
