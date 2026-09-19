'use client';

import React, { useState } from 'react';
import {
  SettingsIcon,
  StoreIcon,
  CheckCircleIcon,
  PlusIcon,
  XIcon,
} from '@/components/icons';

interface StaffMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Staff';
  lastLogin: string;
}

export const SettingsTab: React.FC = () => {
  // Business Details State
  const [businessName, setBusinessName] = useState("Mama's Pizzeria");
  const [didNumber] = useState("+61 2 9999 1234");
  const [timezone, setTimezone] = useState("AEST (UTC+10)");
  const [holidayMode, setHolidayMode] = useState(false);

  // AI Voice Settings State
  const [personaName, setPersonaName] = useState("Aria");
  const [greetingScript, setGreetingScript] = useState(
    '"Hi, welcome to Mama\'s Pizzeria! I\'m Aria. Would you like to place an order today?"'
  );
  const [allowManualTakeover, setAllowManualTakeover] = useState(true);
  const [transferLowConfidence, setTransferLowConfidence] = useState(true);

  // Integrations State
  const [shopifyConnected, setShopifyConnected] = useState(false);

  // Staff Table State
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: '1', name: 'John Rossi', role: 'Owner', lastLogin: 'Now' },
    { id: '2', name: 'Sarah M.', role: 'Manager', lastLogin: '2h ago' },
  ]);

  // Modals & Feedback
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Manager' | 'Staff'>('Manager');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Settings and AI persona instructions saved successfully.');
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      lastLogin: 'Pending Invite',
    };

    setStaffList((prev) => [...prev, newMember]);
    setInviteModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    showToast(`✓ Invitation dispatched to ${newStaffEmail}.`);
  };

  return (
    <div className="section active space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a0a1e] text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-fade-in">
          <CheckCircleIcon size={18} className="text-teal-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings}>
        <div className="two-col">
          {/* Left Column: Business Details & Integrations */}
          <div>
            {/* Business Details Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <span className="card-title">Business Details</span>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <div className="input-label">Business Name</div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <div className="input-label">Phone Number (TalkByte DID)</div>
                  <input
                    type="text"
                    value={didNumber}
                    readOnly
                    style={{ background: '#f9fafb', color: 'var(--muted)' }}
                  />
                </div>

                <div className="input-group">
                  <div className="input-label">Timezone</div>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="AEST (UTC+10)">AEST (UTC+10)</option>
                    <option value="AEDT (UTC+11)">AEDT (UTC+11)</option>
                  </select>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="setting-label">Holiday Closure Mode</div>
                    <div className="setting-desc">
                      AI announces closure and redirects to voicemail
                    </div>
                  </div>
                  <div
                    className={`toggle ${holidayMode ? 'on' : ''}`}
                    onClick={() => {
                      setHolidayMode(!holidayMode);
                      showToast(
                        !holidayMode
                          ? 'Holiday closure IVR mode activated.'
                          : 'Standard operating hours restored.'
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Integrations Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Integrations</span>
              </div>
              <div className="card-body" style={{ padding: '12px 20px' }}>
                {/* Square POS */}
                <div className="integration-row">
                  <div className="int-left">
                    <div className="int-icon">🟦</div>
                    <div>
                      <div className="int-name">Square POS</div>
                      <div className="int-desc">Mama&apos;s Pizzeria — Newtown</div>
                    </div>
                  </div>
                  <span className="badge badge-green">
                    <span className="status-dot green" />
                    Connected
                  </span>
                </div>

                {/* Stripe Checkout */}
                <div className="integration-row">
                  <div className="int-left">
                    <div className="int-icon">💳</div>
                    <div>
                      <div className="int-name">Stripe Checkout</div>
                      <div className="int-desc">Payment links · acc_1Nk...</div>
                    </div>
                  </div>
                  <span className="badge badge-green">
                    <span className="status-dot green" />
                    Active
                  </span>
                </div>

                {/* Twilio SMS / Telnyx */}
                <div className="integration-row">
                  <div className="int-left">
                    <div className="int-icon">📱</div>
                    <div>
                      <div className="int-name">Twilio SMS</div>
                      <div className="int-desc">+61 2 9999 1234</div>
                    </div>
                  </div>
                  <span className="badge badge-green">
                    <span className="status-dot green" />
                    Active
                  </span>
                </div>

                {/* Shopify POS */}
                <div className="integration-row">
                  <div className="int-left">
                    <div className="int-icon">📦</div>
                    <div>
                      <div className="int-name">Shopify POS</div>
                      <div className="int-desc">
                        {shopifyConnected
                          ? 'Connected · Catalog sync enabled'
                          : 'Not configured'}
                      </div>
                    </div>
                  </div>
                  {shopifyConnected ? (
                    <span className="badge badge-green">
                      <span className="status-dot green" />
                      Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShopifyConnected(true);
                        showToast('Shopify POS connector initialized.');
                      }}
                      className="topbar-btn btn-ghost"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Voice Settings & Staff Access */}
          <div>
            {/* AI Voice Settings Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <span className="card-title">AI Voice Settings</span>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <div className="input-label">TTS Provider (Text-to-Speech)</div>
                  <select defaultValue="cartesia">
                    <option value="cartesia">Cartesia Sonic (Ultra-low Latency)</option>
                    <option value="elevenlabs">ElevenLabs (High Quality)</option>
                  </select>
                </div>

                <div className="input-group">
                  <div className="input-label">Voice Persona Name</div>
                  <input
                    type="text"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <div className="input-label">Greeting Script</div>
                  <textarea
                    style={{ height: '70px', resize: 'none' }}
                    value={greetingScript}
                    onChange={(e) => setGreetingScript(e.target.value)}
                  />
                </div>

                <div className="settings-row">
                  <div>
                    <div className="setting-label">Allow Manual Takeover</div>
                    <div className="setting-desc">
                      Staff can intercept active AI calls from dashboard
                    </div>
                  </div>
                  <div
                    className={`toggle ${allowManualTakeover ? 'on' : ''}`}
                    onClick={() =>
                      setAllowManualTakeover(!allowManualTakeover)
                    }
                  />
                </div>

                <div className="settings-row">
                  <div>
                    <div className="setting-label">
                      Transfer on Low Confidence
                    </div>
                    <div className="setting-desc">
                      Auto-transfer when AI confidence drops below 70%
                    </div>
                  </div>
                  <div
                    className={`toggle ${transferLowConfidence ? 'on' : ''}`}
                    onClick={() =>
                      setTransferLowConfidence(!transferLowConfidence)
                    }
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="topbar-btn btn-primary text-xs"
                  >
                    Save Voice Configuration
                  </button>
                </div>
              </div>
            </div>

            {/* Staff Access Card */}
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <span className="card-title">Staff Access</span>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                  className="topbar-btn btn-ghost text-xs flex items-center gap-1"
                >
                  <PlusIcon size={12} />
                  Invite
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            member.role === 'Owner'
                              ? 'badge-purple'
                              : member.role === 'Manager'
                              ? 'badge-blue'
                              : 'badge-gray'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td>{member.lastLogin}</td>
                      <td></td>
                    </tr>
                  ))}
                  <tr>
                    <td>+ Invite Staff</td>
                    <td colSpan={3}>
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        className="topbar-btn btn-ghost"
                        style={{ fontSize: '11px', padding: '4px 12px' }}
                      >
                        Send Invite
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>

      {/* Invite Staff Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Invite Staff Member
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="py-4 space-y-4">
              <div className="input-group">
                <div className="input-label">Full Name</div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marco Rossi"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label">Email Address</div>
                <input
                  type="email"
                  required
                  placeholder="e.g. marco@mamaspizzeria.com.au"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label">Access Role</div>
                <select
                  value={newStaffRole}
                  onChange={(e) =>
                    setNewStaffRole(e.target.value as 'Manager' | 'Staff')
                  }
                >
                  <option value="Manager">Manager (Full call & menu controls)</option>
                  <option value="Staff">Staff (Orders & monitor view only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="topbar-btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="topbar-btn btn-primary text-xs"
                >
                  Send Invite Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsTab;
