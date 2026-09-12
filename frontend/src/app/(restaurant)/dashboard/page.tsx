'use client';
import { useRestaurant } from '../layout';
import DashboardTab from '@/components/restaurant/DashboardTab';
import LiveCallsTab from '@/components/restaurant/LiveCallsTab';
import OrdersTab from '@/components/restaurant/OrdersTab';
import MenuTab from '@/components/restaurant/MenuTab';
import AnalyticsTab from '@/components/restaurant/AnalyticsTab';
import BillingTab from '@/components/restaurant/BillingTab';
import SettingsTab from '@/components/restaurant/SettingsTab';
import TeamTab from './team';

export default function RestaurantDashboardPage() {
  const {
    activeTab,
    setActiveTab,
    isAddItemModalOpen,
    setIsAddItemModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  } = useRestaurant();

  return (
    <div className="tab-content" id="tab-content">
      {activeTab === 'dashboard' && (
        <DashboardTab onViewCalls={() => setActiveTab('livecalls')} />
      )}

      {activeTab === 'livecalls' && <LiveCallsTab />}

      {activeTab === 'orders' && <OrdersTab />}

      {activeTab === 'menu' && (
        <MenuTab
          isModalOpen={isAddItemModalOpen}
          setIsModalOpen={setIsAddItemModalOpen}
        />
      )}

      {activeTab === 'analytics' && <AnalyticsTab />}

      {activeTab === 'billing' && <BillingTab />}

      {activeTab === 'settings' && <SettingsTab />}

      {activeTab === 'team' && <TeamTab />}
    </div>
  );
}
