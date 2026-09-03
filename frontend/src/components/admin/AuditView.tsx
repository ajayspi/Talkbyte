'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
} from '@/components/icons';
import { getAuditLogs } from '@/lib/supabase';
import type { AuditLog } from '@/types/database.types';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  eventType: 'ORDER' | 'ESCALATION' | 'BILLING' | 'RESTAURANT' | 'SYSTEM' | 'POS' | 'AUTH' | 'ONBOARD';
  actor: string;
  resource: string;
  detail: string;
  ip: string;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-29 19:38:22',
    eventType: 'ORDER',
    actor: 'AI Agent',
    resource: "Mama's Pizzeria",
    detail: 'Order #4821 confirmed · $47.50 · Paid · POS synced',
    ip: 'system',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-29 19:35:11',
    eventType: 'ESCALATION',
    actor: 'AI Agent',
    resource: 'Spaghetti Junction',
    detail: 'Call escalated to human after 3 failed STT attempts · Transferred to +61 411 *** 234',
    ip: 'system',
  },
  {
    id: 'log-3',
    timestamp: '2026-08-29 19:30:04',
    eventType: 'BILLING',
    actor: 'aj@designjoom.in',
    resource: 'Thai Express',
    detail: 'Plan upgraded: Starter → Pro · Stripe Invoice #INV-2847 · $1,500/mo',
    ip: '203.x.x.x',
  },
  {
    id: 'log-4',
    timestamp: '2026-08-29 19:22:18',
    eventType: 'RESTAURANT',
    actor: 'aj@designjoom.in',
    resource: 'Noodle House',
    detail: 'Menu updated: 3 items added, 1 item deactivated · pgvector re-indexed',
    ip: '203.x.x.x',
  },
  {
    id: 'log-5',
    timestamp: '2026-08-29 19:15:33',
    eventType: 'SYSTEM',
    actor: 'Monitoring',
    resource: 'Deepgram Flux',
    detail: 'Latency alert fired: avg TTFT 94ms (threshold: 90ms) · Pagerduty alert #P-4721',
    ip: 'system',
  },
  {
    id: 'log-6',
    timestamp: '2026-08-29 19:08:41',
    eventType: 'POS',
    actor: 'System',
    resource: 'The Greek Place',
    detail: 'Square POS sync failed (3 retries) · Fallback email sent to greek.place@gmail.com',
    ip: 'system',
  },
  {
    id: 'log-7',
    timestamp: '2026-08-29 18:55:22',
    eventType: 'AUTH',
    actor: 'owner@mamaspizza.com',
    resource: 'Restaurant Dashboard',
    detail: 'Login · Supabase Auth · Session started',
    ip: '101.x.x.x',
  },
  {
    id: 'log-8',
    timestamp: '2026-08-29 18:40:07',
    eventType: 'ONBOARD',
    actor: 'aj@designjoom.in',
    resource: 'Sakura Sushi',
    detail: 'New restaurant provisioned · Telnyx +61 3 7017 XXXX assigned · Sandbox mode',
    ip: '203.x.x.x',
  },
];

export default function AuditView() {
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Events');
  const [timeWindow, setTimeWindow] = useState('Last 24h');

  useEffect(() => {
    getAuditLogs().then((data: AuditLog[]) => {
      if (data && data.length > 0) {
        // Integrate any backend events with unique IDs
        const extraLogs: AuditLogItem[] = data
          .filter((d) => !INITIAL_AUDIT_LOGS.some((l) => l.detail === d.details))
          .map((d, idx) => ({
            id: d.id || `audit-supa-${idx}`,
            timestamp: d.timestamp ? new Date(d.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '2026-08-29 18:00:00',
            eventType: (d.event_type || 'SYSTEM') as any,
            actor: d.actor || 'System',
            resource: d.resource || 'Platform',
            detail: d.details || 'Audit event recorded',
            ip: d.ip_address || 'system',
          }));

        if (extraLogs.length > 0) {
          setLogs((prev) => [...prev, ...extraLogs]);
        }
      }
    });
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'All Events' ||
        log.eventType.toUpperCase() === categoryFilter.toUpperCase();

      return matchSearch && matchCategory;
    });
  }, [logs, searchQuery, categoryFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Event Type', 'Actor', 'Resource', 'Detail', 'IP'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.eventType}"`,
      `"${l.actor}"`,
      `"${l.resource}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      `"${l.ip}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `talkbyte-audit-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Section Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">Audit Log</h2>
          <div className="text-[12px] text-[#6b7280]">
            Tamper-proof security and platform event ledger recorded across all services and operators.
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Filter events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-[#111827] placeholder-[#9ca3af] shadow-2xs w-[220px] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="All Events">All Events</option>
            <option value="ORDER">ORDER</option>
            <option value="ESCALATION">ESCALATION</option>
            <option value="BILLING">BILLING</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="POS">POS</option>
            <option value="AUTH">AUTH</option>
            <option value="ONBOARD">ONBOARD</option>
          </select>

          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[13px] text-[#374151] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          >
            <option value="Last 24h">Last 24h</option>
            <option value="Last 7d">Last 7d</option>
            <option value="Last 30d">Last 30d</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-white border border-[#e5e7eb] hover:bg-gray-50 text-[#374151] text-[13px] font-semibold px-3 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <DownloadIcon size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb] text-[11px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3.5 font-semibold">Event Type</th>
                <th className="py-2.5 px-3.5 font-semibold">Actor</th>
                <th className="py-2.5 px-3.5 font-semibold">Resource</th>
                <th className="py-2.5 px-3.5 font-semibold">Detail</th>
                <th className="py-2.5 px-3.5 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6b7280]">
                    No audit events match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let badgeChip = 'bg-[#f3f4f6] text-[#6b7280]';
                  if (log.eventType === 'ORDER') badgeChip = 'bg-[#f0fdf4] text-[#16a34a]';
                  if (log.eventType === 'ESCALATION') badgeChip = 'bg-[#fefce8] text-[#854d0e]';
                  if (log.eventType === 'BILLING') badgeChip = 'bg-[#eff6ff] text-[#3b82f6]';
                  if (log.eventType === 'RESTAURANT' || log.eventType === 'ONBOARD')
                    badgeChip = 'bg-[#ede9fe] text-[#7c3aed]';
                  if (log.eventType === 'SYSTEM') badgeChip = 'bg-[#fef2f2] text-[#ef4444]';
                  if (log.eventType === 'POS') badgeChip = 'bg-[#ccfbf1] text-[#0f766e]';
                  if (log.eventType === 'AUTH') badgeChip = 'bg-[#f3f4f6] text-[#4b5563]';

                  return (
                    <tr key={log.id} className="hover:bg-[#fafaf9] transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${badgeChip}`}>
                          {log.eventType}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-medium text-[#111827] whitespace-nowrap">
                        {log.actor}
                      </td>

                      <td className="py-3 px-3.5 font-semibold text-[#111827] whitespace-nowrap">
                        {log.resource}
                      </td>

                      <td className="py-3 px-3.5 text-[#374151] leading-relaxed max-w-md">
                        {log.detail}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[11px] text-[#6b7280] whitespace-nowrap">
                        {log.ip}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
