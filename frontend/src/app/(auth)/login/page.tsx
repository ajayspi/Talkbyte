'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

/**
 * Restaurant portal login page at /login.
 * Unauthenticated users are directed here before accessing /dashboard.
 */
export default function LoginPage() {
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
      router.push('/dashboard');
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
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">
          Talk<span className="text-[#14b8a6]">Byte</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Restaurant portal — sign in to continue
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Login form">
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7c3aed] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500 space-y-2">
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-[#7c3aed] font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
        <p>
          Operator Admin?{' '}
          <Link
            href="/admin/login"
            className="text-[#4A0E4E] font-semibold hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
