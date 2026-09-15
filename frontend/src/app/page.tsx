"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Phone, CheckCircle2, Store, Activity } from "lucide-react";
import Link from "next/link";
import GoldGlobe from "@/components/landing/GoldGlobe";
import AnimatedGraph from "@/components/landing/AnimatedGraph";
import NodeNetwork from "@/components/landing/NodeNetwork";

export default function Home() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navigation />

      {/* Background Lighting */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D4AF37]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#7c3aed]/10 blur-[120px]" />
      </div>

      <main>
        {/* HERO SECTION - Masterpiece Core */}
        <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-8 relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse shadow-[0_0_10px_#D4AF37]" />
                <span className="text-[var(--gold)] text-xs font-bold tracking-widest uppercase">The Voice Commerce OS</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-[80px] font-black tracking-tighter leading-[1]">
                Every missed call is <br />
                <span className="text-gradient-premium">lost revenue.</span>
              </h1>

              <p className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed font-light">
                TalkByte AI answers every call instantly, takes orders with human-parity accuracy, sends SMS payment links, and syncs directly into your Point of Sale.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="#demo" className="glow-btn px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Phone size={18} /> Hear it in action
                </Link>
                <Link href="/features" className="px-8 py-4 rounded-full glass-panel hover:bg-white/5 transition-colors font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                  See The Pipeline
                </Link>
              </div>

              <div className="pt-8 flex items-center gap-8 border-t border-[var(--gold)]/10">
                 <div>
                   <div className="text-3xl font-black text-white">487<span className="text-[var(--gold)] text-lg">ms</span></div>
                   <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">Response Latency</div>
                 </div>
                 <div className="w-px h-12 bg-[var(--gold)]/10"></div>
                 <div>
                   <div className="text-3xl font-black text-emerald-400">94<span className="text-emerald-500/50 text-lg">%</span></div>
                   <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">Order Accuracy</div>
                 </div>
              </div>
            </motion.div>

            {/* Premium Gold Globe Component */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="relative z-10"
            >
              <GoldGlobe />
            </motion.div>
          </div>
        </section>

        {/* DATA VISUALIZATION SECTION */}
        <section id="analytics" className="py-32 relative z-10 border-y border-[var(--gold)]/10 bg-black/40">
           <div className="max-w-7xl mx-auto px-6">
             <div className="grid lg:grid-cols-2 gap-16 items-center">
               <motion.div
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
               >
                 <AnimatedGraph />
               </motion.div>
               <div className="space-y-6">
                 <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Capture the <span className="text-gradient-premium">Friday Rush.</span></h2>
                 <p className="text-lg text-white/60 leading-relaxed">
                   When your venue peaks at 7 PM, human staff put callers on hold, leading to a 30% abandonment rate. TalkByte's infinite concurrency means every caller is greeted instantly, capturing revenue you didn't know you were losing.
                 </p>
                 <ul className="space-y-4 pt-4">
                   <li className="flex items-center gap-4 text-sm font-medium text-white/80 glass-panel p-4 rounded-xl">
                     <Activity className="text-[var(--gold)]" /> Real-time Analytics Sync
                   </li>
                   <li className="flex items-center gap-4 text-sm font-medium text-white/80 glass-panel p-4 rounded-xl">
                     <Store className="text-emerald-400" /> Direct POS Menu Injection
                   </li>
                 </ul>
               </div>
             </div>
           </div>
        </section>

        {/* HOW IT WORKS / NODE NETWORK */}
        <section id="how-it-works" className="py-32 relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">A unified <span className="text-gradient-premium">AI Pipeline.</span></h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">Not just an answering machine. An entire automated workflow spanning telephony, speech-to-text, LLM routing, and payment gateways.</p>
            </div>

            <div className="relative">
              <NodeNetwork />
            </div>
          </div>
        </section>

        {/* INTERACTIVE DEMO */}
        <section id="demo" className="py-32 relative z-10 border-t border-[var(--gold)]/10 bg-black/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Hear a <span className="text-gradient-premium">real call.</span></h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">Trained on thousands of real-world interactions. It handles thick accents, complex modifications, and payment friction automatically.</p>
            </div>

            <div className="max-w-3xl mx-auto glass-panel rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[var(--violet)]/20 border border-[var(--violet)]/30 flex items-center justify-center text-[var(--violet)] font-bold text-xl shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                      TB
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050505]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">TalkByte Agent</h3>
                    <p className="text-xs text-[var(--gold)] font-mono tracking-widest uppercase">Live Transcript</p>
                  </div>
                </div>
                <div className="text-emerald-400 font-mono flex items-center gap-2 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  01:24
                </div>
              </div>

              <div className="space-y-6 font-medium text-[15px]">
                {[
                  { role: 'AI', text: "Hi! Thanks for calling Mama\Mama'sapos;s Pizzeria. What can I get you?", bg: "bg-[var(--violet)]/10 border-[var(--violet)]/20 text-white/90" },
                  { role: 'You', text: "Large Margherita and garlic bread please.", bg: "bg-[var(--gold)]/10 border-[var(--gold)]/20 text-white", reverse: true },
                  { role: 'AI', text: "One large Margherita, garlic bread! Anything else?", bg: "bg-[var(--violet)]/10 border-[var(--violet)]/20 text-white/90" },
                  { role: 'You', text: "A Coke as well.", bg: "bg-[var(--gold)]/10 border-[var(--gold)]/20 text-white", reverse: true },
                  { role: 'AI', text: "$32.50 total. Confirming your order now and sending a payment link to your phone!", bg: "bg-[var(--violet)]/10 border-[var(--violet)]/20 text-white/90" }
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className={`flex gap-4 ${msg.reverse ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${msg.reverse ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--violet)]/20 text-[var(--violet)]'} shrink-0 flex items-center justify-center text-xs font-bold border border-white/5`}>
                      {msg.role}
                    </div>
                    <div className={`border rounded-2xl p-4 shadow-lg ${msg.reverse ? 'rounded-tr-none' : 'rounded-tl-none'} ${msg.bg}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* FINAL CTA & FOOTER */}
      <footer className="border-t border-[var(--gold)]/10 bg-[#020202] pt-24 pb-12 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 text-center mb-24 relative z-10">
           <h2 className="text-4xl md:text-5xl font-bold mb-6">Setup in 15 min · <span className="text-gradient-premium">No credit card.</span></h2>
           <Link href="/signup" className="glow-btn inline-block px-12 py-5 rounded-full font-bold text-sm uppercase tracking-wider mt-4">
              Start Your Trial
           </Link>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8 relative z-10">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center text-black font-black text-sm">TB</div>
            <span className="font-bold text-white">TalkByte AI</span>
          </div>
          <div className="text-white/30 text-sm font-medium">
            © 2026 TalkByte AI. The Voice Commerce Standard.
          </div>
        </div>
      </footer>
    </div>
  );
}
