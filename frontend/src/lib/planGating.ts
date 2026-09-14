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
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  level: number;
  monthlyPrice: number;
  callLimit: number;
  badgeLabel: string;
  badgeColorClass: string;
}

export const PLAN_TIERS: Record<'starter' | 'growth' | 'enterprise', PlanTierConfig> = {
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
  minTier: 'starter' | 'growth' | 'enterprise';
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
    description: 'Access extended monthly metrics, call history, and revenue performance over 30 days.',
    upgradeCtaText: 'Upgrade to Growth for 30-day analytics',
  },
  'analytics:custom_range': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Custom Date Range Analytics',
    description: 'Filter orders and call statistics across custom calendar intervals.',
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
    description: 'Export raw call logs, orders, and revenue tables to CSV format.',
    upgradeCtaText: 'Upgrade to Growth to export CSV data',
  },
  'analytics:export_pdf': {
    minLevel: 3,
    minTier: 'enterprise',
    title: 'Executive PDF Summary',
    description: 'Automated executive summary reports formatted for stakeholders and multi-unit operators.',
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
    description: 'Ultra-realistic neural voice models with customizable emotional nuances and accent support.',
    upgradeCtaText: 'Upgrade to Growth to unlock ElevenLabs voices',
  },
  'settings:manual_takeover': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Live Call Manual Takeover',
    description: 'Allows floor staff to intercept and monitor active AI phone calls in real time.',
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
    description: 'Real-time catalog synchronization and order injection with Shopify POS.',
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
    description: 'Update AI availability in real-time within 30 seconds.',
    upgradeCtaText: '',
  },
  'menu:csv_upload': {
    minLevel: 2,
    minTier: 'growth',
    title: 'Bulk CSV Menu Upload',
    description: 'Import entire menus with hundreds of items from a spreadsheet in seconds.',
    upgradeCtaText: 'Upgrade to Growth for bulk CSV imports',
  },
  'menu:web_scraper': {
    minLevel: 3,
    minTier: 'enterprise',
    title: 'Automated Web Menu Crawler',
    description: 'AI crawler extracts menu items, descriptions, and pricing directly from your restaurant website.',
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
 * Normalizes any plan string into a canonical 3-tier key ('starter' | 'growth' | 'enterprise').
 * 'pro' is mapped to 'growth' (Level 2).
 */
export function normalizePlanId(planId?: string | null): 'starter' | 'growth' | 'enterprise' {
  if (!planId) return 'starter';
  const clean = planId.toLowerCase().trim();
  if (clean === 'enterprise') return 'enterprise';
  if (clean === 'growth' || clean === 'pro') return 'growth';
  return 'starter';
}

/**
 * Gets the numeric access level:
 * 1 = Starter
 * 2 = Growth / Pro
 * 3 = Enterprise
 */
export function getPlanLevel(planId?: string | null): number {
  const tier = normalizePlanId(planId);
  return PLAN_TIERS[tier].level;
}

/**
 * Pure function to check if a plan has access to a given feature.
 */
export function hasFeatureAccess(
  planId: string | null | undefined,
  feature: FeatureKey
): boolean {
  const level = getPlanLevel(planId);
  const required = FEATURE_METADATA[feature];
  if (!required) return true;
  return level >= required.minLevel;
}

/**
 * Pure function to check if a plan meets or exceeds a target tier level.
 */
export function isTierAtLeast(
  planId: string | null | undefined,
  requiredTier: 'starter' | 'growth' | 'enterprise'
): boolean {
  const level = getPlanLevel(planId);
  const targetLevel = PLAN_TIERS[requiredTier].level;
  return level >= targetLevel;
}

/**
 * React hook to consume plan gating state inside any restaurant dashboard component.
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

  const isAtLeast = (tier: 'starter' | 'growth' | 'enterprise'): boolean => {
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
