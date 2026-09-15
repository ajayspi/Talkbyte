"use client";

import { motion } from "framer-motion";
import { Phone, Server, CreditCard, CheckCircle2 } from "lucide-react";

export default function NodeNetwork() {
  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center">
      {/* Central AI Brain */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 w-32 h-32 rounded-full bg-[#050505] border-2 border-[var(--gold)] flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)]"
      >
        <div className="text-[var(--gold)] text-4xl font-black">AI</div>
        <div className="absolute inset-0 rounded-full border border-[var(--gold)]/30 node-pulse" />
      </motion.div>

      {/* Connection Lines (SVGs) */}
      <svg className="absolute inset-0 w-full h-full z-0" style={{ filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.5))' }}>
        <motion.path
          d="M 100,100 Q 300,300 300,300"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
        <motion.path
          d="M 500,100 Q 300,300 300,300"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
        <motion.path
          d="M 100,500 Q 300,300 300,300"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
        <motion.path
          d="M 500,500 Q 300,300 300,300"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
      </svg>

      {/* Perimeter Nodes */}
      <motion.div className="absolute top-[10%] left-[10%] z-10 glass-panel p-4 rounded-2xl flex items-center gap-3">
        <Phone className="text-white" /> <span className="font-bold text-sm">Inbound Call</span>
      </motion.div>

      <motion.div className="absolute top-[10%] right-[10%] z-10 glass-panel p-4 rounded-2xl flex items-center gap-3">
        <Server className="text-emerald-400" /> <span className="font-bold text-sm">POS Sync</span>
      </motion.div>

      <motion.div className="absolute bottom-[10%] left-[10%] z-10 glass-panel p-4 rounded-2xl flex items-center gap-3">
        <CreditCard className="text-[var(--violet)]" /> <span className="font-bold text-sm">Stripe Payment</span>
      </motion.div>

      <motion.div className="absolute bottom-[10%] right-[10%] z-10 glass-panel p-4 rounded-2xl flex items-center gap-3">
        <CheckCircle2 className="text-[var(--gold)]" /> <span className="font-bold text-sm">Order Fired</span>
      </motion.div>
    </div>
  );
}
