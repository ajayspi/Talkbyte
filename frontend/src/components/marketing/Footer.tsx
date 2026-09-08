'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const LINKS = {
  Product: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Restaurant Dashboard', href: '/dashboard' },
  ],
  Company: [
    { label: 'Contact', href: '/contact' },
    { label: 'Book a Demo', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0614] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect x="40" y="25" width="20" height="30" rx="10" fill="url(#footerGrad)" />
                  <line x1="50" y1="55" x2="50" y2="75" stroke="url(#footerGrad)" strokeWidth="3" strokeLinecap="round" />
                  <line x1="35" y1="75" x2="65" y2="75" stroke="url(#footerGrad)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 20 40 Q 15 50 20 60" stroke="#7c3aed" strokeWidth="2.5" fill="none" opacity="0.7" />
                  <path d="M 10 35 Q 3 50 10 65" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.5" />
                  <path d="M 80 40 Q 85 50 80 60" stroke="#14b8a6" strokeWidth="2.5" fill="none" opacity="0.7" />
                  <path d="M 90 35 Q 97 50 90 65" stroke="#14b8a6" strokeWidth="2" fill="none" opacity="0.5" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                TalkByte AI
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-[220px]">
              AI phone ordering for Australian restaurants. Answer every call, take every order.
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
            © {new Date().getFullYear()} TalkByte AI. All rights reserved. ABN placeholder.
          </p>
          <p className="text-white/30 text-xs">
            Built for Australian restaurants 🇦🇺
          </p>
        </div>
      </div>
    </footer>
  );
}
