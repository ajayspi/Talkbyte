"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/app/(marketing)/Footer";
import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      plan: "Starter",
      price: "99",
      desc: "Perfect for single-location takeaway shops.",
      feats: ["Up to 500 AI minutes/mo", "Square POS sync", "SMS confirmations", "Restaurant dashboard"],
      pop: false
    },
    {
      plan: "Growth",
      price: "199",
      desc: "For busy venues doing high volume.",
      feats: ["Up to 1,500 AI minutes/mo", "Up to 3 locations", "Stripe phone payments", "Advanced analytics"],
      pop: true
    },
    {
      plan: "Pro",
      price: "349",
      desc: "For growing franchises and hospitality groups.",
      feats: ["Unlimited AI minutes", "Unlimited locations", "Custom voice cloning", "Priority 24/7 Support"],
      pop: false
    }
  ];

  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              Honest <span className="text-gradient-premium">Pricing.</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
              Stop paying 30% to delivery apps just to take a phone order. Pay a fair, flat monthly rate and scale your margins.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-panel p-8 rounded-3xl relative flex flex-col transition-all duration-300 ${p.pop ? 'gold-glow scale-105 z-10 border-[var(--gold)]/40' : 'hover:border-[var(--gold)]/20'}`}
              >
                {p.pop && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-[var(--gold)] text-black text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.4)]">Most Popular</div>}
                <h3 className="text-xl font-bold mb-2 text-white">{p.plan}</h3>
                <p className="text-white/50 text-sm mb-6">{p.desc}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">${p.price}</span>
                  <span className="text-white/50">/mo</span>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
