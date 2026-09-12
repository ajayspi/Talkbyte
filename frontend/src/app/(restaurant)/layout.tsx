'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BoltIcon,
  PhoneIcon,
  ShoppingCartIcon,
  UtensilsIcon,
  BarChartIcon,
  CreditCardIcon,
  SettingsIcon,
  StoreIcon,
  ChevronDownIcon,
  XIcon,
  DownloadIcon,
  PlusIcon,
} from '@/components/icons';
import { getRestaurant, getFleetRestaurants } from '@/lib/supabase';
import type { Restaurant } from '@/types/database.types';

export type TabId =
  | 'dashboard'
  | 'livecalls'
  | 'orders'
  | 'menu'
  | 'analytics'
  | 'billing'
  | 'settings'
  | 'team';

interface RestaurantContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  currentVenue: Restaurant | null;
  setCurrentVenue: (venue: Restaurant) => void;
  isAddItemModalOpen: boolean;
  setIsAddItemModalOpen: (open: boolean) => void;
}

const RestaurantContext = createContext<RestaurantContextType>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
  currentVenue: null,
  setCurrentVenue: () => {},
  isAddItemModalOpen: false,
  setIsAddItemModalOpen: () => {},
});

export const useRestaurant = () => useContext(RestaurantContext);

const TAB_TITLES: Record<TabId, string> = {
  dashboard: 'Dashboard',
  livecalls: 'Live Calls',
  orders: 'Orders',
  menu: 'Menu Management',
  analytics: 'Analytics',
  billing: 'Billing & Plan',
  settings: 'Settings',
  team: 'Team Management',
};

