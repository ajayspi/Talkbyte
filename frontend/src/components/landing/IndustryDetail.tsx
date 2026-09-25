"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { INDUSTRIES } from '@/content/homepage';

const DETAILS: Record<string, { hero: string; flows: string[]; checklist: string[] }> = {
  'restaurants-qsr': {
    hero: 'Dual lanes, roaring engines, forty seconds to get it right. TalkByte runs both order points as one conversation.',
    flows: ['Lane-aware greeting with live queue balancing', 'Plate and ticket handoff to window staff', 'One capped upsell offer per car'],
    checklist: ['Two weeks of drive-through audio tuning', 'POS firing rules per lane', 'Rain and engine-noise tests'],
  },
  'hospitality-wellness': {
    hero: 'Reservations are revenue contracts. TalkByte treats them like a private maitre d\' with perfect memory.',
    flows: ['Occasion, allergy, and seating-preference capture', 'Deposit collection without awkward pauses', 'Cancellation backfill from a smart waitlist'],
    checklist: ['Sommelier-approved greeting script', 'VIP tagging and visit memory', 'Deposit and no-show policy wording'],
  },
  healthcare: {
    hero: 'Patients judge a practice by its phone. TalkByte answers every ring, books every slot, and never plays hold music.',
    flows: ['Symptom-aware triage within approved scripts', 'Two-way calendar booking with reminder calls', 'Privacy-first handling of every caller'],
    checklist: ['Approved triage script sign-off', 'Calendar and PMS integration verified', 'Privacy and recording notices configured'],
  },
  automotive: {
    hero: 'Service bays run on bookings, not voicemails. TalkByte fills the diary while your team stays under the car.',
    flows: ['Service booking with registration and VIN capture', 'Parts enquiry qualification with stock lookup', 'After-hours leads logged and routed by urgency'],
    checklist: ['Service menu and labour rates synced', 'Loan-car and availability rules set', 'Quote follow-up cadence approved'],
  },
};

const FALLBACK = {
  hero: 'Enterprise voice infrastructure tuned to this format.',
  flows: ['Format-specific greeting and qualification', 'Payment and confirmation handling', 'POS, book, and staff notifications'],
  checklist: ['Voice and script sign-off', 'Menu, pricing, and policy sync', 'Launch load and failure testing'],
};

export default function IndustryDetail({ slug }: { slug: string }) {
  const industry = INDUSTRIES.find((item) => item.slug === slug) ?? INDUSTRIES[0];
  const detail = DETAILS[slug] ?? FALLBACK;
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <Link href="/industries" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/55 hover:text-white">
        <ArrowLeft size={14} /> All industries
      </Link>
      <p className="font-mono-grotesk mt-8 text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">{industry.name}</p>
      <h1 className="font-display mt-4 max-w-3xl text-5xl leading-tight md:text-6xl">{industry.headline}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/65">{detail.hero}</p>
      
      {industry.imageSrc && (
        <div className="relative mt-10 h-[400px] w-full overflow-hidden rounded-[32px] border border-white/10">
          <Image 
            src={industry.imageSrc} 
            alt={industry.name} 
            fill 
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="inline-flex items-baseline gap-3 rounded-2xl border border-[rgba(217,164,65,0.35)] bg-[rgba(217,164,65,0.28)] backdrop-blur-md px-6 py-4">
              <span className="font-display text-4xl text-gradient-gold drop-shadow-sm">{industry.metric}</span>
              <span className="font-mono-grotesk text-xs uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">{industry.metricLabel}</span>
            </div>
          </div>
        </div>
      )}

      {!industry.imageSrc && (
        <div className="mt-8 inline-flex items-baseline gap-3 rounded-2xl border border-[rgba(217,164,65,0.35)] bg-[rgba(217,164,65,0.08)] px-6 py-4">
          <span className="font-display text-4xl text-gradient-gold">{industry.metric}</span>
          <span className="font-mono-grotesk text-xs uppercase tracking-[0.2em] text-white/60">{industry.metricLabel}</span>
        </div>
      )}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-display text-2xl">How calls flow</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
            {detail.flows.map((flow) => (
              <li key={flow} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#f7dfa0]" /><span>{flow}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-display text-2xl">Launch checklist</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
            {detail.checklist.map((item) => (
              <li key={item} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" /><span>{item}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/contact" className="glow-btn rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.14em]">Scope my deployment</Link>
        <Link href="/pricing" className="ghost-btn rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white">See pricing <ArrowRight size={15} className="inline" /></Link>
      </div>
    </main>
  );
}
