'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../layout';
import { getRestaurant, supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BillingEvent {
  id: string;
  restaurant_id: string;
  event_type: string;
  amount_cents: number | null;
  plan_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  created_at: string;
}

interface PlanOption {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  displayPrice: string;
  sub: string;
  features: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter',
    displayPrice: '$500',
    sub: 'Up to 3,000 calls/mo',
    features: ['3,000 inbound calls/month', 'AI voice ordering', 'Basic analytics', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    displayPrice: '$1,500',
    sub: 'Up to 10,000 calls/mo',
    features: ['10,000 inbound calls/month', 'Priority AI routing', 'Advanced analytics', 'SMS receipts', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    displayPrice: '$3,500',
    sub: 'Unlimited · Dedicated number',
    features: ['Unlimited calls', 'Dedicated Telnyx number', 'Custom AI persona', 'POS integrations', 'Dedicated CSM'],
  },
];

const MOCK_BILLING_EVENTS: BillingEvent[] = [
  {
    id: 'be-001',
    restaurant_id: 'mock',
    event_type: 'invoice.paid',
    amount_cents: 150000,
    plan_id: 'pro',
    stripe_invoice_id: 'in_mock_aug26',
    stripe_subscription_id: 'sub_mock_001',
    status: 'paid',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'be-002',
    restaurant_id: 'mock',
    event_type: 'invoice.paid',
    amount_cents: 150000,
    plan_id: 'pro',
    stripe_invoice_id: 'in_mock_jul26',
    stripe_subscription_id: 'sub_mock_001',
    status: 'paid',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'be-003',
    restaurant_id: 'mock',
    event_type: 'invoice.paid',
    amount_cents: 150000,
    plan_id: 'pro',
    stripe_invoice_id: 'in_mock_jun26',
    stripe_subscription_id: 'sub_mock_001',
    status: 'paid',
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    id: 'be-004',
    restaurant_id: 'mock',
    event_type: 'customer.subscription.created',
    amount_cents: 50000,
    plan_id: 'starter',
    stripe_invoice_id: 'in_mock_may26',
    stripe_subscription_id: 'sub_mock_001',
    status: 'paid',
    created_at: '2026-05-01T00:00:00Z',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCents(cents: number | null): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    'invoice.paid': 'Invoice Paid',
    'invoice.payment_failed': 'Payment Failed',
    'customer.subscription.created': 'Subscription Created',
    'customer.subscription.updated': 'Plan Updated',
  };
  return map[type] ?? type;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { currentVenue, setActiveTab } = useRestaurant();

  const [planId, setPlanId] = useState<string>('pro');
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'starter' | 'pro' | 'enterprise' | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Sync active sidebar tab to billing
  useEffect(() => {
    setActiveTab('billing');
  }, [setActiveTab]);

  // Load plan_id
  useEffect(() => {
    async function loadPlan() {
      if (currentVenue?.plan_id) {
        setPlanId(currentVenue.plan_id);
        return;
      }
      const rest = await getRestaurant();
      if (rest?.plan_id) setPlanId(rest.plan_id);
    }
    loadPlan();
  }, [currentVenue]);

  // Load billing events from Supabase; fall back to mock data
  useEffect(() => {
    async function loadBillingEvents() {
      setLoadingEvents(true);
      try {
        const { data, error } = await (supabase as any)
          .from('billing_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data && data.length > 0) {
          setBillingEvents(data as BillingEvent[]);
        } else {
          setBillingEvents(MOCK_BILLING_EVENTS);
        }
      } catch {
        setBillingEvents(MOCK_BILLING_EVENTS);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadBillingEvents();
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpgradeClick = (plan: PlanOption) => {
    if (plan.id === planId) return;
    setTargetPlan(plan.id);
    setConfirmModalOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!targetPlan) return;
    setConfirmModalOpen(false);
    setCheckoutLoading(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined'
          ? window.location.origin.replace(/:\d+$/, ':8000')
          : 'http://localhost:8000');

      const res = await fetch(`${apiBase}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: currentVenue?.id ?? 'mock-restaurant',
          plan_id: targetPlan,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }

      const { checkout_url } = (await res.json()) as { checkout_url?: string };
      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        showToast('✓ Subscription update requested — you will receive an email confirmation.', true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showToast(`✗ Checkout failed: ${msg}`, false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const currentPlan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
  const isStarter = planId === 'starter';

  return (
    <div className="section active space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-sm font-medium ${
            toast.ok
              ? 'bg-[#1a0a1e] text-white border-teal-500/40'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Starter plan gating banner */}
      {isStarter && (
        <div className="alert alert-warn">
          <span>⚠️</span>
          <span>
            You&apos;re on the <strong>Starter</strong> plan. Upgrade to <strong>Pro</strong> to
            unlock advanced analytics, priority routing, and SMS receipts.{' '}
            <button
              onClick={() => handleUpgradeClick(PLANS[1])}
              className="underline font-bold cursor-pointer"
            >
              Upgrade now →
            </button>
          </span>
        </div>
      )}

      {/* Current plan summary card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Current Plan</span>
          <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
            {currentPlan.name}
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div className="plan-price" style={{ fontSize: 36 }}>
              {currentPlan.displayPrice}
              <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/mo AUD</span>
            </div>
            <div className="plan-sub">{currentPlan.sub}</div>
          </div>
          <div style={{ flex: 1, paddingLeft: 24, borderLeft: '1px solid var(--border)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
              {currentPlan.features.map((f) => (
                <li
                  key={f}
                  style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ color: 'var(--teal)', fontSize: 14 }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Plan selector cards */}
      <div className="three-col">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === planId;
          return (
            <div
              key={plan.id}
              className={`plan-card ${isCurrent ? 'current' : ''}`}
              onClick={() => handleUpgradeClick(plan)}
              style={{ cursor: isCurrent ? 'default' : 'pointer' }}
            >
              {isCurrent && <div className="plan-tag">Current Plan</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.displayPrice}
                <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/mo</span>
              </div>
              <div className="plan-sub">{plan.sub}</div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 12px',
                    textAlign: 'left',
                  }}
                >
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        padding: '2px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: 'var(--teal)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || checkoutLoading}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-purple-100 text-purple-700 cursor-default'
                      : 'bg-gray-100 hover:bg-purple-600 hover:text-white text-gray-700'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Billing history table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Billing History</span>
          {loadingEvents && (
            <span className="text-xs text-gray-400 animate-pulse">Loading…</span>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {billingEvents.length === 0 && !loadingEvents ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}
                >
                  No billing history yet.
                </td>
              </tr>
            ) : (
              billingEvents.map((ev) => (
                <tr key={ev.id}>
                  <td className="font-medium text-gray-800">{formatDate(ev.created_at)}</td>
                  <td className="text-gray-700">{eventTypeLabel(ev.event_type)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{ev.plan_id ?? '—'}</td>
                  <td className="font-bold text-gray-900">{formatCents(ev.amount_cents)}</td>
                  <td>
                    {ev.status === 'paid' ? (
                      <span className="badge badge-green">✓ Paid</span>
                    ) : ev.status === 'failed' ? (
                      <span className="badge badge-red">✗ Failed</span>
                    ) : (
                      <span className="badge badge-yellow">{ev.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upgrade Confirmation Modal */}
      {confirmModalOpen && targetPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Confirm Plan Change</h3>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-600">
                You are switching to the{' '}
                <strong className="text-gray-900 capitalize">{targetPlan}</strong> plan.
              </p>
              {(() => {
                const tp = PLANS.find((p) => p.id === targetPlan);
                return tp ? (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-900">
                    <strong>{tp.name}:</strong> {tp.displayPrice}/mo AUD · {tp.sub}
                  </div>
                ) : null;
              })()}
              <p className="text-xs text-gray-500">
                You will be redirected to Stripe Checkout to complete the subscription. Your card on
                file will be charged at the next billing cycle.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="topbar-btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckout}
                disabled={checkoutLoading}
                className="topbar-btn btn-primary text-xs"
              >
                {checkoutLoading ? 'Redirecting…' : 'Confirm & Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
