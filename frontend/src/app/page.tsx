import Link from 'next/link';
import {
  StoreIcon,
  ShieldIcon,
  ChevronRightIcon,
} from '@/components/icons';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0a1e] via-[#2d124d] to-[#0f172a] text-white flex flex-col justify-between p-6 sm:p-12">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#14b8a6] flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
            TB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              TalkByte <span className="text-[#14b8a6]">AI</span>
            </h1>
            <p className="text-xs text-white/50">Next-Gen Voice Ordering Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Production Core v2.2 (AU-EAST-1)
        </div>
      </header>

      {/* Main Section */}
      <section className="max-w-4xl w-full mx-auto my-12 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[#14b8a6] text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
          Telephony · LLM · STT/TTS · POS Integration
        </span>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Autonomous Phone Ordering for Restaurants
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto text-base sm:text-lg mb-10">
          Direct caller connection via Telnyx SIP, real-time LiveKit audio processing, Deepgram Flux STT, GPT-4.1 menu RAG, ElevenLabs natural voices, and Square POS sync.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Restaurant Dashboard Card */}
          <Link
            href="/dashboard"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-2xl p-7 transition-all duration-200 shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                  <StoreIcon size={24} />
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-1 rounded-md">
                  Venue Staff Portal
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                Restaurant Dashboard
                <ChevronRightIcon size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-white/60 mb-6">
                Operations console for Mama&apos;s Pizzeria. Real-time call monitor, 4-stage order pipeline, 30s live menu RAG toggle, analytics, and billing.
              </p>

              <div className="space-y-1.5 text-xs text-white/70 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Real-Time Live Call Audio Intercept
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> 4-Stage Orders Pipeline (Placed → Synced)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> 30-Second AI Menu Availability Sync
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50">
              <span>7 Operational Tabs</span>
              <span className="text-purple-400 font-semibold group-hover:underline">Launch Dashboard &rarr;</span>
            </div>
          </Link>

          {/* Operator Admin Panel Card */}
          <Link
            href="/admin"
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/50 rounded-2xl p-7 transition-all duration-200 shadow-xl hover:shadow-teal-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                  <ShieldIcon size={24} />
                </div>
                <span className="text-xs bg-teal-500/20 text-teal-300 font-semibold px-2.5 py-1 rounded-md">
                  Platform Operator
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-teal-300 transition-colors flex items-center gap-2">
                Operator Admin Panel
                <ChevronRightIcon size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-white/60 mb-6">
                Platform control center across 487 venues. Live call monitoring, unit economics ($0.062/min pipeline COGS), infrastructure health, and audit logs.
              </p>

              <div className="space-y-1.5 text-xs text-white/70 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span> 487-Tenant Restaurant Fleet Directory
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span> Unit Economics & $0.062/min COGS Breakdown
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">✓</span> 9 Infrastructure Monitors & Audit Ledger
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/50">
              <span>9 Administrative Views</span>
              <span className="text-teal-400 font-semibold group-hover:underline">Open Admin Console &rarr;</span>
            </div>
          </Link>
        </div>

        {/* Telemetry Metric Strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">487</div>
            <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">Active Venues</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400">99.4%</div>
            <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">Order Accuracy</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-purple-400">$0.062</div>
            <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">COGS / Min</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-teal-400">14</div>
            <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-semibold">Live Calls</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <div>TalkByte AI Pty Ltd · Sydney, Australia</div>
        <div className="flex items-center gap-6">
          <span>FastAPI Backend: localhost:8000</span>
          <span>Supabase Postgres + pgvector</span>
        </div>
      </footer>
    </main>
  );
}
