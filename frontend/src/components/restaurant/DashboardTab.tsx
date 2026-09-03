'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  DollarIcon,
  HeadsetIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@/components/icons';
import type { Order, Call } from '@/types/database.types';

interface DashboardTabProps {
  onNavigateTab: (tab: string) => void;
  recentOrders?: Order[];
  liveCalls?: Call[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onNavigateTab,
  recentOrders = [],
  liveCalls = [],
}) => {
  // Live ticker for active call widget
  const [tickerSeconds, setTickerSeconds] = useState(134); // 2:14
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Hourly call volume data from prototype
  const hourlyData = [
    { hour: '8am', calls: 2 },
    { hour: '9', calls: 3 },
    { hour: '10', calls: 4 },
    { hour: '11', calls: 5 },
    { hour: '12pm', calls: 12 },
    { hour: '1', calls: 15 },
    { hour: '2', calls: 9 },
    { hour: '3', calls: 6 },
    { hour: '4', calls: 5 },
    { hour: '5', calls: 7 },
    { hour: '6pm', calls: 14 },
    { hour: '7', calls: 18 },
    { hour: '8', calls: 10 },
    { hour: '9', calls: 4 },
  ];

  const maxCalls = 20;
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="section active space-y-6">
      {/* Onboarding Banner */}
      <div className="onboard-bar">
        <div style={{ fontSize: '28px' }}>🚀</div>
        <div className="onboard-progress">
          <div className="onboard-title">
            Setup almost done — 4 of 5 steps complete
          </div>
          <div className="onboard-steps">
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step done" />
            <div className="onboard-step" />
          </div>
        </div>
        <button
          className="onboard-cta"
          onClick={() => onNavigateTab('settings')}
        >
          Connect POS →
        </button>
      </div>

      {/* Alert Warning Strip */}
      <div className="alert alert-warn flex items-center justify-between">
        <div>
          ⚠️ 2 payment links expired without payment in the last hour.{' '}
          <span
            onClick={() => onNavigateTab('orders')}
            className="cursor-pointer underline font-semibold text-amber-900 ml-1 hover:text-amber-950"
          >
            Review orders
          </span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <div className="kpi-label">Calls Today</div>
          <div className="kpi-value">47</div>
          <div className="kpi-trend trend-up">↑ 18% vs yesterday</div>
          <div className="kpi-icon text-purple-600">
            <PhoneIcon size={24} />
          </div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-label">Revenue Today</div>
          <div className="kpi-value">$1,284</div>
          <div className="kpi-trend trend-up">↑ $320 vs yesterday</div>
          <div className="kpi-icon text-teal-600">
            <DollarIcon size={24} />
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-label">AI Answer Rate</div>
          <div className="kpi-value">96%</div>
          <div className="kpi-trend trend-up">↑ 2% vs last week</div>
          <div className="kpi-icon text-[#FF6B35]">
            <HeadsetIcon size={24} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-label">Customer Satisfaction</div>
          <div className="kpi-value">4.7</div>
          <div className="kpi-trend text-gray-500">— Same as last week</div>
          <div className="kpi-icon text-emerald-600">
            <CheckCircleIcon size={24} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="two-col">
        {/* Left Column: Active Calls & Recent Orders */}
        <div className="space-y-5">
          {/* Active Calls Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Active Calls</span>
              <span
                className="card-action"
                onClick={() => onNavigateTab('livecalls')}
              >
                View all →
              </span>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              <div className="live-call">
                <div className="call-info">
                  <span className="call-icon text-emerald-400">
                    <PhoneIcon size={20} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="caller-num">+61 4•• ••• 847</div>
                    <div className="call-meta">Inbound · Ordering</div>
                  </div>
                  <div className="call-duration">
                    {formatDuration(tickerSeconds)}
                  </div>
                </div>
                <div className="call-transcript">
                  &quot;Can I get a large margherita, extra cheese, and two garlic bread please...&quot;
                </div>
                <div className="call-actions">
                  <button
                    className={`call-btn call-btn-intercept transition-all ${
                      isTakingOver ? 'opacity-80 scale-95' : ''
                    }`}
                    onClick={() => {
                      setIsTakingOver(!isTakingOver);
                      if (!isTakingOver) setIsMonitoring(false);
                    }}
                  >
                    {isTakingOver ? 'Staff Speaking ✓' : 'Take Over'}
                  </button>
                  <button
                    className={`call-btn call-btn-monitor transition-all ${
                      isMonitoring ? 'bg-teal-600 text-white' : ''
                    }`}
                    onClick={() => {
                      setIsMonitoring(!isMonitoring);
                      if (!isMonitoring) setIsTakingOver(false);
                    }}
                  >
                    {isMonitoring ? 'Monitoring 🎧' : 'Monitor'}
                  </button>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '10px 0',
                  fontSize: '13px',
                  color: 'var(--muted)',
                }}
              >
                1 active · 0 queued
              </div>
            </div>
          </div>

          {/* Recent Orders Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Orders</span>
              <span
                className="card-action"
                onClick={() => onNavigateTab('orders')}
              >
                View all →
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#1047</td>
                  <td>Margherita L, Garlic ×2</td>
                  <td>
                    <strong>$38.50</strong>
                  </td>
                  <td>
                    <span className="badge badge-green">✓ Paid</span>
                  </td>
                </tr>
                <tr>
                  <td>#1046</td>
                  <td>Pepperoni XL, Coke ×3</td>
                  <td>
                    <strong>$54.00</strong>
                  </td>
                  <td>
                    <span className="badge badge-yellow">⏳ Link Sent</span>
                  </td>
                </tr>
                <tr>
                  <td>#1045</td>
                  <td>Veggie Special, Tiramisu</td>
                  <td>
                    <strong>$42.80</strong>
                  </td>
                  <td>
                    <span className="badge badge-green">✓ POS Synced</span>
                  </td>
                </tr>
                <tr>
                  <td>#1044</td>
                  <td>Quattro Stagioni</td>
                  <td>
                    <strong>$28.00</strong>
                  </td>
                  <td>
                    <span className="badge badge-red">✗ Link Expired</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Calls Today Chart & Sentiment Feed */}
        <div className="space-y-5">
          {/* Calls Today (by hour) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Calls Today (by hour)</span>
            </div>
            <div className="card-body">
              <div className="chart-wrap relative">
                {/* SVG Bar Chart */}
                <svg
                  viewBox="0 0 520 200"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[0, 5, 10, 15, 20].map((val) => {
                    const y = 170 - (val / maxCalls) * 140;
                    return (
                      <g key={val}>
                        <line
                          x1="30"
                          y1={y}
                          x2="510"
                          y2={y}
                          stroke="#f3f4f6"
                          strokeWidth="1"
                        />
                        <text
                          x="22"
                          y={y + 4}
                          fontSize="9"
                          fill="#9ca3af"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {hourlyData.map((d, index) => {
                    const barWidth = 22;
                    const spacing = 34;
                    const x = 40 + index * spacing;
                    const barHeight = (d.calls / maxCalls) * 140;
                    const y = 170 - barHeight;
                    const isHovered = hoveredBar === index;

                    return (
                      <g
                        key={d.hour}
                        onMouseEnter={() => setHoveredBar(index)}
                        onMouseLeave={() => setHoveredBar(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="5"
                          ry="5"
                          fill={
                            isHovered
                              ? '#7c3aed'
                              : 'rgba(124, 58, 237, 0.7)'
                          }
                          className="transition-colors duration-150"
                        />
                        {/* Hour Label */}
                        <text
                          x={x + barWidth / 2}
                          y="188"
                          fontSize="10"
                          fill={isHovered ? '#111827' : '#6b7280'}
                          fontWeight={
                            d.hour.includes('pm') || d.hour === '8am'
                              ? '600'
                              : '400'
                          }
                          textAnchor="middle"
                        >
                          {d.hour}
                        </text>

                        {/* Tooltip on hover */}
                        {isHovered && (
                          <g>
                            <rect
                              x={x - 8}
                              y={y - 24}
                              width={barWidth + 16}
                              height="18"
                              rx="4"
                              fill="#1a0a1e"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 12}
                              fontSize="9"
                              fill="#fff"
                              fontWeight="600"
                              textAnchor="middle"
                            >
                              {d.calls} calls
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Customer Sentiment — Last 7 Days */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Customer Sentiment — Last 7 Days</span>
            </div>
            <div className="card-body" style={{ padding: '12px 20px' }}>
              <div className="sentiment-row">
                <div className="sentiment-score pos">😊</div>
                <div style={{ flex: 1 }}>
                  <strong>Mon — Positive</strong>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    &quot;Easy ordering, loved the voice!&quot;
                  </div>
                </div>
                <span className="badge badge-green">94%</span>
              </div>

              <div className="sentiment-row">
                <div className="sentiment-score pos">😊</div>
                <div style={{ flex: 1 }}>
                  <strong>Tue — Positive</strong>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    &quot;Quick and simple, will order again&quot;
                  </div>
                </div>
                <span className="badge badge-green">91%</span>
              </div>

              <div className="sentiment-row">
                <div className="sentiment-score neu">😐</div>
                <div style={{ flex: 1 }}>
                  <strong>Wed — Neutral</strong>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    &quot;Took a few tries to get the order right&quot;
                  </div>
                </div>
                <span className="badge badge-gray">72%</span>
              </div>

              <div className="sentiment-row">
                <div className="sentiment-score neg">😞</div>
                <div style={{ flex: 1 }}>
                  <strong>Thu — Negative</strong>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    &quot;AI didn&apos;t understand my request&quot;
                  </div>
                </div>
                <span className="badge badge-red">48%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardTab;
