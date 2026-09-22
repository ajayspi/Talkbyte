import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import { INDUSTRIES } from '@/content/homepage';

export const metadata: Metadata = {
  title: 'Industries — TalkByte AI',
  description: 'Deployment plans for restaurants, hospitality, healthcare, trades, retail, automotive, legal, real estate, fitness and multi-site franchises.',
};

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-[#070605] text-[#f5efe2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Industries</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-tight md:text-6xl">Every format has its own deployment plan.</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-white/60">Choose your operation. Each page covers call flows, compliance, staffing impact, launch checklists, and honest constraints.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-[rgba(217,164,65,0.5)]">
              <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-white/50">{industry.name}</p>
              <h2 className="font-display mt-3 text-2xl leading-snug">{industry.headline}</h2>
              <p className="mt-2 text-sm text-white/60">{industry.detail}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#f7dfa0]">Open plan <ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
