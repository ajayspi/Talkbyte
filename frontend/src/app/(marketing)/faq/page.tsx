'use client';

import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { Accordion } from '@/components/ui/Accordion';
import { Reveal } from '@/components/ui/Reveal';
import { FAQS } from '@/content/platform';

export default function FAQPage() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="section-eyebrow mb-4">FAQ</p>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-white">
              Questions, <span className="text-gradient-gold">answered plainly</span>
            </h1>
            <p className="mt-5 text-lg text-white/55 font-light max-w-xl mx-auto">
              Everything operators ask before going live with voice AI.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion items={FAQS} />
          </Reveal>

          <Reveal delay={0.15} className="text-center mt-14">
            <p className="text-white/50 text-sm">
              Still curious?{' '}
              <Link href="/contact" className="text-[var(--gold)] hover:text-[var(--gold-bright)] transition-colors">
                Talk to us directly
              </Link>
            </p>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
