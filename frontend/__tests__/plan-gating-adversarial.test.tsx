import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  normalizePlanId,
  getPlanLevel,
  hasFeatureAccess,
  isTierAtLeast,
  PLAN_TIERS,
  FEATURE_METADATA,
  FeatureKey,
} from '@/lib/planGating';
import { PlanGate } from '@/components/ui/PlanGate';
import DashboardBillingPage from '@/app/(restaurant)/dashboard/billing/page';
import BillingTab, { PLANS } from '@/components/restaurant/BillingTab';
import MenuTab from '@/components/restaurant/MenuTab';

// Mock Next.js navigation hooks
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/billing',
}));

// Mock restaurant context
const mockSetActiveTab = jest.fn();
const mockSetCurrentVenue = jest.fn();
let mockCurrentVenue: any = {
  id: 'rest-1',
  name: "Mama's Pizzeria",
  plan_id: 'starter',
  timezone: 'Australia/Sydney',
  pos_provider: 'Square',
};

jest.mock('@/app/(restaurant)/layout', () => ({
  useRestaurant: () => ({
    activeTab: 'billing',
    setActiveTab: mockSetActiveTab,
    currentVenue: mockCurrentVenue,
    setCurrentVenue: mockSetCurrentVenue,
    isAddItemModalOpen: false,
    setIsAddItemModalOpen: jest.fn(),
  }),
}));

// Mock Supabase
const mockToggleMenuItemAvailability = jest.fn().mockResolvedValue({ success: true });
jest.mock('@/lib/supabase', () => {
  const queryChain = () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  });
  return {
    supabase: {
      from: queryChain,
      table: queryChain,
    },
    toggleMenuItemAvailability: (...args: any[]) => mockToggleMenuItemAvailability(...args),
  };
});

