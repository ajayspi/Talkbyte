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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
// eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    getPlatformStats().then(setStats);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* System Warning Alert Banner */}
      {!alertDismissed && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="text-sm">
              <strong>3 restaurants</strong> have payment links expiring unredeemed — check{' '}
              <button
                onClick={() => setActiveTab('revenue')}
                className="underline font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Revenue → Expired Links
              </button>{' '}
              tab.
            </span>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="text-amber-500/60 hover:text-amber-400 p-1 rounded-md cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* KPI Grid 1: High-Level Platform Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Restaurants */}
        <Card className="bg-gradient-to-br from-violet-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Restaurants
              </div>
              <StoreIcon size={24} className="text-violet-500/30" />
            </div>
            <div className="text-3xl font-extrabold text-violet-400 mt-2 mb-1">
              {stats ? stats.totalVenues : '487'}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↑ 12</span> this week · 94% plan active
            </div>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card className="bg-gradient-to-br from-emerald-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                MRR
              </div>
              <DollarIcon size={24} className="text-emerald-500/30" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 mb-1">
              ${stats ? (stats.mrrCents / 100).toLocaleString() : '125,400'}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↑ 5.5%</span> vs last month · $1.51M ARR
            </div>
          </CardContent>
        </Card>

        {/* Calls Today */}
        <Card className="bg-gradient-to-br from-teal-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Calls Today
              </div>
              <PhoneIcon size={24} className="text-teal-500/30" />
            </div>
            <div className="text-3xl font-extrabold text-teal-400 mt-2 mb-1">
              2,847
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↑ 18%</span> vs yesterday · 23 live now
            </div>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card className="bg-gradient-to-br from-amber-900/40 to-slate-800/80">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Churn Rate
              </div>
              <BarChartIcon size={24} className="text-amber-500/30" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2 mb-1">
              2.1%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-rose-400">↑ 0.3%</span> vs last month · 10 at risk
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Grid 2: Operational Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order Completion Rate */}
        <Card>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Order Completion Rate
              </div>
              <CheckCircleIcon size={24} className="text-emerald-500/20" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 mb-1">
              74.2%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↑ 2.1%</span> last 7 days · target ≥70%
            </div>
          </CardContent>
        </Card>

        {/* Payment Conversion */}
        <Card>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Payment Conversion
              </div>
              <CreditCardIcon size={24} className="text-violet-500/20" />
            </div>
            <div className="text-3xl font-extrabold text-violet-400 mt-2 mb-1">
              82.7%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↑ 1.4%</span> last 7 days · target ≥80%
            </div>
          </CardContent>
        </Card>

        {/* Avg E2E Latency */}
        <Card>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Avg E2E Latency
              </div>
              <BoltIcon size={24} className="text-teal-500/20" />
            </div>
            <div className="text-3xl font-extrabold text-teal-400 mt-2 mb-1">
              387ms
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↓ 23ms</span> vs yesterday · target &lt;500ms
            </div>
          </CardContent>
        </Card>

        {/* Escalation Rate */}
        <Card>
          <CardContent className="p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Escalation Rate
              </div>
              <AlertTriangleIcon size={24} className="text-amber-500/20" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2 mb-1">
              11.4%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span className="text-emerald-400">↓ 0.8%</span> vs last week · target ≤15%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls Per Hour — Today */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calls Per Hour — Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#a78bfa' }}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                    />
                    <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MRR Growth — 6 Months */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Growth — 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mrrGrowthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip
                      formatter={(value: any) => [`$${value}K`, 'MRR']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#mrrGradient)" />
                  </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Restaurants by Orders Today */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Top Restaurants by Orders Today</CardTitle>
            <Badge variant="info">Today</Badge>
          </CardHeader>
          <div className="overflow-x-auto rounded-b-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400 border-y border-slate-700/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">Restaurant</th>
                  <th className="py-3 px-4 font-semibold">Calls</th>
                  <th className="py-3 px-4 font-semibold">Orders</th>
                  <th className="py-3 px-4 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-violet-400">1</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Mama&apos;s Pizzeria</div>
                    <div className="text-[10px] text-slate-400">Carlton, VIC</div>
                  </td>
                  <td className="py-3 px-4">84</td>
                  <td className="py-3 px-4">61</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$1,842</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-violet-400">2</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Thai Express</div>
                    <div className="text-[10px] text-slate-400">Newtown, NSW</div>
                  </td>
                  <td className="py-3 px-4">71</td>
                  <td className="py-3 px-4">58</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$1,650</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-violet-400">3</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Burger Palace</div>
                    <div className="text-[10px] text-slate-400">South Bank, QLD</div>
                  </td>
                  <td className="py-3 px-4">67</td>
                  <td className="py-3 px-4">51</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$1,427</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-violet-400">4</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Noodle House</div>
                    <div className="text-[10px] text-slate-400">Chinatown, NSW</div>
                  </td>
                  <td className="py-3 px-4">55</td>
                  <td className="py-3 px-4">44</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$1,188</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-violet-400">5</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">The Curry Leaf</div>
                    <div className="text-[10px] text-slate-400">Fitzroy, VIC</div>
                  </td>
                  <td className="py-3 px-4">49</td>
                  <td className="py-3 px-4">39</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">$972</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* At-Risk Restaurants Radar */}
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>At-Risk Restaurants</CardTitle>
            <Badge variant="warning">10 flagged</Badge>
          </CardHeader>
          <div className="overflow-x-auto rounded-b-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-400 border-y border-slate-700/50">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Restaurant</th>
                  <th className="py-2.5 px-4 font-semibold">Risk Signal</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Sakura Sushi</div>
                    <div className="text-[10px] text-slate-400">St Kilda, VIC</div>
                  </td>
                  <td className="py-3 px-4 flex flex-col gap-1 items-start">
                    <Badge variant="danger" className="scale-90 origin-left">Low usage</Badge>
                    <Badge variant="warning" className="scale-90 origin-left">3 wks</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveModal({
                          type: 'contact',
                          restaurant: 'Sakura Sushi',
                          detail: 'Owner: kenji@sakurasushi.com.au · Inbound volume dropped 82% over the last 21 days.',
                        })
                      }
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Contact
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">The Greek Place</div>
                    <div className="text-[10px] text-slate-400">Oakleigh, VIC</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="warning" className="scale-90 origin-left">POS errors</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveModal({
                          type: 'debug',
                          restaurant: 'The Greek Place',
                          detail: 'Square POS OAuth token expired · 3 order push events queued for retry.',
                        })
                      }
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Debug
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Taco Loco</div>
                    <div className="text-[10px] text-slate-400">Surry Hills, NSW</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="danger" className="scale-90 origin-left">Overdue invoice</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveModal({
                          type: 'invoice',
                          restaurant: 'Taco Loco',
                          detail: 'Stripe Invoice #INV-2901 ($249.00 AUD) past due by 5 days.',
                        })
                      }
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Invoice
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">Spaghetti Junction</div>
                    <div className="text-[10px] text-slate-400">Richmond, VIC</div>
                  </td>
                  <td className="py-3 px-4 flex flex-col gap-1 items-start">
                    <Badge variant="warning" className="scale-90 origin-left">High escalation</Badge>
                    <span className="text-[10px] text-slate-400 ml-1">34%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveModal({
                          type: 'review',
                          restaurant: 'Spaghetti Junction',
                          detail: 'STT confidence avg 71% on acoustic background music noise · Menu item misinterpretation: "Gnocchi Gorgonzola".',
                        })
                      }
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Review AI
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
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
