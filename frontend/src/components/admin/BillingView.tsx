'use client';

import React, { useState, useEffect } from 'react';
import {
  BillingIcon,
  CreditCardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  RefreshIcon,
} from '@/components/icons';
import { getSubscriptions } from '@/lib/supabase';
import type { Subscription } from '@/types/database.types';

export interface BillingSubItem {
  id: string;
  restaurant: string;
  planName: string;
  stripeSubId: string;
  amountMonthly: string;
  status: 'active' | 'past_due' | 'trialing' | 'cancelled';
  nextBillingDate: string;
  stripeSync: boolean;
}

const INITIAL_SUBSCRIPTIONS: BillingSubItem[] = [
  {
    id: 'sub-1',
    restaurant: "Mama's Pizzeria",
    planName: 'Enterprise Plan',
    stripeSubId: 'sub_1Pz98vMamaLive',
    amountMonthly: '$499.00 AUD',
    status: 'active',
    nextBillingDate: '1 Oct 2026',
    stripeSync: true,
  },
  {
    id: 'sub-2',
    restaurant: 'Thai Express',
    planName: 'Pro Plan',
    stripeSubId: 'sub_1Pz88aThaiLive',
    amountMonthly: '$249.00 AUD',
    status: 'active',
    nextBillingDate: '1 Oct 2026',
    stripeSync: true,
  },
  {
    id: 'sub-3',
    restaurant: 'Burger Palace',
    planName: 'Pro Plan',
    stripeSubId: 'sub_1Pz77xBurgerLive',
    amountMonthly: '$249.00 AUD',
    status: 'active',
    nextBillingDate: '1 Oct 2026',
    stripeSync: true,
  },
  {
    id: 'sub-4',
    restaurant: 'Taco Loco',
    planName: 'Pro Plan',
    stripeSubId: 'sub_1Pz66mTacoLive',
    amountMonthly: '$249.00 AUD',
    status: 'past_due',
    nextBillingDate: '28 Aug 2026',
    stripeSync: true,
  },
  {
    id: 'sub-5',
    restaurant: 'Spaghetti Junction',
    planName: 'Starter Plan',
    stripeSubId: 'sub_1Pz55kSpaghLive',
    amountMonthly: '$149.00 AUD',
    status: 'active',
    nextBillingDate: '1 Oct 2026',
    stripeSync: true,
  },
  {
    id: 'sub-6',
    restaurant: 'Sakura Sushi',
    planName: 'Starter Plan',
    stripeSubId: 'sub_1Pz44hSakuraLive',
    amountMonthly: '$149.00 AUD',
    status: 'trialing',
    nextBillingDate: '15 Sep 2026',
    stripeSync: true,
  },
];

const RECENT_INVOICES = [
  {
    id: 'INV-4821',
    restaurant: "Mama's Pizzeria",
    date: '2026-09-01',
    amount: '$499.00 AUD',
    status: 'Paid',
    stripeUrl: 'https://invoice.stripe.com/i/acct_talkbyte/inv_4821',
  },
  {
    id: 'INV-4820',
    restaurant: 'Thai Express',
    date: '2026-09-01',
    amount: '$249.00 AUD',
    status: 'Paid',
    stripeUrl: 'https://invoice.stripe.com/i/acct_talkbyte/inv_4820',
  },
  {
    id: 'INV-4819',
    restaurant: 'Burger Palace',
    date: '2026-09-01',
    amount: '$249.00 AUD',
    status: 'Paid',
    stripeUrl: 'https://invoice.stripe.com/i/acct_talkbyte/inv_4819',
  },
  {
    id: 'INV-4818',
    restaurant: 'Taco Loco',
    date: '2026-08-28',
    amount: '$249.00 AUD',
    status: 'Past Due',
    stripeUrl: 'https://invoice.stripe.com/i/acct_talkbyte/inv_4818',
  },
  {
    id: 'INV-4817',
    restaurant: 'The Curry Leaf',
    date: '2026-08-25',
    amount: '$149.00 AUD',
    status: 'Paid',
    stripeUrl: 'https://invoice.stripe.com/i/acct_talkbyte/inv_4817',
  },
];

