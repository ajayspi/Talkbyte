'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  ActivityIcon,
  Volume2Icon,
  MicIcon,
  MicOffIcon,
} from '@/components/icons';
import type { Call } from '@/types/database.types';

interface LiveCallsTabProps {
  initialLiveCalls?: Call[];
}

export const LiveCallsTab: React.FC<LiveCallsTabProps> = () => {
  // Real-time call timers incrementing every second
  const [call1Duration, setCall1Duration] = useState(134); // 2:14
  const [call2Duration, setCall2Duration] = useState(47); // 0:47

  // Intercept and monitoring states for each call
  const [call1State, setCall1State] = useState<{
    status: 'ai' | 'monitored' | 'taken_over' | 'ended';
  }>({ status: 'ai' });

  const [call2State, setCall2State] = useState<{
    status: 'ai' | 'monitored' | 'taken_over' | 'ended';
  }>({ status: 'ai' });

  useEffect(() => {
    const interval = setInterval(() => {
      setCall1Duration((prev) => (call1State.status !== 'ended' ? prev + 1 : prev));
      setCall2Duration((prev) => (call2State.status !== 'ended' ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [call1State.status, call2State.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeCallsCount =
    (call1State.status !== 'ended' ? 1 : 0) +
    (call2State.status !== 'ended' ? 1 : 0);

  return (
    <div className="section active space-y-6">
      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card purple">
          <div className="kpi-label">Active Now</div>
          <div className="kpi-value">{activeCallsCount}</div>
          <div className="kpi-icon text-purple-600">
            <PhoneIcon size={24} />
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-label">Calls Today</div>
          <div className="kpi-value">47</div>
          <div className="kpi-icon text-emerald-600">
            <CheckCircleIcon size={24} />
          </div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-label">Avg Duration</div>
          <div className="kpi-value">2:18</div>
          <div className="kpi-icon text-teal-600">
            <ClockIcon size={24} />
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-label">Success Rate</div>
          <div className="kpi-value">96%</div>
          <div className="kpi-icon text-[#FF6B35]">
            <ActivityIcon size={24} />
          </div>
        </div>
      </div>

      {/* Active Calls Section */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Calls</span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live ({activeCallsCount})
          </span>
        </div>

        <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Call 1 */}
          {call1State.status !== 'ended' ? (
            <div className="live-call">
              <div className="call-info">
                <span className="call-icon text-emerald-400">
                  <PhoneIcon size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="caller-num flex items-center gap-2">
                    +61 4•• ••• 847
                    {call1State.status === 'taken_over' && (
                      <span className="badge badge-orange text-[10px] py-0.5 px-2">
                        Staff Intercept Active
                      </span>
                    )}
                    {call1State.status === 'monitored' && (
                      <span className="badge badge-teal text-[10px] py-0.5 px-2">
                        Monitoring (Muted)
                      </span>
                    )}
                  </div>
                  <div className="call-meta">
                    Inbound · Ordering · Confidence 97% · Room: livekit_room_8921
                  </div>
                </div>
                <div className="call-duration">{formatDuration(call1Duration)}</div>
              </div>

              <div className="call-transcript">
                &quot;Can I get a large margherita, extra cheese, and two garlic bread please? Oh and a Coke as well.&quot;
              </div>

              <div className="call-actions flex items-center gap-2 mt-3">
                <button
                  className={`call-btn call-btn-intercept flex items-center gap-1.5 ${
                    call1State.status === 'taken_over'
                      ? 'bg-amber-600 ring-2 ring-amber-400'
                      : ''
                  }`}
                  onClick={() =>
                    setCall1State({
                      status:
                        call1State.status === 'taken_over' ? 'ai' : 'taken_over',
                    })
                  }
                >
                  <MicIcon size={14} />
                  {call1State.status === 'taken_over'
                    ? 'Release to AI'
                    : 'Take Over Call'}
                </button>

                <button
                  className={`call-btn call-btn-monitor flex items-center gap-1.5 ${
                    call1State.status === 'monitored'
                      ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                      : ''
                  }`}
                  onClick={() =>
                    setCall1State({
                      status:
                        call1State.status === 'monitored' ? 'ai' : 'monitored',
                    })
                  }
                >
                  <Volume2Icon size={14} />
                  {call1State.status === 'monitored'
                    ? 'Stop Audio Monitor'
                    : 'Monitor Only'}
                </button>

                <button
                  className="call-btn hover:bg-red-700/40 transition-colors"
                  style={{
                    background: 'rgba(220,38,38,.2)',
                    color: '#fca5a5',
                  }}
                  onClick={() => setCall1State({ status: 'ended' })}
                >
                  End Call
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed text-center">
              Call #TB-847 was ended by staff.
            </div>
          )}

          {/* Call 2 */}
          {call2State.status !== 'ended' ? (
            <div className="live-call" style={{ borderLeftColor: 'var(--teal)' }}>
              <div className="call-info">
                <span className="call-icon text-teal-400">
                  <PhoneIcon size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="caller-num flex items-center gap-2">
                    +61 2•• ••• 312
                    {call2State.status === 'taken_over' && (
                      <span className="badge badge-orange text-[10px] py-0.5 px-2">
                        Staff Intercept Active
                      </span>
                    )}
                    {call2State.status === 'monitored' && (
                      <span className="badge badge-teal text-[10px] py-0.5 px-2">
                        Monitoring (Muted)
                      </span>
                    )}
                  </div>
                  <div className="call-meta">
                    Inbound · Inquiry · Confidence 88% · Room: livekit_room_8922
                  </div>
                </div>
                <div className="call-duration" style={{ color: 'var(--teal)' }}>
                  {formatDuration(call2Duration)}
                </div>
              </div>

              <div className="call-transcript">
                &quot;What time do you close tonight? And do you have gluten-free options?&quot;
              </div>

              <div className="call-actions flex items-center gap-2 mt-3">
                <button
                  className={`call-btn call-btn-intercept flex items-center gap-1.5 ${
                    call2State.status === 'taken_over'
                      ? 'bg-amber-600 ring-2 ring-amber-400'
                      : ''
                  }`}
                  onClick={() =>
                    setCall2State({
                      status:
                        call2State.status === 'taken_over' ? 'ai' : 'taken_over',
                    })
                  }
                >
                  <MicIcon size={14} />
                  {call2State.status === 'taken_over'
                    ? 'Release to AI'
                    : 'Take Over Call'}
                </button>

                <button
                  className={`call-btn call-btn-monitor flex items-center gap-1.5 ${
                    call2State.status === 'monitored'
                      ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                      : ''
                  }`}
                  onClick={() =>
                    setCall2State({
                      status:
                        call2State.status === 'monitored' ? 'ai' : 'monitored',
                    })
                  }
                >
                  <Volume2Icon size={14} />
                  {call2State.status === 'monitored'
                    ? 'Stop Audio Monitor'
                    : 'Monitor Only'}
                </button>

                <button
                  className="call-btn hover:bg-red-700/40 transition-colors"
                  style={{
                    background: 'rgba(220,38,38,.2)',
                    color: '#fca5a5',
                  }}
                  onClick={() => setCall2State({ status: 'ended' })}
                >
                  End Call
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed text-center">
              Call #TB-312 was ended by staff.
            </div>
          )}
        </div>
      </div>

      {/* Recent Calls — Today Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Calls — Today</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Number</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Outcome</th>
              <th>Confidence</th>
              <th>Sentiment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>14:22</td>
              <td>+61 4•• ••• 211</td>
              <td>Order</td>
              <td>1:54</td>
              <td>
                <span className="badge badge-green">Order Placed</span>
              </td>
              <td>98%</td>
              <td>😊 Positive</td>
            </tr>
            <tr>
              <td>14:08</td>
              <td>+61 3•• ••• 564</td>
              <td>Order</td>
              <td>3:12</td>
              <td>
                <span className="badge badge-yellow">Link Sent</span>
              </td>
              <td>94%</td>
              <td>😊 Positive</td>
            </tr>
            <tr>
              <td>13:55</td>
              <td>+61 4•• ••• 901</td>
              <td>Inquiry</td>
              <td>0:38</td>
              <td>
                <span className="badge badge-blue">Answered</span>
              </td>
              <td>91%</td>
              <td>😐 Neutral</td>
            </tr>
            <tr>
              <td>13:41</td>
              <td>+61 4•• ••• 778</td>
              <td>Order</td>
              <td>2:05</td>
              <td>
                <span className="badge badge-red">Link Expired</span>
              </td>
              <td>96%</td>
              <td>😐 Neutral</td>
            </tr>
            <tr>
              <td>13:20</td>
              <td>+61 2•• ••• 445</td>
              <td>Order</td>
              <td>4:30</td>
              <td>
                <span className="badge badge-purple">Transferred</span>
              </td>
              <td>62%</td>
              <td>😞 Negative</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default LiveCallsTab;
