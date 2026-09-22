"use client";

import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import ParticlesBackground from "@/components/marketing/ParticlesBackground";
import { Reveal } from "@/components/ui/Reveal";
import { Mic, CreditCard, Store, Link as LinkIcon, ShieldCheck, BarChart3 } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-24">
            <p className="section-eyebrow mb-4">Platform</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-white">
              The <span className="text-gradient-premium">engine</span> beneath.
            </h1>
            <p className="text-xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
              TalkByte is not a chatbot with a phone number. It is a voice infrastructure layer — speech, reasoning, payments and system sync — built to hold up under real call volume.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic />,
                title: "Voices that sound local",
                desc: "ElevenLabs voices with regional acoustic tuning. Warm, natural delivery your callers recognise — no robotic menus, no synthetic edges."
              },
              {
                icon: <CreditCard />,
                title: "Payments inside the call",
                desc: "Card payments through Stripe or Square by secure SMS link. Tokenised, PCI-aware handling — no raw card number ever crosses the phone line."
              },
              {
                icon: <Store />,
                title: "Real-time system sync",
                desc: "Every request posts to your calendar, CRM, POS or dispatch board in about two seconds. No re-keying, no transcription drift."
              },
              {
                icon: <LinkIcon />,
                title: "Graceful human handoff",
                desc: "When a caller needs something outside the brief, the call transfers to your team with the full live transcript attached."
              },
              {
                icon: <ShieldCheck />,
                title: "Accessible by design",
                desc: "Voice remains the most inclusive channel there is. TalkByte answers it instantly for people who will never download an app."
              },
              {
                icon: <BarChart3 />,
                title: "Live telemetry",
                desc: "Call volume, containment, intent mix, conversion and abandonment — visible from day one, exportable any time."
              }
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="glass-panel p-8 rounded-3xl hover:border-[var(--gold)]/40 transition-colors group h-full">
                  <div className="w-14 h-14 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-white/60 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
