import Link from 'next/link';
import type { ReactNode } from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

/**
 * Shared layout for legal pages — glass panel on design tokens,
 * gold eyebrow, consistent prose typography. Text ≤ 40%, one idea per section.
 */
export function LegalPageLayout({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto glass-panel rounded-3xl p-10 md:p-14">
          <p className="section-eyebrow mb-3">{eyebrow}</p>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight text-white">{title}</h1>
          {updated && <p className="mt-3 text-xs text-white/40 font-mono">Last updated — {updated}</p>}
          <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/60 [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-[var(--gold)] [&_a:hover]:text-[var(--gold-bright)] [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
            {children}
          </div>
          <p className="mt-12 pt-6 border-t border-[var(--border-subtle)] text-xs text-white/40">
            Questions about this policy?{' '}
            <Link href="/contact">Contact us</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
