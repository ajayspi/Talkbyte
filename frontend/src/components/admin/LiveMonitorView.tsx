'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  HeadsetIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  VolumeIcon,
} from '@/components/icons';
import { getLiveCalls } from '@/lib/supabase';
import type { Call } from '@/types/database.types';

interface LiveCallItem {
  id: string;
  restaurant: string;
  location: string;
  stateCode: 'VIC' | 'NSW' | 'QLD';
  phone: string;
  sttConfidence: number;
  callState: 'TAKING_ORDER' | 'CONFIRMING' | 'ESCALATED' | 'PAYMENT_SENT';
  stateLabel: string;
  items: string;
  initialSeconds: number;
  seconds: number;
  borderTheme: 'green' | 'yellow' | 'teal' | 'blue';
  isEscalating?: boolean;
}

const INITIAL_CALLS: LiveCallItem[] = [
  {
    id: 'call-1',
    restaurant: "Mama's Pizzeria",
    location: 'Carlton VIC',
    stateCode: 'VIC',
    phone: '+61 412 *** 847',
    sttConfidence: 97,
    callState: 'TAKING_ORDER',
    stateLabel: 'TAKING ORDER',
    items: '🛒 2× Margherita · 1× Garlic Bread',
    initialSeconds: 134,
    seconds: 134,
    borderTheme: 'green',
  },
  {
    id: 'call-2',
    restaurant: 'Thai Express',
    location: 'Newtown NSW',
    stateCode: 'NSW',
    phone: '+61 438 *** 221',
    sttConfidence: 95,
    callState: 'TAKING_ORDER',
    stateLabel: 'TAKING ORDER',
    items: '🛒 Pad Thai large · Green curry',
    initialSeconds: 92,
    seconds: 92,
    borderTheme: 'green',
  },
  {
    id: 'call-3',
    restaurant: 'Burger Palace',
    location: 'South Bank QLD',
    stateCode: 'QLD',
    phone: '+61 404 *** 119',
    sttConfidence: 98,
    callState: 'CONFIRMING',
    stateLabel: 'CONFIRMING ORDER',
    items: '🛒 3× Beef Burger · 3× Chips · 2× Vanilla Shake',
    initialSeconds: 227,
    seconds: 227,
    borderTheme: 'teal',
  },
  {
    id: 'call-4',
    restaurant: 'Spaghetti Junction',
    location: 'Richmond VIC',
    stateCode: 'VIC',
    phone: '+61 421 *** 034',
    sttConfidence: 71,
    callState: 'ESCALATED',
    stateLabel: 'ESCALATING — 3rd misunderstanding',
    items: '⚠️ Transferring to staff in 10s if no resolution',
    initialSeconds: 312,
    seconds: 312,
    borderTheme: 'yellow',
    isEscalating: true,
  },
  {
    id: 'call-5',
    restaurant: 'Noodle House',
    location: 'Chinatown NSW',
    stateCode: 'NSW',
    phone: '+61 455 *** 662',
    sttConfidence: 96,
    callState: 'TAKING_ORDER',
    stateLabel: 'TAKING ORDER',
    items: '🛒 Ramen large · Spring rolls ×2',
    initialSeconds: 58,
    seconds: 58,
    borderTheme: 'green',
  },
  {
    id: 'call-6',
    restaurant: 'The Curry Leaf',
    location: 'Fitzroy VIC',
    stateCode: 'VIC',
    phone: '+61 448 *** 777',
    sttConfidence: 94,
    callState: 'PAYMENT_SENT',
    stateLabel: 'PAYMENT SMS SENT',
    items: '✅ Butter chicken · Biryani · Naan ×3 — awaiting payment',
    initialSeconds: 241,
    seconds: 241,
    borderTheme: 'blue',
  },
];

