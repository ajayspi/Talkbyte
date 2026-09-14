'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

/**
 * Admin portal registration page at /admin/signup.
 * Authorizes new platform operators with a corporate invite code.
 */
export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'operator_admin',
            invite_code: inviteCode,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
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
          Operator Account Registration
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Admin registration form">
        <div className="mb-4">
          <label
            htmlFor="admin-name"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Operator Name
          </label>
          <input
            id="admin-name"
            type="text"
            name="name"
            required
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#4A0E4E] transition-colors"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="admin-email"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Corporate Email
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

        <div className="mb-4">
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
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#4A0E4E] transition-colors"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="invite-code"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Invite Code
          </label>
          <input
            id="invite-code"
            type="text"
            name="inviteCode"
            required
            placeholder="TB-OP-XXXX"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono outline-none focus:border-[#4A0E4E] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4A0E4E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3a0a3d] transition-colors disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register Operator Account'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
        <p>
          Already registered?{' '}
          <Link
            href="/admin/login"
            className="text-[#4A0E4E] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
