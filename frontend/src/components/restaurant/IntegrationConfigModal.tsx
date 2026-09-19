'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XIcon, CheckCircleIcon } from '@/components/icons';
import { saveIntegration } from '@/lib/api';
import { saveRestaurantIntegration } from '@/lib/supabase';

export type IntegrationProvider = 'square' | 'stripe' | 'twilio' | 'shopify' | string;

export interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: IntegrationProvider;
  restaurantId?: string;
  initialData?: {
    apiKey?: string;
    maskedKey?: string;
    metadata?: Record<string, any>;
    status?: string;
    connected?: boolean;
  };
  onSuccess?: (provider: string, data: any) => void;
}

interface ProviderMeta {
  name: string;
  icon: string;
  tagline: string;
  description: string;
  docHint: string;
}

const PROVIDER_METAS: Record<string, ProviderMeta> = {
  square: {
    name: 'Square POS',
    icon: '🟦',
    tagline: 'Point of Sale & Kitchen Printer Integration',
    description:
      'Connect your Square account so incoming AI phone orders automatically flow straight to your kitchen display (KDS) and receipt printers.',
    docHint: 'Retrieve your Location ID and Access Token from the Square Developer Dashboard.',
  },
  stripe: {
    name: 'Stripe Checkout',
    icon: '💳',
    tagline: 'Instant SMS & WhatsApp Payment Links',
    description:
      'Connect Stripe to automatically generate secure payment links sent to callers via SMS or WhatsApp for automated contactless checkout.',
    docHint: 'Find your API keys in Stripe Dashboard > Developers > API keys.',
  },
  twilio: {
    name: 'Twilio SMS',
    icon: '📱',
    tagline: 'Outbound Customer SMS Notifications',
    description:
      'Connect Twilio to send automated order status updates, pickup notifications, and payment links with custom sender branding.',
    docHint: 'Your Account SID and Auth Token are located in the Twilio Console homepage.',
  },
  shopify: {
    name: 'Shopify POS',
    icon: '📦',
    tagline: 'Menu Catalog & Inventory Synchronization',
    description:
      'Connect Shopify to sync catalog menus, product modifiers, and real-time inventory levels with TalkByte AI ordering.',
    docHint: 'Create a custom app in your Shopify Store Admin > Settings > Apps and sales channels to generate an Admin API token.',
  },
};