export default function LiveMonitorView() {
  const [calls, setCalls] = useState<LiveCallItem[]>(INITIAL_CALLS);
  const [regionFilter, setRegionFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [selectedCall, setSelectedCall] = useState<LiveCallItem | null>(null);

  // Live ticking timer effect (increments seconds every 1s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCalls((prev) =>
        prev.map((call) => ({
          ...call,
          seconds: call.seconds + 1,
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredCalls = calls.filter((call) => {
    if (regionFilter !== 'All' && call.stateCode !== regionFilter) return false;
    if (stateFilter !== 'All' && call.callState !== stateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header with Fleet Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827] flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444] animate-pulse" />
            Live Call Monitor
          </h2>
          <div className="text-[12px] text-[#6b7280] mt-0.5 font-medium">
            23 active calls across 487 restaurants · Updated every 3s
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All">All Restaurants</option>
            <option value="VIC">VIC</option>
            <option value="NSW">NSW</option>
            <option value="QLD">QLD</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All">All States</option>
            <option value="TAKING_ORDER">TAKING_ORDER</option>
            <option value="CONFIRMING">CONFIRMING</option>
            <option value="ESCALATED">ESCALATED</option>
          </select>
        </div>
      </div>

      {/* 5-KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Active Calls
          </div>
          <div className="text-[26px] font-extrabold text-[#22c55e] mt-1.5 leading-none">23</div>
          <div className="text-[11px] text-[#6b7280] mt-1">Platform-wide now</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            In Ordering
          </div>
          <div className="text-[26px] font-extrabold text-[#7c3aed] mt-1.5 leading-none">18</div>
          <div className="text-[11px] text-[#6b7280] mt-1">TAKING_ORDER state</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Confirming
          </div>
          <div className="text-[26px] font-extrabold text-[#14b8a6] mt-1.5 leading-none">3</div>
          <div className="text-[11px] text-[#6b7280] mt-1">CONFIRMING state</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Escalating
          </div>
          <div className="text-[26px] font-extrabold text-[#eab308] mt-1.5 leading-none">2</div>
          <div className="text-[11px] text-[#6b7280] mt-1">⚠️ Needs attention</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Avg Call Duration
          </div>
          <div className="text-[26px] font-extrabold text-[#3b82f6] mt-1.5 leading-none">2m 41s</div>
          <div className="text-[11px] text-[#6b7280] mt-1">target ≤3 min</div>
        </div>
      </div>

      {/* Active Call Cards Grid */}
      <div>
        <div className="text-[14px] font-bold text-[#111827] mb-3 flex items-center justify-between">
          <span>Active Call Cards</span>
          <span className="bg-[#fef2f2] text-[#ef4444] text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide">
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCalls.map((call) => {
            const isYellow = call.borderTheme === 'yellow';
            const isTeal = call.borderTheme === 'teal';
            const isBlue = call.borderTheme === 'blue';

            let borderClass = 'border-l-[3px] border-l-[#22c55e]';
            if (isYellow) borderClass = 'border-l-[3px] border-l-[#eab308] animate-pulse';
            if (isTeal) borderClass = 'border-l-[3px] border-l-[#14b8a6]';
            if (isBlue) borderClass = 'border-l-[3px] border-l-[#3b82f6]';

            let timerColor = 'text-[#7c3aed]';
            if (isYellow) timerColor = 'text-[#eab308]';

            return (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className={`bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer ${borderClass}`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold text-[13px] text-[#111827] flex items-center gap-1.5">
                    {call.isEscalating && <span>⚠️</span>}
                    <span>{call.restaurant}</span>
                  </div>
                  <div className={`text-[18px] font-extrabold ${timerColor} font-mono`}>
                    {formatTimer(call.seconds)}
                  </div>
                </div>

                <div className="text-[11px] text-[#6b7280] my-1">
                  {call.phone} · {call.location} · STT: {call.sttConfidence}% conf.
                </div>

                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#111827] mt-1.5">
                  {call.borderTheme === 'green' && (
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
                  )}
                  {call.borderTheme === 'teal' && (
                    <span className="w-2 h-2 rounded-full bg-[#14b8a6]" />
                  )}
                  {call.borderTheme === 'yellow' && (
                    <span className="w-2 h-2 rounded-full bg-[#eab308]" />
                  )}
                  {call.borderTheme === 'blue' && (
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  )}
                  <span>{call.stateLabel}</span>
                </div>

                <div className="text-[12px] text-[#6b7280] mt-2 pt-2 border-t border-[#f3f4f6]">
                  {call.items}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Completed Calls Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-[#111827]">Recent Completed Calls</h3>
          <span className="bg-[#f3f4f6] text-[#6b7280] text-[11px] font-semibold px-2 py-0.5 rounded-full">
            Last 30 min
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Time</th>
                <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                <th className="py-2.5 px-3.5 font-semibold">Duration</th>
                <th className="py-2.5 px-3.5 font-semibold">Outcome</th>
                <th className="py-2.5 px-3.5 font-semibold">Order Value</th>
                <th className="py-2.5 px-3.5 font-semibold">Payment</th>
                <th className="py-2.5 px-3.5 font-semibold">POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              <tr className="hover:bg-[#fafaf9] transition-colors">
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">19:38:22</td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">Mama&apos;s Pizzeria</td>
                <td className="py-3 px-3.5">2m 14s</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Ordered
                  </span>
                </td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">$47.50</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Paid
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Synced
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#fafaf9] transition-colors">
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">19:36:11</td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">Thai Express</td>
                <td className="py-3 px-3.5">1m 58s</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Ordered
                  </span>
                </td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">$38.00</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fefce8] text-[#854d0e]">
                    Pending
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                    Waiting
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#fafaf9] transition-colors">
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">19:34:05</td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">Sakura Sushi</td>
                <td className="py-3 px-3.5">0m 45s</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                    Abandoned
                  </span>
                </td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
              </tr>

              <tr className="hover:bg-[#fafaf9] transition-colors">
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">19:31:44</td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">Burger Palace</td>
                <td className="py-3 px-3.5">3m 22s</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Ordered
                  </span>
                </td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">$82.00</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Paid
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#16a34a]">
                    Synced
                  </span>
                </td>
              </tr>

              <tr className="hover:bg-[#fafaf9] transition-colors">
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280]">19:28:17</td>
                <td className="py-3 px-3.5 font-semibold text-[#111827]">The Greek Place</td>
                <td className="py-3 px-3.5">4m 01s</td>
                <td className="py-3 px-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#3b82f6]">
                    Escalated
                  </span>
                </td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
                <td className="py-3 px-3.5 text-[#9ca3af]">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Call Telemetry / Audio Inspector Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <div>
                <h3 className="font-bold text-[16px] text-[#111827] flex items-center gap-2">
                  <PhoneIcon size={18} className="text-[#7c3aed]" />
                  Live Call Inspector: {selectedCall.restaurant}
                </h3>
                <div className="text-[11px] text-[#6b7280]">
                  Room: room_{selectedCall.id} · Active for {formatTimer(selectedCall.seconds)}
                </div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-[#374151]">Session Telemetry</div>
              <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[#6b7280] text-[10px]">STT Confidence</div>
                  <div className="font-bold text-[#22c55e]">{selectedCall.sttConfidence}%</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[#6b7280] text-[10px]">Deepgram TTFT</div>
                  <div className="font-bold text-[#3b82f6]">62ms</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-[#6b7280] text-[10px]">ElevenLabs TTS</div>
                  <div className="font-bold text-[#7c3aed]">178ms</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[12px] font-semibold text-[#374151]">Current Order Context</div>
              <div className="p-3 bg-[#f8f7ff] rounded-lg text-[13px] border border-[#ede9fe] text-[#4A0E4E] font-medium">
                {selectedCall.items}
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              <button
                onClick={() => {
                  alert(`AI voice assistant muted for call ${selectedCall.id}`);
                }}
                className="px-3 py-2 text-[12px] font-semibold rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-gray-50"
              >
                Mute AI
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    alert(`Emergency SIP transfer dispatched to venue staff phone`);
                    setSelectedCall(null);
                  }}
                  className="px-3 py-2 text-[12px] font-semibold rounded-lg bg-[#eab308] text-white hover:bg-[#ca8a04]"
                >
                  Transfer to Staff
                </button>
                <button
                  onClick={() => {
                    alert(`Telephony connection terminated`);
                    setSelectedCall(null);
                  }}
                  className="px-3 py-2 text-[12px] font-semibold rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626]"
                >
                  Terminate Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
