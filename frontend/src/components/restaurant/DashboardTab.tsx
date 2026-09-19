'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  DollarIcon,
  HeadsetIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/icons';
import type { Order, Call } from '@/types/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DashboardTabProps {
  onNavigateTab: (tab: string) => void;
  recentOrders?: Order[];
  liveCalls?: Call[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateTab,
  recentOrders = [],
  liveCalls = [],
}) => {
  // Live ticker for active call widget
  const [tickerSeconds, setTickerSeconds] = useState(134); // 2:14
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Hourly call volume data from prototype
  const hourlyData = [
    { hour: '8am', calls: 2 },
    { hour: '9', calls: 3 },
    { hour: '10', calls: 4 },
    { hour: '11', calls: 5 },
    { hour: '12pm', calls: 12 },
    { hour: '1', calls: 15 },
    { hour: '2', calls: 9 },
    { hour: '3', calls: 6 },
    { hour: '4', calls: 5 },
    { hour: '5', calls: 7 },
    { hour: '6pm', calls: 14 },
    { hour: '7', calls: 18 },
    { hour: '8', calls: 10 },
    { hour: '9', calls: 4 },
  ];

  const maxCalls = 20;
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="section active space-y-6">
      {/* Onboarding Banner */}
      <div className="onboard-bar">
        <div style={{ fontSize: '28px' }}>🚀</div>
        <div className="onboard-progress">
          <div className="onboard-title">
            Setup almost done — 4 of 5 steps complete
          </div>
          <div className="onboard-steps">
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step" />
          </div>
        </div>
        <button
          className="onboard-cta"
          onClick={() => onNavigateTab('settings')}
        >
          Connect POS →
        </button>
      </div>

      {/* Alert Warning Strip */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          ⚠️ 2 payment links expired without payment in the last hour.{' '}
          <span
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer underline font-semibold text-amber-400 ml-1 hover:text-amber-300"
          >
            Review orders
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calls Today</div>
            <div className="text-3xl font-extrabold text-violet-400 mt-2 mb-1">47</div>
            <div className="text-xs text-emerald-400 font-medium">↑ 18% vs yesterday</div>
            <div className="absolute top-4 right-4 text-violet-500/30">
              <PhoneIcon size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revenue Today</div>
            <div className="text-3xl font-extrabold text-teal-400 mt-2 mb-1">$1,284</div>
            <div className="text-xs text-emerald-400 font-medium">↑ $320 vs yesterday</div>
            <div className="absolute top-4 right-4 text-teal-500/30">
              <DollarIcon size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Answer Rate</div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2 mb-1">96%</div>
            <div className="text-xs text-emerald-400 font-medium">↑ 2% vs last week</div>
            <div className="absolute top-4 right-4 text-rose-500/30">
              <HeadsetIcon size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer Satisfaction</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 mb-1">4.7</div>
            <div className="text-xs text-slate-400 font-medium">— Same as last week</div>
            <div className="absolute top-4 right-4 text-emerald-500/30">
              <CheckCircleIcon size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* Left Column: Active Calls & Recent Orders */}
        <div className="space-y-6">
          {/* Active Calls Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Calls</CardTitle>
              <span
                className="text-violet-400 hover:text-violet-300 text-sm font-medium cursor-pointer"
                onClick={() => onNavigateTab('livecalls')}
              >
                View all →
              </span>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <PhoneIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">+61 4•• ••• 847</div>
                    <div className="text-slate-400 text-xs">Inbound · Ordering</div>
                  </div>
                  <div className="text-emerald-400 font-mono font-bold">
                    {formatDuration(tickerSeconds)}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-slate-300 border border-slate-700/50 mb-4 font-mono italic">
                  &quot;Can I get a large margherita, extra cheese, and two garlic bread please...&quot;
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={isTakingOver ? 'secondary' : 'danger'}
                    onClick={() => {
                      setIsTakingOver(!isTakingOver);
                      if (!isTakingOver) setIsMonitoring(false);
                    }}
                  >
                    {isTakingOver ? 'Staff Speaking ✓' : 'Take Over'}
                  </Button>
                  <Button
                    variant={isMonitoring ? 'primary' : 'secondary'}
                    onClick={() => {
                      setIsMonitoring(!isMonitoring);
                      if (!isMonitoring) setIsTakingOver(false);
                    }}
                  >
                    {isMonitoring ? 'Monitoring 🎧' : 'Monitor'}
                  </Button>
                </div>
              </div>
              <div className="text-center text-sm text-slate-500 font-medium">
                1 active · 0 queued
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <span
                className="text-violet-400 hover:text-violet-300 text-sm font-medium cursor-pointer"
                onClick={() => onNavigateTab('orders')}
              >
                View all →
              </span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-y border-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Items</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-300">
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#1047</td>
                    <td className="px-6 py-4">Margherita L, Garlic ×2</td>
                    <td className="px-6 py-4 font-bold text-white">$38.50</td>
                    <td className="px-6 py-4">
                      <Badge variant="success">✓ Paid</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#1046</td>
                    <td className="px-6 py-4">Pepperoni XL, Coke ×3</td>
                    <td className="px-6 py-4 font-bold text-white">$54.00</td>
                    <td className="px-6 py-4">
                      <Badge variant="warning">⏳ Link Sent</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#1045</td>
                    <td className="px-6 py-4">Veggie Special, Tiramisu</td>
                    <td className="px-6 py-4 font-bold text-white">$42.80</td>
                    <td className="px-6 py-4">
                      <Badge variant="success">✓ POS Synced</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">#1044</td>
                    <td className="px-6 py-4">Quattro Stagioni</td>
                    <td className="px-6 py-4 font-bold text-white">$28.00</td>
                    <td className="px-6 py-4">
                      <Badge variant="danger">✗ Link Expired</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Calls Today Chart & Sentiment Feed */}
        <div className="space-y-6">
          {/* Calls Today (by hour) */}
          <Card>
            <CardHeader>
              <CardTitle>Calls Today (by hour)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full relative pt-4">
                {/* SVG Bar Chart */}
                <svg
                  viewBox="0 0 520 200"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[0, 5, 10, 15, 20].map((val) => {
                    const y = 170 - (val / maxCalls) * 140;
                    return (
                      <g key={val}>
                        <line
                          x1="30"
                          y1={y}
                          x2="510"
                          y2={y}
                          stroke="#334155"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="22"
                          y={y + 4}
                          fontSize="10"
                          fill="#64748b"
                          textAnchor="end"
                          className="font-medium"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {hourlyData.map((d, index) => {
                    const barWidth = 24;
                    const spacing = 34;
                    const x = 38 + index * spacing;
                    const barHeight = (d.calls / maxCalls) * 140;
                    const y = 170 - barHeight;
                    const isHovered = hoveredBar === index;

                    return (
                      <g
                        key={`bar-${index}`}
                        onMouseEnter={() => setHoveredBar(index)}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="4"
                          ry="4"
                          fill={
                            isHovered
                              ? '#8b5cf6'
                              : 'rgba(124, 58, 237, 0.4)'
                          }
                          className="transition-colors duration-150"
                        />
                        {/* Hour Label */}
                        <text
                          x={x + barWidth / 2}
                          y="190"
                          fontSize="10"
                          fill={isHovered ? '#e2e8f0' : '#64748b'}
                          fontWeight={
                            d.hour.includes('pm') || d.hour === '8am'
                              ? '600'
                              : '500'
                          }
                          textAnchor="middle"
                        >
                          {d.hour}
                        </text>
                        {/* Tooltip hint on hover */}
                        {isHovered && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            fontSize="12"
                            fontWeight="bold"
                            fill="#f8fafc"
                            textAnchor="middle"
                          >
                            {d.calls} calls
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Customer Sentiment — Last 7 Days */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Sentiment — Last 7 Days</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-700/50">
              <div className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl flex-shrink-0">😊</div>
                <div className="flex-1">
                  <strong className="text-sm text-white">Mon — Positive</strong>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &quot;Easy ordering, loved the voice!&quot;
                  </div>
                </div>
                <Badge variant="success">94%</Badge>
              </div>

              <div className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl flex-shrink-0">😊</div>
                <div className="flex-1">
                  <strong className="text-sm text-white">Tue — Positive</strong>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &quot;Quick and simple, will order again&quot;
                  </div>
                </div>
                <Badge variant="success">91%</Badge>
              </div>

              <div className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl flex-shrink-0">😐</div>
                <div className="flex-1">
                  <strong className="text-sm text-white">Wed — Neutral</strong>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &quot;Took a few tries to get the order right&quot;
                  </div>
                </div>
                <Badge variant="warning">72%</Badge>
              </div>

              <div className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-xl flex-shrink-0">😞</div>
                <div className="flex-1">
                  <strong className="text-sm text-white">Thu — Negative</strong>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &quot;AI didn&apos;t understand my request&quot;
                  </div>
                </div>
                <Badge variant="danger">48%</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default DashboardTab;
