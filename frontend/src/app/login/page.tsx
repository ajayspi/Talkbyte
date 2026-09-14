'use client';

import React, { useState } from 'react';

/**
 * Restaurant portal login page at /login.
 * Unauthenticated users are directed here before accessing /dashboard.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Authentication handled via Supabase in production
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">
            Talk<span className="text-[#14b8a6]">Byte</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Restaurant portal — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} aria-label="Login form">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#7c3aed] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#4A0E4E] transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
