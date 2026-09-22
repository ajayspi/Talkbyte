'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { ProcessFlow, type FlowStep } from '@/components/ui/ProcessFlow';
import { Reveal } from '@/components/ui/Reveal';
import { USE_CASES } from '@/content/platform';

/** Outcome node per use case — completes the Caller → TalkByte → Outcome flow. */
const OUTCOMES: Record<string, { icon: string; title: string; sub: string }> = {
  'voice-commerce': { icon: 'receipt', title: 'Order placed & paid', sub: 'SMS link clears before hang-up' },
  'front-desk': { icon: 'user-check', title: 'Qualified & routed', sub: 'Warm hand-off with context' },
  'appointment-booking': { icon: 'calendar-check', title: 'Booked & reminded', sub: 'Calendar synced both ways' },
  'contact-center': { icon: 'headset', title: 'Resolved or handed off', sub: 'Transcript always attached' },
  outbound: { icon: 'send', title: 'Confirmed & followed up', sub: 'No-shows and churn drop' },
  'drive-thru': { icon: 'utensils-crossed', title: 'Order in the lane', sub: '52s peak service' },
  'employee-assist': { icon: 'ticket-check', title: 'Ticket resolved', sub: 'Tier-1 answered instantly' },
  'voice-insights': { icon: 'bar-chart', title: 'Insights delivered', sub: 'Every call, measured' },
  multilingual: { icon: 'languages', title: 'Understood, any language', sub: '30+ languages, 38 accents' },
  'ai-agent': { icon: 'check-circle', title: 'Task completed', sub: 'Within strict guardrails' },
};

export default function UseCasesPage() {
  const [active, setActive] = useState(USE_CASES[0].slug);
  const uc = USE_CASES.find((u) => u.slug === active)!;
  const outcome = OUTCOMES[uc.slug];

  const flow: FlowStep[] = [
    { icon: 'phone-call', title: 'They call', sub: 'Customer or employee dials in' },
    { icon: 'bot', title: 'TalkByte answers', sub: `${uc.name} — ${uc.tagline}` },
    { icon: outcome.icon, title: outcome.title, sub: outcome.sub },
  ];

  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero — one idea: one platform, many jobs */}
          <Reveal className="text-center mb-16">
            <p className="section-eyebrow mb-4">Use Cases</p>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-white max-w-3xl mx-auto">
              One platform. <span className="text-gradient-gold">Ten ways</span> to talk to your customers.
            </h1>
            <p className="mt-5 text-lg text-white/55 max-w-2xl mx-auto font-light">
              Every use case below runs on the same voice engine — deploy one, or connect them.
            </p>
          </Reveal>
          {/* Tab bar */}
          <Reveal delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2 mb-14">
              {USE_CASES.map((u) => {
                const Icon = u.icon;
                const isActive = u.slug === active;
                return (
                  <button
                    key={u.slug}
                    onClick={() => setActive(u.slug)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                      isActive ? 'text-black' : 'text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="uc-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon size={14} className="relative z-10" />
                    <span className="relative z-10">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Active panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={uc.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid lg:grid-cols-2 gap-14 items-center glass-panel rounded-3xl p-10 md:p-14"
            >
              {/* Copy */}
              <div>
                <uc.icon size={34} className="text-[var(--gold)] mb-6" strokeWidth={1.5} />
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{uc.name}</h2>
                <p className="mt-2 text-xl text-[var(--gold)] font-display italic">{uc.tagline}</p>
                <p className="mt-5 text-white/60 leading-relaxed max-w-md">{uc.copy}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {uc.chips.map((chip) => (
                    <span key={chip} className="badge-gold">{chip}</span>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="mt-9 inline-flex items-center gap-2 glow-btn rounded-full px-7 py-3 text-xs font-bold uppercase tracking-widest text-white"
                >
                  See it on your calls <ArrowRight size={15} />
                </Link>
              </div>

              {/* Animated flow */}
              <div className="flex items-center justify-center py-6">
                <ProcessFlow steps={flow} />
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      <Footer />
    </div>
  );
}
