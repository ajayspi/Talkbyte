"use client";

import { motion } from "framer-motion";
import { HERO_METRICS, TICKER_ITEMS } from "@/content/homepage";
import { CountUp } from "@/components/ui/CountUp";

export function MetricsStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {HERO_METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: i * 0.08 }}
          className="glass-card rounded-2xl px-5 py-4"
        >
          <p className="font-display text-3xl text-[#fff3cf]">
            <CountUp to={m.to} decimals={m.decimals} suffix={m.suffix} />
          </p>
          <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.14em] text-white/80">{m.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{m.note}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function IndustryTicker() {
  const row = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden rounded-full border border-white/10 bg-black/40 py-3">
      <div className="hero-marquee flex w-max items-center gap-8 whitespace-nowrap px-6">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-8 font-mono-grotesk text-xs uppercase tracking-[0.24em] text-white/65">
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]" aria-hidden />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#070605] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#070605] to-transparent" />
    </div>
  );
}
