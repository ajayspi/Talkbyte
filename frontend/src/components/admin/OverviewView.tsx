'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  StoreIcon,
  DollarIcon,
  PhoneIcon,
  BarChartIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BoltIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  XIcon,
} from '@/components/icons';
import { useAdmin } from '@/app/(admin)/layout';
import { getPlatformStats, getFleetRestaurants } from '@/lib/supabase';
import type { PlatformStats } from '@/types/database.types';

const callsData = [
  { hour: '6am', calls: 12 },
  { hour: '7', calls: 24 },
  { hour: '8', calls: 48 },
  { hour: '9', calls: 87 },
  { hour: '10', calls: 120 },
  { hour: '11', calls: 145 },
  { hour: '12pm', calls: 198 },
  { hour: '1', calls: 211 },
  { hour: '2', calls: 187 },
  { hour: '3', calls: 164 },
  { hour: '4', calls: 142 },
  { hour: '5', calls: 168 },
  { hour: '6', calls: 224 },
  { hour: '7', calls: 287 },
  { hour: '8', calls: 312 },
  { hour: '9', calls: 264 },
  { hour: '10', calls: 198 },
  { hour: '11', calls: 142 },
];

const mrrGrowthData = [
  { month: 'Mar', mrr: 78 },
  { month: 'Apr', mrr: 91 },
  { month: 'May', mrr: 103 },
  { month: 'Jun', mrr: 112 },
  { month: 'Jul', mrr: 119 },
  { month: 'Aug', mrr: 125 },
];

