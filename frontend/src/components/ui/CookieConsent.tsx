'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

const KEY = 'talkbyte.cookie-choice';

/** Slide-in cookie consent — pairs with the Cookie Policy page. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage unavailable — stay silent */
    }
  }, []);

  const decide = (choice: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-3xl"
        >
          <div className="glass-panel flex flex-col gap-4 rounded-2xl px-6 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)] md:flex-row md:items-center md:gap-6">
            <Cookie size={22} className="shrink-0 text-[var(--gold)]" strokeWidth={1.6} aria-hidden />
            <p className="flex-1 text-sm leading-relaxed text-white/65">
              We use essential cookies to run TalkByte, and optional ones to understand what is working.{' '}
              <Link href="/cookies" className="text-[var(--gold)] underline decoration-[var(--gold-border)] underline-offset-2 hover:text-[var(--gold-bright)]">
                Cookie Policy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => decide('declined')}
                className="ghost-btn rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white"
              >
                Essential only
              </button>
              <button
                onClick={() => decide('accepted')}
                className="glow-btn rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