const TAB_SUBS: Record<TabId, string> = {
  dashboard: 'Saturday, 29 Aug 2026 · AEST',
  livecalls: '2 active calls right now',
  orders: '47 orders today · $1,284 revenue',
  menu: '24 items · Last synced 4 min ago',
  analytics: 'Last 7 days overview',
  billing: 'Pro Plan · $1,500/mo',
  settings: 'Account & AI configuration',
  team: 'Manage staff access and roles',
};

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [currentVenue, setCurrentVenue] = useState<Restaurant | null>(null);
  const [venues, setVenues] = useState<Restaurant[]>([]);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sync tab from URL param if available on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        ['dashboard', 'livecalls', 'orders', 'menu', 'analytics', 'billing', 'settings'].includes(
          tabParam
        )
      ) {
        setActiveTab(tabParam as TabId);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const rest = await getRestaurant();
      setCurrentVenue(rest);
      const fleet = await getFleetRestaurants();
      setVenues(fleet);
    }
    loadData();
  }, []);

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSelectTab,
        currentVenue,
        setCurrentVenue,
        isAddItemModalOpen,
        setIsAddItemModalOpen,
      }}
    >
      {/* Visual styling matching talkbyte-restaurant-dashboard.html */}
      <style jsx global>{`
        :root {
          --purple: #4A0E4E;
          --purple-light: #7c3aed;
          --teal: #14b8a6;
          --orange: #FF6B35;
          --bg: #f8f7ff;
          --sidebar: #1a0a1e;
          --card: #fff;
          --border: #e5e7eb;
          --text: #111827;
          --muted: #6b7280;
          --success: #16a34a;
          --warn: #d97706;
          --danger: #dc2626;
        }

        .restaurant-dashboard-root {
          background-color: var(--bg);
          color: var(--text);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 240px;
          background: var(--sidebar);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
        }

        .sidebar-logo {
          padding: 20px 20px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logo-mark {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--purple-light), var(--teal));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .logo-sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .venue-picker {
          margin: 12px 12px 0;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          transition: background 0.15s;
        }

        .venue-picker:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .venue-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .venue-meta {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .nav {
          flex: 1;
          padding: 16px 8px;
          overflow-y: auto;
        }

        .nav-section {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 0 10px;
          margin: 16px 0 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
          margin-bottom: 2px;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(20, 184, 166, 0.2));
          color: #fff;
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--teal);
          border-radius: 0 2px 2px 0;
        }

        .nav-icon {
          font-size: 16px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-badge {
          margin-left: auto;
          background: var(--orange);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .live-pulse {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          margin-left: auto;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .profile-pill:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--purple-light), var(--teal));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .profile-name {
          font-size: 13px;
          color: #fff;
          font-weight: 500;
        }

        .profile-role {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* ── MAIN AREA ── */
        .main {
          margin-left: 240px;
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          min-height: 100vh;
        }

        .topbar {
          background: #fff;
          border-bottom: 1px solid var(--border);
          padding: 0 28px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .page-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .page-sub {
          font-size: 12px;
          color: var(--muted);
          margin-top: 1px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .btn-primary {
          background: var(--purple-light);
          color: #fff;
        }

        .btn-primary:hover {
          background: var(--purple);
        }

        .btn-ghost {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
        }

        .btn-ghost:hover {
          background: var(--bg);
          color: var(--text);
        }

        .notif-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          font-size: 16px;
        }

        .notif-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: var(--orange);
          border-radius: 50%;
          border: 2px solid #fff;
        }

        .content {
          padding: 24px 28px;
          flex: 1;
          overflow-y: auto;
        }

        /* ── CARDS ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: var(--card);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 60px;
          height: 60px;
          border-radius: 0 12px 0 60px;
          opacity: 0.08;
        }

        .kpi-card.purple::before { background: var(--purple-light); }
        .kpi-card.teal::before { background: var(--teal); }
        .kpi-card.orange::before { background: var(--orange); }
        .kpi-card.green::before { background: var(--success); }

        .kpi-label {
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
          margin-bottom: 8px;
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -1px;
        }

        .kpi-trend {
          font-size: 12px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trend-up { color: var(--success); }
        .trend-down { color: var(--danger); }

        .kpi-icon {
          font-size: 22px;
          position: absolute;
          top: 18px;
          right: 18px;
          opacity: 0.7;
        }

        .card {
          background: var(--card);
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }

        .card-action {
          font-size: 12px;
          color: var(--purple-light);
          cursor: pointer;
          font-weight: 500;
        }

        .card-body {
          padding: 20px;
        }

        /* ── TABLE ── */
        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 14px;
          text-align: left;
          border-bottom: 2px solid var(--border);
        }

        td {
          padding: 12px 14px;
          font-size: 13px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #faf9ff; }

        /* ── BADGES ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-purple { background: #ede9fe; color: #5b21b6; }
        .badge-gray { background: #f3f4f6; color: #374151; }

        /* ── LIVE CALL CARD ── */
        .live-call {
          background: linear-gradient(135deg, #1a0a1e, #0f172a);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          border-left: 3px solid #22c55e;
          position: relative;
          overflow: hidden;
        }

        .live-call::after {
          content: 'LIVE';
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 10px;
          font-weight: 800;
          color: #22c55e;
          letter-spacing: 1px;
        }

        .call-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .call-icon { font-size: 20px; }
        .caller-num { font-size: 14px; font-weight: 600; color: #fff; }
        .call-meta { font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 2px; }
        .call-duration { font-size: 13px; font-weight: 700; color: #22c55e; }

        .call-transcript {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 10px 12px;
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
          border-left: 2px solid var(--teal);
        }

        .call-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .call-btn {
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .call-btn-intercept { background: var(--orange); color: #fff; }
        .call-btn-monitor { background: rgba(255, 255, 255, 0.1); color: #fff; }

        /* ── LAYOUT HELPERS ── */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .section { display: block; }

        /* ── STATUS TIMELINE ── */
        .order-timeline { display: flex; align-items: center; gap: 0; }
        .tl-step { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; }
        .tl-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .tl-dot.done { background: #dcfce7; color: #166534; }
        .tl-dot.active { background: var(--purple-light); color: #fff; animation: pulse 1.5s infinite; }
        .tl-dot.pending { background: #f3f4f6; color: #9ca3af; }
        .tl-line { width: 24px; height: 2px; background: var(--border); margin: 0 2px; }
        .tl-line.done { background: #22c55e; }

        /* ── MENU GRID ── */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .menu-item-card {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
          background: var(--card);
          position: relative;
        }

        .menu-item-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text); }
        .menu-item-price { font-size: 18px; font-weight: 800; color: var(--purple-light); margin-bottom: 8px; }
        .menu-item-desc { font-size: 12px; color: var(--muted); line-height: 1.4; margin-bottom: 10px; }
        .toggle-wrap { display: flex; align-items: center; justify-content: space-between; }
        .toggle {
          width: 40px;
          height: 22px;
          background: #e5e7eb;
          border-radius: 11px;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
        }
        .toggle.on { background: var(--teal); }
        .toggle::after {
          content: '';
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: left 0.2s;
        }
        .toggle.on::after { left: 20px; }
        .item-badge { position: absolute; top: 10px; right: 10px; }

        /* ── SETTINGS ── */
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }
        .settings-row:last-child { border-bottom: none; }
        .setting-label { font-size: 14px; font-weight: 500; color: var(--text); }
        .setting-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

        input[type="text"], input[type="email"], select, textarea {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 13px;
          width: 100%;
          outline: none;
          background: #fff;
          color: var(--text);
        }

        input[type="text"]:focus, select:focus, textarea:focus {
          border-color: var(--purple-light);
        }

        .input-group { margin-bottom: 16px; }
        .input-label { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 6px; }

        /* ── PLAN CARD ── */
        .plan-card {
          border: 2px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          background: #fff;
        }

        .plan-card.current {
          border-color: var(--purple-light);
          background: #f5f3ff;
        }

        .plan-card .plan-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
        .plan-card .plan-price { font-size: 32px; font-weight: 800; color: var(--purple-light); letter-spacing: -1px; }
        .plan-card .plan-sub { font-size: 12px; color: var(--muted); }
        .plan-tag {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--purple-light);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 10px;
        }

        .usage-bar { height: 8px; background: var(--border); border-radius: 4px; margin-top: 8px; overflow: hidden; }
        .usage-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--purple-light), var(--teal));
        }

        /* ── SENTIMENT ── */
        .sentiment-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .sentiment-row:last-child { border-bottom: none; }
        .sentiment-score {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .sentiment-score.pos { background: #dcfce7; }
        .sentiment-score.neg { background: #fee2e2; }
        .sentiment-score.neu { background: #f3f4f6; }

        /* ── ONBOARDING ── */
        .onboard-bar {
          background: linear-gradient(135deg, var(--purple), #1e1050);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          color: #fff;
        }

        .onboard-progress { flex: 1; }
        .onboard-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
        .onboard-steps { display: flex; gap: 6px; }
        .onboard-step { flex: 1; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.2); }
        .onboard-step.done { background: var(--teal); }
        .onboard-cta {
          padding: 8px 16px;
          background: var(--orange);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        /* ── ALERT STRIP ── */
        .alert {
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
        }
        .alert-warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .alert-danger { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

        .chart-wrap { position: relative; height: 220px; }

        /* ── INTEGRATION STATUS ── */
        .integration-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .integration-row:last-child { border-bottom: none; }
        .int-left { display: flex; align-items: center; gap: 12px; }
        .int-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .int-name { font-size: 14px; font-weight: 600; color: var(--text); }
        .int-desc { font-size: 12px; color: var(--muted); margin-top: 1px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; display: inline-block; }
        .status-dot.green { background: #22c55e; }
        .status-dot.red { background: var(--danger); }
        .status-dot.gray { background: #9ca3af; }
      `}</style>

      <div className="restaurant-dashboard-root">
        {/* FIXED SIDEBAR */}
        <nav className="sidebar">
          {/* Logo & Platform Subtitle */}
          <div className="sidebar-logo">
            <div className="logo-mark">🎙️</div>
            <div>
              <div className="logo-text">TalkByte</div>
              <div className="logo-sub">AI Voice Platform</div>
            </div>
          </div>

          {/* Venue Picker */}
          <div
            className="venue-picker"
            onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="venue-name">
                {currentVenue ? currentVenue.name : "Mama's Pizzeria"}
              </div>
              <ChevronDownIcon
                size={14}
                className={`text-white/40 transition-transform ${
                  isVenueDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            <div className="venue-meta">
              {currentVenue?.name === 'Bondi Burger Co'
                ? 'Bondi Beach, Sydney · Enterprise Plan'
                : currentVenue?.name === 'Little Italy Carlton'
                ? 'Carlton, Melbourne · Pro Plan'
                : 'Newtown, Sydney · Pro Plan'}
            </div>

            {/* Dropdown for multi-unit operators */}
            {isVenueDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 bg-[#25102a] border border-white/10 rounded-xl p-1.5 shadow-2xl z-50 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {venues.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setCurrentVenue(v);
                      setIsVenueDropdownOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      v.id === currentVenue?.id
                        ? 'bg-purple-600/40 text-white font-semibold'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-[10px] text-white/40">
                      {v.timezone.split('/')[1]} · {v.pos_provider}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="nav">
            <div className="nav-section">Operations</div>

            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleSelectTab('dashboard')}
            >
              <span className="nav-icon">⚡</span> Dashboard
            </div>

            <div
              className={`nav-item ${activeTab === 'livecalls' ? 'active' : ''}`}
              onClick={() => handleSelectTab('livecalls')}
            >
              <span className="nav-icon">📞</span> Live Calls
              <span className="live-pulse" />
            </div>

            <div
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleSelectTab('orders')}
            >
              <span className="nav-icon">🛒</span> Orders
              <span className="nav-badge">3</span>
            </div>

            <div className="nav-section">Management</div>

            <div
              className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => handleSelectTab('menu')}
            >
              <span className="nav-icon">🍽️</span> Menu
            </div>

            <div
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleSelectTab('analytics')}
            >
              <span className="nav-icon">📊</span> Analytics
            </div>

            <div className="nav-section">Account</div>
            <div
              className={`nav-item ${activeTab === 'team' ? 'active' : ' '}`}
              onClick={() => handleSelectTab('team')}
            >
              <span className="nav-icon">👥</span> Team
            </div>


            <div
              className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => handleSelectTab('billing')}
            >
              <span className="nav-icon">💳</span> Billing & Plan
            </div>

            <div
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleSelectTab('settings')}
            >
              <span className="nav-icon">⚙️</span> Settings
            </div>
          </div>

          {/* Sidebar Footer with User Profile */}
          <div className="sidebar-footer">
            <div className="profile-pill">
              <div className="avatar">JR</div>
              <div>
                <div className="profile-name">John Rossi</div>
                <div className="profile-role">Owner</div>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN AREA */}
        <div className="main">
          {/* STICKY TOPBAR */}
          <header className="topbar">
            <div>
              <div className="page-title" id="page-title">
                {TAB_TITLES[activeTab]}
              </div>
              <div className="page-sub" id="page-sub">
                {TAB_SUBS[activeTab]}
              </div>
            </div>

            <div className="topbar-right">
              {/* Notification Bell with indicator dot */}
              <div
                className="notif-btn"
                title="Active calls and warnings"
                onClick={() => handleSelectTab('livecalls')}
              >
                🔔<div className="notif-dot" />
              </div>

              {/* Export Button */}
              <button
                className="topbar-btn btn-ghost flex items-center gap-1"
                onClick={() => setIsExportModalOpen(true)}
              >
                <DownloadIcon size={14} />
                Export
              </button>

              {/* Add Item Button */}
              <button
                className="topbar-btn btn-primary flex items-center gap-1"
                onClick={() => setIsAddItemModalOpen(true)}
              >
                <PlusIcon size={14} />
                Add Item
              </button>
            </div>
          </header>

          {/* SCROLLABLE CONTENT AREA */}
          <main className="content">{children}</main>
        </div>
      </div>

      {/* Global Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Export Report</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="py-4 space-y-2 text-xs text-gray-600">
              <p>Choose export format for current tab data ({TAB_TITLES[activeTab]}):</p>
              <div className="space-y-1.5 pt-2">
                <button
                  onClick={() => {
                    setIsExportModalOpen(false);
                    alert(`Exported ${TAB_TITLES[activeTab]} as CSV.`);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 font-medium text-gray-800 flex items-center justify-between"
                >
                  <span>Comma-Separated Values (.csv)</span>
                  <span className="text-[10px] text-purple-600 font-bold">CSV</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportModalOpen(false);
                    alert(`Exported ${TAB_TITLES[activeTab]} as PDF summary.`);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 font-medium text-gray-800 flex items-center justify-between"
                >
                  <span>Executive Summary (.pdf)</span>
                  <span className="text-[10px] text-teal-600 font-bold">PDF</span>
                </button>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="topbar-btn btn-ghost text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RestaurantContext.Provider>
  );
}
