# Milestone M1 Technical Investigation: Build Config, Tailwind CSS v4, Globals.css & Root Portal

**Agent**: `explorer_m1_3`  
**Milestone**: M1 (Frontend Foundation & Data Layer)  
**Date**: 2026-09-03  
**Status**: COMPLETE  

---

## 1. Executive Summary

This investigation delivers the exact technical specifications and architecture for the frontend foundation of the **TalkByte AI** platform. The frontend repository is located in `frontend/` and leverages **Next.js 16.3.3**, **React 19.2.8**, and **Tailwind CSS 4.3.3** with **PostCSS 8**.

Key findings and architectural determinations:
1. **Build Configuration**: Next.js 16 requires a strict `tsconfig.json` with `"moduleResolution": "bundler"` and `"skipLibCheck": true` to eliminate React 19 / third-party type conflicts. `next.config.mjs` must provide clean React 19 App Router options.
2. **Tailwind CSS v4 & PostCSS**: Tailwind v4 fundamentally alters the build pipeline. It deprecates `tailwind.config.js` and `@tailwind` directives. Configuration is CSS-first using `@import "tailwindcss";` and `@theme` blocks. The PostCSS plugin is `@tailwindcss/postcss` (not `tailwindcss`), and `autoprefixer` must **not** be included because Tailwind v4 embeds Lightning CSS for automatic prefixing.
3. **Design Tokens & `globals.css`**: The design system faithfully unifies the dark theme requirements with the HTML prototypes (`talkbyte-restaurant-dashboard.html` and `talkbyte-admin-panel.html`). It incorporates the dark slate base (`#0f172a`), deep plum/purple brand accents (`#4A0E4E`, `#7c3aed`), teal accents (`#14b8a6`), orange highlights (`#FF6B35`), live call gradients (`#1a0a1e` to `#0f172a`), custom sleek scrollbars, and high-contrast status badge classes.
4. **Root Layout & Portal**: `src/app/layout.tsx` must use a resilient system font stack to prevent fatal `next/font/google` fetch failures during offline builds. `src/app/page.tsx` provides a responsive portal directing users to the Restaurant Dashboard (`/dashboard`) and Operator Admin Panel (`/admin`) without external icon dependencies (`lucide-react`).
5. **Next.js 16 / React 19 Pitfalls**: Identified 7 critical pitfalls, including the breaking change where Page/Layout `params` and `searchParams` are now asynchronous Promises, Recharts SSR hydration caveats, and ESLint 9 flat config nuances.

---

## 2. Dependency Audit & Build Configuration Analysis

### 2.1 Package Audit (`frontend/package.json`)
The project dependencies installed in `frontend/node_modules` were verified:
- **Next.js**: `16.3.3` (App Router enabled)
- **React / React-DOM**: `19.2.8`
- **Tailwind CSS**: `4.3.3`
- **Tailwind PostCSS Plugin**: `@tailwindcss/postcss@4.3.3`
- **PostCSS**: `8.5.6`
- **TypeScript**: `5.9.3`
- **Data & Charts**: `@supabase/supabase-js@2.47.0`, `recharts@2.13.3`, `zustand@5.0.2`, `axios@1.7.9`, `date-fns@4.1.0`
- **Testing**: `jest@29.7.0`, `ts-jest@29.1.0`, `@testing-library/react@16.0.0`, `@testing-library/jest-dom@6.6.3`

### 2.2 Exact `tsconfig.json` Specification

In Next.js 16 with React 19, TypeScript compilation requires specific compiler options. In particular:
- `"moduleResolution": "bundler"`: Required for Next.js 16 modern module resolution and package export maps (e.g. `@tailwindcss/postcss` and React 19 exports).
- `"skipLibCheck": true`: **Mandatory**. Without this, `@types/react@19` generates fatal type conflicts when parsing third-party declarations (such as `recharts` and `@testing-library/react`).
- `"paths"`: Must map `"@/*": ["./src/*"]` to align with `jest.config.js` (`moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }`).
- `"jsx": "preserve"`: Lets Next.js and SWC/Turbopack transform JSX with React 19 automatic runtime.

#### Proposed `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### 2.3 Exact `next.config.mjs` Specification

Next.js 16 builds with Turbopack support in dev and standard SWC optimization. For the production build (`next build`), the configuration should enforce strict React mode and resilient image handling.

#### Proposed `frontend/next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack options for next dev --turbopack
  turbopack: {},
  // Resilient static image handling
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### 2.4 Exact `postcss.config.mjs` Specification

In Tailwind CSS v4, the PostCSS integration uses the `@tailwindcss/postcss` package.
**Key Differences from Tailwind v3**:
- Plugin name is `'@tailwindcss/postcss'`, **not** `'tailwindcss'`.
- `autoprefixer` must **NOT** be included. Tailwind CSS v4 bundles Lightning CSS which performs vendor prefixing automatically. Adding `autoprefixer` causes redundant processing and warning logs.

