# TalkByte AI Operator Platform — Next.js Implementation

**Date:** 2026-08-04
**Status:** Approved
**Source:** Claude Design canvas project "Naru Kitchen prototype design" (`https://claude.ai/design/p/fbddd0a7-df5e-4dee-9f82-2c11f22f1596`), file `TalkByte AI.dc.html`

## Purpose

`TalkByte AI.dc.html` is an interactive UX-exploration prototype (10 screens) for TalkByte AI's operator dashboard, built in Claude's design-canvas format (custom `{{ }}` template bindings, `sc-if`/`sc-for` directives, a `data-dc-script` React class component driving a simulated live-call demo). It is not runnable outside the design-canvas tool.

This project turns that prototype into a real, standalone Next.js application: same visual design, same simulated interactivity, real component/routing structure, buildable and runnable independently.

## Scope

In scope: reproduce all 10 views with matching visuals and simulated behavior, using mock data (no backend — none exists yet per the TalkByte SRS).

Out of scope: real backend integration (Twilio, Deepgram, POS, Stripe, etc.), authentication, persistence. This is a UI/UX artifact, same as the source.

## Source material

- `TalkByte AI.dc.html` — the 10-view prototype markup + simulation script (retrieved via the `claude_design` MCP / DesignSync tool)
- `_ds/modernist-8e51480f-f363-4d8c-bc5e-89d8096bc992/styles.css` — the "Modernist" design-system tokens and component classes (cream background `#f3f2f2`, near-black text `#201e1d`, red-orange accent `#ec3013`, zero border-radius, Archivo font)
- `support.js` — the design-canvas runtime (React-based template interpreter); not ported directly, but its behavior (what `{{ }}`, `sc-if`, `sc-for` do) informs how templates become JSX

## Views

1. **Overview** — daily KPI dashboard (calls answered, orders placed, avg call, revenue taken), live calls panel, today's orders table, "Needs you" sidebar (alerts, menu gaps, Co-Pilot preview, sentiment breakdown). Adds a **Leads card** (FR-017, Lead Conversion Intelligence) to the "Needs you" panel, alongside the existing unhappy-caller/menu-gap/Co-Pilot cards — same card style, showing abandoned-call count, classified abandonment reason, and a re-engagement CTA; one more `lib/mock-data.ts` entry, no new component.
2. **Live call** — real-time call monitor: streaming transcript with typing animation, order building panel with running total/GST, confidence meter, take-over dialog. Language tag ("Australian English") gets a companion "Phase 3 preview" tag hinting at multi-language detection (FR-006), styled like the existing Co-Pilot "Phase 2 preview" tags elsewhere — no functional language switching, just the same forward-looking visual marker the prototype already uses for other Phase 2/3 features.
3. **Menu** — menu management table with category tabs and availability toggles; website-menu-scraping flow (idle → scanning animation → results-for-review) driven by local state. An **Add/edit dish dialog** (FR-008) reuses the `.dialog`/`.dialog-backdrop`/`.field`/`.input` classes already ported for the Take-over dialog — fields: name, price, category, dietary tags, description, availability toggle. "Add a dish" and a new per-row "Edit" action both open it (pre-filled for edit).
4. **Analytics** — 30-day KPIs, calls-per-day bar chart, hour×day heatmap, Co-Pilot insight cards, scheduled reports
5. **Campaigns** ("Call-outs") — outbound campaign composer (audience, schedule, channel, AI script preview) + running/recent campaigns list + DNCR compliance notice. Campaign types extend the existing four (Confirmation/Survey/Promo/Loyalty) with a fifth, **Delivery update** (FR-019), listed in "Running & recent" the same way — a data addition, no new UI.
6. **Setup** — 5-step onboarding wizard (currently on "Connect your till"): auto-detected POS, POS picker grid, embedded video-tutorial placeholder
7. **Mobile** — 3 phone-frame mockups (staff home, live call, sold-out toggle) showing the operator app's mobile companion
8. **Variants** — internal design-review page comparing 3 treatments (A/B/C) for showing live calls, plus 2 density variants and 2 alert-tone variants. Kept as a reference/internal route, not customer-facing.
9. **Admin** ("Platform") — TalkByte-internal multi-tenant view: MRR/cost-per-minute/margin/uptime KPIs, venues table, pipeline health, an open-risk callout (Twilio AU mobile pricing risk — R-013)
10. **Landing** — public marketing page: hero, stat strip, feature list, pricing tiers, CTA band, footer

## Architecture

### Routing split

The source nests the Landing page inside the same sidebar shell as the operator views (single-canvas prototype convenience). This implementation splits them, matching how the product would actually ship:

- **`/`** — public marketing site (Landing view), no sidebar
- **`/app/overview`**, **`/app/live`**, **`/app/menu`**, **`/app/analytics`**, **`/app/campaigns`**, **`/app/setup`**, **`/app/mobile`**, **`/app/admin`**, **`/app/variants`** — operator app, under a shared `AppShell` layout (top bar + left sidebar nav), matching the prototype's nav exactly (Today: Overview/Live call/Menu; Grow: Analytics/Call-outs; Design set: Setup wizard/Mobile/Variants/Platform admin/Marketing site link)

