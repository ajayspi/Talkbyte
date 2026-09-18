'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { PhoneIcon, CheckCircleIcon, DollarIcon, ShoppingCartIcon } from '@/components/icons';

const dailyOrdersCallsData = [
  { day: 'Mon', calls: 2400, orders: 1782 },
  { day: 'Tue', calls: 2621, orders: 1944 },
  { day: 'Wed', calls: 2518, orders: 1868 },
  { day: 'Thu', calls: 2734, orders: 2028 },
  { day: 'Fri', calls: 3012, orders: 2235 },
  { day: 'Sat', calls: 3284, orders: 2438 },
  { day: 'Sun', calls: 2847, orders: 2112 },
];

const cuisineCompletionData = [
  { cuisine: 'Pizza', rate: 82, fill: '#7c3aed' },
  { cuisine: 'Thai', rate: 79, fill: '#14b8a6' },
  { cuisine: 'Burgers', rate: 76, fill: '#FF6B35' },
  { cuisine: 'Chinese', rate: 74, fill: '#06b6d4' },
  { cuisine: 'Sushi', rate: 71, fill: '#3b82f6' },
  { cuisine: 'Indian', rate: 68, fill: '#22c55e' },
  { cuisine: 'Italian', rate: 65, fill: '#8b5cf6' },
];

export default function AnalyticsView() {
  const [timeWindow, setTimeWindow] = useState('Last 7 days');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">Platform Analytics</h2>
          <div className="text-[12px] text-[#6b7280]">
            Full-funnel conversion diagnostics, cuisine benchmarks, and order abandonment telemetry.
          </div>
        </div>

        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value)}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        >
          <option value="Last 7 days">Last 7 days</option>
          <option value="Last 30 days">Last 30 days</option>
          <option value="Last 90 days">Last 90 days</option>
        </select>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Total Calls (7d)
            </div>
            <PhoneIcon size={24} className="text-[#7c3aed]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#7c3aed] mt-2 mb-1 leading-none">
            19,847
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 18%</span> vs prior week
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Orders Completed
            </div>
            <CheckCircleIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            14,731
          </div>
          <div className="text-[12px] text-[#6b7280]">74.2% completion rate</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              GMV (7d)
            </div>
            <DollarIcon size={24} className="text-[#22c55e]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#22c55e] mt-2 mb-1 leading-none">
            $441K
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ 22%</span> vs prior week
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <div className="flex justify-between items-start">
            <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
              Avg Order Value
            </div>
            <ShoppingCartIcon size={24} className="text-[#3b82f6]/20" />
          </div>
          <div className="text-[28px] font-extrabold text-[#3b82f6] mt-2 mb-1 leading-none">
            $43.20
          </div>
          <div className="text-[12px] text-[#6b7280]">
            <span className="text-[#22c55e] font-semibold">↑ $2.10</span> vs prior week
          </div>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Orders vs Calls — 7 days */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">
            Daily Orders vs Calls — 7 days
          </h3>
          <div className="h-[200px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyOrdersCallsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
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
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                  <Line type="monotone" name="Calls" dataKey="calls" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3, fill: '#7c3aed' }} />
                  <Line type="monotone" name="Orders" dataKey="orders" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Completion Rate by Cuisine Type */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">
            Completion Rate by Cuisine Type
          </h3>
          <div className="h-[200px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cuisineCompletionData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis dataKey="cuisine" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="rate" fill="#7c3aed" radius={[0, 6, 6, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column: Abandonment Reasons and Payment Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Abandonment Reasons Table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#111827] mb-3">Top Abandonment Reasons</h3>
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Reason</th>
                  <th className="py-2.5 px-3.5 font-semibold">Count</th>
                  <th className="py-2.5 px-3.5 font-semibold">% of Abandoned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Call dropped (network)</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] font-semibold">847</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#ef4444]">34%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Customer hung up voluntarily</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] font-semibold">621</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#854d0e]">25%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">STT misunderstanding ×3</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] font-semibold">498</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#854d0e]">20%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Item not available</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] font-semibold">312</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#3b82f6]">13%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Restaurant closed / outside hours</td>
                  <td className="py-2.5 px-3.5 text-[#6b7280] font-semibold">199</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#6b7280]">8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Conversion Funnel Table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
          <h3 className="text-[14px] font-bold text-[#111827] mb-3">Payment Conversion Funnel</h3>
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Stage</th>
                  <th className="py-2.5 px-3.5 font-semibold">Count</th>
                  <th className="py-2.5 px-3.5 font-semibold">Conv%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Calls received</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">19,847</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#6b7280]">100%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Orders confirmed</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">14,731</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#7c3aed]">74.2%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">SMS payment link sent</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">14,731</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#6b7280]">100%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">Payment link opened</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">13,404</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#3b82f6]">91.0%</td>
                </tr>
                <tr className="bg-[#f0fdf4]">
                  <td className="py-2.5 px-3.5 font-bold text-[#16a34a]">Payment completed</td>
                  <td className="py-2.5 px-3.5 font-bold text-[#16a34a]">12,182</td>
                  <td className="py-2.5 px-3.5 font-bold text-[#16a34a]">82.7%</td>
                </tr>
                <tr className="hover:bg-[#fafaf9]">
                  <td className="py-2.5 px-3.5 text-[#111827]">POS synced successfully</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#111827]">11,939</td>
                  <td className="py-2.5 px-3.5 font-semibold text-[#16a34a]">98.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
