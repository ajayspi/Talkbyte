'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const LINKS = {
  Platform: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Use cases', href: '/use-cases' },
    { label: 'Industries', href: '/industries' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'Contact', href: '/contact' },
    { label: 'Start a pilot', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Sitemap', href: '/sitemap' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[var(--bg-deep)] border-t border-[var(--border-subtle)] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8">
                <Logo size={32} />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase font-sans">
                TalkByte <span className="text-gradient-gold">OS</span>
              </span>
            </Link>
            <p className="text-[var(--text-dim)] text-sm leading-relaxed max-w-[260px] font-medium">
              Voice AI that answers, books, sells and follows up — for every business, 24/7.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} TalkByte AI. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Deepgram · ElevenLabs · LiveKit · Stripe · Square
          </p>
        </div>
      </div>
    </footer>
  );
}
