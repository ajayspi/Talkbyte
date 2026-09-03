'use client';

import React from 'react';
import { useAdmin } from '@/app/(admin)/layout';
import OverviewView from '@/components/admin/OverviewView';
import LiveMonitorView from '@/components/admin/LiveMonitorView';
import RestaurantsView from '@/components/admin/RestaurantsView';
import UsersView from '@/components/admin/UsersView';
import RevenueView from '@/components/admin/RevenueView';
import BillingView from '@/components/admin/BillingView';
import InfraView from '@/components/admin/InfraView';
import AuditView from '@/components/admin/AuditView';
import AnalyticsView from '@/components/admin/AnalyticsView';

export default function AdminPage() {
  const { activeTab } = useAdmin();

  switch (activeTab) {
    case 'overview':
      return <OverviewView />;
    case 'live':
      return <LiveMonitorView />;
    case 'restaurants':
      return <RestaurantsView />;
    case 'users':
      return <UsersView />;
    case 'revenue':
      return <RevenueView />;
    case 'billing':
      return <BillingView />;
    case 'infra':
      return <InfraView />;
    case 'audit':
      return <AuditView />;
    case 'analytics':
      return <AnalyticsView />;
    default:
      return <OverviewView />;
  }
}
