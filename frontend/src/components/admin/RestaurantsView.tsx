'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  StoreIcon,
  PhoneIcon,
  AlertTriangleIcon,
} from '@/components/icons';
import { getFleetRestaurants } from '@/lib/supabase';
import type { Restaurant } from '@/types/database.types';

export interface FleetRestaurantItem {
  id: string;
  name: string;
  suburb: string;
  state: string;
  onboardingDate: string;
  plan: 'Enterprise' | 'Pro' | 'Starter';
  callsMonth: number;
  ordersMonth: number;
  completionRate: number;
  healthScore: number;
  posProvider: string;
  posStatus: 'synced' | 'error' | 'manual' | 'none';
  status: 'Active' | 'At Risk' | 'Churning';
  mrr: number;
  hasErrors?: boolean;
}

const INITIAL_FLEET: FleetRestaurantItem[] = [
  {
    id: 'rest-1',
    name: "Mama's Pizzeria",
    suburb: 'Carlton',
    state: 'VIC',
    onboardingDate: 'Mar 2026',
    plan: 'Enterprise',
    callsMonth: 2847,
    ordersMonth: 2115,
    completionRate: 74,
    healthScore: 98,
    posProvider: 'Square ✓',
    posStatus: 'synced',
    status: 'Active',
    mrr: 3500,
  },
  {
    id: 'rest-2',
    name: 'Thai Express',
    suburb: 'Newtown',
    state: 'NSW',
    onboardingDate: 'Jan 2026',
    plan: 'Pro',
    callsMonth: 1543,
    ordersMonth: 1189,
    completionRate: 77,
    healthScore: 95,
    posProvider: 'Square ✓',
    posStatus: 'synced',
    status: 'Active',
    mrr: 1500,
  },
  {
    id: 'rest-3',
    name: 'Burger Palace',
    suburb: 'South Bank',
    state: 'QLD',
    onboardingDate: 'Feb 2026',
    plan: 'Pro',
    callsMonth: 1287,
    ordersMonth: 951,
    completionRate: 74,
    healthScore: 92,
    posProvider: 'Lightspeed ✓',
    posStatus: 'synced',
    status: 'Active',
    mrr: 1500,
  },
  {
    id: 'rest-4',
    name: 'Spaghetti Junction',
    suburb: 'Richmond',
    state: 'VIC',
    onboardingDate: 'Apr 2026',
    plan: 'Starter',
    callsMonth: 512,
    ordersMonth: 287,
    completionRate: 56,
    healthScore: 61,
    posProvider: 'Email only',
    posStatus: 'manual',
    status: 'At Risk',
    mrr: 500,
  },
  {
    id: 'rest-5',
    name: 'Sakura Sushi',
    suburb: 'St Kilda',
    state: 'VIC',
    onboardingDate: 'May 2026',
    plan: 'Starter',
    callsMonth: 89,
    ordersMonth: 41,
    completionRate: 46,
    healthScore: 34,
    posProvider: 'None',
    posStatus: 'none',
    status: 'Churning',
    mrr: 500,
  },
  {
    id: 'rest-6',
    name: 'The Greek Place',
    suburb: 'Oakleigh',
    state: 'VIC',
    onboardingDate: 'Jun 2026',
    plan: 'Starter',
    callsMonth: 341,
    ordersMonth: 214,
    completionRate: 63,
    healthScore: 58,
    posProvider: 'Square ✗ errors',
    posStatus: 'error',
    status: 'At Risk',
    mrr: 500,
    hasErrors: true,
  },
];

