'use client';

import React, { useState } from 'react';

/**
 * Admin portal login page at /admin/login.
 * Operator admins sign in here to access the TalkByte platform admin panel.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Authentication handled via Supabase with admin role check in production
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#4A0E4E]">
            Talk<span className="text-[#14b8a6]">Byte</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">
            Operator Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} aria-label="Admin login form">
          <div className="mb-4">
            <label htmlFor="admin-email" className="block text-sm font-semibold text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="admin@talkbyte.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4A0E4E] transition-colors"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4A0E4E] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#4A0E4E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3a0a3d] transition-colors"
          >
            Sign In as Admin
          </button>
        </form>
      </div>
    </div>
  );
}
