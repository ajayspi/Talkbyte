# TalkByte Production Readiness

## Current state

The repository now has a runnable Next.js operations dashboard, authenticated API dependencies,
provider webhook signature verification, and tenant RLS policies. Provider
integrations and full order workflow remain incomplete until the corresponding
accounts and Supabase project are configured.

## Required before pilot

1. Set `SUPABASE_JWT_SECRET`, provider credentials, and `STRIPE_WEBHOOK_SECRET`.
2. Apply `backend/supabase_schema.sql` to a staging Supabase project.
3. Replace the service-role database client on user-scoped requests with an
   authenticated Supabase client or explicit membership checks.
4. Implement the TODO handlers in voice, payment, POS, restaurant, and admin APIs.
5. Add staging integration tests for Telnyx, LiveKit, Stripe, Square, Redis, and
   Supabase; never test these flows against production credentials.
6. Configure HTTPS webhook URLs, secret rotation, backups, monitoring, and an
   incident rollback procedure.

## Local checks

Backend: `cd backend && python -m pytest -q`

Frontend: `cd frontend && npm test -- --runInBand` and `npm run build`