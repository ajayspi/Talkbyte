'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          restaurant_name: restaurantName,
          role: 'owner'
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-white">Check your email</h2>
        <p className="mt-2 text-sm text-gray-400">
          We've sent a confirmation link to <span className="text-white font-medium">{email}</span>.
        </p>
        <div className="mt-8">
          <Link href="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
          Create Account
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Start your 14-day free trial of TalkByte AI
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSignup}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
           <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="restaurantName">
              Restaurant Name
            </label>
            <input
              id="restaurantName"
              name="restaurantName"
              type="text"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors sm:text-sm"
              placeholder="e.g. Joe's Pizza"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors sm:text-sm"
              placeholder="admin@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors sm:text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#111111] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#111111] text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="w-full flex items-center justify-center px-4 py-2 border border-white/10 rounded-xl shadow-sm text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'apple' })} className="w-full flex items-center justify-center px-4 py-2 border border-white/10 rounded-xl shadow-sm text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.365 14.316c-.023-2.525 2.062-3.722 2.155-3.774-1.168-1.71-2.979-1.942-3.64-1.97-1.558-.157-3.042.916-3.834.916-.79 0-2.022-.897-3.32-.871-1.693.023-3.255.986-4.135 2.514-1.777 3.092-.455 7.682 1.285 10.187.854 1.233 1.861 2.624 3.197 2.573 1.286-.05 1.77-.827 3.323-.827 1.55 0 1.986.827 3.342.802 1.382-.026 2.253-1.258 3.095-2.49 1.002-1.464 1.41-2.88 1.41-2.88-.024-.01-2.705-1.041-2.731-4.148h-.147zm-1.897-6.042c.691-.845 1.157-2.016 1.03-3.197-1.01.042-2.228.675-2.946 1.517-.638.747-1.196 1.936-1.045 3.093 1.134.088 2.274-.567 2.961-1.413h0z"/>
            </svg>
            Apple
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-400">Already have an account? </span>
        <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign in
        </Link>
      </div>
    </>
  );
}