export default function RestaurantsView() {
  const [fleet, setFleet] = useState<FleetRestaurantItem[]>(INITIAL_FLEET);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [debugModalVenue, setDebugModalVenue] = useState<FleetRestaurantItem | null>(null);
  const [viewDetailVenue, setViewDetailVenue] = useState<FleetRestaurantItem | null>(null);

  // Form State for Add Restaurant
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenuePhone, setNewVenuePhone] = useState('+61 2 8999 4400');
  const [newVenueTelnyx, setNewVenueTelnyx] = useState('+61 2 8123 9999');
  const [newVenueSuburb, setNewVenueSuburb] = useState('');
  const [newVenueState, setNewVenueState] = useState('NSW');
  const [newVenuePlan, setNewVenuePlan] = useState<'Enterprise' | 'Pro' | 'Starter'>('Pro');
  const [newVenuePos, setNewVenuePos] = useState('Square');
  const [newVenueEmail, setNewVenueEmail] = useState('');

  // Load any extra fleet restaurants from Supabase backend if connected
  useEffect(() => {
    getFleetRestaurants().then((data: Restaurant[]) => {
      if (data && data.length > 0) {
        // Map any extra restaurants into fleet structure if not already present
        const extras: FleetRestaurantItem[] = data
          .filter((item) => !INITIAL_FLEET.some((f) => f.name.toLowerCase() === item.name.toLowerCase()))
          .map((item, idx) => ({
            id: item.id || `extra-${idx}`,
            name: item.name,
            suburb: 'Sydney Metro',
            state: 'NSW',
            onboardingDate: 'Jul 2026',
            plan: (item.plan_id === 'enterprise' ? 'Enterprise' : item.plan_id === 'starter' ? 'Starter' : 'Pro') as any,
            callsMonth: item.calls_month || 650,
            ordersMonth: item.orders_month || 410,
            completionRate: Math.round(item.completion_rate || 75),
            healthScore: item.health_score || 90,
            posProvider: item.pos_provider === 'lightspeed' ? 'Lightspeed ✓' : 'Square ✓',
            posStatus: 'synced',
            status: 'Active',
            mrr: item.mrr || (item.plan_id === 'enterprise' ? 3500 : item.plan_id === 'starter' ? 500 : 1500),
          }));

        if (extras.length > 0) {
          setFleet((prev) => [...prev, ...extras]);
        }
      }
    });
  }, []);

  const filteredFleet = useMemo(() => {
    return fleet.filter((venue) => {
      const matchesSearch =
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan =
        planFilter === 'All Plans' || venue.plan.toLowerCase() === planFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All Status' || venue.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [fleet, searchQuery, planFilter, statusFilter]);

  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;

    const newVenue: FleetRestaurantItem = {
      id: `rest-${Date.now()}`,
      name: newVenueName.trim(),
      suburb: newVenueSuburb.trim() || 'Melbourne CBD',
      state: newVenueState,
      onboardingDate: 'Sep 2026',
      plan: newVenuePlan,
      callsMonth: 12,
      ordersMonth: 8,
      completionRate: 85,
      healthScore: 99,
      posProvider: `${newVenuePos} ✓`,
      posStatus: 'synced',
      status: 'Active',
      mrr: newVenuePlan === 'Enterprise' ? 3500 : newVenuePlan === 'Pro' ? 1500 : 500,
    };

    setFleet((prev) => [newVenue, ...prev]);
    setIsAddModalOpen(false);
    setNewVenueName('');
    setNewVenueSuburb('');
    setNewVenueEmail('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-[#111827]">
          Restaurant Fleet ({fleet.length})
        </h2>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            />
            <input
              type="text"
              placeholder="Search restaurants…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-[#111827] placeholder-[#9ca3af] shadow-2xs w-[220px] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All Plans">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
            <option value="Churning">Churning</option>
          </select>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <PlusIcon size={16} />
            <span>Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Fleet Management Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Restaurant</th>
                <th className="py-2.5 px-3.5 font-semibold">Plan</th>
                <th className="py-2.5 px-3.5 font-semibold">State</th>
                <th className="py-2.5 px-3.5 font-semibold">Calls/mo</th>
                <th className="py-2.5 px-3.5 font-semibold">Orders/mo</th>
                <th className="py-2.5 px-3.5 font-semibold">Completion%</th>
                <th className="py-2.5 px-3.5 font-semibold">Health</th>
                <th className="py-2.5 px-3.5 font-semibold">POS</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">MRR</th>
                <th className="py-2.5 px-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredFleet.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#6b7280]">
                    No restaurants match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFleet.map((venue) => {
                  let planChip = 'bg-[#f3f4f6] text-[#6b7280]';
                  if (venue.plan === 'Enterprise') planChip = 'bg-[#ede9fe] text-[#7c3aed]';
                  if (venue.plan === 'Pro') planChip = 'bg-[#eff6ff] text-[#3b82f6]';

                  let healthFillColor = 'bg-[#22c55e]';
                  let healthChip = 'bg-[#f0fdf4] text-[#16a34a]';
                  if (venue.healthScore < 50) {
                    healthFillColor = 'bg-[#ef4444]';
                    healthChip = 'bg-[#fef2f2] text-[#ef4444]';
                  } else if (venue.healthScore < 80) {
                    healthFillColor = 'bg-[#eab308]';
                    healthChip = 'bg-[#fefce8] text-[#854d0e]';
                  }

                  let posChip = 'bg-[#ccfbf1] text-[#0f766e]';
                  if (venue.posStatus === 'error') {
                    posChip = 'bg-[#fef2f2] text-[#ef4444]';
                  } else if (venue.posStatus === 'manual' || venue.posStatus === 'none') {
                    posChip = 'bg-[#f3f4f6] text-[#6b7280]';
                  }

                  let statusChip = 'bg-[#f0fdf4] text-[#16a34a]';
                  if (venue.status === 'At Risk') statusChip = 'bg-[#fefce8] text-[#854d0e]';
                  if (venue.status === 'Churning') statusChip = 'bg-[#fef2f2] text-[#ef4444]';

                  return (
                    <tr key={venue.id} className="hover:bg-[#fafaf9] transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#111827]">{venue.name}</div>
                        <div className="text-[11px] text-[#6b7280]">
                          {venue.suburb} {venue.state} · Since {venue.onboardingDate}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${planChip}`}>
                          {venue.plan}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-[#374151] font-medium">{venue.state}</td>

                      <td className="py-3 px-3.5 text-[#111827] font-semibold">
                        {venue.callsMonth.toLocaleString()}
                      </td>

                      <td className="py-3 px-3.5 text-[#111827] font-semibold">
                        {venue.ordersMonth.toLocaleString()}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#111827] w-8">{venue.completionRate}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${healthFillColor}`}
                              style={{ width: `${venue.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${healthChip}`}>
                          ● {venue.healthScore}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${posChip}`}>
                          {venue.posProvider}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusChip}`}>
                          {venue.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-[#111827]">
                        ${venue.mrr.toLocaleString()}
                      </td>

                      <td className="py-3 px-3.5">
                        {venue.hasErrors ? (
                          <button
                            onClick={() => setDebugModalVenue(venue)}
                            className="bg-[#fef2f2] border border-[#fca5a5] text-[#b91c1c] hover:bg-[#fee2e2] text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            Debug
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewDetailVenue(venue)}
                            className="border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#ede9fe] text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Restaurant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <h3 className="font-bold text-[16px] text-[#111827]">
                + Provision New Restaurant Tenant
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Restaurant Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bella Napoli Trattoria"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Real Restaurant Phone
                  </label>
                  <input
                    type="text"
                    value={newVenuePhone}
                    onChange={(e) => setNewVenuePhone(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Telnyx DID Number
                  </label>
                  <input
                    type="text"
                    value={newVenueTelnyx}
                    onChange={(e) => setNewVenueTelnyx(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">Suburb</label>
                  <input
                    type="text"
                    placeholder="e.g. Fitzroy"
                    value={newVenueSuburb}
                    onChange={(e) => setNewVenueSuburb(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">State</label>
                  <select
                    value={newVenueState}
                    onChange={(e) => setNewVenueState(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  >
                    <option value="VIC">VIC</option>
                    <option value="NSW">NSW</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="ACT">ACT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={newVenuePlan}
                    onChange={(e) => setNewVenuePlan(e.target.value as any)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  >
                    <option value="Starter">Starter ($149/mo)</option>
                    <option value="Pro">Pro ($249/mo)</option>
                    <option value="Enterprise">Enterprise ($499/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#374151] mb-1">POS System</label>
                  <select
                    value={newVenuePos}
                    onChange={(e) => setNewVenuePos(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                  >
                    <option value="Square">Square POS</option>
                    <option value="Lightspeed">Lightspeed K-Series</option>
                    <option value="Manual Email">Manual Email Fallback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Owner Email (Magic Link Invite)
                </label>
                <input
                  type="email"
                  placeholder="owner@restaurant.com.au"
                  value={newVenueEmail}
                  onChange={(e) => setNewVenueEmail(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-[13px] rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] cursor-pointer"
                >
                  Provision Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Debug Diagnostic Modal */}
      {debugModalVenue && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <h3 className="font-bold text-[16px] text-[#ef4444] flex items-center gap-1.5">
                <AlertTriangleIcon size={18} />
                POS Sync Failure: {debugModalVenue.name}
              </h3>
              <button
                onClick={() => setDebugModalVenue(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="p-3 bg-[#fef2f2] rounded-lg text-[#991b1b] font-mono text-[12px]">
                HTTP 401: Unauthorized (OAuth token expired for Square POS location #loc_992). 3 order push attempts failed.
              </div>
              <p className="text-[#4b5563]">
                Orders are currently being saved as confirmed drafts in Supabase and alerted via fallback email to the venue manager.
              </p>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              <button
                onClick={() => {
                  alert(`POS provider switched to Email Fallback for ${debugModalVenue.name}`);
                  setDebugModalVenue(null);
                }}
                className="px-3 py-2 text-[12px] rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-gray-50"
              >
                Switch to Email
              </button>
              <button
                onClick={() => {
                  alert(`OAuth refresh token requested for Square POS`);
                  setDebugModalVenue(null);
                }}
                className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              >
                Retry OAuth & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Drawer/Modal */}
      {viewDetailVenue && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <div>
                <h3 className="font-bold text-[16px] text-[#111827]">{viewDetailVenue.name}</h3>
                <div className="text-[12px] text-[#6b7280]">
                  {viewDetailVenue.suburb}, {viewDetailVenue.state} · {viewDetailVenue.plan} Plan
                </div>
              </div>
              <button
                onClick={() => setViewDetailVenue(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#f8f7ff] p-2.5 rounded-lg border border-[#ede9fe]">
                  <div className="text-[11px] text-[#6b7280]">Health Score</div>
                  <div className="text-[20px] font-bold text-[#22c55e]">
                    ● {viewDetailVenue.healthScore}
                  </div>
                </div>
                <div className="bg-[#f8f7ff] p-2.5 rounded-lg border border-[#ede9fe]">
                  <div className="text-[11px] text-[#6b7280]">Monthly MRR</div>
                  <div className="text-[20px] font-bold text-[#7c3aed]">
                    ${viewDetailVenue.mrr.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-[#374151] space-y-1">
                <div>
                  <strong>Monthly Volume:</strong> {viewDetailVenue.callsMonth.toLocaleString()} calls /{' '}
                  {viewDetailVenue.ordersMonth.toLocaleString()} orders
                </div>
                <div>
                  <strong>POS Integration:</strong> {viewDetailVenue.posProvider}
                </div>
                <div>
                  <strong>Current Standing:</strong> {viewDetailVenue.status}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewDetailVenue(null)}
                className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
