# Technical Analysis: Feature Gating Architecture & Dashboard Integration (M3-3)

**Date**: 2026-09-14  
**Agent**: explorer_m3_3  
**Parent**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f  
**Milestone**: M3 — SaaS Subscription Billing for Restaurants (Requirement R2)  
**Status**: Investigation Complete & Architecture Documented  

---

## 1. Executive Summary

Requirement **R2** states:
> *"Access to premium dashboard features must be gated based on `plan_id`."*

Currently, the frontend dashboard allows unrestricted access across all features regardless of the venue's active subscription plan (`restaurants.plan_id`). Neither `frontend/src/lib/planGating.ts` nor `frontend/src/components/ui/PlanGate.tsx` exists in the codebase yet.

This report provides the full architectural design, data models, component blueprints, and exact integration points across **`AnalyticsTab.tsx`**, **`SettingsTab.tsx`**, **`MenuTab.tsx`**, and supporting dashboard components to enforce plan gating cleanly, maintain high conversion UX, and guarantee zero regressions on automated Playwright test journeys.

---

## 2. Current Codebase State Analysis

### 2.1 Schema & Data Models
1. **Database Schema (`backend/supabase_schema.sql`)**:
   - Defines the `plans` table with 3 base tiers:
     - `starter`: 500 calls/mo, $149 AUD ($14,900 cents)
     - `growth`: 2,000 calls/mo, $249 AUD ($24,900 cents)
     - `enterprise`: 10,000 calls/mo, $499 AUD ($49,900 cents)
   - `restaurants.plan_id` is a foreign key to `plans(id)` defaulting to `'starter'`.
2. **TypeScript Definitions (`frontend/src/types/database.types.ts`)**:
   - `Restaurant.plan_id` typed as `'starter' | 'growth' | 'enterprise' | string`.
   - `Plan.id` typed as `'starter' | 'growth' | 'enterprise' | string`.
