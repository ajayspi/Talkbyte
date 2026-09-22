"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SCENARIOS } from "@/content/homepage";

export default function ScenarioTabs() {
  const [active, setActive] = useState(SCENARIOS[0].id);
  const current = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-2">
        {SCENARIOS.map((s) => {
          const selected = s.id === active;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                selected
                  ? "border-[rgba(217,164,65,0.55)] bg-[rgba(217,164,65,0.10)] shadow-[0_18px_50px_rgba(217,164,65,0.16)]"
                  : "border-white/10 bg-white/[0.03] hover:border-[rgba(217,164,65,0.35)]"
              }`}
            >
              <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-[#f7dfa0]/80">{s.index}</p>
              <p className="mt-1 font-display text-lg leading-snug text-white">{s.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                View scenario <ArrowRight size={13} />
              </p>
            </button>
          );
        })}
      </div>

      <div className="glass-panel relative overflow-hidden rounded-3xl p-7 md:p-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.34 }}
          >
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-1 font-mono-grotesk text-[11px] uppercase tracking-[0.22em] text-emerald-200">
              {current.venue}
            </p>
            <h3 className="font-display mt-4 text-3xl leading-tight text-white md:text-4xl">{current.title}</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-red-300/20 bg-red-500/[0.07] p-4">
                <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.22em] text-red-200">Before</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{current.before}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(217,164,65,0.35)] bg-[rgba(217,164,65,0.08)] p-4">
                <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.22em] text-[#f7dfa0]">During the call</p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/80">
                  {current.during.map((line) => (
                    <li key={line} className="flex gap-2">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#f7dfa0]" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/[0.08] p-4">
                <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.22em] text-emerald-200">After</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{current.after}</p>
                <p className="font-display mt-3 text-2xl text-emerald-200">{current.stat}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