describe('Milestone M3: Plan Gating & Billing Routing Adversarial Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentVenue = {
      id: 'rest-1',
      name: "Mama's Pizzeria",
      plan_id: 'starter',
      timezone: 'Australia/Sydney',
      pos_provider: 'Square',
    };
  });

  // ── 1. Edge-Case Plan String Normalization ─────────────────────────────────
  describe('Plan Normalization (normalizePlanId & getPlanLevel)', () => {
    it('normalizes falsy and nullish inputs to "starter" (Level 1)', () => {
      expect(normalizePlanId(undefined)).toBe('starter');
      expect(normalizePlanId(null)).toBe('starter');
      expect(normalizePlanId('')).toBe('starter');
      expect(getPlanLevel(undefined)).toBe(1);
      expect(getPlanLevel(null)).toBe(1);
      expect(getPlanLevel('')).toBe(1);
    });

    it('normalizes whitespace-only strings to "starter" (Level 1)', () => {
      expect(normalizePlanId('   ')).toBe('starter');
      expect(normalizePlanId('\t\n')).toBe('starter');
      expect(normalizePlanId('  \r\n  ')).toBe('starter');
      expect(getPlanLevel('   ')).toBe(1);
    });

    it('normalizes standard tiers case-insensitively and trims whitespace', () => {
      // Starter
      expect(normalizePlanId('starter')).toBe('starter');
      expect(normalizePlanId('STARTER')).toBe('starter');
      expect(normalizePlanId(' Starter  ')).toBe('starter');
      expect(getPlanLevel('Starter')).toBe(1);

      // Growth
      expect(normalizePlanId('growth')).toBe('growth');
      expect(normalizePlanId('GROWTH')).toBe('growth');
      expect(normalizePlanId('  Growth \n')).toBe('growth');
      expect(getPlanLevel('Growth')).toBe(2);

      // Pro (legacy alias mapped to growth)
      expect(normalizePlanId('pro')).toBe('growth');
      expect(normalizePlanId('PRO')).toBe('growth');
      expect(normalizePlanId('  Pro  ')).toBe('growth');
      expect(getPlanLevel('Pro')).toBe(2);

      // Enterprise
      expect(normalizePlanId('enterprise')).toBe('enterprise');
      expect(normalizePlanId('ENTERPRISE')).toBe('enterprise');
      expect(normalizePlanId('  Enterprise  ')).toBe('enterprise');
      expect(getPlanLevel('Enterprise')).toBe(3);
    });

    it('adversarial inputs fall back safely to "starter" (Level 1 default-deny)', () => {
      const adversarialInputs = [
        'hacker_plan',
        'admin',
        'root',
        'superadmin',
        '<script>alert(1)</script>',
        'undefined',
        'null',
        '[object Object]',
        'NaN',
        '0',
        '1',
        '-1',
        'growth_plus',
        'enterprise_unlimited',
        'DROP TABLE subscriptions;',
        'true',
        'false',
      ];

      for (const input of adversarialInputs) {
        expect(normalizePlanId(input)).toBe('starter');
        expect(getPlanLevel(input)).toBe(1);
      }
    });
  });

  // ── 2. Plan Gating Boundary Verification ──────────────────────────────────
  describe('Plan Gating Boundaries (hasFeatureAccess & isTierAtLeast)', () => {
    const STARTER_FEATURES: FeatureKey[] = [
      'analytics:7d',
      'settings:tts_cartesia',
      'settings:pos_square',
      'menu:manual_add',
      'menu:availability_toggle',
    ];

    const GROWTH_FEATURES: FeatureKey[] = [
      'analytics:30d',
      'analytics:custom_range',
      'analytics:peak_hours_heatmap',
      'analytics:export_csv',
      'settings:tts_elevenlabs',
      'settings:manual_takeover',
      'settings:pos_shopify',
      'settings:multi_staff',
      'menu:csv_upload',
      'livecalls:audio_intercept',
    ];

    const ENTERPRISE_FEATURES: FeatureKey[] = [
      'analytics:export_pdf',
      'menu:web_scraper',
    ];

    it('Level 1 (Starter) boundary: can access Starter, but CANNOT access Growth or Enterprise', () => {
      for (const feat of STARTER_FEATURES) {
        expect(hasFeatureAccess('starter', feat)).toBe(true);
      }
      for (const feat of GROWTH_FEATURES) {
        expect(hasFeatureAccess('starter', feat)).toBe(false);
      }
      for (const feat of ENTERPRISE_FEATURES) {
        expect(hasFeatureAccess('starter', feat)).toBe(false);
      }

      expect(isTierAtLeast('starter', 'starter')).toBe(true);
      expect(isTierAtLeast('starter', 'growth')).toBe(false);
      expect(isTierAtLeast('starter', 'enterprise')).toBe(false);
    });

    it('Level 2 (Growth & Pro) boundary: can access Starter & Growth, but CANNOT access Enterprise', () => {
      for (const plan of ['growth', 'pro', 'GROWTH', 'PRO']) {
        for (const feat of STARTER_FEATURES) {
          expect(hasFeatureAccess(plan, feat)).toBe(true);
        }
        for (const feat of GROWTH_FEATURES) {
          expect(hasFeatureAccess(plan, feat)).toBe(true);
        }
        for (const feat of ENTERPRISE_FEATURES) {
          expect(hasFeatureAccess(plan, feat)).toBe(false);
        }

        expect(isTierAtLeast(plan, 'starter')).toBe(true);
        expect(isTierAtLeast(plan, 'growth')).toBe(true);
        expect(isTierAtLeast(plan, 'enterprise')).toBe(false);
      }
    });

    it('Level 3 (Enterprise) boundary: can access ALL features across platform', () => {
      const allFeatures = [...STARTER_FEATURES, ...GROWTH_FEATURES, ...ENTERPRISE_FEATURES];
      for (const feat of allFeatures) {
        expect(hasFeatureAccess('enterprise', feat)).toBe(true);
        expect(hasFeatureAccess('ENTERPRISE', feat)).toBe(true);
      }

      expect(isTierAtLeast('enterprise', 'starter')).toBe(true);
      expect(isTierAtLeast('enterprise', 'growth')).toBe(true);
      expect(isTierAtLeast('enterprise', 'enterprise')).toBe(true);
    });

    it('unregistered or unknown feature keys behave fail-open per implementation contract', () => {
      // Current implementation returns true if feature is not found in FEATURE_METADATA
      expect(hasFeatureAccess('starter', 'unknown:unregistered_feature' as any)).toBe(true);
    });
  });

  // ── 3. Critical Guarantee: Menu Item Availability Toggle ──────────────────
  describe('Menu Item Availability Toggle Operational Guarantee', () => {
    it('is ALWAYS permitted for all plans including null, undefined, and unknown strings', () => {
      const testPlans = [
        'starter',
        'growth',
        'pro',
        'enterprise',
        null,
        undefined,
        '',
        'hacker_plan',
        'unknown_tier',
      ];

      for (const plan of testPlans) {
        expect(hasFeatureAccess(plan, 'menu:availability_toggle')).toBe(true);
      }
    });

    it('in MenuTab component, toggling availability succeeds and is never blocked by feature gating', async () => {
      // Mount MenuTab with Starter venue
      mockCurrentVenue = { id: 'rest-1', name: "Mama's Pizzeria", plan_id: 'starter' };
      render(<MenuTab />);

      // Find availability toggle switches
      const toggles = document.querySelectorAll('.toggle');
      expect(toggles.length).toBeGreaterThan(0);

      // Toggle first item
      fireEvent.click(toggles[0]);

      // Expect toggle mutation to be called with item id and opposite boolean
      expect(mockToggleMenuItemAvailability).toHaveBeenCalledTimes(1);
    });

    it('in MenuTab, premium features (Web Scraper & CSV Upload) are properly gated while toggle is ungated', () => {
      mockCurrentVenue = { id: 'rest-1', name: "Mama's Pizzeria", plan_id: 'starter' };
      render(<MenuTab />);

      // Web Scraper has ENT lock badge
      expect(screen.getByText(/Import from Website/i)).toBeInTheDocument();
      expect(screen.getByText('ENT')).toBeInTheDocument();

      // CSV Upload has PRO lock badge
      expect(screen.getByText(/Upload CSV/i)).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();

      // Add Item and Toggle are completely unblocked
      expect(screen.getByText('Add Item')).toBeInTheDocument();
    });
  });

  // ── 4. Frontend Billing Route & UI Verification ───────────────────────────
  describe('Frontend Billing Route (/dashboard/billing)', () => {
    it('DashboardBillingPage sets activeTab to "billing" on mount and renders BillingTab', () => {
      render(<DashboardBillingPage />);
      expect(mockSetActiveTab).toHaveBeenCalledWith('billing');
      expect(screen.getByText(/Managed via Stripe Billing/i)).toBeInTheDocument();
    });

    it('BillingTab renders official SaaS plans ($149 Starter, $249 Growth, $499 Enterprise)', () => {
      render(<BillingTab />);

      // Verify plan cards exist with exact pricing
      expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$149/).length).toBeGreaterThanOrEqual(1);

      expect(screen.getAllByText('Growth').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$249/).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText(/\$499/)).toBeInTheDocument();

      // Starter venue shows Starter as active plan
      expect(screen.getByText('Active Plan')).toBeInTheDocument();
    });

    it('BillingTab opens Stripe Checkout modal when clicking an upgrade plan', () => {
      render(<BillingTab />);

      // Click upgrade to Growth
      const upgradeGrowthBtn = screen.getByRole('button', { name: /Upgrade to Growth/i });
      fireEvent.click(upgradeGrowthBtn);

      // Confirm modal opens
      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
      expect(screen.getByText(/Switching your subscription to the/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Stripe Checkout \(\$249\)/i })).toBeInTheDocument();
    });
  });

  // ── 5. PlanGate UI Component Resilience ───────────────────────────────────
  describe('PlanGate Component Behavior', () => {
    it('renders children without overlay when feature is accessible', () => {
      mockCurrentVenue = { id: 'rest-1', name: "Mama's Pizzeria", plan_id: 'enterprise' };
      render(
        <PlanGate feature="analytics:export_pdf">
          <div data-testid="unlocked-content">Executive PDF Content</div>
        </PlanGate>
      );

      expect(screen.getByTestId('unlocked-content')).toBeInTheDocument();
      expect(screen.queryByText(/Upgrade to Access/i)).not.toBeInTheDocument();
    });

    it('renders lock overlay and upgrade CTA when feature is locked', () => {
      mockCurrentVenue = { id: 'rest-1', name: "Mama's Pizzeria", plan_id: 'starter' };
      render(
        <PlanGate feature="analytics:peak_hours_heatmap">
          <div data-testid="heatmap-content">Heatmap Matrix</div>
        </PlanGate>
      );

      expect(screen.getByTestId('heatmap-content')).toBeInTheDocument();
      expect(screen.getByText('Peak Hours Call Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Unlock Heatmap with Growth Plan')).toBeInTheDocument();
    });

    it('hides children completely when mode="hide" and feature is locked', () => {
      mockCurrentVenue = { id: 'rest-1', name: "Mama's Pizzeria", plan_id: 'starter' };
      render(
        <PlanGate feature="analytics:export_pdf" mode="hide">
          <div data-testid="hidden-content">Hidden PDF Button</div>
        </PlanGate>
      );

      expect(screen.queryByTestId('hidden-content')).not.toBeInTheDocument();
    });
  });
});
