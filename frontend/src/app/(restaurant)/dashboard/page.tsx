'use client';

import React from 'react';
import { useRestaurant } from '../layout';
import DashboardTab from '@/components/restaurant/DashboardTab';
import LiveCallsTab from '@/components/restaurant/LiveCallsTab';
import OrdersTab from '@/components/restaurant/OrdersTab';
import MenuTab from '@/components/restaurant/MenuTab';
import AnalyticsTab from '@/components/restaurant/AnalyticsTab';
import BillingTab from '@/components/restaurant/BillingTab';
import SettingsTab from '@/components/restaurant/SettingsTab';

export default function RestaurantDashboardPage() {
  const {
    activeTab,
    setActiveTab,
    isAddItemModalOpen,
    setIsAddItemModalOpen,
  } = useRestaurant();

  return (
    <div>
      {activeTab === 'dashboard' && (
        <DashboardTab onNavigateTab={(tab: any) => setActiveTab(tab)} />
      )}

      {activeTab === 'livecalls' && <LiveCallsTab />}

      {activeTab === 'orders' && <OrdersTab />}

      {activeTab === 'menu' && (
        <MenuTab
          isAddItemModalOpen={isAddItemModalOpen}
          setIsAddItemModalOpen={setIsAddItemModalOpen}
        />
      )}

      {activeTab === 'analytics' && <AnalyticsTab />}

      {activeTab === 'billing' && <BillingTab />}

      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}
