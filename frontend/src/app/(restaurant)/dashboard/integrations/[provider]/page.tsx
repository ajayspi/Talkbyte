'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  StoreIcon,
  ShieldIcon,
} from '@/components/icons';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { saveIntegration, getIntegrations } from '@/lib/api';
import { saveRestaurantIntegration, getRestaurantIntegrations } from '@/lib/supabase';

interface ProviderConfig {
  name: string;
  icon: string;
  subtitle: string;
  docsUrl: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    required: boolean;
    helper: string;
  }[];
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  square: {
    name: 'Square POS',
    icon: '🟦',
    subtitle: 'Synchronize menus, print tickets to kitchen printers, and sync real-time order states.',
    docsUrl: 'https://developer.squareup.com/docs',
    fields: [
      {
        key: 'location_id',
        label: 'Square Location ID',
        placeholder: 'e.g. L9B4EXAMPLE',
        type: 'text',
        required: true,
        helper: 'Locate your Location ID under Locations in the Square Developer Dashboard.',
      },
      {
        key: 'api_key',
        label: 'Square Access Token',
        placeholder: 'sq0atp-xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helper: 'OAuth Access Token or personal sandbox/production access token.',
      },
    ],
  },
  stripe: {
    name: 'Stripe Checkout',
    icon: '💳',
    subtitle: 'Generate instant payment links for callers sent via automated SMS and WhatsApp.',
    docsUrl: 'https://stripe.com/docs',
    fields: [
      {
        key: 'publishable_key',
        label: 'Stripe Publishable Key',
        placeholder: 'pk_live_... or pk_test_...',
        type: 'text',
        required: true,
        helper: 'Client-facing key for initiating Stripe checkout sessions.',
      },
      {
        key: 'api_key',
        label: 'Stripe Secret Key',
        placeholder: 'sk_live_... or sk_test_...',
        type: 'password',
        required: true,
        helper: 'Restricted secret key with Checkout and Payment Links permissions.',
      },
    ],
  },
  twilio: {
    name: 'Twilio SMS',
    icon: '📱',
    subtitle: 'Send payment links, order receipts, and real-time status updates directly to callers.',
    docsUrl: 'https://www.twilio.com/docs',
    fields: [
      {
        key: 'account_sid',
        label: 'Twilio Account SID',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'text',
        required: true,
        helper: 'Found on your Twilio Console dashboard overview page.',
      },
      {
        key: 'api_key',
        label: 'Twilio Auth Token',
        placeholder: 'Auth token from Twilio console',
        type: 'password',
        required: true,
        helper: 'Secret authorization token associated with your Twilio account.',
      },
      {
        key: 'from_phone_number',
        label: 'From Phone Number (TalkByte DID)',
        placeholder: '+61 2 9999 1234',
        type: 'text',
        required: false,
        helper: 'Twilio active phone number for outbound SMS delivery.',
      },
    ],
  },
  shopify: {
    name: 'Shopify POS',
    icon: '📦',
    subtitle: 'Catalog and inventory synchronization for retail and e-commerce teams.',
    docsUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens',
    fields: [
      {
        key: 'shop_domain',
        label: 'Shopify Store Domain',
        placeholder: 'your-store.myshopify.com',
        type: 'text',
        required: true,
        helper: 'The myshopify.com URL of your Shopify store.',
      },
      {
        key: 'api_key',
        label: 'Admin API Access Token',
        placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helper: 'Created via Custom Apps under Settings > Apps and sales channels.',
      },
    ],
  },
};

