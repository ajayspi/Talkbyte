'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DollarIcon, CreditCardIcon, BarChartIcon, CheckCircleIcon } from '@/components/icons';

const monthlyTrendData = [
  { month: 'Mar', mrr: 78, calls: 58 },
  { month: 'Apr', mrr: 91, calls: 72 },
  { month: 'May', mrr: 103, calls: 84 },
  { month: 'Jun', mrr: 112, calls: 94 },
  { month: 'Jul', mrr: 119, calls: 102 },
  { month: 'Aug', mrr: 125, calls: 112 },
];

export default function RevenueView() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header */}
      <div>
        <h2 className="text-[18px] font-bold text-[#111827]">Revenue & Financials</h2>
        <div className="text-[12px] text-[#6b7280]">
          Recurring subscription revenues, unit economics (COGS per minute), and telephony margins.
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              MRR
            </div>
            <DollarIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            $125.4K
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 5.5%</span> MoM
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              ARR
            </div>
            <BarChartIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            $1.51M
          </div>
          <div className="text-[12px] text-[#6b7280]">Annualised run rate</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Avg Revenue / Restaurant
            </div>
            <CreditCardIcon size={24} className="text-[#7c3aed]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#7c3aed] mt-2 mb-1 leading-none">
            $257
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ $12</span> MoM
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              LTV / Restaurant
            </div>
            <CheckCircleIcon size={24} className="text-[#3b82f6]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#3b82f6] mt-2 mb-1 leading-none">
            $5,940
          </div>
          <div className="text-[12px] text-[#6b7280]">Avg 23mo lifetime</div>
        </div>
      </div>

      {/* Two-Column: Plan Distribution & Unit Economics COGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan Distribution Breakdown */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#111827] mb-4">Plan Distribution</h3>

            <div className="space-y-4">
              {/* Enterprise */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ede9fe] text-[#7c3aed]">
                    Enterprise
                  </span>
                </div>
                <div className="flex-1 h-2.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: '9%' }} />
                </div>
                <div className="w-16 text-right text-[12px] text-[#6b7280] shrink-0">43 rest.</div>
                <div className="w-16 text-right text-[12px] font-bold text-[#22c55e] shrink-0">
                  $150.5K
                </div>
              </div>

              {/* Pro */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#3b82f6]">
                    Pro
                  </span>
                </div>
                <div className="flex-1 h-2.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: '38%' }} />
                </div>
                <div className="w-16 text-right text-[12px] text-[#6b7280] shrink-0">184 rest.</div>
                <div className="w-16 text-right text-[12px] font-bold text-[#22c55e] shrink-0">
                  $276K
                </div>
              </div>

              {/* Starter */}
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                    Starter
                  </span>
                </div>
                <div className="flex-1 h-2.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6b7280] rounded-full" style={{ width: '53%' }} />
                </div>
                <div className="w-16 text-right text-[12px] text-[#6b7280] shrink-0">260 rest.</div>
                <div className="w-16 text-right text-[12px] font-bold text-[#22c55e] shrink-0">
                  $130K
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#e5e7eb]">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#6b7280]">Total MRR</span>
              <span className="font-extrabold text-[15px] text-[#22c55e]">$556.5K</span>
            </div>
            <div className="text-[11px] text-[#6b7280] mt-1">
              Enterprise = 27% of restaurants, 27% of MRR — upsell opportunity in Pro tier
            </div>
          </div>
        </div>

        {/* Cost Breakdown (per minute) COGS */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#111827] mb-3">Cost Breakdown (per minute)</h3>
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Component</th>
                  <th className="py-2.5 px-3.5 font-semibold">Cost/Min</th>
                  <th className="py-2.5 px-3.5 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Telnyx SIP (blended)</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.018</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff0eb] text-[#FF6B35]">
                      23%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Deepgram Flux STT</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.007</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fefce8] text-[#854d0e]">
                      9%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">GPT-4.1 LLM</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.012</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#3b82f6]">
                      15%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">ElevenLabs TTS</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.012</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#3b82f6]">
                      15%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">SMS + Payment Links</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.005</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                      6%
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Infrastructure (Railway)</td>
                  <td className="py-2.5 px-3.5 font-mono text-[#111827]">$0.008</td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                      10%
                    </span>
                  </td>
                </tr>
                <tr className="bg-[#f0fdf4]">
                  <td className="py-2.5 px-3.5 font-bold text-[#16a34a]">TOTAL COST</td>
                  <td className="py-2.5 px-3.5 font-bold font-mono text-[#16a34a]">$0.062/min</td>
                  <td className="py-2.5 px-3.5 font-bold text-[#16a34a]">100%</td>
                </tr>
                <tr className="bg-[#ede9fe]">
                  <td className="py-2.5 px-3.5 font-bold text-[#7c3aed]">Revenue (avg 3min call)</td>
                  <td className="py-2.5 px-3.5 font-bold font-mono text-[#7c3aed]">$0.30/call</td>
                  <td className="py-2.5 px-3.5 font-bold text-[#7c3aed]">Margin: 31%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Revenue & Call Volume Trend Chart */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
        <h3 className="text-[14px] font-bold text-[#111827] mb-4">
          Monthly Revenue &amp; Call Volume Trend
        </h3>
        <div className="h-[220px] w-full">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'mrr' ? `$${val}K` : `${val}K calls`,
                    name === 'mrr' ? 'MRR ($K)' : 'Calls (K)',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Bar name="MRR ($K)" dataKey="mrr" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar name="Calls (K)" dataKey="calls" fill="#14b8a6" radius={[4, 4, 0, 0]} opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
