'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  ShieldIcon,
  CheckIcon,
  XIcon,
} from '@/components/icons';
import { getUsers } from '@/lib/supabase';
import type { RestaurantUser } from '@/types/database.types';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  restaurantName: string;
  role: 'owner' | 'manager' | 'staff' | 'readonly';
  status: 'active' | 'invited' | 'suspended';
  lastLogin: string;
  avatarInitials: string;
}

const INITIAL_USERS: UserDirectoryItem[] = [
  {
    id: 'usr-1',
    name: 'Marco Rossi',
    email: 'marco@mamaspizzeria.com.au',
    restaurantName: "Mama's Pizzeria",
    role: 'owner',
    status: 'active',
    lastLogin: '10 min ago',
    avatarInitials: 'MR',
  },
  {
    id: 'usr-2',
    name: 'Lucia Rossi',
    email: 'lucia@mamaspizzeria.com.au',
    restaurantName: "Mama's Pizzeria",
    role: 'staff',
    status: 'active',
    lastLogin: '2 hours ago',
    avatarInitials: 'LR',
  },
  {
    id: 'usr-3',
    name: 'Somchai Prasert',
    email: 'somchai@thaiexpress.com.au',
    restaurantName: 'Thai Express',
    role: 'owner',
    status: 'active',
    lastLogin: '35 min ago',
    avatarInitials: 'SP',
  },
  {
    id: 'usr-4',
    name: 'Sarah Connor',
    email: 'sarah.c@burgerpalace.com.au',
    restaurantName: 'Burger Palace',
    role: 'manager',
    status: 'active',
    lastLogin: '1 day ago',
    avatarInitials: 'SC',
  },
  {
    id: 'usr-5',
    name: 'Kenji Takahashi',
    email: 'kenji@sakurasushi.com.au',
    restaurantName: 'Sakura Sushi',
    role: 'owner',
    status: 'active',
    lastLogin: '3 days ago',
    avatarInitials: 'KT',
  },
  {
    id: 'usr-6',
    name: 'Nikolaos Kostas',
    email: 'nikos@thegreekplace.com.au',
    restaurantName: 'The Greek Place',
    role: 'owner',
    status: 'active',
    lastLogin: '5 hours ago',
    avatarInitials: 'NK',
  },
  {
    id: 'usr-7',
    name: 'Financial Auditor',
    email: 'auditor.tax@deloitte.com.au',
    restaurantName: 'Platform Wide',
    role: 'readonly',
    status: 'active',
    lastLogin: 'Yesterday',
    avatarInitials: 'FA',
  },
  {
    id: 'usr-8',
    name: 'Matteo Bellini',
    email: 'matteo@spaghettijunction.com.au',
    restaurantName: 'Spaghetti Junction',
    role: 'owner',
    status: 'invited',
    lastLogin: 'Never',
    avatarInitials: 'MB',
  },
];

