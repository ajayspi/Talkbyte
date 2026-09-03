'use client';

import React, { useState } from 'react';
import { CreditCardIcon, CheckCircleIcon, XIcon } from '@/components/icons';

interface PlanOption {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  sub: string;
  isCurrent?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$500',
    sub: 'Up to 3,000 calls/mo',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$1,500',
    sub: 'Up to 10,000 calls/mo',
    isCurrent: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$3,500',
    sub: 'Unlimited · Dedicated number',
  },
];

export const BillingTab: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectPlan = (planId: 'starter' | 'pro' | 'enterprise') => {
    if (planId === selectedPlan) return;
    setSelectedPlan(planId);
    setUpgradeModalOpen(true);
  };

  const handleConfirmUpgrade = () => {
    setUpgradeModalOpen(false);
    showToast(`✓ Plan changed to ${selectedPlan.toUpperCase()}. Stripe subscription updated.`);
  };

  return (
    <div className="section active space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a0a1e] text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-fade-in">
          <CheckCircleIcon size={18} className="text-teal-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Next Billing Alert */}
      <div className="alert alert-success">
        ✓ Next billing date: 1 September 2026 · $1,500 AUD
      </div>

      {/* 3-Column Plan Cards */}
      <div className="three-col">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === selectedPlan;
          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`plan-card cursor-pointer transition-all ${
                isCurrent ? 'current ring-2 ring-purple-600 shadow-md' : 'hover:border-purple-300'
              }`}
            >
              {isCurrent && <div className="plan-tag">Current Plan</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.price}
                <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
                  /mo
                </span>
              </div>
              <div className="plan-sub">{plan.sub}</div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-purple-100 text-purple-700 cursor-default'
                      : 'bg-gray-100 hover:bg-purple-600 hover:text-white text-gray-700'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column: Usage This Month & Billing History */}
      <div className="two-col">
        {/* Usage This Month Card */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="card-title">Usage This Month</span>
            <span className="text-xs text-gray-500">Resets in 2 days</span>
          </div>
          <div className="card-body">
            {/* Calls Used: 4,841 / 10,000 (48%) */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '6px',
                }}
              >
                <span className="font-medium text-gray-700">Calls Used</span>
                <span>
                  <strong className="text-gray-900">4,841</strong> / 10,000
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: '48%' }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">48% of monthly limit used</div>
            </div>

            {/* AI Minutes: 11,183 / 25,000 (45%) */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '6px',
                }}
              >
                <span className="font-medium text-gray-700">AI Minutes</span>
                <span>
                  <strong className="text-gray-900">11,183</strong> / 25,000
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: '45%' }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">45% of included minutes consumed</div>
            </div>

            {/* SMS Sent: 3,920 / 10,000 (39%) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '6px',
                }}
              >
                <span className="font-medium text-gray-700">SMS Sent</span>
                <span>
                  <strong className="text-gray-900">3,920</strong> / 10,000
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: '39%' }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Payment links & SMS receipts</div>
            </div>
          </div>
        </div>

        {/* Billing History Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Billing History</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium text-gray-800">Aug 2026</td>
                <td className="font-bold text-gray-900">$1,500</td>
                <td>
                  <span className="badge badge-yellow">Due 1 Sep</span>
                </td>
              </tr>
              <tr>
                <td className="font-medium text-gray-800">Jul 2026</td>
                <td className="font-bold text-gray-900">$1,500</td>
                <td>
                  <span className="badge badge-green">✓ Paid</span>
                </td>
              </tr>
              <tr>
                <td className="font-medium text-gray-800">Jun 2026</td>
                <td className="font-bold text-gray-900">$1,500</td>
                <td>
                  <span className="badge badge-green">✓ Paid</span>
                </td>
              </tr>
              <tr>
                <td className="font-medium text-gray-800">May 2026</td>
                <td className="font-bold text-gray-900">$500</td>
                <td>
                  <span className="badge badge-green">✓ Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Switch Confirmation Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Confirm Plan Change
              </h3>
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-600">
                You are updating your subscription tier to the{' '}
                <strong className="text-gray-900 capitalize">{selectedPlan}</strong> plan.
              </p>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900">
                {selectedPlan === 'starter' &&
                  'Includes up to 3,000 inbound calls/month at $500 AUD/mo.'}
                {selectedPlan === 'pro' &&
                  'Includes up to 10,000 inbound calls/month at $1,500 AUD/mo.'}
                {selectedPlan === 'enterprise' &&
                  'Includes unlimited calls and a dedicated Telnyx voice trunk at $3,500 AUD/mo.'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="topbar-btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                className="topbar-btn btn-primary text-xs"
              >
                Confirm & Update Billing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BillingTab;
