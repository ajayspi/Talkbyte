'use client';

import React, { useState } from 'react';
import { usePlanGating, FeatureKey } from '@/lib/planGating';
import { XIcon } from '@/components/icons';

// Self-contained SVG Lock Icon
export const LockIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
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

export interface PlanGateProps {
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

  // If user has access, render children normally
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
          <div className="opacity-60 pointer-events-none select-none">{children}</div>
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
        <div className="bg-white/95 border border-purple-200/80 shadow-2xl rounded-2xl p-6 max-w-sm text-center transform transition-transform">
          <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
            <LockIcon size={20} />
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-2">
            {requiredBadge} Feature
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-1">
            {meta.title}
          </h4>

          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            {meta.description}
          </p>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left animate-scale-in">
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
            {meta.description} This feature requires an upgrade to the{' '}
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
