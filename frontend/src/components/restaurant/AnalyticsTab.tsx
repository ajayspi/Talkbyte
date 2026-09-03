'use client';

import React, { useState } from 'react';
import {
  PhoneIcon,
  DollarIcon,
  ActivityIcon,
  ClockIcon,
} from '@/components/icons';

export const AnalyticsTab: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'custom'>('7d');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{
    day: string;
    hour: string;
    calls: number;
  } | null>(null);

  // 7-day call volume data from prototype: [38, 42, 35, 51, 48, 62, 36]
  const callVolumeData = [
    { day: 'Mon', calls: 38 },
    { day: 'Tue', calls: 42 },
    { day: 'Wed', calls: 35 },
    { day: 'Thu', calls: 51 },
    { day: 'Fri', calls: 48 },
    { day: 'Sat', calls: 62 },
    { day: 'Sun', calls: 36 },
  ];

  // 7-day revenue data from prototype: [920, 1050, 870, 1380, 1240, 1620, 940]
  const revenueData = [
    { day: 'Mon', revenue: 920 },
    { day: 'Tue', revenue: 1050 },
    { day: 'Wed', revenue: 870 },
    { day: 'Thu', revenue: 1380 },
    { day: 'Fri', revenue: 1240 },
    { day: 'Sat', revenue: 1620 },
    { day: 'Sun', revenue: 940 },
  ];

  // Peak hours matrix
  const hours = [
    '8am', '9', '10', '11', '12pm', '1', '2', '3', '4', '5', '6pm', '7', '8', '9',
  ];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const heatmapMatrix: Record<string, number[]> = {
    Mon: [1, 1, 2, 3, 8, 12, 7, 3, 2, 3, 6, 14, 18, 9],
    Tue: [1, 2, 2, 4, 9, 13, 6, 3, 2, 4, 7, 13, 16, 8],
    Wed: [1, 1, 3, 3, 7, 11, 5, 2, 2, 3, 8, 15, 17, 7],
    Thu: [2, 2, 3, 5, 11, 15, 8, 4, 3, 5, 10, 17, 19, 11],
    Fri: [2, 3, 4, 6, 14, 18, 10, 5, 4, 7, 14, 20, 22, 14],
    Sat: [3, 4, 5, 8, 16, 21, 12, 7, 5, 8, 16, 22, 24, 15],
    Sun: [2, 2, 3, 5, 10, 14, 8, 4, 3, 4, 8, 14, 15, 7],
  };

  const topItems = [
    { name: '🍕 Margherita L', count: 78, rev: '$1,443' },
    { name: '🍕 Pepperoni XL', count: 54, rev: '$1,188' },
    { name: '🍞 Garlic Bread', count: 102, rev: '$714' },
    { name: '🍕 Veggie Special M', count: 42, rev: '$903' },
    { name: '🍰 Tiramisu', count: 31, rev: '$217' },
  ];

  // Helper to construct smooth SVG paths for area charts
  const buildSvgAreaPath = (
    values: number[],
    maxVal: number,
    width = 460,
    height = 130
  ) => {
    const step = width / (values.length - 1);
    const points = values.map((val, idx) => ({
      x: 35 + idx * step,
      y: height - (val / maxVal) * (height - 30) + 10,
    }));

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      linePath += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { linePath, areaPath, points };
  };

  const callChart = buildSvgAreaPath(
    callVolumeData.map((d) => d.calls),
    70
  );
  const revChart = buildSvgAreaPath(
    revenueData.map((d) => d.revenue),
    1800
  );

  return (
    <div className="section active space-y-6">
      {/* Timeframe Scope Switcher */}
      <div className="flex gap-2.5">
        <button
          onClick={() => setTimeframe('7d')}
          className={`topbar-btn text-xs ${
            timeframe === '7d' ? 'btn-primary' : 'btn-ghost'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeframe('30d')}
          className={`topbar-btn text-xs ${
            timeframe === '30d' ? 'btn-primary' : 'btn-ghost'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeframe('custom')}
          className={`topbar-btn text-xs ${
            timeframe === 'custom' ? 'btn-primary' : 'btn-ghost'
          }`}
        >
          Custom
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <div className="kpi-label">Total Calls</div>
          <div className="kpi-value">312</div>
          <div className="kpi-trend trend-up">↑ 24% vs prior week</div>
          <div className="kpi-icon text-purple-600">
            <PhoneIcon size={24} />
          </div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-label">Revenue</div>
          <div className="kpi-value">$8,420</div>
          <div className="kpi-trend trend-up">↑ 18%</div>
          <div className="kpi-icon text-teal-600">
            <DollarIcon size={24} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-label">Order Conversion</div>
          <div className="kpi-value">82%</div>
          <div className="kpi-trend trend-up">↑ 5%</div>
          <div className="kpi-icon text-emerald-600">
            <ActivityIcon size={24} />
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-label">Avg Handle Time</div>
          <div className="kpi-value">2:18</div>
          <div className="kpi-trend trend-up">↓ 12s improvement</div>
          <div className="kpi-icon text-[#FF6B35]">
            <ClockIcon size={24} />
          </div>
        </div>
      </div>

      {/* Two Line/Area Charts */}
      <div className="two-col">
        {/* Call Volume — Last 7 Days */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Call Volume — Last 7 Days</span>
          </div>
          <div className="card-body">
            <div className="chart-wrap relative">
              <svg viewBox="0 0 520 180" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines */}
                {[0, 20, 40, 60].map((val) => {
                  const y = 140 - (val / 70) * 110;
                  return (
                    <g key={val}>
                      <line x1="35" y1={y} x2="505" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                      <text x="25" y={y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area and Line */}
                <path d={callChart.areaPath} fill="url(#purpleAreaGrad)" />
                <path d={callChart.linePath} fill="none" stroke="#7c3aed" strokeWidth="2.5" />

                {/* Data Points */}
                {callChart.points.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#fff" stroke="#7c3aed" strokeWidth="2" />
                    <text
                      x={pt.x}
                      y="160"
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {callVolumeData[idx].day}
                    </text>
                    <title>{`${callVolumeData[idx].day}: ${callVolumeData[idx].calls} calls`}</title>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue — Last 7 Days */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue — Last 7 Days</span>
          </div>
          <div className="card-body">
            <div className="chart-wrap relative">
              <svg viewBox="0 0 520 180" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines */}
                {[0, 500, 1000, 1500].map((val) => {
                  const y = 140 - (val / 1800) * 110;
                  return (
                    <g key={val}>
                      <line x1="42" y1={y} x2="505" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                      <text x="36" y={y + 3} fontSize="9" fill="#9ca3af" textAnchor="end">
                        ${val}
                      </text>
                    </g>
                  );
                })}

                {/* Area and Line */}
                <path d={revChart.areaPath} fill="url(#tealAreaGrad)" />
                <path d={revChart.linePath} fill="none" stroke="#14b8a6" strokeWidth="2.5" />

                {/* Data Points */}
                {revChart.points.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#fff" stroke="#14b8a6" strokeWidth="2" />
                    <text
                      x={pt.x}
                      y="160"
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {revenueData[idx].day}
                    </text>
                    <title>{`${revenueData[idx].day}: $${revenueData[idx].revenue}`}</title>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap and Top Items */}
      <div className="two-col">
        {/* Peak Hours Heatmap */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="card-title">Peak Hours Heatmap</span>
            {hoveredHeatmapCell && (
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                {hoveredHeatmapCell.day} {hoveredHeatmapCell.hour}: {hoveredHeatmapCell.calls} calls
              </span>
            )}
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40px repeat(14, 1fr)',
                gap: '3px',
                fontSize: '10px',
                color: 'var(--muted)',
              }}
            >
              {/* Header row with hour labels */}
              <div />
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    color:
                      h.includes('pm') || ['12pm', '2', '6pm', '7', '8', '9'].includes(h)
                        ? 'var(--text)'
                        : 'var(--muted)',
                    fontWeight:
                      h.includes('pm') || ['12pm', '2', '6pm', '7', '8', '9'].includes(h)
                        ? '600'
                        : '400',
                  }}
                >
                  {h}
                </div>
              ))}

              {/* Day rows with intensity blocks */}
              {days.map((d) => (
                <React.Fragment key={d}>
                  <div style={{ fontWeight: 500, paddingTop: '4px' }}>{d}</div>
                  {heatmapMatrix[d].map((v, idx) => {
                    const intensity = (v / 24) * 0.85 + 0.05;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() =>
                          setHoveredHeatmapCell({
                            day: d,
                            hour: hours[idx],
                            calls: v,
                          })
                        }
                        onMouseLeave={() => setHoveredHeatmapCell(null)}
                        style={{
                          height: '22px',
                          borderRadius: '3px',
                          backgroundColor: `rgba(124, 58, 237, ${intensity})`,
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                        }}
                        className="hover:scale-110 hover:ring-1 hover:ring-purple-400"
                        title={`${d} ${hours[idx]}: ${v} calls`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Top Ordered Items Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Ordered Items</span>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {topItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom:
                    idx < topItems.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontSize: '13px', flex: 1, fontWeight: 500 }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {item.count} orders
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--purple-light)',
                  }}
                >
                  {item.rev}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsTab;