3. **Mock Data (`frontend/src/lib/mockData.ts`)**:
   - `MOCK_RESTAURANT` (Mama's Pizzeria): `plan_id: 'growth'`
   - `MOCK_FLEET_RESTAURANTS`:
     - `Mama's Pizzeria`: `growth`
     - `Bondi Burger Co`: `enterprise`
     - `Little Italy Carlton`: `growth`
     - `Golden Dragon Dumplings`: `starter`
     - `Byron Bay Burritos`: `growth`
4. **Context & State Flow (`frontend/src/app/(restaurant)/layout.tsx`)**:
   - `RestaurantLayout` wraps the entire dashboard and provides `useRestaurant()` context:
     - `currentVenue: Restaurant | null`
     - `setCurrentVenue: (venue: Restaurant) => void`
     - `activeTab: TabId`
     - `setActiveTab: (tab: TabId) => void`
   - Switching restaurants via the top-left Venue Picker automatically changes `currentVenue`. This provides an immediate, zero-friction mechanism to test different subscription tiers in real time.

---

## 3. Plan Hierarchy & Feature Matrix

### 3.1 Tier Normalization & Levels
To unify schema keys (`growth`) and prototype terminology (`pro`), the gating architecture normalizes plans into 3 ascending numeric levels:

| Tier Key | Level | Display Name | Monthly AUD | Call Limit | Target Customer |
|---|---|---|---|---|---|
| `starter` | **1** | Starter | $149 | 500 calls | Single-location boutique cafes/takeaway |
| `growth` / `pro` | **2** | Growth / Pro | $249 | 2,000 calls | Fast-casual & high-volume dining |
| `enterprise` | **3** | Enterprise | $499 | 10,000+ calls | Multi-unit restaurant groups & franchises |

*Note: In `normalizePlanId(id)`, `'pro'` maps to Level 2 (same as `'growth'`), ensuring full backwards compatibility with prototype fixtures.*

### 3.2 Feature Gating Matrix

| Feature Key | Min Level | Min Tier | Target Tab / Component | Gating UX Behavior |
|---|---|---|---|---|
| `analytics:7d` | **1** | Starter | `AnalyticsTab.tsx` | Available to all plans |
| `analytics:30d` | **2** | Growth/Pro | `AnalyticsTab.tsx` | Badge `PRO`, click triggers upgrade modal |
| `analytics:custom_range` | **2** | Growth/Pro | `AnalyticsTab.tsx` | Badge `PRO`, click triggers upgrade modal |
| `analytics:peak_hours_heatmap` | **2** | Growth/Pro | `AnalyticsTab.tsx` | Glassmorphic blur overlay with upgrade CTA |
| `analytics:export_csv` | **2** | Growth/Pro | Topbar Export Modal | Unlocked for Growth+, locked for Starter |
| `analytics:export_pdf` | **3** | Enterprise | Topbar Export Modal | Badge `ENTERPRISE`, locked for Starter & Growth |
| `settings:tts_cartesia` | **1** | Starter | `SettingsTab.tsx` | Default available to all plans |
| `settings:tts_elevenlabs` | **2** | Growth/Pro | `SettingsTab.tsx` | Disabled option or intercepted select with upgrade prompt |
| `settings:manual_takeover` | **2** | Growth/Pro | `SettingsTab.tsx` | Disabled toggle with lock badge & upgrade prompt |
| `settings:pos_square` | **1** | Starter | `SettingsTab.tsx` | Available to all plans |
| `settings:pos_shopify` | **2** | Growth/Pro | `SettingsTab.tsx` | "Connect" button displays `PRO` badge & upgrade prompt |
| `settings:multi_staff` | **2** | Growth/Pro | `SettingsTab.tsx` | Starter limited to 1 owner; invite triggers upgrade prompt |
| `menu:manual_add` | **1** | Starter | `MenuTab.tsx` | Unlocked for all plans (essential core journey) |
| `menu:availability_toggle` | **1** | Starter | `MenuTab.tsx` | Unlocked for all plans (Playwright Journey 2) |
| `menu:csv_upload` | **2** | Growth/Pro | `MenuTab.tsx` | Button has `PRO` badge; opens upgrade prompt on Starter |
| `menu:web_scraper` | **3** | Enterprise | `MenuTab.tsx` | Button has `ENTERPRISE` badge; opens upgrade modal |
| `livecalls:audio_intercept` | **2** | Growth/Pro | `LiveCallsTab.tsx` | Intercept / Monitor buttons require Growth/Pro |

---

## 4. Architectural Specification: `planGating.ts`

**Target File**: `frontend/src/lib/planGating.ts`

### 4.1 Responsibilities
1. Define type-safe `PlanTier` and `FeatureKey` enums.
2. Provide pure, deterministic helper functions:
   - `normalizePlanId(planId?: string | null): PlanTier`
   - `getPlanLevel(planId?: string | null): number`
   - `hasFeatureAccess(planId: string | null | undefined, feature: FeatureKey): boolean`
   - `isTierAtLeast(planId: string | null | undefined, requiredTier: PlanTier): boolean`
   - `getFeatureMetadata(feature: FeatureKey)`
3. Provide a custom React hook `usePlanGating()` that consumes `useRestaurant()` and returns the current venue's gating capabilities and upgrade helpers.

### 4.2 Proposed Code Implementation

```typescript
import { useRestaurant } from '@/app/(restaurant)/layout';

export type PlanTier = 'starter' | 'growth' | 'pro' | 'enterprise';

export type FeatureKey =
  // Analytics Tab
  | 'analytics:7d'
  | 'analytics:30d'
  | 'analytics:custom_range'
  | 'analytics:peak_hours_heatmap'
  | 'analytics:export_csv'
  | 'analytics:export_pdf'
  // Settings Tab
  | 'settings:tts_cartesia'
  | 'settings:tts_elevenlabs'
  | 'settings:manual_takeover'
  | 'settings:pos_square'
  | 'settings:pos_shopify'
  | 'settings:multi_staff'
  // Menu Tab
  | 'menu:manual_add'
  | 'menu:availability_toggle'
  | 'menu:csv_upload'
  | 'menu:web_scraper'
  // Live Calls Tab
  | 'livecalls:audio_intercept';

export interface PlanTierConfig {
  id: PlanTier;
  name: string;
  level: number;
  monthlyPrice: number;
  callLimit: number;
  badgeLabel: string;
  badgeColorClass: string;
}

export const PLAN_TIERS: Record<PlanTier, PlanTierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    level: 1,
    monthlyPrice: 149,
    callLimit: 500,
    badgeLabel: 'Starter',
    badgeColorClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    level: 2,
    monthlyPrice: 249,
    callLimit: 2000,
    badgeLabel: 'Growth',
    badgeColorClass: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    level: 2,
    monthlyPrice: 249,
    callLimit: 2000,
    badgeLabel: 'Pro',
    badgeColorClass: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    level: 3,
    monthlyPrice: 499,
    callLimit: 10000,
    badgeLabel: 'Enterprise',
    badgeColorClass: 'bg-teal-100 text-teal-700 border-teal-300',
  },
};

export interface FeatureMetadata {
  minLevel: number;
  minTier: PlanTier;
  title: string;
  description: string;
  upgradeCtaText: string;
}

export const FEATURE_METADATA: Record<FeatureKey, FeatureMetadata> = {
  'analytics:7d': {
    minLevel: 1,
    minTier: 'starter',
    title: '7-Day Call Volume & Revenue',
    description: 'Basic 7-day operational analytics.',
    upgradeCtaText: '',
  },
  'analytics:30d': {
    minLevel: 2,
    minTier: 'growth',
    title: '30-Day Trend Analysis',
    description: 'Access extended monthly metrics and call trend history.',
    upgradeCtaText: 'Upgrade to Growth for 30-day analytics',
  },
  'analytics:custom_range': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Custom Date Range Analytics',
    description: 'Filter orders and calls by custom calendar intervals.',
    upgradeCtaText: 'Upgrade to Growth for custom ranges',
  },
  'analytics:peak_hours_heatmap': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Peak Hours Call Heatmap',
    description: 'Hourly call density matrix identifying peak rush periods and staffing gaps.',
    upgradeCtaText: 'Unlock Heatmap with Growth Plan',
  },
  'analytics:export_csv': {
    minLevel: 2,
    minTier: 'growth',
    title: 'CSV Data Export',
    description: 'Export raw call, order, and revenue logs to CSV format.',
    upgradeCtaText: 'Upgrade to Growth to export CSV data',
  },
  'analytics:export_pdf': {
    minLevel: 3,
    minTier: 'enterprise',
    title: 'Executive PDF Summary',
    description: 'Automated executive summary reports formatted for stakeholders.',
    upgradeCtaText: 'Upgrade to Enterprise for PDF exports',
  },
  'settings:tts_cartesia': {
    minLevel: 1,
    minTier: 'starter',
    title: 'Cartesia Sonic Voice',
    description: 'Standard ultra-low latency conversational voice.',
    upgradeCtaText: '',
  },
  'settings:tts_elevenlabs': {
    minLevel: 2,
    minTier: 'growth',
    title: 'ElevenLabs Neural TTS',
    description: 'Ultra-realistic neural voice models with customizable emotional nuances.',
    upgradeCtaText: 'Upgrade to Growth to unlock ElevenLabs voices',
  },
  'settings:manual_takeover': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Live Call Manual Takeover',
    description: 'Allows floor staff to intercept active AI phone calls in real time.',
    upgradeCtaText: 'Upgrade to Growth to enable manual call takeover',
  },
  'settings:pos_square': {
    minLevel: 1,
    minTier: 'starter',
    title: 'Square POS Connector',
    description: 'Two-way menu and order injection with Square POS.',
    upgradeCtaText: '',
  },
  'settings:pos_shopify': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Shopify POS Connector',
    description: 'Real-time catalog synchronization with Shopify POS.',
    upgradeCtaText: 'Upgrade to Growth to connect Shopify POS',
  },
  'settings:multi_staff': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Multi-User Staff Permissions',
    description: 'Invite managers and floor staff with role-based access control.',
    upgradeCtaText: 'Upgrade to Growth to add staff members',
  },
  'menu:manual_add': {
    minLevel: 1,
    minTier: 'starter',
    title: 'Manual Menu Item Addition',
    description: 'Add individual items to your menu catalog.',
    upgradeCtaText: '',
  },
  'menu:availability_toggle': {
    minLevel: 1,
    minTier: 'starter',
    title: 'Instant 30s Availability Toggle',
    description: 'Update AI availability in real-time.',
    upgradeCtaText: '',
  },
  'menu:csv_upload': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Bulk CSV Menu Upload',
    description: 'Import entire menus with hundreds of items from a spreadsheet.',
    upgradeCtaText: 'Upgrade to Growth for bulk CSV imports',
  },
  'menu:web_scraper': {
    minLevel: 3,
    minTier: 'enterprise',
    title: 'Automated Web Menu Crawler',
    description: 'AI crawler extracts menu items, descriptions, and pricing directly from your website.',
    upgradeCtaText: 'Upgrade to Enterprise for website menu scraping',
  },
  'livecalls:audio_intercept': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Real-time Audio Intercept',
    description: 'Listen to live call audio streams and inject voice.',
    upgradeCtaText: 'Upgrade to Growth for live audio monitoring',
  },
};

/**
 * Normalizes any plan string into a valid PlanTier.
 */
export function normalizePlanId(planId?: string | null): PlanTier {
  if (!planId) return 'starter';
  const clean = planId.toLowerCase().trim();
  if (clean === 'enterprise') return 'enterprise';
  if (clean === 'growth' || clean === 'pro') return 'growth';
  return 'starter';
}

/**
 * Gets the numeric access level (1 = Starter, 2 = Growth/Pro, 3 = Enterprise).
 */
export function getPlanLevel(planId?: string | null): number {
  const tier = normalizePlanId(planId);
  return PLAN_TIERS[tier].level;
}

/**
 * Pure checker: whether a plan has access to a given feature.
 */
export function hasFeatureAccess(
  planId: string | null | undefined,
  feature: FeatureKey
): boolean {
  const level = getPlanLevel(planId);
  const required = FEATURE_METADATA[feature];
  return level >= required.minLevel;
}

/**
 * Pure checker: whether a plan meets or exceeds a target tier level.
 */
export function isTierAtLeast(
  planId: string | null | undefined,
  requiredTier: PlanTier
): boolean {
  const level = getPlanLevel(planId);
  const targetLevel = PLAN_TIERS[requiredTier].level;
  return level >= targetLevel;
}

/**
 * Hook for consuming plan gating state inside any restaurant dashboard component.
 */
export function usePlanGating() {
  const { currentVenue, setActiveTab } = useRestaurant();
  const rawPlanId = currentVenue?.plan_id;
  const currentTier = normalizePlanId(rawPlanId);
  const currentLevel = getPlanLevel(rawPlanId);
  const currentTierConfig = PLAN_TIERS[currentTier];

  const canAccess = (feature: FeatureKey): boolean => {
    return hasFeatureAccess(rawPlanId, feature);
  };

  const isAtLeast = (tier: PlanTier): boolean => {
    return isTierAtLeast(rawPlanId, tier);
  };

  const navigateToBilling = () => {
    setActiveTab('billing');
  };

  return {
    rawPlanId,
    currentTier,
    currentLevel,
    currentTierConfig,
    canAccess,
    isAtLeast,
    navigateToBilling,
    getFeatureMeta: (feat: FeatureKey) => FEATURE_METADATA[feat],
  };
}
```

---

## 5. Architectural Specification: `PlanGate.tsx`

**Target File**: `frontend/src/components/ui/PlanGate.tsx`

### 5.1 Design Goals
1. **Glassmorphic / Overlay Mode**: Render premium sections (e.g. Peak Hours Heatmap) in place with a gentle blur, displaying a lock badge and clear call-to-action to upgrade. This acts as an effective sales conversion tool inside the dashboard without disrupting page layout.
2. **Inline / Action Mode**: Render buttons or controls with a subtle lock badge (`PRO` / `ENTERPRISE`), intercepting clicks with an informative upgrade dialog.
3. **Upgrade Modal (`PlanUpgradeModal`)**: An accessible dialog providing transparent tier comparison, price difference, feature explanation, and a 1-click button routing to `/dashboard/billing` (`setActiveTab('billing')`).

### 5.2 Proposed Code Implementation

```typescript
'use client';

import React, { useState } from 'react';
import { usePlanGating, FeatureKey, PlanTier } from '@/lib/planGating';
import { XIcon } from '@/components/icons';

// Self-contained SVG Lock Icon
export const LockIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

interface PlanGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'overlay' | 'inline' | 'hide';
  className?: string;
}

export const PlanGate: React.FC<PlanGateProps> = ({
  feature,
  children,
  fallback,
  mode = 'overlay',
  className = '',
}) => {
  const { canAccess, getFeatureMeta, navigateToBilling } = usePlanGating();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasAccess = canAccess(feature);

  // If user has access, render content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // If a custom fallback is provided, render it directly
  if (fallback) {
    return <>{fallback}</>;
  }

  // Hide mode: completely unmount
  if (mode === 'hide') {
    return null;
  }

  const meta = getFeatureMeta(feature);
  const requiredBadge = meta.minLevel === 3 ? 'ENTERPRISE' : 'PRO';

  // Inline mode: render children wrapped in an interceptor container
  if (mode === 'inline') {
    return (
      <>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={`relative cursor-pointer group ${className}`}
          title={meta.upgradeCtaText}
        >
          <div className="opacity-60 pointer-events-none">{children}</div>
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
            <LockIcon size={10} />
            {requiredBadge}
          </span>
        </div>

        {isModalOpen && (
          <PlanUpgradeModal
            feature={feature}
            onClose={() => setIsModalOpen(false)}
            onUpgrade={() => {
              setIsModalOpen(false);
              navigateToBilling();
            }}
          />
        )}
      </>
    );
  }

  // Overlay mode (default for containers, charts, widgets)
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Blurred background content */}
      <div className="filter blur-[3px] opacity-40 select-none pointer-events-none">
        {children}
      </div>

      {/* Centered Lock Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/10 backdrop-blur-[2px]">
        <div className="bg-white/95 border border-purple-200/80 shadow-2xl rounded-2xl p-6 max-w-sm text-center transform transition-transform hover:scale-102">
          <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
            <LockIcon size={20} />
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-2">
            {requiredBadge} Feature
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-1">
            {meta.title}
          </h4>

          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            {meta.description}
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{meta.upgradeCtaText || 'Upgrade to Access'}</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <PlanUpgradeModal
          feature={feature}
          onClose={() => setIsModalOpen(false)}
          onUpgrade={() => {
            setIsModalOpen(false);
            navigateToBilling();
          }}
        />
      )}
    </div>
  );
};

// ── Upgrade Confirmation Modal Component ─────────────────────────────────────
export const PlanUpgradeModal: React.FC<{
  feature: FeatureKey;
  onClose: () => void;
  onUpgrade: () => void;
}> = ({ feature, onClose, onUpgrade }) => {
  const { currentTierConfig, getFeatureMeta } = usePlanGating();
  const meta = getFeatureMeta(feature);
  const targetTierName = meta.minLevel === 3 ? 'Enterprise' : 'Growth';
  const targetPrice = meta.minLevel === 3 ? '$499 AUD/mo' : '$249 AUD/mo';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <LockIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Unlock {meta.title}
              </h3>
              <p className="text-[11px] text-gray-400">
                Current Plan: <span className="font-semibold text-gray-700">{currentTierConfig.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            {meta.description} This capability requires an upgrade to the{' '}
            <strong className="text-purple-700">{targetTierName} Plan</strong> ({targetPrice}).
          </p>

          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="font-semibold text-purple-900">
              What&apos;s included in {targetTierName}:
            </div>
            <ul className="list-disc list-inside text-purple-800/80 space-y-0.5 text-[11px]">
              {meta.minLevel === 3 ? (
                <>
                  <li>Unlimited automated website menu crawler</li>
                  <li>Dedicated Telnyx phone numbers</li>
                  <li>Custom AI voice persona prompts</li>
                  <li>10,000 inbound calls/month included</li>
                </>
              ) : (
                <>
                  <li>30-day extended analytics & peak hours heatmap</li>
                  <li>ElevenLabs high-definition neural voices</li>
                  <li>Live manual call takeover & audio interception</li>
                  <li>2,000 inbound calls/month included</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1"
          >
            Go to Billing & Upgrade →
          </button>
        </div>
      </div>
    </div>
  );
};
export default PlanGate;
```

---

## 6. Detailed Integration Plan & Diffs across Dashboard Tabs

### 6.1 `AnalyticsTab.tsx` Integration

#### Points of Gating:
1. **Timeframe Switcher** (`30d` and `custom`):
   - Starter plan venues see `30 Days` and `Custom` with a lock icon / `PRO` tag.
   - Clicking `30 Days` or `Custom` while on Starter triggers `PlanUpgradeModal`.
2. **Peak Hours Heatmap**:
   - Gated with `<PlanGate feature="analytics:peak_hours_heatmap">`.
   - On Starter plan venues, the heatmap grid is blurred with an upgrade card in the center.

#### Code Diff Blueprint for `AnalyticsTab.tsx`:
```diff
+ import { usePlanGating } from '@/lib/planGating';
+ import { PlanGate, LockIcon, PlanUpgradeModal } from '@/components/ui/PlanGate';

  export const AnalyticsTab: React.FC = () => {
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'custom'>('7d');
+   const { canAccess, navigateToBilling } = usePlanGating();
+   const [upgradeModalFeature, setUpgradeModalFeature] = useState<any>(null);

+   const handleSelectTimeframe = (target: '7d' | '30d' | 'custom') => {
+     if (target === '30d' && !canAccess('analytics:30d')) {
+       setUpgradeModalFeature('analytics:30d');
+       return;
+     }
+     if (target === 'custom' && !canAccess('analytics:custom_range')) {
+       setUpgradeModalFeature('analytics:custom_range');
+       return;
+     }
+     setTimeframe(target);
+   };

    return (
      <div className="section active space-y-6">
        {/* Timeframe Scope Switcher */}
        <div className="flex gap-2.5">
          <button
-           onClick={() => setTimeframe('7d')}
+           onClick={() => handleSelectTimeframe('7d')}
            className={`topbar-btn text-xs ${timeframe === '7d' ? 'btn-primary' : 'btn-ghost'}`}
          >
            7 Days
          </button>
          <button
-           onClick={() => setTimeframe('30d')}
+           onClick={() => handleSelectTimeframe('30d')}
            className={`topbar-btn text-xs flex items-center gap-1 ${timeframe === '30d' ? 'btn-primary' : 'btn-ghost'}`}
          >
            30 Days
+           {!canAccess('analytics:30d') && (
+             <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">PRO</span>
+           )}
          </button>
          <button
-           onClick={() => setTimeframe('custom')}
+           onClick={() => handleSelectTimeframe('custom')}
            className={`topbar-btn text-xs flex items-center gap-1 ${timeframe === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Custom
+           {!canAccess('analytics:custom_range') && (
+             <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">PRO</span>
+           )}
          </button>
        </div>

...

        {/* Peak Hours Heatmap */}
+       <PlanGate feature="analytics:peak_hours_heatmap">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span className="card-title">Peak Hours Heatmap</span>
              ...
            </div>
            <div className="card-body">
              {/* Heatmap Grid */}
            </div>
          </div>
+       </PlanGate>

+       {upgradeModalFeature && (
+         <PlanUpgradeModal
+           feature={upgradeModalFeature}
+           onClose={() => setUpgradeModalFeature(null)}
+           onUpgrade={() => {
+             setUpgradeModalFeature(null);
+             navigateToBilling();
+           }}
+         />
+       )}
      </div>
    );
```

---

### 6.2 `SettingsTab.tsx` Integration

#### Points of Gating:
1. **TTS Provider Select**:
   - `ElevenLabs (High Quality)` option is marked with `[Growth/Pro Plan]`.
   - If selected by a Starter plan user, intercept selection, keep Cartesia, and trigger `PlanUpgradeModal`.
2. **Allow Manual Takeover Toggle**:
   - Gated with `settings:manual_takeover`.
   - For Starter plan users, clicking toggle prompts the upgrade modal.
3. **Shopify POS Connector**:
   - "Connect" button gated with `settings:pos_shopify`.
   - Shows `PRO` badge and triggers upgrade modal.
4. **Staff Invite Button**:
   - Multi-staff invitations gated with `settings:multi_staff`.

#### Code Diff Blueprint for `SettingsTab.tsx`:
```diff
+ import { usePlanGating } from '@/lib/planGating';
+ import { PlanUpgradeModal, LockIcon } from '@/components/ui/PlanGate';

  export const SettingsTab: React.FC = () => {
+   const { canAccess, navigateToBilling } = usePlanGating();
+   const [upgradeFeature, setUpgradeFeature] = useState<any>(null);

    // AI Voice Settings State
+   const [ttsProvider, setTtsProvider] = useState<'cartesia' | 'elevenlabs'>('cartesia');

+   const handleTtsChange = (newVal: 'cartesia' | 'elevenlabs') => {
+     if (newVal === 'elevenlabs' && !canAccess('settings:tts_elevenlabs')) {
+       setUpgradeFeature('settings:tts_elevenlabs');
+       return;
+     }
+     setTtsProvider(newVal);
+   };

    return (
      ...
        {/* TTS Provider */}
        <div className="input-group">
          <div className="input-label">TTS Provider (Text-to-Speech)</div>
          <select
-           defaultValue="cartesia"
+           value={ttsProvider}
+           onChange={(e) => handleTtsChange(e.target.value as any)}
          >
            <option value="cartesia">Cartesia Sonic (Ultra-low Latency)</option>
            <option value="elevenlabs">
-             ElevenLabs (High Quality)
+             ElevenLabs (High Quality) {!canAccess('settings:tts_elevenlabs') ? '🔒 [Growth/Pro]' : ''}
            </option>
          </select>
        </div>

        {/* Manual Takeover */}
        <div className="settings-row">
          <div>
            <div className="setting-label flex items-center gap-1.5">
              Allow Manual Takeover
+             {!canAccess('settings:manual_takeover') && (
+               <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
+                 <LockIcon size={10} /> PRO
+               </span>
+             )}
            </div>
            <div className="setting-desc">
              Staff can intercept active AI calls from dashboard
            </div>
          </div>
          <div
            className={`toggle ${allowManualTakeover ? 'on' : ''} ${!canAccess('settings:manual_takeover') ? 'opacity-60 cursor-pointer' : ''}`}
            onClick={() => {
+             if (!canAccess('settings:manual_takeover')) {
+               setUpgradeFeature('settings:manual_takeover');
+               return;
+             }
              setAllowManualTakeover(!allowManualTakeover);
            }}
          />
        </div>

        {/* Shopify POS */}
        <div className="integration-row">
          ...
          <button
            type="button"
            onClick={() => {
+             if (!canAccess('settings:pos_shopify')) {
+               setUpgradeFeature('settings:pos_shopify');
+               return;
+             }
              setShopifyConnected(true);
              showToast('Shopify POS connector initialized.');
            }}
            className="topbar-btn btn-ghost flex items-center gap-1"
          >
            Connect
+           {!canAccess('settings:pos_shopify') && (
+             <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">PRO</span>
+           )}
          </button>
        </div>

+       {upgradeFeature && (
+         <PlanUpgradeModal
+           feature={upgradeFeature}
+           onClose={() => setUpgradeFeature(null)}
+           onUpgrade={() => {
+             setUpgradeFeature(null);
+             navigateToBilling();
+           }}
+         />
+       )}
```

---

### 6.3 `MenuTab.tsx` Integration

#### Points of Gating:
1. **Import from Website (Web Scraper)**:
   - Gated to Enterprise (`menu:web_scraper`).
   - Displays `ENTERPRISE` badge. On non-enterprise plans, opens `PlanUpgradeModal`.
2. **Upload CSV (Bulk Menu Ingestion)**:
   - Gated to Growth/Pro (`menu:csv_upload`).
   - Displays `PRO` badge. On Starter, opens `PlanUpgradeModal`.
3. **Availability Toggle**:
   - Remains completely unlocked across all tiers to guarantee Playwright Journey 2 succeeds.

#### Code Diff Blueprint for `MenuTab.tsx`:
```diff
+ import { usePlanGating } from '@/lib/planGating';
+ import { PlanUpgradeModal, LockIcon } from '@/components/ui/PlanGate';

  export const MenuTab: React.FC<MenuTabProps> = ({ ... }) => {
+   const { canAccess, navigateToBilling } = usePlanGating();
+   const [upgradeFeature, setUpgradeFeature] = useState<any>(null);

    return (
      <div className="section active space-y-6">
        <div className="flex items-center gap-2.5">
          <button
-           onClick={() => setIsImportModalOpen(true)}
+           onClick={() => {
+             if (!canAccess('menu:web_scraper')) {
+               setUpgradeFeature('menu:web_scraper');
+               return;
+             }
+             setIsImportModalOpen(true);
+           }}
            className="topbar-btn btn-ghost text-xs flex items-center gap-1.5"
          >
            📥 Import from Website
+           {!canAccess('menu:web_scraper') && (
+             <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
+               <LockIcon size={9} /> ENT
+             </span>
+           )}
          </button>

          <button
-           onClick={() => setIsUploadCsvOpen(true)}
+           onClick={() => {
+             if (!canAccess('menu:csv_upload')) {
+               setUpgradeFeature('menu:csv_upload');
+               return;
+             }
+             setIsUploadCsvOpen(true);
+           }}
            className="topbar-btn btn-ghost text-xs flex items-center gap-1"
          >
            Upload CSV
+           {!canAccess('menu:csv_upload') && (
+             <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">PRO</span>
+           )}
          </button>

          <button
            onClick={() => setAddItemOpen(true)}
            className="topbar-btn btn-primary text-xs flex items-center gap-1.5"
          >
            <PlusIcon size={14} />
            Add Item
          </button>
        </div>

...

+       {upgradeFeature && (
+         <PlanUpgradeModal
+           feature={upgradeFeature}
+           onClose={() => setUpgradeFeature(null)}
+           onUpgrade={() => {
+             setUpgradeFeature(null);
+             navigateToBilling();
+           }}
+         />
+       )}
      </div>
    );
```

---

## 7. Integration Touchpoint: Global Export Modal (`layout.tsx`)

In `frontend/src/app/(restaurant)/layout.tsx`:
The sticky topbar has an "Export" button opening a modal with two options:
1. **CSV Export**: Gated to Growth/Pro+ (`analytics:export_csv`).
2. **PDF Executive Summary**: Gated to Enterprise (`analytics:export_pdf`).

Integrating gating badges on these options provides consistent gating feedback globally across the application.

---

## 8. Verification & Test Strategy

### 8.1 Multi-Tenant Switching Verification
The venue picker in the restaurant layout contains 5 pre-seeded restaurants with different `plan_id` values:
1. **Golden Dragon Dumplings** (`plan_id: 'starter'`):
   - Heatmap is blurred with Lock Overlay.
   - 30d/Custom timeframe shows PRO lock badge.
   - Web Scraper shows ENT lock badge and opens upgrade modal.
   - ElevenLabs voice shows Growth/Pro prompt.
2. **Mama's Pizzeria** (`plan_id: 'growth'`):
   - Heatmap is completely unlocked and interactive.
   - 30d/Custom timeframe is unlocked.
   - ElevenLabs and Manual Takeover are enabled.
   - Web Scraper shows ENT lock badge and opens upgrade modal.
3. **Bondi Burger Co** (`plan_id: 'enterprise'`):
   - All features unlocked: Heatmap, 30d, ElevenLabs, Shopify POS, and Web Scraper.

### 8.2 Playwright Test Safety
1. **Journey 1 (`owner-login.spec.ts`)**: Loads dashboard for Mama's Pizzeria (`growth`). KPI cards and live calls load without interference.
2. **Journey 2 (`menu-availability.spec.ts`)**: Menu item availability toggle is intentionally UNGATED and functions identically on all plans.
3. **Journey 3 (`admin-login.spec.ts`)**: Admin views remain independent of restaurant gating.
4. **Build Check**: All new code is strictly typed with TypeScript, with zero missing icon imports or undefined references.

---

## 9. Implementation Checklist for Coder Agent

- [ ] Create `frontend/src/lib/planGating.ts` with tiers, features, helpers, and `usePlanGating()` hook.
- [ ] Create `frontend/src/components/ui/PlanGate.tsx` with `PlanGate` component, `LockIcon`, and `PlanUpgradeModal`.
- [ ] Update `frontend/src/components/restaurant/AnalyticsTab.tsx` with timeframe gating and Peak Hours Heatmap overlay.
- [ ] Update `frontend/src/components/restaurant/SettingsTab.tsx` with ElevenLabs, manual takeover, and Shopify POS gating.
- [ ] Update `frontend/src/components/restaurant/MenuTab.tsx` with Web Scraper and CSV upload gating.
- [ ] Verify `npm run build` in `frontend/` succeeds with exit code 0.
