"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements[0] as HTMLInputElement).value;
    const password = (form.elements[1] as HTMLInputElement).value;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <>
      <div className="text-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/20 blur-xl rounded-full" />
        <h1 className="text-2xl font-bold text-white mb-2 relative flex justify-center items-center gap-2">
          Operator Access <ShieldAlert size={20} className="text-red-400" />
        </h1>
        <p className="text-white/50 text-sm">System administration portal</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center relative z-10">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-2">Operator ID</label>
          <input
            type="text"
            required
            placeholder="admin@talkbyte.ai"
            className="w-full bg-black/40 border border-red-500/20 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-2">Security Key</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="w-full bg-black/40 border border-red-500/20 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-400 text-white rounded-xl py-3.5 font-bold uppercase tracking-wide text-sm mt-4 flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Authenticate"
          )}
        </button>
      </form>
    </>
  );
}