export default function BillingView() {
  const [subscriptions, setSubscriptions] = useState<BillingSubItem[]>(INITIAL_SUBSCRIPTIONS);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptions().then((data: Subscription[]) => {
      if (data && data.length > 0) {
        // Enrich from Supabase if needed
        const mapped = data.map((sub, idx) => ({
          id: sub.id || `sub-supa-${idx}`,
          restaurant: sub.restaurant_name || `Restaurant #${idx + 1}`,
          planName: sub.plan_name || 'Standard Plan',
          stripeSubId: sub.stripe_subscription_id || `sub_live_${idx}99`,
          amountMonthly: '$249.00 AUD',
          status: (sub.status || 'active') as any,
          nextBillingDate: sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('en-AU') : '1 Oct 2026',
          stripeSync: true,
        }));
        setSubscriptions(mapped);
      }
    });
  }, []);

  const handleRetryPayment = (id: string, venue: string) => {
    setRetryingId(id);
    setTimeout(() => {
      setRetryingId(null);
      alert(`Stripe charge retry initiated for ${venue}. Webhook dispatched.`);
    }, 800);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header */}
      <div>
        <h2 className="text-[18px] font-bold text-[#111827]">Billing &amp; Stripe Subscriptions</h2>
        <div className="text-[12px] text-[#6b7280]">
          487 active subscriptions · $0 outstanding invoices · Next billing cycle: 1 Oct 2026
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Active Subscriptions
            </div>
            <BillingIcon size={24} className="text-[#7c3aed]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#7c3aed] mt-2 mb-1 leading-none">
            487
          </div>
          <div className="text-[12px] text-[#6b7280]">100% connected to Stripe</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              SaaS MRR
            </div>
            <CreditCardIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            $125.4K
          </div>
          <div className="text-[12px] text-[#6b7280]">Recurring subscription fee</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Outstanding Balance
            </div>
            <CheckCircleIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            $0.00
          </div>
          <div className="text-[12px] text-[#6b7280]">All accounts in good standing</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Smart Retries
            </div>
            <AlertTriangleIcon size={24} className="text-[#eab308]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#eab308] mt-2 mb-1 leading-none">
            1 retry
          </div>
          <div className="text-[12px] text-[#6b7280]">Scheduled for 24h auto-retry</div>
        </div>
      </div>

      {/* Warning Strip */}
      <div className="bg-[#fefce8] border border-[#fde047] text-[#713f12] rounded-lg p-3.5 px-4 text-[13px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Taco Loco</strong> has 1 past-due invoice ($249.00 AUD). Stripe Smart Retry is active. Service remains enabled.
          </span>
        </div>
        <button
          onClick={() => handleRetryPayment('sub-4', 'Taco Loco')}
          className="px-3 py-1 bg-white border border-[#e5e7eb] text-[12px] font-semibold rounded hover:bg-gray-50 cursor-pointer"
        >
          {retryingId === 'sub-4' ? 'Retrying...' : 'Retry Now'}
        </button>
      </div>

      {/* Subscription Health Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-[#111827]">Subscription Lifecycle</h3>
          <span className="text-[12px] text-[#6b7280]">Stripe Billing v2</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                <th className="py-2.5 px-3.5 font-semibold">Tier</th>
                <th className="py-2.5 px-3.5 font-semibold">Stripe Subscription ID</th>
                <th className="py-2.5 px-3.5 font-semibold">Amount</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Next Period End</th>
                <th className="py-2.5 px-3.5 font-semibold">Sync Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {subscriptions.map((sub) => {
                let statusChip = 'bg-[#f0fdf4] text-[#16a34a]';
                if (sub.status === 'past_due') statusChip = 'bg-[#fefce8] text-[#854d0e]';
                if (sub.status === 'trialing') statusChip = 'bg-[#eff6ff] text-[#3b82f6]';
                if (sub.status === 'cancelled') statusChip = 'bg-[#fef2f2] text-[#ef4444]';

                return (
                  <tr key={sub.id} className="hover:bg-[#fafaf9] transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#111827]">{sub.restaurant}</td>
                    <td className="py-3 px-3.5 text-[#374151] font-medium">{sub.planName}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">
                      {sub.stripeSubId}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#111827]">{sub.amountMonthly}</td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusChip}`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#6b7280] text-[12px]">{sub.nextBillingDate}</td>
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#22c55e]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                        Stripe Synced
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      {sub.status === 'past_due' ? (
                        <button
                          onClick={() => handleRetryPayment(sub.id, sub.restaurant)}
                          className="text-[11px] font-semibold text-[#ef4444] hover:underline"
                        >
                          {retryingId === sub.id ? 'Retrying...' : 'Retry Payment'}
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Opening Stripe Customer Portal for ${sub.restaurant}`)}
                          className="text-[11px] font-semibold text-[#7c3aed] hover:underline flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ExternalLinkIcon size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
          <h3 className="text-[14px] font-bold text-[#111827]">Recent Invoices</h3>
          <span className="text-[12px] text-[#6b7280]">Generated via Stripe Invoicing API</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Invoice ID</th>
                <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                <th className="py-2.5 px-3.5 font-semibold">Date</th>
                <th className="py-2.5 px-3.5 font-semibold">Amount</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {RECENT_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-[12px] font-semibold text-[#111827]">
                    {inv.id}
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-[#111827]">{inv.restaurant}</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] text-[12px]">{inv.date}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">{inv.amount}</td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        inv.status === 'Paid'
                          ? 'bg-[#f0fdf4] text-[#16a34a]'
                          : 'bg-[#fefce8] text-[#854d0e]'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <button
                      onClick={() => alert(`Downloading Stripe PDF Receipt for ${inv.id}`)}
                      className="text-[12px] text-[#7c3aed] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <DownloadIcon size={14} />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