export const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({
  isOpen,
  onClose,
  provider,
  restaurantId = '5b99fb66-e992-489d-86b6-125577af8f55',
  initialData,
  onSuccess,
}) => {
  const normProvider = (provider || 'square').toLowerCase();
  const meta = PROVIDER_METAS[normProvider] || {
    name: `${provider} Integration`,
    icon: '🔌',
    tagline: 'Third-party integration',
    description: 'Configure API keys and connection parameters.',
    docHint: 'Enter your credentials below.',
  };

  // Provider specific state fields
  // Square
  const [squareLocationId, setSquareLocationId] = useState('');
  const [squareAccessToken, setSquareAccessToken] = useState('');
  const [squareEnv, setSquareEnv] = useState<'production' | 'sandbox'>('production');

  // Stripe
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');

  // Shopify
  const [shopifyShopDomain, setShopifyShopDomain] = useState('');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');

  // General state
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.metadata) {
      if (normProvider === 'square') {
        if (initialData.metadata.location_id) setSquareLocationId(initialData.metadata.location_id);
        if (initialData.metadata.environment) setSquareEnv(initialData.metadata.environment);
      } else if (normProvider === 'stripe') {
        if (initialData.metadata.publishable_key) setStripePublishableKey(initialData.metadata.publishable_key);
        if (initialData.metadata.webhook_secret) setStripeWebhookSecret(initialData.metadata.webhook_secret);
      } else if (normProvider === 'twilio') {
        if (initialData.metadata.account_sid) setTwilioAccountSid(initialData.metadata.account_sid);
        if (initialData.metadata.from_phone_number) setTwilioFromNumber(initialData.metadata.from_phone_number);
      } else if (normProvider === 'shopify') {
        if (initialData.metadata.shop_domain) setShopifyShopDomain(initialData.metadata.shop_domain);
      }
    }
    if (initialData?.apiKey) {
      if (normProvider === 'square') setSquareAccessToken(initialData.apiKey);
      if (normProvider === 'stripe') setStripeSecretKey(initialData.apiKey);
      if (normProvider === 'twilio') setTwilioAuthToken(initialData.apiKey);
      if (normProvider === 'shopify') setShopifyAccessToken(initialData.apiKey);
    }
  }, [initialData, normProvider, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    let apiKey = '';
    let metadata: Record<string, any> = {};

    if (normProvider === 'square') {
      if (!squareLocationId.trim()) {
        setErrorMessage('Square Location ID is required.');
        setIsSubmitting(false);
        return;
      }
      if (!squareAccessToken.trim() && !initialData?.maskedKey) {
        setErrorMessage('Square Access Token is required.');
        setIsSubmitting(false);
        return;
      }
      apiKey = squareAccessToken.trim() || initialData?.apiKey || '';
      metadata = {
        location_id: squareLocationId.trim(),
        location_name: "Mama's Pizzeria — Newtown",
        environment: squareEnv,
      };
    } else if (normProvider === 'stripe') {
      if (!stripePublishableKey.trim()) {
        setErrorMessage('Stripe Publishable Key is required.');
        setIsSubmitting(false);
        return;
      }
      if (!stripeSecretKey.trim() && !initialData?.maskedKey) {
        setErrorMessage('Stripe Secret Key is required.');
        setIsSubmitting(false);
        return;
      }
      apiKey = stripeSecretKey.trim() || initialData?.apiKey || '';
      metadata = {
        publishable_key: stripePublishableKey.trim(),
        webhook_secret: stripeWebhookSecret.trim(),
        account_name: 'acc_1Nk...',
      };
    } else if (normProvider === 'twilio') {
      if (!twilioAccountSid.trim()) {
        setErrorMessage('Twilio Account SID is required.');
        setIsSubmitting(false);
        return;
      }
      if (!twilioAuthToken.trim() && !initialData?.maskedKey) {
        setErrorMessage('Twilio Auth Token is required.');
        setIsSubmitting(false);
        return;
      }
      apiKey = twilioAuthToken.trim() || initialData?.apiKey || '';
      metadata = {
        account_sid: twilioAccountSid.trim(),
        from_phone_number: twilioFromNumber.trim() || '+61 2 9999 1234',
      };
    } else if (normProvider === 'shopify') {
      if (!shopifyShopDomain.trim()) {
        setErrorMessage('Shopify Shop Domain is required.');
        setIsSubmitting(false);
        return;
      }
      if (!shopifyAccessToken.trim() && !initialData?.maskedKey) {
        setErrorMessage('Shopify Admin Access Token is required.');
        setIsSubmitting(false);
        return;
      }
      apiKey = shopifyAccessToken.trim() || initialData?.apiKey || '';
      metadata = {
        shop_domain: shopifyShopDomain.trim(),
      };
    }

    try {
      // Primary: backend API call
      try {
        await saveIntegration(restaurantId, normProvider, apiKey, metadata);
      } catch (apiErr) {
        console.warn('Backend saveIntegration failed, attempting direct Supabase persistence:', apiErr);
        const dbSuccess = await saveRestaurantIntegration(restaurantId, normProvider, apiKey, metadata);
        if (!dbSuccess) {
          throw new Error('Failed to persist integration credentials. Please verify your credentials and try again.');
        }
      }

      setSuccessMessage(`✓ Successfully connected ${meta.name}!`);

      if (onSuccess) {
        onSuccess(normProvider, {
          connected: true,
          status: 'connected',
          metadata,
          masked_key: apiKey ? `${apiKey.slice(0, 6)}****` : initialData?.maskedKey || 'connected',
        });
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to save integration:', err);
      setErrorMessage(err.message || 'Failed to save integration. Please verify your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center text-xl shadow-xs">
              {meta.icon}
            </div>
            <div>
              <h3 id="modal-headline" className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Configure {meta.name}</span>
                {initialData?.connected && (
                  <span className="badge badge-green text-[10px] py-0.5 px-2">
                    <span className="status-dot green" /> Connected
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">{meta.tagline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Description Banner */}
        <div className="mt-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100/80 text-xs text-purple-900 leading-relaxed">
          {meta.description}
          <div className="mt-1 font-medium text-purple-700 opacity-90">{meta.docHint}</div>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-medium">
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-xs font-medium flex items-center gap-2">
            <CheckCircleIcon size={14} className="text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* ── SQUARE FORM ── */}
          {normProvider === 'square' && (
            <>
              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Square Location ID</span>
                  <span className="text-[11px] text-gray-400 font-normal">Required</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. L9B4EXAMPLE"
                  value={squareLocationId}
                  onChange={(e) => setSquareLocationId(e.target.value)}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Find in Square Developer Console under Locations.
                </span>
              </div>

              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Square Access Token</span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required={!initialData?.maskedKey}
                  placeholder={initialData?.maskedKey || 'sq0atp-xxxxxxxxxxxxxxxxxxxx'}
                  value={squareAccessToken}
                  onChange={(e) => setSquareAccessToken(e.target.value)}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  OAuth access token with orders and payments permissions.
                </span>
              </div>

              <div className="input-group">
                <div className="input-label">Environment</div>
                <select
                  value={squareEnv}
                  onChange={(e) => setSquareEnv(e.target.value as 'production' | 'sandbox')}
                >
                  <option value="production">Production (Live Orders)</option>
                  <option value="sandbox">Sandbox (Testing)</option>
                </select>
              </div>
            </>
          )}

          {/* ── STRIPE FORM ── */}
          {normProvider === 'stripe' && (
            <>
              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Publishable Key</span>
                  <span className="text-[11px] text-gray-400 font-normal">Required</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="pk_live_... or pk_test_..."
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Secret Key</span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required={!initialData?.maskedKey}
                  placeholder={initialData?.maskedKey || 'sk_live_... or sk_test_...'}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Keys are securely encrypted and masked before storage.
                </span>
              </div>

              <div className="input-group">
                <div className="input-label">Webhook Signing Secret (Optional)</div>
                <input
                  type="text"
                  placeholder="whsec_..."
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── TWILIO FORM ── */}
          {normProvider === 'twilio' && (
            <>
              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Account SID</span>
                  <span className="text-[11px] text-gray-400 font-normal">Required</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Auth Token</span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required={!initialData?.maskedKey}
                  placeholder={initialData?.maskedKey || 'Auth token from Twilio console'}
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label">From Phone Number (TalkByte DID)</div>
                <input
                  type="text"
                  placeholder="e.g. +61 2 9999 1234 or +61 412 345 678"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Authorized sender number configured in your Twilio account.
                </span>
              </div>
            </>
          )}

          {/* ── SHOPIFY FORM ── */}
          {normProvider === 'shopify' && (
            <>
              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Shop Domain</span>
                  <span className="text-[11px] text-gray-400 font-normal">Required</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="your-store.myshopify.com"
                  value={shopifyShopDomain}
                  onChange={(e) => setShopifyShopDomain(e.target.value)}
                />
              </div>

              <div className="input-group">
                <div className="input-label flex items-center justify-between">
                  <span>Admin API Access Token</span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required={!initialData?.maskedKey}
                  placeholder={initialData?.maskedKey || 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                  value={shopifyAccessToken}
                  onChange={(e) => setShopifyAccessToken(e.target.value)}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Requires <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">read_products</code> and <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">write_orders</code> scopes.
                </span>
              </div>
            </>
          )}

          {/* Dedicated Route Link */}
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
            <span>Prefer a full page view?</span>
            <Link
              href={`/dashboard/integrations/${normProvider}`}
              className="text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center gap-1"
              onClick={onClose}
            >
              <span>Open dedicated config page</span>
              <span>→</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="topbar-btn btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="topbar-btn btn-primary text-xs flex items-center gap-1.5"
            >
              {isSubmitting && <span className="animate-spin mr-0.5">◌</span>}
              <span>Save & Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationConfigModal;
