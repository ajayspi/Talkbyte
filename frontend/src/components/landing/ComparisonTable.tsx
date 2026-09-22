"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { COMPARISON_ROWS } from "@/content/homepage";

export default function ComparisonTable() {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl">
      <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr] gap-2 border-b border-white/10 bg-black/30 px-5 py-4 font-mono-grotesk text-[11px] uppercase tracking-[0.2em] text-white/55 md:px-8">
        <span>Operation</span>
        <span>Manual phone</span>
        <span className="text-[#f7dfa0]">TalkByte</span>
        <span className="text-right">Impact</span>
      </div>
      {COMPARISON_ROWS.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45, delay: i * 0.06 }}
          className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr] items-center gap-2 border-b border-white/[0.07] px-5 py-4 transition-colors last:border-0 hover:bg-[rgba(217,164,65,0.06)] md:px-8"
        >
          <span className="text-sm font-bold text-white">{row.label}</span>
          <span className="text-sm text-white/55">{row.manual}</span>
          <span className="text-sm font-semibold text-[#ffeebc]">{row.talkbyte}</span>
          <span className="inline-flex items-center justify-end gap-1 text-right font-mono-grotesk text-xs font-bold text-emerald-300">
            {row.delta} <ArrowUpRight size={13} />
          </span>
        </motion.div>
      ))}
    </div>
  );
}
