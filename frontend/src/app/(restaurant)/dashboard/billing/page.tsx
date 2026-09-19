'use client';

import React, { useEffect } from 'react';
import { useRestaurant } from '../../layout';
import BillingTab from '@/components/restaurant/BillingTab';

export default function DashboardBillingPage() {
  const { setActiveTab } = useRestaurant();

  useEffect(() => {
    setActiveTab('billing');
  }, [setActiveTab]);

  return <BillingTab />;
}
