"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { GUARDRAILS, INDUSTRIES, OPERATING_MODEL, GLOBAL_SIGNALS, TESTIMONIALS } from "@/content/homepage";

export function OperatingModel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {OPERATING_MODEL.map((item, i) => (
        <motion.div
          key={item.step}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: i * 0.08 }}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(217,164,65,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#f7dfa0] via-[#d9a441] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
          <p className="font-display text-5xl text-white/10 transition-colors group-hover:text-[rgba(217,164,65,0.28)]">{item.step}</p>
          <h3 className="font-display mt-2 text-2xl text-white">{item.title}</h3>
          <p className="mt-1 font-mono-grotesk text-[11px] uppercase tracking-[0.22em] text-[#f7dfa0]">{item.time}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/65">{item.copy}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function IndustryGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {INDUSTRIES.map((industry, i) => (
        <motion.div
          key={industry.slug}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
        >
          <Link
            href={`/industries/${industry.slug}`}
            className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(217,164,65,0.5)] hover:shadow-[0_24px_70px_rgba(217,164,65,0.14)]"
          >
            <div>
              <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-white/50">{industry.name}</p>
              <h3 className="font-display mt-3 text-2xl leading-snug text-white">{industry.headline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{industry.detail}</p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="font-display text-4xl text-gradient-gold">{industry.metric}</p>
                <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.2em] text-white/50">{industry.metricLabel}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-all group-hover:border-[#d9a441] group-hover:bg-[#d9a441] group-hover:text-black">
                <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function GlobalSignals() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {GLOBAL_SIGNALS.map((signal, i) => (
        <motion.div
          key={signal.city}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45, delay: i * 0.06 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-white">{signal.city}</h3>
            <span className="flex items-center gap-2 font-mono-grotesk text-[11px] uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> live
            </span>
          </div>
          <p className="mt-1 text-xs text-white/55">{signal.detail}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${signal.load}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="h-full rounded-full bg-gradient-to-r from-[#f7dfa0] via-[#d9a441] to-[#e0653a]"
            />
          </div>
          <p className="mt-2 font-mono-grotesk text-[11px] uppercase tracking-[0.18em] text-white/50">{signal.load}% of nightly capacity</p>
        </motion.div>
      ))}
    </div>
  );
}

/** Quiet guardrail list — four lines, no cards competing for attention. */
export function GuardrailList() {
  return (
    <div className="mt-10 grid gap-x-8 gap-y-5 border-t border-white/10 pt-8 md:grid-cols-2">
      {GUARDRAILS.map((g) => (
        <div key={g.title} className="flex gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#d9a441]" strokeWidth={1.6} aria-hidden />
          <p className="text-sm leading-relaxed text-white/60">
            <span className="font-semibold text-white/90">{g.title}. </span>
            {g.copy}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Customer proof — headline metric first, one sentence of context. */
export function Testimonials() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TESTIMONIALS.map((t, i) => (
        <motion.figure
          key={t.metric}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.55, delay: i * 0.1 }}
          className="glass-card flex flex-col rounded-3xl p-7"
        >
          <p className="font-display text-5xl leading-none text-gradient-gold">{t.metric}</p>
          <p className="mt-2 font-mono-grotesk text-[11px] uppercase tracking-[0.2em] text-white/50">{t.metricLabel}</p>
          <blockquote className="mt-6 flex-1 text-sm leading-relaxed text-white/70">&ldquo;{t.quote}&rdquo;</blockquote>
          <figcaption className="mt-6 border-t border-white/10 pt-4 text-xs text-white/45">
            <span className="font-semibold text-white/75">{t.name}</span> · {t.org}
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