export default function OverviewView() {
  const { setActiveTab } = useAdmin();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    type: 'contact' | 'debug' | 'invoice' | 'review';
    restaurant: string;
    detail: string;
  } | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    getPlatformStats().then(setStats);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* System Warning Alert Banner */}
      {!alertDismissed && (
        <div className="bg-[#fefce8] border border-[#fde047] text-[#713f12] rounded-lg p-3.5 px-4 flex items-center justify-between text-[13px] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[16px]">⚠️</span>
            <span>
              <strong>3 restaurants</strong> have payment links expiring unredeemed — check{' '}
              <button
                onClick={() => setActiveTab('revenue')}
                className="underline font-bold text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer"
              >
                Revenue → Expired Links
              </button>{' '}
              tab.
            </span>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="text-[#713f12]/60 hover:text-[#713f12] p-1 rounded-md cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* KPI Grid 1: High-Level Platform Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Restaurants */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Active Restaurants
            </div>
            <StoreIcon size={24} className="text-[#7c3aed]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#7c3aed] mt-2 mb-1.5 leading-none">
            {stats ? stats.totalVenues : '487'}
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 12</span> this week · 94% plan active
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              MRR
            </div>
            <DollarIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1.5 leading-none">
            $125.4K
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 5.5%</span> vs last month · $1.51M ARR
          </div>
        </div>

        {/* Calls Today */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Calls Today
            </div>
            <PhoneIcon size={24} className="text-[#14b8a6]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#14b8a6] mt-2 mb-1.5 leading-none">
            2,847
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 18%</span> vs yesterday · 23 live now
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Churn Rate
            </div>
            <BarChartIcon size={24} className="text-[#FF6B35]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#FF6B35] mt-2 mb-1.5 leading-none">
            2.1%
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#ef4444] font-semibold">↑ 0.3%</span> vs last month · 10 at risk
          </div>
        </div>
      </div>

      {/* KPI Grid 2: Operational Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order Completion Rate */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Order Completion Rate
            </div>
            <CheckCircleIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1.5 leading-none">
            74.2%
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 2.1%</span> last 7 days · target ≥70%
          </div>
        </div>

        {/* Payment Conversion */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Payment Conversion
            </div>
            <CreditCardIcon size={24} className="text-[#7c3aed]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#7c3aed] mt-2 mb-1.5 leading-none">
            82.7%
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 1.4%</span> last 7 days · target ≥80%
          </div>
        </div>

        {/* Avg E2E Latency */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Avg E2E Latency
            </div>
            <BoltIcon size={24} className="text-[#14b8a6]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#14b8a6] mt-2 mb-1.5 leading-none">
            387ms
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↓ 23ms</span> vs yesterday · target &lt;500ms
          </div>
        </div>

        {/* Escalation Rate */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Escalation Rate
            </div>
            <AlertTriangleIcon size={24} className="text-[#eab308]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#eab308] mt-2 mb-1.5 leading-none">
            11.4%
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↓ 0.8%</span> vs last week · target ≤15%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calls Per Hour — Today */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="text-[14px] font-bold text-[#111827] mb-4">Calls Per Hour — Today</div>
          <div className="h-[200px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="calls" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* MRR Growth — 6 Months */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="text-[14px] font-bold text-[#111827] mb-4">MRR Growth — 6 Months</div>
          <div className="h-[200px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrGrowthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip
                    formatter={(value: any) => [`$${value}K`, 'MRR']}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#mrrGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Tables: Leaderboard and At-Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Restaurants by Orders Today */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Top Restaurants by Orders Today</h3>
            <span className="bg-[#eff6ff] text-[#3b82f6] text-[11px] font-semibold px-2 py-0.5 rounded-full">
              Today
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">#</th>
                  <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                  <th className="py-2.5 px-3.5 font-semibold">Calls</th>
                  <th className="py-2.5 px-3.5 font-semibold">Orders</th>
                  <th className="py-2.5 px-3.5 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-[#7c3aed]">1</td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Mama&apos;s Pizzeria</div>
                    <div className="text-[11px] text-[#6b7280]">Carlton, VIC</div>
                  </td>
                  <td className="py-3 px-3.5">84</td>
                  <td className="py-3 px-3.5">61</td>
                  <td className="py-3 px-3.5 font-bold text-[#22c55e]">$1,842</td>
                </tr>
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-[#7c3aed]">2</td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Thai Express</div>
                    <div className="text-[11px] text-[#6b7280]">Newtown, NSW</div>
                  </td>
                  <td className="py-3 px-3.5">71</td>
                  <td className="py-3 px-3.5">58</td>
                  <td className="py-3 px-3.5 font-bold text-[#22c55e]">$1,650</td>
                </tr>
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-[#7c3aed]">3</td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Burger Palace</div>
                    <div className="text-[11px] text-[#6b7280]">South Bank, QLD</div>
                  </td>
                  <td className="py-3 px-3.5">67</td>
                  <td className="py-3 px-3.5">51</td>
                  <td className="py-3 px-3.5 font-bold text-[#22c55e]">$1,427</td>
                </tr>
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-[#7c3aed]">4</td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Noodle House</div>
                    <div className="text-[11px] text-[#6b7280]">Chinatown, NSW</div>
                  </td>
                  <td className="py-3 px-3.5">55</td>
                  <td className="py-3 px-3.5">44</td>
                  <td className="py-3 px-3.5 font-bold text-[#22c55e]">$1,188</td>
                </tr>
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-[#7c3aed]">5</td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">The Curry Leaf</div>
                    <div className="text-[11px] text-[#6b7280]">Fitzroy, VIC</div>
                  </td>
                  <td className="py-3 px-3.5">49</td>
                  <td className="py-3 px-3.5">39</td>
                  <td className="py-3 px-3.5 font-bold text-[#22c55e]">$972</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* At-Risk Restaurants Radar */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">At-Risk Restaurants</h3>
            <span className="bg-[#fefce8] text-[#854d0e] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#fde047]">
              10 flagged
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                  <th className="py-2.5 px-3.5 font-semibold">Risk Signal</th>
                  <th className="py-2.5 px-3.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Sakura Sushi</div>
                    <div className="text-[11px] text-[#6b7280]">St Kilda, VIC</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#ef4444] mr-1">
                      Low usage
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fefce8] text-[#854d0e]">
                      3 wks
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() =>
                        setActiveModal({
                          type: 'contact',
                          restaurant: 'Sakura Sushi',
                          detail: 'Owner: kenji@sakurasushi.com.au · Inbound volume dropped 82% over the last 21 days.',
                        })
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#ede9fe] cursor-pointer transition-colors"
                    >
                      Contact
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">The Greek Place</div>
                    <div className="text-[11px] text-[#6b7280]">Oakleigh, VIC</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fefce8] text-[#854d0e]">
                      POS errors
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() =>
                        setActiveModal({
                          type: 'debug',
                          restaurant: 'The Greek Place',
                          detail: 'Square POS OAuth token expired · 3 order push events queued for retry.',
                        })
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#ede9fe] cursor-pointer transition-colors"
                    >
                      Debug
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Taco Loco</div>
                    <div className="text-[11px] text-[#6b7280]">Surry Hills, NSW</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#ef4444]">
                      Overdue invoice
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() =>
                        setActiveModal({
                          type: 'invoice',
                          restaurant: 'Taco Loco',
                          detail: 'Stripe Invoice #INV-2901 ($249.00 AUD) past due by 5 days.',
                        })
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#ede9fe] cursor-pointer transition-colors"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-[#111827]">Spaghetti Junction</div>
                    <div className="text-[11px] text-[#6b7280]">Richmond, VIC</div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fefce8] text-[#854d0e] mr-1">
                      High escalation
                    </span>
                    <span className="text-[12px] text-[#6b7280]">34%</span>
                  </td>
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() =>
                        setActiveModal({
                          type: 'review',
                          restaurant: 'Spaghetti Junction',
                          detail: 'STT confidence avg 71% on acoustic background music noise · Menu item misinterpretation: "Gnocchi Gorgonzola".',
                        })
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#ede9fe] cursor-pointer transition-colors"
                    >
                      Review AI
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Triage Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <h3 className="font-bold text-[16px] text-[#111827]">
                Triage Intervention: {activeModal.restaurant}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon size={18} />
              </button>
            </div>
            <p className="text-[13px] text-[#4b5563] leading-relaxed">{activeModal.detail}</p>
            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-2 text-[13px] rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Operator action confirmed for ${activeModal.restaurant}`);
                  setActiveModal(null);
                }}
                className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              >
                Execute Intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
