"use client";

import { motion } from "framer-motion";
import { Activity, CreditCard, Printer, ShieldCheck } from "lucide-react";

const pulses = [
  { left: "8%", delay: "0s", duration: "2.8s" },
  { left: "28%", delay: "0.5s", duration: "3.4s" },
  { left: "52%", delay: "1.1s", duration: "2.6s" },
  { left: "74%", delay: "0.3s", duration: "3.1s" },
  { left: "90%", delay: "0.9s", duration: "2.9s" },
];

export default function HeroVisual() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto">
      <div className="absolute -inset-10 rounded-[48px] bg-[radial-gradient(circle_at_50%_30%,rgba(217,164,65,0.24),transparent_62%)] blur-2xl" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 34, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-[rgba(217,164,65,0.28)] bg-[#0d0a06]/90 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <div>
                            <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-emerald-300">Live call · channel 04</p>
              <p className="text-sm font-semibold text-white">Maison Clinic — Collins St</p>
            </div>
          </div>
          <div className="equalizer flex h-8 items-end gap-1" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="w-1 rounded-full bg-gradient-to-t from-[#8a5f14] via-[#d9a441] to-[#f7dfa0]" style={{ height: `${18 + ((i * 7) % 14)}px` }} />
            ))}
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 text-[13px] leading-relaxed">
          <div className="max-w-[86%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] p-3 text-white/90">
                        Hi — a new patient looking for an emergency appointment tomorrow. One adult, no dental cover. Around ten?
          </div>
          <div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-md border border-[rgba(217,164,65,0.4)] bg-[rgba(217,164,65,0.12)] p-3 text-[#fff4d6]">
                        Absolutely — 10:00 or 10:40 both have Dr Sharma. I'll lock 10:00, note the no-cover preference, and send a $20 deposit link. Which suits?
          </div>
                    <div className="max-w-[62%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.06] p-3 text-white/90">10:00 is perfect. Send it.</div>
          <div className="ml-auto flex max-w-[78%] items-center gap-2 rounded-2xl rounded-tr-md border border-emerald-300/30 bg-emerald-400/10 p-3 text-emerald-100">
                        <ShieldCheck size={16} /> Appointment booked · deposit secured · PMS synced
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-white/10 bg-black/40 px-5 py-4 text-center">
          {[
            { icon: Activity, top: '1m 04s', bottom: 'handle time' },
            { icon: CreditCard, top: '$20.00', bottom: 'deposit taken' },
            { icon: Printer, top: 'POS + CRM', bottom: 'posted 2.1s' },
          ].map((item) => (
            <div key={item.bottom} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
              <item.icon size={15} className="mx-auto mb-1 text-[#f7dfa0]" />
              <p className="text-[13px] font-bold text-white">{item.top}</p>
              <p className="font-mono-grotesk text-[10px] uppercase tracking-[0.18em] text-white/50">{item.bottom}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-6 top-10 hidden rounded-2xl border border-white/10 bg-[#12100b]/95 px-4 py-3 shadow-2xl sm:block"
      >
                <p className="font-mono-grotesk text-[10px] uppercase tracking-[0.22em] text-white/55">Revenue captured</p>
        <p className="font-display text-2xl text-[#f7dfa0]">$8,412</p>
      </motion.div>
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute -right-5 bottom-16 hidden rounded-2xl border border-white/10 bg-[#12100b]/95 px-4 py-3 shadow-2xl sm:block"
      >
        <p className="font-mono-grotesk text-[10px] uppercase tracking-[0.22em] text-white/55">Missed calls</p>
        <p className="font-display text-2xl text-emerald-300">0 abandoned</p>
      </motion.div>

      <div className="pointer-events-none absolute -bottom-8 left-6 right-6 h-20 overflow-hidden opacity-70" aria-hidden>
        {pulses.map((p) => (
          <span
            key={p.left}
            className="absolute bottom-0 h-10 w-px bg-gradient-to-t from-transparent via-[#d9a441] to-transparent"
            style={{ left: p.left, animation: `float-y ${p.duration} ease-in-out infinite`, animationDelay: p.delay }}
          />
        ))}
      </div>
    </div>
  );
}