Next.js App Router: `app/page.tsx` (landing), `app/app/layout.tsx` (AppShell), `app/app/{overview,live,menu,analytics,campaigns,setup,mobile,admin,variants}/page.tsx`.

### Simulation state

The prototype's single component `state` (`screen`, `tick`, `line`, `chars`, `off`, `scrape`, `scanPct`, `takeover`, `sim`) and its 70ms interval become a `SimulationProvider` React Context wrapping the `/app` layout, exposing a `useSimulation()` hook with the same derived values the original `renderVals()` computed:

- Transcript playback (typing effect through the 7-line demo call script)
- KPI counters ticking up over time (`kpiCalls`, `kpiOrders`, `kpiRevenue`)
- Menu-scrape animation (idle → scanning with progress % → results)
- Per-item menu sold-out toggles
- Take-over dialog open/close
- Sim pause/resume (top bar button)

Views that don't need live simulation (Setup, Variants, Admin, Landing) read only the static parts of this data or plain local component state.

### Data

`lib/mock-data.ts` — ported verbatim from the script's `SCRIPT`, `ORDER`, `SNIPS`, `MENU`, `SCRAPED` consts and the inline arrays in `renderVals()` (orders, mobile orders, campaigns, POS list, timeline, tenants, services, copilot insights, landing features/pricing). No transformation of content — same restaurant (Naru Kitchen), same demo data, same numbers.

### Design tokens & components

`styles.css` tokens (CSS custom properties: `--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--font-*`) are ported as-is into `app/globals.css`. Archivo font loads via `next/font/google` instead of the Google Fonts `@import`. The existing component classes (`.btn`, `.btn-primary/secondary/ghost`, `.card`, `.tag`, `.table`, `.field`/`.input`, `.dialog`, `.nav`, `.seg`) are copied unchanged — components use them directly via `className`, same as the source uses them via `class`. Tailwind is configured to reference these CSS variables (`theme.extend.colors` etc. pointing at `var(--color-accent)` and so on) so either styling approach works without redefining the palette.

### Components

One `.tsx` per view: `OverviewView`, `LiveCallView`, `MenuView`, `AnalyticsView`, `CampaignsView`, `SetupView`, `MobileView`, `VariantsView`, `AdminView`, `LandingPage`. Shared: `AppShell` (top bar + sidebar nav), `TakeoverDialog`. Inline `sc-if`/`sc-for` in the source become plain JSX conditionals and `.map()` calls; animations (`tb-caret`, `tb-pulse`, `tb-wave`, `tb-scan`, `tb-in` keyframes) are copied into `globals.css` unchanged.

### Testing

No backend, no persistence — nothing to unit-test at the data layer. Verification is a manual pass in the browser per view, confirming: simulation ticks (transcript typing, KPI counters, scrape animation) run identically to the original; sim pause/resume works; take-over dialog opens/closes; menu sold-out toggles work; all sidebar nav links route correctly; the landing page renders standalone without the app shell; the add/edit dish dialog opens, pre-fills on edit, and closes. The pass also covers accessibility (WCAG 2.1 AA per SRS §4.5): keyboard navigation and visible focus states across all views and dialogs, leaning on the design system's existing `:focus-visible` rules rather than adding new ones.

## Non-goals / explicit deviations from source

- Landing page is split to its own top-level route instead of living inside the operator sidebar (see Routing split above) — this was confirmed with the user as the one intentional structural change.
- No attempt to replicate `support.js`'s generic template-interpreter runtime — its behavior is reimplemented directly in idiomatic React/TSX per view instead.
- **FR-022 (Hotel PMS integration) and FR-023 (Retail voice agent) are explicitly out of scope.** Both are Phase 3 in the SRS, and the source prototype is scoped entirely to one restaurant tenant (Naru Kitchen) — hotel and retail only appear as rows in the Admin tenant table (e.g. "The Wharf Hotel" / Mews PMS, "Fitzroy Provisions" / Zettle). This implementation does not invent hotel- or retail-specific operator screens the design canvas never designed; that would be new design work, not a port of the existing prototype. Confirmed with the user.

## Functional-requirement coverage

Cross-checked against the TalkByte SRS v2.1's 25 functional requirements. Covered by the views above: FR-001 (inbound reception), FR-002 (STT — "Deepgram Nova-3 · 84ms" tag), FR-003 (noise cancellation), FR-004 (NLP order processing), FR-005 (TTS — Admin pipeline health), FR-006 (multi-language, preview-only), FR-007 (concurrent calls), FR-008 (menu CRUD, incl. add/edit dialog), FR-009 (menu scraping), FR-010 (training data flag), FR-011 (Stripe payment), FR-012/FR-013 (POS integrations), FR-014 (analytics dashboard), FR-015 (sentiment), FR-016 (AI Co-Pilot), FR-017 (lead conversion), FR-018 (order confirmation calls), FR-019 (delivery updates), FR-020 (CSAT surveys), FR-021 (promo/loyalty), FR-024 (onboarding wizard), FR-025 (live-ops dashboard). Explicitly out of scope: FR-022, FR-023 (see above).
