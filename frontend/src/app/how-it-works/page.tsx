import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { ProcessFlow } from '@/components/ui/ProcessFlow';
import { Reveal } from '@/components/ui/Reveal';

const DEPLOY_STEPS = [
  { icon: 'search', title: 'Discover', sub: 'We map your call flows, FAQs and pain points before a line of code.' },
  { icon: 'workflow', title: 'Connect', sub: 'TalkByte wires into your phones, calendar and stack — typed, tested, safe.' },
  { icon: 'rocket', title: 'Go live', sub: 'You approve scripts and success metrics. No rip and replace.' },
];

const LIVE_PIPELINE = [
  { icon: 'phone-call', title: 'Call arrives', sub: 'Answered in 0.8s, any hour' },
  { icon: 'audio-waveform', title: 'TalkByte resolves', sub: '38 accents, 30+ languages' },
  { icon: 'calendar-check', title: 'Action booked', sub: 'Calendar, ticket or order created' },
  { icon: 'receipt', title: 'Payment secured', sub: 'SMS link, PCI-compliant' },
];

export const metadata = {
  title: 'How TalkByte Works — From First Call to Live AI',
  description:
    'A transparent path from discovery to a live voice AI that answers, books, sells and follows up for your business, 24/7.',
};

export default function HowItWorksPage() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <Reveal className="text-center mb-20">
            <p className="section-eyebrow mb-4">Platform</p>
            <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[1.05] text-white max-w-3xl mx-auto">
              From first call to <span className="text-gradient-gold">live AI</span> in three steps
            </h1>
            <p className="mt-5 text-lg text-white/55 max-w-2xl mx-auto font-light">
              A transparent path — you approve everything before a single customer hears it.
            </p>
          </Reveal>

          {/* Live call pipeline — the animated showpiece */}
          <Reveal delay={0.1} className="mb-20">
            <div className="glass-panel rounded-3xl px-8 py-12 md:px-14">
              <p className="section-eyebrow text-center mb-10">What a call looks like</p>
              <ProcessFlow steps={LIVE_PIPELINE} />
            </div>
          </Reveal>

          {/* Deployment steps */}
          <Reveal delay={0.15} className="mb-20">
            <div className="glass-panel rounded-3xl px-8 py-12 md:px-14">
              <p className="section-eyebrow text-center mb-10">Deployment</p>
              <ProcessFlow steps={DEPLOY_STEPS} />
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal delay={0.2} className="text-center">
            <p className="text-white/55 mb-7 font-light">Most businesses go live in 4–8 weeks.</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 glow-btn rounded-full px-9 py-4 text-xs font-bold uppercase tracking-widest text-white"
            >
              Book a free demo
            </Link>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}

