"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/app/(marketing)/Footer";
import { Mic, CreditCard, Store, Link as LinkIcon, ShieldCheck, BarChart3 } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navigation />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-24"
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              The <span className="text-gradient-premium">Engine</span> beneath.
            </h1>
            <p className="text-xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
              TalkByte is not a simple chatbot. It is a highly robust, multi-layered voice commerce architecture designed specifically to handle high-throughput hospitality environments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic />,
                title: "Natural Australian Voices",
                desc: "Powered by ElevenLabs and specialized acoustic models, our agents speak with warm, locally-accented voices. Regulars feel comfortable talking to the AI—no robotic menu trees, no jarring synthetic tones."
              },
              {
                icon: <CreditCard />,
                title: "Secure Phone Payments",
                desc: "TalkByte processes card payments through Stripe via secure SMS links sent during the call. Tokenised, PCI-aware handling ensures no raw card numbers are ever exposed over the phone."
              },
              {
                icon: <Store />,
                title: "Real-Time POS Sync",
                desc: "Orders land straight into your Point of Sale (Square, Lightspeed) or kitchen display system instantly. No re-keying, no double-handling, zero margin for transcription errors."
              },
              {
                icon: <LinkIcon />,
                title: "Smart Call Routing",
                desc: "If a caller asks a complex question outside the menu (e.g., 'Are you hiring?'), the AI seamlessly hands off the call to a human manager, attaching the full live transcript for context."
              },
              {
                icon: <ShieldCheck />,
                title: "Accessible By Design",
                desc: "A true lifeline for customers who cannot or will not use mobile delivery apps. Voice remains the most inclusive and fastest ordering channel, and TalkByte ensures it is answered instantly."
              },
              {
                icon: <BarChart3 />,
                title: "Live Telemetry & Analytics",
                desc: "Your dashboard provides day-one visibility into call volumes, order containment rates, average order values, and peak hour abandonment analysis."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-3xl hover:border-[var(--gold)]/40 transition-colors group"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