#### Proposed `frontend/postcss.config.mjs`:
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

### 2.5 ESLint 9 Configuration (`frontend/eslint.config.mjs`)

`frontend/package.json` specifies `"eslint": "^9"` and `"eslint-config-next": "^16.0.0"`. ESLint 9 enforces the Flat Config format. To prevent build failures during `next build` or `npm run lint`, `eslint.config.mjs` must bridge `eslint-config-next` via `FlatCompat`:

#### Proposed `frontend/eslint.config.mjs`:
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  }
];

export default eslintConfig;
```

---

## 3. Tailwind CSS v4 Setup & `globals.css` Styling

### 3.1 Tailwind CSS v4 Architecture
Unlike Tailwind v3, Tailwind v4 is CSS-first:
- `@tailwind base; @tailwind components; @tailwind utilities;` are **obsolete**.
- Entry point is `@import "tailwindcss";`.
- Theme extensions use `@theme { ... }` blocks directly within CSS.
- No `tailwind.config.js` is required.

### 3.2 Design Token Extraction from Prototypes
Analysis of `talkbyte-restaurant-dashboard.html`, `talkbyte-admin-panel.html`, and `style.css` yields the following unified design tokens:

| Token Name | Hex / Value | Prototype Source | Semantic Usage |
|---|---|---|---|
| `--color-purple-dark` | `#4A0E4E` | Both prototypes | Admin sidebar background, brand mark |
| `--color-purple-sidebar` | `#1a0a1e` | Restaurant prototype | Restaurant dark sidebar background |
| `--color-purple-primary` | `#7c3aed` | Both prototypes | Primary buttons, active nav indicators |
| `--color-purple-light` | `#ede9fe` | Admin prototype | Light purple badge, highlighted tags |
| `--color-teal` | `#14b8a6` | Both prototypes | AI live pulse, audio waveform, active border |
| `--color-teal-light` | `#ccfbf1` | Admin prototype | Teal badges, status highlights |
| `--color-orange` | `#FF6B35` | Both prototypes | Urgent badges, call intercepts, notifications |
| `--color-slate-900` | `#0f172a` | Dispatch / Dark theme | Platform root dark background |
| `--color-slate-800` | `#1e293b` | Dark theme | Primary card surfaces, topbar |
| `--color-slate-700` | `#334155` | Dark theme | Secondary card surfaces, borders |
| `--color-slate-400` | `#94a3b8` | Dark theme | Secondary / muted text |
| `--color-slate-100` | `#f1f5f9` | Dark theme | Primary body text |
| `--color-green` | `#22c55e` | Both prototypes | Live call active, order confirmed |
| `--color-yellow` | `#eab308` | Both prototypes | Order link sent, warning status |
| `--color-red` | `#ef4444` | Both prototypes | Call escalated, payment failed, outage |
| `--color-blue` | `#3b82f6` | Both prototypes | Placed order, info status, Stripe sync |

### 3.3 Proposed Complete `frontend/src/app/globals.css`

```css
@import "tailwindcss";

@layer theme, base, components, utilities;

@theme {
  --color-brand-purple: #4A0E4E;
  --color-brand-sidebar: #1a0a1e;
  --color-brand-violet: #7c3aed;
  --color-brand-teal: #14b8a6;
  --color-brand-orange: #FF6B35;
  --color-brand-dark: #0f172a;
  --color-brand-card: #1e293b;
  --color-brand-border: #334155;
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:root {
  --bg-main: #0f172a;
  --bg-card: #1e293b;
  --bg-card-hover: #273549;
  --bg-subtle: #334155;
  --border-color: rgba(255, 255, 255, 0.08);
  --border-color-strong: rgba(255, 255, 255, 0.15);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --purple-dark: #4A0E4E;
  --purple-sidebar: #1a0a1e;
  --purple-primary: #7c3aed;
  --teal-accent: #14b8a6;
  --orange-accent: #FF6B35;
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;
  --info: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-sans);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── CUSTOM SCROLLBARS ── */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* ── STATUS BADGES ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
}

.badge-green {
  background-color: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-yellow {
  background-color: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.badge-red {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-blue {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-purple {
  background-color: rgba(124, 58, 237, 0.15);
  color: #c084fc;
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.badge-orange {
  background-color: rgba(255, 107, 53, 0.15);
  color: #fb923c;
  border: 1px solid rgba(255, 107, 53, 0.3);
}

.badge-gray {
  background-color: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

/* ── LIVE CALL CARDS ── */
.live-call-card {
  background: linear-gradient(135deg, #1a0a1e 0%, #0f172a 100%);
  border-radius: 0.75rem;
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-left: 3px solid #22c55e;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.live-pulse {
  width: 8px;
  height: 8px;
  background-color: #22c55e;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

/* ── KPI & SURFACE CARDS ── */
.panel-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: border-color 0.15s ease;
}

.panel-card:hover {
  border-color: var(--border-color-strong);
}

/* ── TABLES ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.data-table th {
  background-color: rgba(15, 23, 42, 0.6);
  color: var(--text-muted);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.data-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.02);
}
```