export default function UsersView() {
  const [users, setUsers] = useState<UserDirectoryItem[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteVenue, setInviteVenue] = useState("Mama's Pizzeria");
  const [inviteRole, setInviteRole] = useState<'owner' | 'manager' | 'staff' | 'readonly'>('staff');

  useEffect(() => {
    getUsers().then((data: RestaurantUser[]) => {
      if (data && data.length > 0) {
        const extraUsers: UserDirectoryItem[] = data
          .filter((d) => !INITIAL_USERS.some((u) => u.email === d.email))
          .map((d, idx) => ({
            id: d.id || `supa-usr-${idx}`,
            name: d.name || 'Venue User',
            email: d.email || `user${idx}@talkbyte.com.au`,
            restaurantName: 'Assigned Restaurant',
            role: (d.role || 'staff') as any,
            status: 'active',
            lastLogin: 'Recently',
            avatarInitials: (d.name ? d.name.substring(0, 2) : 'VU').toUpperCase(),
          }));

        if (extraUsers.length > 0) {
          setUsers((prev) => [...prev, ...extraUsers]);
        }
      }
    });
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
      const matchStatus = statusFilter === 'All' || u.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newUser: UserDirectoryItem = {
      id: `usr-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      restaurantName: inviteVenue,
      role: inviteRole,
      status: 'invited',
      lastLogin: 'Never',
      avatarInitials: inviteName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Total Users
          </div>
          <div className="text-[26px] font-extrabold text-[#7c3aed] mt-1.5 leading-none">1,243</div>
          <div className="text-[11px] text-[#6b7280] mt-1">Across 487 venues</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Venue Owners
          </div>
          <div className="text-[26px] font-extrabold text-[#22c55e] mt-1.5 leading-none">487</div>
          <div className="text-[11px] text-[#6b7280] mt-1">Full administrative rights</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Active Staff
          </div>
          <div className="text-[26px] font-extrabold text-[#14b8a6] mt-1.5 leading-none">652</div>
          <div className="text-[11px] text-[#6b7280] mt-1">POS & Kitchen handlers</div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.7px]">
            Readonly / Auditor
          </div>
          <div className="text-[26px] font-extrabold text-[#3b82f6] mt-1.5 leading-none">104</div>
          <div className="text-[11px] text-[#6b7280] mt-1">Supabase RLS restricted</div>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">User Management</h2>
          <div className="text-[12px] text-[#6b7280]">
            Role-based access control (Owner, Manager, Staff, Readonly) managed via Supabase Auth & RLS.
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search users or venues…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-[#111827] placeholder-[#9ca3af] shadow-2xs w-[220px] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="readonly">Readonly</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
          </select>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <PlusIcon size={16} />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">User</th>
                <th className="py-2.5 px-3.5 font-semibold">Email</th>
                <th className="py-2.5 px-3.5 font-semibold">Assigned Restaurant</th>
                <th className="py-2.5 px-3.5 font-semibold">Role</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Last Sign In</th>
                <th className="py-2.5 px-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredUsers.map((u) => {
                let roleChip = 'bg-[#f3f4f6] text-[#6b7280]';
                if (u.role === 'owner') roleChip = 'bg-[#ede9fe] text-[#7c3aed]';
                if (u.role === 'manager') roleChip = 'bg-[#eff6ff] text-[#3b82f6]';
                if (u.role === 'staff') roleChip = 'bg-[#ccfbf1] text-[#0f766e]';

                let statusChip = 'bg-[#f0fdf4] text-[#16a34a]';
                if (u.status === 'invited') statusChip = 'bg-[#fefce8] text-[#854d0e]';
                if (u.status === 'suspended') statusChip = 'bg-[#fef2f2] text-[#ef4444]';

                return (
                  <tr key={u.id} className="hover:bg-[#fafaf9] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {u.avatarInitials}
                        </div>
                        <div className="font-semibold text-[#111827]">{u.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-[#6b7280] font-mono text-[12px]">{u.email}</td>
                    <td className="py-3 px-3.5 font-medium text-[#111827]">{u.restaurantName}</td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleChip}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusChip}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#6b7280] text-[12px]">{u.lastLogin}</td>
                    <td className="py-3 px-3.5">
                      <button
                        onClick={() => alert(`Password reset / Auth link dispatched to ${u.email}`)}
                        className="text-[11px] font-semibold text-[#7c3aed] hover:underline"
                      >
                        Reset Auth
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#e5e7eb] pb-3">
              <h3 className="font-bold text-[16px] text-[#111827]">Invite Tenant User</h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-[13px]">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@restaurant.com.au"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Assign to Venue</label>
                <select
                  value={inviteVenue}
                  onChange={(e) => setInviteVenue(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                >
                  <option value="Mama's Pizzeria">Mama&apos;s Pizzeria (Carlton VIC)</option>
                  <option value="Thai Express">Thai Express (Newtown NSW)</option>
                  <option value="Burger Palace">Burger Palace (South Bank QLD)</option>
                  <option value="Noodle House">Noodle House (Chinatown NSW)</option>
                  <option value="The Curry Leaf">The Curry Leaf (Fitzroy VIC)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full border border-[#e5e7eb] rounded-lg p-2 text-[#111827] focus:ring-1 focus:ring-[#7c3aed] focus:outline-none"
                >
                  <option value="staff">Staff (View live calls & orders)</option>
                  <option value="manager">Manager (Menu & settings management)</option>
                  <option value="owner">Owner (Full venue access & billing)</option>
                  <option value="readonly">Readonly (Audit & analytics only)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                >
                  Send Invitation Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
