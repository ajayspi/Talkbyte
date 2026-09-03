'use client';

import React, { createContext, useContext, useState, useEffect, useTransition, Suspense } from 'react';
import {
  BarChartIcon,
  PhoneIcon,
  StoreIcon,
  UsersIcon,
  DollarIcon,
  BillingIcon,
  ServerIcon,
  ShieldIcon,
  AnalyticsIcon,
} from '@/components/icons';

export type AdminTab =
  | 'overview'
  | 'live'
  | 'restaurants'
  | 'users'
  | 'revenue'
  | 'billing'
  | 'infra'
  | 'audit'
  | 'analytics';

export interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  liveCallCount: number;
  setLiveCallCount: (count: number) => void;
}

const AdminContext = createContext<AdminContextType>({
  activeTab: 'overview',
  setActiveTab: () => {},
  liveCallCount: 23,
  setLiveCallCount: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export const PAGE_TITLES: Record<AdminTab, string> = {
  overview: 'Platform Overview',
  live: 'Live Call Monitor',
  restaurants: 'Restaurant Fleet',
  revenue: 'Revenue & Financials',
  infra: 'Infrastructure Health',
  audit: 'Audit Log',
  analytics: 'Platform Analytics',
  users: 'User Management',
  billing: 'Billing Management',
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [liveCallCount, setLiveCallCount] = useState<number>(23);
  const [formattedTime, setFormattedTime] = useState<string>('Sat 29 Aug 2026 · 7:42 PM AEST');
  const [, startTransition] = useTransition();

  // Read initial tab from URL query params or hash if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as AdminTab | null;
      if (tabParam && PAGE_TITLES[tabParam]) {
        setActiveTab(tabParam);
      } else if (window.location.hash) {
        const hash = window.location.hash.replace('#', '') as AdminTab;
        if (PAGE_TITLES[hash]) {
          setActiveTab(hash);
        }
      }
    }
  }, []);

  // Update clock every minute in AEST
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Australia/Sydney',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        const formatter = new Intl.DateTimeFormat('en-AU', options);
        setFormattedTime(`${formatter.format(now)} AEST`);
      } catch {
        // Fallback default
        setFormattedTime('Sat 29 Aug 2026 · 7:42 PM AEST');
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleTabSelect = (tab: AdminTab) => {
    startTransition(() => {
      setActiveTab(tab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
      }
    });
  };

  return (
    <AdminContext.Provider value={{ activeTab, setActiveTab: handleTabSelect, liveCallCount, setLiveCallCount }}>
      <div className="flex min-h-screen bg-[#f8f7ff] text-[#111827] font-sans antialiased text-[14px]">
        {/* Fixed Left Sidebar */}
        <aside className="w-[220px] min-h-screen bg-[#4A0E4E] text-white fixed top-0 left-0 z-40 flex flex-col overflow-y-auto border-r border-white/10 select-none">
          {/* Logo & Platform Badge */}
          <div className="p-5 pb-3.5 border-b border-white/10">
            <div className="text-[20px] font-extrabold tracking-tight">
              Talk<span className="text-[#14b8a6]">Byte</span>
            </div>
            <div className="text-[10px] text-white/55 uppercase tracking-[1px] mt-1 font-semibold">
              Operator Admin Panel
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 py-2 overflow-y-auto">
            {/* PLATFORM */}
            <div className="px-3.5 pt-3.5 pb-1 text-[9px] uppercase tracking-[1.2px] text-white/45 font-bold">
              Platform
            </div>
            <button
              onClick={() => handleTabSelect('overview')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChartIcon size={16} className="text-[#c084fc] shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleTabSelect('live')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer mt-0.5 ${
                activeTab === 'live'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
              <span>Live Monitor</span>
            </button>

            {/* MANAGEMENT */}
            <div className="px-3.5 pt-4 pb-1 text-[9px] uppercase tracking-[1.2px] text-white/45 font-bold">
              Management
            </div>
            <button
              onClick={() => handleTabSelect('restaurants')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer ${
                activeTab === 'restaurants'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <StoreIcon size={16} className="text-[#60a5fa] shrink-0" />
              <span>Restaurants</span>
            </button>

            <button
              onClick={() => handleTabSelect('users')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer mt-0.5 ${
                activeTab === 'users'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UsersIcon size={16} className="text-[#38bdf8] shrink-0" />
              <span>Users</span>
            </button>

            {/* FINANCE */}
            <div className="px-3.5 pt-4 pb-1 text-[9px] uppercase tracking-[1.2px] text-white/45 font-bold">
              Finance
            </div>
            <button
              onClick={() => handleTabSelect('revenue')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer ${
                activeTab === 'revenue'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <DollarIcon size={16} className="text-[#4ade80] shrink-0" />
              <span>Revenue</span>
            </button>

            <button
              onClick={() => handleTabSelect('billing')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer mt-0.5 ${
                activeTab === 'billing'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BillingIcon size={16} className="text-[#facc15] shrink-0" />
              <span>Billing</span>
            </button>

            {/* SYSTEM */}
            <div className="px-3.5 pt-4 pb-1 text-[9px] uppercase tracking-[1.2px] text-white/45 font-bold">
              System
            </div>
            <button
              onClick={() => handleTabSelect('infra')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer ${
                activeTab === 'infra'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ServerIcon size={16} className="text-[#2dd4bf] shrink-0" />
              <span>Infrastructure</span>
            </button>

            <button
              onClick={() => handleTabSelect('audit')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer mt-0.5 ${
                activeTab === 'audit'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ShieldIcon size={16} className="text-[#a78bfa] shrink-0" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={() => handleTabSelect('analytics')}
              className={`w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] text-left transition-all cursor-pointer mt-0.5 ${
                activeTab === 'analytics'
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <AnalyticsIcon size={16} className="text-[#fb923c] shrink-0" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Sidebar Status Footer */}
          <div className="p-3 border-t border-white/10 bg-[#3a0a3d]/60">
            <div className="text-[12px] text-white/70 flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block mr-1.5 shadow-[0_0_6px_#22c55e]" />
              All systems operational
            </div>
            <div className="text-[11px] text-white/40 mt-1.5 font-mono">v2.2 · AU-EAST-1</div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          {/* Topbar */}
          <header className="bg-white border-b border-[#e5e7eb] px-6 h-14 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <h1 className="text-[17px] font-bold text-[#4A0E4E]">
              {PAGE_TITLES[activeTab] || 'Operator Admin Panel'}
            </h1>

            <div className="flex items-center gap-3">
              <div className="bg-[#ef4444] text-white text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse shadow-xs">
                <span>●</span> {liveCallCount} Live Calls
              </div>
              <div className="text-[12px] text-[#6b7280] hidden sm:block font-medium">
                {formattedTime}
              </div>
              <div
                className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-[13px] font-bold shadow-xs cursor-default"
                title="Super Operator: AJ"
              >
                AJ
              </div>
            </div>
          </header>

          {/* View Content */}
          <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
          <div className="text-[#4A0E4E] font-semibold text-base animate-pulse">
            Loading TalkByte Admin...
          </div>
        </div>
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
