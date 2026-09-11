'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { PhoneIcon, CheckCircleIcon, ServerIcon, ClockIcon } from '@/components/icons';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[var(--surface-dark)] overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 grid-bg opacity-40"></div>
      <ParticlesBackground />

      <Navbar />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="section-spacing min-h-screen flex flex-col justify-center pt-32">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--gold-border)] bg-[var(--surface-panel)] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[var(--gold-core)] animate-pulse"></span>
                <span className="text-xs font-mono text-[var(--gold-core)] uppercase tracking-wider">Enterprise AI Voice</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                Every Call. <br />
                Every Order. <br />
                <span className="gold-gradient-text">Answered.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-slate-400 max-w-xl leading-relaxed">
                TalkByte's futuristic voice AI handles your restaurant's inbound phone orders, processes payments via SMS, and syncs directly with Square POS. Zero double-entry. Never sleeps.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 pt-4">
                <Link href="/dashboard" className="btn-premium">
                  Launch Dashboard
                </Link>
                <Link href="/admin" className="btn-ghost">
                  Operator Panel
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Abstract Futuristic Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative hidden lg:flex justify-center items-center"
            >
              {/* Outer Glow Ring */}
              <div className="absolute w-[500px] h-[500px] rounded-full border border-[var(--gold-border)] animate-[spin_20s_linear_infinite] opacity-50"></div>
              <div className="absolute w-[400px] h-[400px] rounded-full border border-[rgba(255,255,255,0.1)] animate-[spin_15s_linear_infinite_reverse]"></div>

              {/* Core Orb */}
              <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-[var(--gold-core)] to-purple-900 flex flex-col items-center justify-center shadow-[0_0_80px_var(--gold-glow)] gold-border-glow z-10">
                <span className="text-5xl mb-4 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🎙️</span>
                <div className="flex gap-1.5 h-8 items-center">
                  {[1,2,3,4,5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                      className="w-1 bg-white rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest mt-4">AI Active</span>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-10 right-10 glass-panel p-4 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircleIcon size={16} className="text-emerald-400" /></div>
                <div className="text-sm font-semibold text-white">POS Synced</div>
              </motion.div>

              <motion.div
                animate={{ y: [15, -15, 15] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-10 left-10 glass-panel p-4 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><PhoneIcon size={16} className="text-indigo-400" /></div>
                <div className="text-sm font-semibold text-white">284ms Latency</div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* TICKER SECTION */}
        <div className="w-full bg-[rgba(255,255,255,0.02)] border-y border-[rgba(255,255,255,0.05)] py-4 overflow-hidden relative backdrop-blur-sm">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex gap-16 whitespace-nowrap px-8 items-center"
          >
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="text-sm font-mono text-slate-400"><strong className="text-[var(--gold-core)]">487</strong> Active Venues</span>
                <span className="text-white/20">•</span>
                <span className="text-sm font-mono text-slate-400"><strong className="text-[var(--gold-core)]">&lt; 350ms</strong> Response Latency</span>
                <span className="text-white/20">•</span>
                <span className="text-sm font-mono text-slate-400"><strong className="text-[var(--gold-core)]">99.4%</strong> STT Accuracy</span>
                <span className="text-white/20">•</span>
                <span className="text-sm font-mono text-slate-400"><strong className="text-[var(--gold-core)]">$0</strong> Missed Revenue</span>
                <span className="text-white/20">•</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* FEATURES BENTO GRID */}
        <section className="section-spacing bg-black/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-xs font-mono text-[var(--gold-core)] tracking-[0.2em] uppercase mb-4">Architecture</h2>
              <h3 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">Engineered for Scale</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div whileHover={{ y: -8 }} className="glass-panel p-8 rounded-2xl gold-border-glow lg:col-span-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold-core)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-[rgba(212,175,55,0.1)] border border-[var(--gold-border)] flex items-center justify-center mb-6 text-2xl">🎙️</div>
                  <h4 className="text-xl font-bold text-white mb-3">Natural Voice Intelligence</h4>
                  <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
                    Powered by Deepgram Flux STT and GPT-4.1. TalkByte understands complex Australian slang, dietary modifications, and noisy backgrounds seamlessly.
                  </p>
                  <div className="text-3xl font-mono font-bold text-[var(--gold-core)]">284ms<span className="text-xs text-slate-500 ml-2 uppercase font-sans">E2E Latency</span></div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -8 }} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400"><ServerIcon size={24} /></div>
                  <h4 className="text-xl font-bold text-white mb-3">Square POS Sync</h4>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Orders drop directly into your kitchen display system the second the payment is confirmed via SMS link.
                  </p>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -8 }} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400"><CheckCircleIcon size={24} /></div>
                  <h4 className="text-xl font-bold text-white mb-3">Automated Payments</h4>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Secure Stripe links dispatched instantly via Telnyx SMS. Zero PCI scope for your staff over the phone.
                  </p>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -8 }} className="glass-panel p-8 rounded-2xl lg:col-span-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400"><ClockIcon size={24} /></div>
                  <h4 className="text-xl font-bold text-white mb-3">Menu Retrieval-Augmented Generation</h4>
                  <p className="text-slate-400 leading-relaxed max-w-md">
                    TalkByte uses pgvector embeddings to dynamically retrieve menu items, prices, and allergen data during the call. Out-of-stock items are automatically excluded from recommendations.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="section-spacing border-t border-[rgba(255,255,255,0.05)]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="relative w-24 h-24 mx-auto bg-[var(--surface-dark)] rounded-full gold-border-glow flex items-center justify-center shadow-[0_0_50px_var(--gold-glow)]">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight">
              Ready to automate your <br className="hidden md:block"/> <span className="gold-gradient-text">front of house?</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Stop missing calls during Friday night rush. Get set up in 15 minutes and let TalkByte handle the logistics.
            </p>
            <div className="pt-8">
              <Link href="/contact" className="btn-premium !text-lg !px-10 !py-4 inline-block">
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