export default function IntegrationPage() {
  const router = useRouter();
  const params = useParams();
  const rawProvider = typeof params?.provider === 'string' ? params.provider : Array.isArray(params?.provider) ? params.provider[0] : 'square';
  const provider = (rawProvider || 'square').toLowerCase();

  const config = PROVIDER_CONFIGS[provider] || {
    name: `${provider.toUpperCase()} Integration`,
    icon: '🔌',
    subtitle: 'Configure third-party service credentials.',
    docsUrl: '#',
    fields: [
      {
        key: 'api_key',
        label: 'API Key / Access Token',
        placeholder: 'Enter API key',
        type: 'password',
        required: true,
        helper: 'API credential for this service',
      },
    ],
  };

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const DEMO_RESTAURANT_ID = '5b99fb66-e992-489d-86b6-125577af8f55';
  const [restaurantId, setRestaurantId] = useState<string>(DEMO_RESTAURANT_ID);

  // Load existing credentials
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let restId = DEMO_RESTAURANT_ID;
      try {
        const supabase = supabaseBrowser();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: userRest } = await supabase
            .from('restaurant_users')
            .select('restaurant_id')
            .eq('user_id', userData.user.id)
            .single();
          if (userRest?.restaurant_id) {
            restId = userRest.restaurant_id;
            setRestaurantId(restId);
          }
        }
      } catch (authErr) {
        console.warn('Failed to resolve authenticated restaurant ID, falling back to demo UUID:', authErr);
      }

      try {
        const res = await getIntegrations(restId);
        const info = res?.integrations?.[provider];
        if (info) {
          setIsConnected(info.connected);
          setMaskedKey(info.masked_key || '');
          if (info.metadata) {
            setFormData((prev) => ({
              ...prev,
              ...info.metadata,
            }));
          }
        }
      } catch (err) {
        // Fallback to supabase helper
        try {
          const rows = await getRestaurantIntegrations(restId);
          const found = rows.find((r) => r.provider.toLowerCase() === provider);
          if (found) {
            setIsConnected(found.status === 'connected' || found.is_active);
            setMaskedKey(found.api_key ? `${found.api_key.slice(0, 6)}****` : '');
            if (found.metadata && typeof found.metadata === 'object') {
              setFormData(found.metadata as Record<string, string>);
            }
          }
        } catch (subErr) {
          console.warn('Failed to load integration details:', subErr);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [provider]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    const apiKey = formData.api_key?.trim() || '';
    const metadata: Record<string, any> = { ...formData };
    delete metadata.api_key;

    try {
      try {
        await saveIntegration(restaurantId, provider, apiKey, metadata);
      } catch (apiErr) {
        console.warn('Backend save failed, trying direct Supabase:', apiErr);
        const dbSuccess = await saveRestaurantIntegration(restaurantId, provider, apiKey, metadata);
        if (!dbSuccess) {
          throw new Error('Failed to save integration credentials to database. Please check your credentials and try again.');
        }
      }

      setIsConnected(true);
      if (apiKey) {
        setMaskedKey(`${apiKey.slice(0, 4)}****...****${apiKey.slice(-4)}`);
      }
      setSuccessMessage(`✓ ${config.name} credentials saved and connected successfully!`);
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err.message || 'Failed to save integration credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="section active space-y-6 max-w-4xl mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Link href="/dashboard?tab=settings" className="hover:text-purple-600 font-medium">
          Settings
        </Link>
        <ChevronRightIcon size={12} className="text-gray-400" />
        <span className="text-gray-400">Integrations</span>
        <ChevronRightIcon size={12} className="text-gray-400" />
        <span className="text-gray-800 font-semibold">{config.name}</span>
      </div>

      {/* Main Card */}
      <div className="card shadow-sm border border-gray-200/80">
        <div className="card-header flex items-center justify-between py-5 px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl shadow-xs">
              {config.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                <span>{config.name} Configuration</span>
                <span
                  className={`badge text-xs ${
                    isConnected ? 'badge-green' : 'badge-gray'
                  }`}
                >
                  <span className={`status-dot ${isConnected ? 'green' : 'gray'}`} />
                  {isConnected ? 'Connected' : 'Not Configured'}
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <Link
            href="/dashboard?tab=settings"
            className="topbar-btn btn-ghost text-xs"
          >
            ← Back to Settings
          </Link>
        </div>

        <div className="card-body p-6 space-y-6">
          {/* Status / Masked Key Banner */}
          {isConnected && maskedKey && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon size={16} className="text-emerald-600" />
                <span>
                  <strong>Active Connection:</strong> Secrets are securely encrypted in Supabase.
                  Current key: <code className="bg-emerald-100/80 px-2 py-0.5 rounded font-mono">{maskedKey}</code>
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">
                Live
              </span>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              ⚠️ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircleIcon size={16} className="text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {config.fields.map((f) => (
              <div key={f.key} className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                  {f.required ? (
                    <span className="text-[11px] text-purple-700 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-normal">Optional</span>
                  )}
                </div>
                <input
                  type={f.type}
                  required={f.required && !maskedKey}
                  placeholder={f.key === 'api_key' && maskedKey ? maskedKey : f.placeholder}
                  value={formData[f.key] || ''}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  className="mt-1"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">{f.helper}</span>
              </div>
            ))}

            {/* Provider Specific Extra Controls */}
            {provider === 'square' && (
              <div className="input-group">
                <div className="input-label text-sm font-semibold text-gray-800">Environment</div>
                <select
                  value={formData.environment || 'production'}
                  onChange={(e) => handleFieldChange('environment', e.target.value)}
                  className="mt-1"
                >
                  <option value="production">Production (Processes real customer orders)</option>
                  <option value="sandbox">Sandbox (Testing environment)</option>
                </select>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <Link
                href="/dashboard?tab=settings"
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Return to Settings
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="topbar-btn btn-primary text-xs flex items-center gap-1.5 px-5 py-2.5 shadow-sm"
                >
                  {isSaving && <span className="animate-spin mr-1">◌</span>}
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
