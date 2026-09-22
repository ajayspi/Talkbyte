"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import ParticlesBackground from "@/components/marketing/ParticlesBackground";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { Reveal } from "@/components/ui/Reveal";
import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const plans = [
    {
      plan: "Starter",
      monthly: 99,
      desc: "For single-location businesses getting started with voice AI.",
      feats: ["Up to 500 AI minutes/mo", "POS & CRM sync", "SMS confirmations", "Live call dashboard"],
      pop: false
    },
    {
      plan: "Growth",
      monthly: 199,
      desc: "For busy teams handling real call volume.",
      feats: ["Up to 1,500 AI minutes/mo", "Up to 3 locations", "Stripe & Square payments", "Advanced analytics"],
      pop: true
    },
    {
      plan: "Pro",
      monthly: 349,
      desc: "For franchises and multi-site operations.",
      feats: ["Unlimited AI minutes", "Unlimited locations", "Custom voice & guardrails", "Priority 24/7 support"],
      pop: false
    }
  ];

  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen flex flex-col">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 flex-1 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <Reveal className="text-center mb-16">
            <p className="section-eyebrow mb-4">Pricing</p>
            <h1 className="font-display text-5xl md:text-6xl font-black tracking-tight mb-6 text-white">
              Honest <span className="text-gradient-premium">pricing.</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
              A flat monthly rate for every call answered, booked and paid — no per-order commissions, no lock-in.
            </p>

            <button
              onClick={() => setAnnual((v) => !v)}
              className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-[var(--gold-border)]"
            >
              <span className={`rounded-full px-4 py-1.5 transition-colors ${annual ? 'bg-white/5 text-white/50' : 'bg-[var(--gold)] text-black'}`}>Monthly</span>
              <span className={`rounded-full px-4 py-1.5 transition-colors ${annual ? 'bg-[var(--gold)] text-black' : 'bg-white/5 text-white/50'}`}>Annual · save 2 months</span>
            </button>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`glass-panel p-8 rounded-3xl relative flex flex-col transition-all duration-300 ${p.pop ? 'gold-glow lg:scale-105 z-10 border-[var(--gold)]/40' : 'hover:border-[var(--gold)]/20'}`}
              >
                {p.pop && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-[var(--gold)] text-black text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.4)]">Most Popular</div>}
                <h3 className="text-xl font-bold mb-2 text-white">{p.plan}</h3>
                <p className="text-white/50 text-sm mb-6">{p.desc}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">
                    ${annual ? (p.monthly * 10) : p.monthly}
                  </span>
                  <span className="text-white/50">/{annual ? 'yr' : 'mo'}</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {p.feats.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-white/80">
                      <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all ${p.pop ? 'glow-btn' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                  {p.pop ? 'Start Free Trial' : 'Get Started'}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 md:mt-28">
            <RoiCalculator />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
