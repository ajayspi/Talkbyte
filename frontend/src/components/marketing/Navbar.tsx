'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[var(--bg-pure)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-2xl' : 'bg-transparent'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="navLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#FCF6BA', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect x="40" y="25" width="20" height="30" rx="10" fill="url(#navLogoGrad)" />
              <line x1="50" y1="55" x2="50" y2="75" stroke="url(#navLogoGrad)" strokeWidth="3" strokeLinecap="round" />
              <line x1="35" y1="75" x2="65" y2="75" stroke="url(#navLogoGrad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 20 40 Q 15 50 20 60" stroke="#D4AF37" strokeWidth="2.5" fill="none" opacity="0.7" />
              <path d="M 10 35 Q 3 50 10 65" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.5" />
              <path d="M 80 40 Q 85 50 80 60" stroke="#FCF6BA" strokeWidth="2.5" fill="none" opacity="0.7" />
              <path d="M 90 35 Q 97 50 90 65" stroke="#FCF6BA" strokeWidth="2" fill="none" opacity="0.5" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:opacity-80 transition-opacity">
            TalkByte <span className="text-gradient-gold">OS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--text-dim)] hover:text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-4 px-6 py-2.5 rounded-full border border-[var(--gold-border)] bg-[rgba(212,175,55,0.05)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[rgba(212,175,55,0.15)] hover:border-[var(--gold-core)] transition-all shadow-[0_0_15px_var(--gold-glow)]"
          >
            Deploy
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <motion.span
            className="block w-6 h-0.5 bg-white rounded-full"
            animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 8 : 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.span
            className="block w-6 h-0.5 bg-white rounded-full"
            animate={{ opacity: mobileOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block w-6 h-0.5 bg-white rounded-full"
            animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -8 : 0 }}
            transition={{ duration: 0.25 }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="md:hidden bg-[#0f0a1a]/95 backdrop-blur-md border-t border-white/10 px-6 py-6 flex flex-col gap-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-white/80 hover:text-white text-base font-medium py-1"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-teal-500 text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
            >
              Book a Demo
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
