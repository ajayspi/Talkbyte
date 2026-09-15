"use client";

import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";

export default function GoldGlobe() {
  return (
    <div className="relative aspect-square flex items-center justify-center w-full max-w-[500px] mx-auto">
      {/* Outer rotating dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-[var(--gold)]/30"
      />

      {/* Inner counter-rotating ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 rounded-full border border-[var(--gold)]/20"
      />

      {/* Deep glowing core */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold)_0%,transparent_50%)] opacity-20 blur-3xl mix-blend-screen" />

      {/* The Globe Icon */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], filter: ["drop-shadow(0 0 20px rgba(212,175,55,0.4))", "drop-shadow(0 0 40px rgba(212,175,55,0.8))", "drop-shadow(0 0 20px rgba(212,175,55,0.4))"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Globe2 size={160} className="text-[var(--gold)]" strokeWidth={1} />
      </motion.div>

      {/* Floating Gold Standard Badge */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-4 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border border-[var(--gold)]/50 shadow-[0_0_30px_rgba(212,175,55,0.3)] z-20 bg-black/60"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
        <span className="font-bold text-sm tracking-widest uppercase text-gradient-premium">The Gold Standard</span>
      </motion.div>
    </div>
  );
}
