"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

const sliderCls =
  "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--gold)]";

/**
 * Interactive ROI calculator — recovered revenue from calls you currently miss.
 * Three sliders in, one animated number out. No backend needed.
 */
export function RoiCalculator() {
  const [calls, setCalls] = useState(120);
  const [missed, setMissed] = useState(28);
  const [value, setValue] = useState(85);

  const { recovered, callsSaved, annual } = useMemo(() => {
    const missedCalls = (calls * missed) / 100;
    const recoveredCalls = missedCalls * 0.78; // share TalkByte captures and completes
    return {
      callsSaved: recoveredCalls * 21,
      recovered: recoveredCalls * value * 21,
      annual: recoveredCalls * value * 21 * 12,
    };
  }, [calls, missed, value]);

  const rows: { label: string; min: number; max: number; step: number; val: number; set: (n: number) => void; fmt: (n: number) => string }[] = [
    { label: "Calls per day", min: 10, max: 600, step: 10, val: calls, set: setCalls, fmt: (n) => `${n}` },
    { label: "Missed or abandoned", min: 0, max: 60, step: 1, val: missed, set: setMissed, fmt: (n) => `${n}%` },
    { label: "Average transaction value", min: 20, max: 1500, step: 5, val: value, set: setValue, fmt: (n) => money(n) },
  ];

  return (
    <div className="glass-panel grid gap-10 overflow-hidden rounded-[28px] p-8 md:grid-cols-2 md:p-12">
      <div>
        <p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[var(--gold)]">ROI calculator</p>
        <h2 className="font-display mt-3 text-3xl leading-tight md:text-4xl text-white">
          What are the calls you miss worth?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Move the sliders. Based on 2.4M scored conversations, TalkByte captures and completes about 78% of demand that would otherwise be abandoned.
        </p>

        <div className="mt-8 space-y-7">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-3 flex items-baseline justify-between">
                <label className="text-sm font-semibold text-white/80" htmlFor={r.label}>{r.label}</label>
                <span className="font-display text-xl text-[var(--gold-bright)]">{r.fmt(r.val)}</span>
              </div>
              <input
                id={r.label}
                type="range"
                min={r.min}
                max={r.max}
                step={r.step}
                value={r.val}
                onChange={(e) => r.set(Number(e.target.value))}
                className={sliderCls}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-3xl border border-[var(--gold-border)] bg-gradient-to-br from-[rgba(212,175,55,0.12)] via-transparent to-transparent p-8">
        <div className="flex items-center gap-2 font-mono-grotesk text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
          <TrendingUp size={15} /> Recovered per month
        </div>
        <p className="font-display mt-4 text-5xl leading-none text-white md:text-6xl">
          <CountUp key={Math.round(recovered)} to={Math.round(recovered)} prefix="$" duration={0.7} />
        </p>
        <div className="mt-7 space-y-3 text-sm">
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white/55">Extra calls answered monthly</span>
            <span className="font-semibold text-white/90">{Math.round(callsSaved).toLocaleString("en-AU")}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white/55">Recovered per year</span>
            <span className="font-semibold text-white/90">{money(annual)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white/55">TalkByte Growth plan</span>
            <span className="font-semibold text-white/90">$199/mo</span>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-7 text-xs leading-relaxed text-white/45"
        >
          Estimates only — we will model your real call data during a free pilot.
        </motion.p>
      </div>
    </div>
  );
}
