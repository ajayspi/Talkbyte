'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Send } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { Reveal } from '@/components/ui/Reveal';

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/50 transition-all';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="section-eyebrow mb-4">Contact</p>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-white">
              Hear your calls, <span className="text-gradient-gold">handled</span>
            </h1>
            <p className="mt-5 text-lg text-white/55 font-light max-w-xl mx-auto">
              Send a sample of your real call volume — we&rsquo;ll show you exactly what TalkByte would handle.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-14 text-center"
                  >
                    <CheckCircle2 size={52} className="mx-auto text-[var(--gold)] mb-6" strokeWidth={1.5} />
                    <h2 className="font-display text-2xl text-white font-bold">Message received.</h2>
                    <p className="mt-3 text-white/55 max-w-sm mx-auto">
                      We reply fast, in plain English — usually within one business day.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-8 ghost-btn rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest text-white"
                    >
                      Send another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0, y: -12 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="firstName" className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">First name</label>
                        <input id="firstName" required type="text" placeholder="Alex" className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">Last name</label>
                        <input id="lastName" required type="text" placeholder="Morgan" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="business" className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">Business name</label>
                      <input id="business" required type="text" placeholder="Morgan & Co Dental" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">Work email</label>
                      <input id="email" required type="email" placeholder="alex@business.com.au" className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">What should TalkByte handle for you?</label>
                      <textarea id="message" rows={4} placeholder="e.g. After-hours calls, appointment bookings, payment follow-ups…" className={inputCls} />
                    </div>
                    <button
                      type="submit"
                      className="w-full glow-btn rounded-xl py-4 text-sm font-bold uppercase tracking-widest text-white inline-flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> Book a free demo
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}

