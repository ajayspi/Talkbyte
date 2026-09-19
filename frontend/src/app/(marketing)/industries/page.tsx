"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/app/(marketing)/Footer";

export default function IndustriesPage() {
  const industries = [
    {
      title: "Hospitality & Fine Dining",
      tagline: "The reservation line that never sleeps.",
      desc: "Guests book, amend, or cancel tables at 10 PM on a Sunday—and your management team walks into a clean, perfectly updated booking sheet on Monday morning. The AI effortlessly handles FAQs about parking, dress codes, and dietary restrictions, freeing up your front-of-house staff to actually serve the guests in front of them.",
      img: "🍷"
    },
    {
      title: "Retail & Call Centers",
      tagline: "Phone support without the hold music.",
      desc: "Click-and-collect queries, stock checks, and simple phone orders are handled instantly on the spot. By automatically triaging routine questions, TalkByte deflects 60% of your call volume, allowing your human support agents to focus on high-value, complex customer service issues.",
      img: "🛍️"
    },
    {
      title: "Food & Beverage (Takeaway)",
      tagline: "Delivery and pickup, fully automated.",
      desc: "Peak-hour order spikes (e.g., Friday night rushes) overflow to the AI voice agent instead of dropping or putting frustrated customers on hold. Your average order value holds steady because the AI is trained to upsell consistently on every single call without rushing.",
      img: "🍕"
    },
    {
      title: "Franchise Networks",
      tagline: "Absolute brand consistency at scale.",
      desc: "Maintain a perfect, unified brand voice across hundreds of franchise locations. Roll out global menu updates instantly, standardize upselling scripts, and utilize centralized telemetry to see exactly which locations are missing calls before TalkByte catches them.",
      img: "🏢"
    }
  ];

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
              Built for <span className="text-gradient-premium">Scale.</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
              We engineer custom voice architectures tailored to the specific operational workflows of your industry.
            </p>
          </motion.div>

          <div className="space-y-12">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`glass-panel p-8 md:p-12 rounded-3xl flex flex-col ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
              >
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{ind.title}</h2>
                  <h3 className="text-lg text-[var(--gold)] font-medium mb-6">{ind.tagline}</h3>
                  <p className="text-white/70 leading-relaxed text-lg">{ind.desc}</p>
                </div>
                <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-black/50 border border-[var(--gold)]/10 flex items-center justify-center text-8xl shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                  {ind.img}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
