'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

/**
 * Admin portal login page at /admin/login.
 * Operator admins sign in here to access the TalkByte platform admin panel.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Authentication failed');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#4A0E4E]">
          Talk<span className="text-[#14b8a6]">Byte</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
          Operator Admin Panel — Restricted Access
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Admin login form">
        <div className="mb-4">
          <label
            htmlFor="admin-email"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Operator Email
          </label>
          <input
            id="admin-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="operator@talkbyte.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#4A0E4E] transition-colors"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="admin-password"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#4A0E4E] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4A0E4E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3a0a3d] transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In as Admin'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500 space-y-2">
        <p>
          Need access credentials?{' '}
          <Link
            href="/admin/signup"
            className="text-[#4A0E4E] font-semibold hover:underline"
          >
            Request Operator Credentials
          </Link>
        </p>
        <p>
          Restaurant Owner?{' '}
          <Link
            href="/login"
            className="text-[#7c3aed] font-semibold hover:underline"
          >
            Return to Restaurant Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
