"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/app/(marketing)/Footer";

export default function FAQPage() {
  const faqs = [
    {
      q: "Will customers know they\they'reapos;re talking to an AI?",
      a: "We're upfront by design — the assistant introduces itself naturally and offers a human hand-off at any point. Our data shows that most callers simply care that their task (placing an order or making a booking) gets done fast and accurately, without being put on hold."
    },
    {
      q: "Can it really take payments over the phone?",
      a: "Yes. Card payments are processed through Stripe via secure SMS payment links sent instantly to the caller's mobile device during the call. This ensures tokenised, PCI-compliant handling — no raw card numbers are ever spoken or stored on our platform."
    },
    {
      q: "What happens when it doesn\doesn'tapos;t understand a caller?",
      a: "The AI is designed to gracefully handle friction. It asks a clarifying question first. If the conversation still cannot be resolved (e.g., extremely complex modifications), it seamlessly transfers the call to your human staff with the live transcript and caller details already attached."
    },
    {
      q: "Does it work with our POS or booking system?",
      a: "We currently integrate directly with Square and are rolling out support for major POS, booking, and delivery platforms via custom APIs. If your system has an open interface, our pipeline can usually connect to it to inject orders without double-handling."
    },
    {
      q: "How long does a deployment take?",
      a: "Most TalkByte voice commerce deployments go live within 2 to 4 weeks. This includes ingesting and training the AI on your specific menu items, configuring the payment gateways, and executing a supervised soft-launch before switching to full autonomy."
    }
  ];

  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navigation />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl font-black tracking-tight mb-6">
              Frequently Asked <span className="text-gradient-premium">Questions.</span>
            </h1>
            <p className="text-xl text-white/60 font-light">Everything you need to know about deploying TalkByte.</p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-4">
                  <span className="text-[var(--gold)]">Q.</span> {faq.q}
                </h3>
                <p className="text-white/70 leading-relaxed flex items-start gap-4">
                  <span className="text-[var(--violet)] font-bold">A.</span> {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