---

## 4. Root Layout & Landing Portal Design

### 4.1 Root Layout (`frontend/src/app/layout.tsx`)

#### Font Strategy for Offline Builds
In many deployment or sandboxed environments, network calls to `fonts.googleapis.com` will fail with DNS or timeout errors during `npm run build`. Therefore, rather than importing `next/font/google`, we declare a resilient system font stack in `layout.tsx` and `globals.css` (`Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). This ensures 100% build reliability without external network calls.

#### Proposed `frontend/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkByte AI — Voice Ordering & Operator Admin',
  description:
    'Autonomous AI voice phone ordering system for restaurants and multi-tenant operator platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f172a] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
```

### 4.2 Root Landing Portal (`frontend/src/app/page.tsx`)

`src/app/page.tsx` serves as the entry portal connecting the two main operational applications:
1. **Restaurant Dashboard** (`/dashboard`): Venue operations, live calls, orders pipeline, menu availability.
2. **Operator Admin Panel** (`/admin`): 487-tenant fleet directory, system KPIs, live monitoring, infrastructure health.

#### Design Specifications:
- Built with standard HTML/SVG elements to avoid missing library dependencies (`lucide-react`).
- Uses Next.js `<Link>` for prefetching and client-side transitions.
- Fully responsive (grid layout collapsing to 1 column on mobile, 2 columns on tablet/desktop).
- Displays live platform metrics banner ($0.062/min COGS, 487 Venues, 99.4% Accuracy).

#### Proposed `frontend/src/app/page.tsx`:
```tsx
import Link from 'next/link';

export default function LandingPortalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0a0f1d] text-slate-100 flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#14b8a6] flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-purple-500/20">
            TB
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              TalkByte <span className="text-[#14b8a6]">AI</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Autonomous Voice Ordering & Fleet Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Operational
          </div>
          <span className="text-xs text-slate-500 font-mono">v1.0.0-prod</span>
        </div>
      </header>

      {/* Main Hero & Portals */}
      <section className="max-w-6xl mx-auto w-full my-auto py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
            <span>🚀</span> Next.js 16 • React 19 • Tailwind CSS v4
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-300 to-orange-400">Control Center</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Welcome to the TalkByte AI ecosystem. Manage venue orders and live AI phone calls or monitor the multi-tenant platform fleet.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Portal Card 1: Restaurant Dashboard */}
          <Link
            href="/dashboard"
            className="group relative rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-8 hover:border-purple-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -z-10 group-hover:bg-purple-600/20 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🍽️
                </div>
                <span className="badge badge-purple">Venue App</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Restaurant Dashboard
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Dedicated interface for restaurant managers. Monitor live inbound phone calls, view the visual 4-stage order pipeline, update 30s menu availability, and inspect analytics.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> Real-Time Live Call Audio Intercept
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> 4-Stage Orders Pipeline (Placed → Synced)
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> 30-Second AI Menu Availability Sync
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span> Voice Persona & Greeting Script Settings
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-sm font-semibold text-purple-400 group-hover:text-purple-300">
              <span>Enter Restaurant Dashboard</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
            </div>
          </Link>

          {/* Portal Card 2: Operator Admin Panel */}
          <Link
            href="/admin"
            className="group relative rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-8 hover:border-teal-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl -z-10 group-hover:bg-teal-600/20 transition-all"></div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-900/40 border border-teal-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🛡️
                </div>
                <span className="badge badge-blue">Platform Operator</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                Operator Admin Panel
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Platform-wide control center for TalkByte operations. Supervise 487 tenant venues, live call fleet, unit economics ($0.062/min pipeline COGS), and infrastructure telemetry.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-teal-400 font-bold">✓</span> 487-Tenant Restaurant Fleet Directory
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-teal-400 font-bold">✓</span> Unit Economics & $0.062/min COGS Breakdown
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-teal-400 font-bold">✓</span> 9 Infrastructure Monitors (Telnyx, Deepgram, OpenAI)
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-teal-400 font-bold">✓</span> Immutable Security Audit Log Ledger
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-sm font-semibold text-teal-400 group-hover:text-teal-300">
              <span>Enter Operator Admin Panel</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
            </div>
          </Link>
        </div>

        {/* Telemetry KPI Strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">487</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Active Venues</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">99.4%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Order Accuracy</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-purple-400">$0.062</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">COGS / Min</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-teal-400">14</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Live Calls</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 TalkByte AI Inc. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Supabase Postgres 16</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">FastAPI Backend</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">LiveKit Audio</span>
        </div>
      </footer>
    </main>
  );
}
```

---

## 5. Next.js 16, React 19 & Tailwind v4 Pitfalls & Mitigation Matrix

| # | Pitfall Category | Specific Issue | Root Cause | Impact | Recommended Solution / Mitigation |
|---|---|---|---|---|---|
| 1 | **Next.js 16 Async Request APIs** | Page / Layout `params` and `searchParams` are now asynchronous Promises. | Next.js 15/16 architectural change to enable streaming and partial prerendering. | Accessing `params.id` directly in Server Components causes TypeScript compiler error or runtime object failure. | In Server Components, type as `Promise<{ id: string }>` and `await params`. In Client Components, use `useParams()` or `React.use(params)`. |
| 2 | **React 19 Type Conflicts** | `@types/react@19` incompatibilities with third-party libraries (`recharts`, `@testing-library`). | Third-party packages have peer dependencies or declarations built against React 18 types. | Hundreds of compilation errors during `next build` inside `node_modules`. | Set `"skipLibCheck": true` in `tsconfig.json`. |
| 3 | **Tailwind CSS v4 PostCSS Plugin** | Using `'tailwindcss'` instead of `'@tailwindcss/postcss'` in `postcss.config.mjs`. | In v4, the PostCSS plugin was separated into `@tailwindcss/postcss`. | PostCSS throws `Plugin "tailwindcss" is not a PostCSS plugin` or fails to process styles. | Specify `'@tailwindcss/postcss': {}` in `postcss.config.mjs`. |
| 4 | **Tailwind CSS v4 Syntax** | Using legacy `@tailwind base;` directives in CSS. | Tailwind v4 uses CSS-first `@import "tailwindcss";` and `@theme`. | Build warning or styling failure. | Use `@import "tailwindcss";` and declare custom tokens in `@theme`. |
| 5 | **Missing `lucide-react` Package** | Attempting to import icons from `lucide-react`. | `lucide-react` is not in `package.json` to prevent dependency bloat. | Fatal build failure: `Module not found: Can't resolve 'lucide-react'`. | Use custom self-contained SVG icon system in `src/components/icons.tsx` as mandated by `PROJECT.md`. |
| 6 | **Offline Google Font Fetch Failures** | Using `import { Inter } from 'next/font/google'` in offline builds. | Next.js build attempts to download font files from Google CDN during `next build`. | Fatal build error: `Failed to fetch font from Google Fonts` if network is restricted or offline. | Use system font stack in `globals.css` and `layout.tsx` (`'Inter', system-ui, -apple-system, sans-serif`). |
| 7 | **Recharts SSR Hydration Error** | Rendering Recharts charts directly in Server Components. | Recharts requires `window` and DOM measurements (`ResizeObserver`, SVG bounds). | Runtime error: `window is not defined` or hydration mismatch. | Mark chart container components with `'use client';` and enforce explicit min-height on parent containers. |
| 8 | **ESLint 9 Flat Config Mismatch** | Next.js 16 running against ESLint 9 without flat config. | ESLint 9 defaults to `eslint.config.mjs` flat configuration. | `next lint` fails with config format warnings. | Provide `eslint.config.mjs` using `@eslint/eslintrc` `FlatCompat`. |

---

## 6. Actionable Implementation Instructions for Implementer Agent

When Milestone M1 implementation proceeds, the following files should be written in this specific order:

1. **`frontend/tsconfig.json`**:
   - Write compiler options matching §2.2 (`moduleResolution: "bundler"`, `skipLibCheck: true`, `@/*` paths).
2. **`frontend/next.config.mjs`**:
   - Write configuration matching §2.3 (`reactStrictMode: true`, `images: { unoptimized: true }`).
3. **`frontend/postcss.config.mjs`**:
   - Write PostCSS configuration matching §2.4 (`plugins: { '@tailwindcss/postcss': {} }`).
4. **`frontend/eslint.config.mjs`**:
   - Write ESLint 9 configuration matching §2.5.
5. **`frontend/src/app/globals.css`**:
   - Write the complete CSS file matching §3.3 (`@import "tailwindcss";`, `@theme`, custom scrollbars, badges, live call styling).
6. **`frontend/src/app/layout.tsx`**:
   - Write the root layout matching §4.1 (`<html lang="en" className="dark">`, body font classes, metadata).
7. **`frontend/src/app/page.tsx`**:
   - Write the landing portal matching §4.2 (`/dashboard` and `/admin` cards, system telemetry banner).
8. **Verification Command**:
   - Run `npm run build` in `frontend/` to confirm exit code 0.
