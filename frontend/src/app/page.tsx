"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Phone, Globe2, UtensilsCrossed, Store, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black">
      <Navigation />

      {/* Background Effects */}
      <div className="fixed inset-0 z-[-1] bg-[#050505]">
        <div className="absolute inset-0 grid-bg opacity-30 mix-blend-screen" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--gold)]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--violet)]/10 blur-[120px]" />
      </div>

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-8 relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
                <span className="text-[var(--gold)] text-xs font-bold tracking-widest uppercase">The Voice Commerce OS</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                Every missed call is <br />
                <span className="text-gradient-gold">lost revenue.</span>
              </h1>

              <p className="text-lg text-white/70 max-w-xl leading-relaxed">
                TalkByte AI answers every call instantly, takes orders with human-parity accuracy, sends SMS payment links, and syncs directly into your POS. Never put a customer on hold again.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="#demo" className="glow-btn px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <Phone size={18} /> Hear it in action
                </Link>
                <Link href="#use-cases" className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-colors font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-white">
                  See Use Cases <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>

            {/* Glowing Globe / 3D Element Abstract Representation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative aspect-square flex items-center justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[500px] aspect-square rounded-full border border-[var(--gold)]/20 animate-[spin_60s_linear_infinite] flex items-center justify-center">
                <div className="absolute inset-4 rounded-full border border-[var(--gold)]/30 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-12 rounded-full border border-[var(--violet)]/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold)_0%,transparent_50%)] opacity-20 blur-3xl mix-blend-screen" />
                <Globe2 size={120} className="text-[var(--gold)]/50 absolute" />
              </div>

              {/* Floating Stat Card */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 left-0 glass-card p-4 rounded-2xl flex items-center gap-4 shadow-2xl shadow-[var(--gold)]/10"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="text-emerald-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-white/50 font-medium">Ring to POS</div>
                  <div className="text-2xl font-black text-white">487<span className="text-sm font-medium text-[var(--gold)]">ms</span></div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* INTERACTIVE DEMO */}
        <section id="demo" className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">The exact sound of <span className="text-gradient-gold">efficiency.</span></h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">Our AI is trained on thousands of Australian hospitality calls. It handles thick accents, complex modifications, and payment friction automatically.</p>
            </div>

            <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8 border border-[var(--gold)]/20 shadow-[0_0_50px_rgba(212,175,55,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[var(--violet)]/20 flex items-center justify-center text-[var(--violet)] font-bold text-xl">
                      TB
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050505]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">TalkByte Agent</h3>
                    <p className="text-xs text-white/50 font-mono tracking-widest uppercase">Live Transcript</p>
                  </div>
                </div>
                <div className="text-emerald-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  01:24
                </div>
              </div>

              <div className="space-y-6 font-medium text-[15px]">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--violet)]/20 shrink-0 flex items-center justify-center text-xs">AI</div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-white/90">
                    Hi! Thanks for calling Mama\Mama'sapos;s Pizzeria. Would you like to place an order for pickup or delivery?
                  </div>
                </div>
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-[var(--gold)]/20 shrink-0 flex items-center justify-center text-xs">You</div>
                  <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-2xl rounded-tr-none p-4 text-white">
                    Yeah, pickup please. Can I get a large Margherita but add olives? And a garlic bread.
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--violet)]/20 shrink-0 flex items-center justify-center text-xs">AI</div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 text-white/90">
                    One large Margherita with olives, and one garlic bread. That comes to $32.50. I\I'veapos;ve just sent a payment link to your phone. We'll have that ready in 15 minutes!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It <span className="text-gradient-gold">Works.</span></h2>
              <p className="text-white/60 text-lg">From ring to receipt in under 487ms.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 text-center relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] opacity-30 -translate-y-1/2 -z-10"></div>
              {[
                { step: "1", title: "Phone Rings", desc: "Customer calls your Telnyx number." },
                { step: "2", title: "AI Answers", desc: "LiveKit agent picks up instantly." },
                { step: "3", title: "Order Taken", desc: "GPT-4.1 processes the natural conversation." },
                { step: "4", title: "POS Synced", desc: "Payment link sent, order fires to Square." }
              ].map((hw, i) => (
                <div key={i} className="glass-card p-6 rounded-3xl relative hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[var(--gold)] text-black font-bold flex items-center justify-center mb-4 text-xl border-4 border-[#050505] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                    {hw.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{hw.title}</h3>
                  <p className="text-sm text-white/60">{hw.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES / VERTICALS */}
        <section id="use-cases" className="py-32 bg-black/40 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for every <span className="text-gradient-gold">vertical.</span></h2>
              <p className="text-white/60 text-lg">Whether you run a fast-paced takeaway or a high-end franchise, we adapt to your flow.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <UtensilsCrossed size={32} />,
                  title: "QSR & Takeaway",
                  desc: "Handle the Friday night rush. Answer 50 simultaneous calls, instantly process payments, and inject orders directly into the kitchen display system.",
                  features: ["Infinite Concurrency", "Zero Hold Times", "Automatic Upselling"]
                },
                {
                  icon: <Globe2 size={32} />,
                  title: "Fine Dining",
                  desc: "Provide a premium concierge experience. The AI handles FAQs about parking, dress codes, and reservations, freeing up your front-of-house staff.",
                  features: ["Natural Conversational Tone", "FAQ Handling", "Staff Liberation"]
                },
                {
                  icon: <Store size={32} />,
                  title: "Franchise Networks",
                  desc: "Maintain perfect brand consistency across hundreds of locations. Roll out menu updates instantly worldwide and analyze sentiment centrally.",
                  features: ["Global Menu Sync", "Centralized Analytics", "Brand Consistency"]
                }
              ].map((uc, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl hover:border-[var(--gold)]/30 transition-colors group">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-[var(--gold)] mb-6 group-hover:scale-110 transition-transform">
                    {uc.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{uc.title}</h3>
                  <p className="text-white/60 leading-relaxed mb-8">{uc.desc}</p>
                  <ul className="space-y-3">
                    {uc.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-white/80">
                        <CheckCircle2 size={16} className="text-[var(--gold)]" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, honest <span className="text-gradient-gold">pricing.</span></h2>
              <p className="text-white/60 text-lg max-w-xl mx-auto">Stop paying 30% to delivery apps for phone orders. Pay a flat rate for unlimited intelligence.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { plan: "Starter", price: "149", desc: "For single-location independents.", feats: ["Unlimited AI calls", "Square POS sync", "SMS confirmations", "Restaurant dashboard"], pop: false },
                { plan: "Growth", price: "199", desc: "For busy venues doing high volume.", feats: ["Everything in Starter", "Up to 3 locations", "Stripe phone payments", "Advanced analytics"], pop: true },
                { plan: "Enterprise", price: "299", desc: "For franchises and hospitality groups.", feats: ["Everything in Growth", "Unlimited locations", "Custom voice cloning", "Dedicated Account Manager"], pop: false }
              ].map((p, i) => (
                <div key={i} className={`glass-card p-8 rounded-3xl relative flex flex-col ${p.pop ? 'border-[var(--gold)]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] scale-105 z-10' : ''}`}>
                  {p.pop && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--gold)] text-black text-xs font-bold uppercase tracking-wider">Most Popular</div>}
                  <h3 className="text-xl font-bold mb-2">{p.plan}</h3>
                  <p className="text-white/50 text-sm mb-6">{p.desc}</p>
                  <div className="mb-8">
                    <span className="text-5xl font-black">${p.price}</span>
                    <span className="text-white/50">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {p.feats.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 size={18} className="text-[var(--gold)] shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all ${p.pop ? 'glow-btn' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                    {p.pop ? 'Start Free Trial' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#020202] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center text-black font-black text-sm">TB</div>
            <span className="font-bold">TalkByte AI</span>
          </div>
          <div className="text-white/30 text-sm">
            © 2026 TalkByte AI. Built for global hospitality.
          </div>
        </div>
      </footer>
    </div>
  );
}
