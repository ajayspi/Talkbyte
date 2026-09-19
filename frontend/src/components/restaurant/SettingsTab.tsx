'use client';

import React, { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  SettingsIcon,
  StoreIcon,
  CheckCircleIcon,
  PlusIcon,
  XIcon,
} from '@/components/icons';
import { usePlanGating, FeatureKey } from '@/lib/planGating';
import { PlanUpgradeModal, LockIcon } from '@/components/ui/PlanGate';

interface StaffMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Staff';
  lastLogin: string;
}

export const SettingsTab: React.FC = () => {
  const { canAccess, navigateToBilling } = usePlanGating();
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureKey | null>(null);

  // Business Details State
const [businessName, setBusinessName] = useState("Loading...");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [holidayClosureMode, setHolidayClosureMode] = useState(false);

  const [ttsProvider, setTtsProvider] = useState("Cartesia Sonic (Ultra-low Latency)");
  const [voicePersona, setVoicePersona] = useState("Aria");
  const [greetingScript, setGreetingScript] = useState("");

  const [allowManualTakeover, setAllowManualTakeover] = useState(true);
  const [transferLowConfidence, setTransferLowConfidence] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = supabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: userRest } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', userData.user.id)
        .single();
        
      if (userRest) {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', userRest.restaurant_id)
          .single();
          
        if (rest) {
          setBusinessName(rest.name || "");
          setPhoneNumber(rest.telnyx_number || rest.phone_number || "");
          setTimezone(rest.timezone || "Australia/Sydney");
          setGreetingScript(rest.ai_instructions || "");
        }
      }
    };
    loadData();
  }, []);

  const handleTtsChange = (newVal: 'cartesia' | 'elevenlabs') => {
    if (newVal === 'elevenlabs' && !canAccess('settings:tts_elevenlabs')) {
      setUpgradeFeature('settings:tts_elevenlabs');
      return;
    }
    setTtsProvider(newVal);
  };

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: userRest } = await supabase.from('restaurant_users').select('restaurant_id').eq('user_id', userData.user.id).single();
      if (userRest) {
        await supabase.from('restaurants').update({
          name: businessName,
          phone_number: phoneNumber,
          timezone: timezone,
          ai_instructions: greetingScript
        }).eq('id', userRest.restaurant_id);
      }
    }
    setIsSaving(false);
    
    showToast('✨ Settings and AI persona instructions saved successfully.');
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
                    value={phoneNumber}
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
                    className={`toggle ${holidayClosureMode ? 'on' : ''}`}
                    onClick={() => {
                      setHolidayClosureMode(!holidayClosureMode);
                      showToast(
                        !holidayClosureMode
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
                        if (!canAccess('settings:pos_shopify')) {
                          setUpgradeFeature('settings:pos_shopify');
                          return;
                        }
                        setShopifyConnected(true);
                        showToast('Shopify POS connector initialized.');
                      }}
                      className="topbar-btn btn-ghost flex items-center gap-1"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                    >
                      <span>Connect</span>
                      {!canAccess('settings:pos_shopify') && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold flex items-center gap-0.5">
                          <LockIcon size={9} /> PRO
                        </span>
                      )}
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
                  <select
                    value={ttsProvider}
                    onChange={(e) => handleTtsChange(e.target.value as any)}
                  >
                    <option value="cartesia">Cartesia Sonic (Ultra-low Latency)</option>
                    <option value="elevenlabs">
                      ElevenLabs (High Quality) {!canAccess('settings:tts_elevenlabs') ? '🔒 [Growth/Pro]' : ''}
                    </option>
                  </select>
                </div>

                <div className="input-group">
                  <div className="input-label">Voice Persona Name</div>
                  <input
                    type="text"
                    value={voicePersona}
                    onChange={(e) => setVoicePersona(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <div className="input-label flex items-center justify-between">
                    <span>Greeting Script</span>
                    <button
                      type="button"
                      className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                      onClick={() => setGreetingScript(`"Hi, welcome to ${businessName || 'our restaurant'}! I'm ${voicePersona}. Would you like to place an order today?"`)}
                      style={{ fontSize: '10px' }}
                    >
                      ✨ Generate with AI
                    </button>
                  </div>
                  <textarea
                    style={{ height: '70px', resize: 'none' }}
                    value={greetingScript}
                    onChange={(e) => setGreetingScript(e.target.value)}
                  />
                </div>

                <div className="settings-row">
                  <div>
                    <div className="setting-label flex items-center gap-1.5">
                      <span>Allow Manual Takeover</span>
                      {!canAccess('settings:manual_takeover') && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <LockIcon size={9} /> PRO
                        </span>
                      )}
                    </div>
                    <div className="setting-desc">
                      Staff can intercept active AI calls from dashboard
                    </div>
                  </div>
                  <div
                    className={`toggle ${allowManualTakeover ? 'on' : ''} ${
                      !canAccess('settings:manual_takeover') ? 'opacity-60 cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (!canAccess('settings:manual_takeover')) {
                        setUpgradeFeature('settings:manual_takeover');
                        return;
                      }
                      setAllowManualTakeover(!allowManualTakeover);
                    }}
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
                  onClick={() => {
                    if (!canAccess('settings:multi_staff')) {
                      setUpgradeFeature('settings:multi_staff');
                      return;
                    }
                    setInviteModalOpen(true);
                  }}
                  className="topbar-btn btn-ghost text-xs flex items-center gap-1"
                >
                  <PlusIcon size={12} />
                  <span>Invite</span>
                  {!canAccess('settings:multi_staff') && (
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold flex items-center gap-0.5">
                      <LockIcon size={9} /> PRO
                    </span>
                  )}
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

      {upgradeFeature && (
        <PlanUpgradeModal
          feature={upgradeFeature}
          onClose={() => setUpgradeFeature(null)}
          onUpgrade={() => {
            setUpgradeFeature(null);
            navigateToBilling();
          }}
        />
      )}
    </div>
  );
};
export default SettingsTab;
