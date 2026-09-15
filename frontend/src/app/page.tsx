'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import { PhoneIcon, CheckCircleIcon, ServerIcon } from '@/components/icons';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="relative min-h-screen bg-[var(--bg-pure)] text-white selection:bg-[var(--gold-core)] selection:text-black overflow-x-hidden" ref={containerRef}>
      <div className="fixed inset-0 grid-bg-infinite z-0 opacity-40 pointer-events-none"></div>
      <div className="gold-glow-orb top-[-20%] left-[-10%]"></div>
      <div className="gold-glow-orb bottom-[20%] right-[-10%] opacity-50"></div>

      <Navbar />

      <main className="relative z-10">
        {/* STICKY HERO SECTION */}
        <section className="h-[100vh] w-full flex items-center justify-center relative px-6 sticky top-0 -z-10">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-6xl mx-auto w-full text-center flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-glass)] backdrop-blur-lg mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--gold-core)] shadow-[0_0_10px_var(--gold-core)] animate-pulse"></span>
              <span className="text-xs font-mono text-[var(--gold-primary)] uppercase tracking-[0.2em]">Enterprise WebOps</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-8xl lg:text-[110px] font-black tracking-tighter leading-[0.9] mb-8"
            >
              <span className="text-gradient-white">Accelerate your</span><br />
              <span className="text-gradient-gold">Digital Growth</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="text-lg md:text-xl text-[var(--text-dim)] max-w-2xl mx-auto font-light leading-relaxed mb-12"
            >
              We embed directly as your WebOps team. Design, build, and scale high-performance enterprise platforms that drive pipeline.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="flex flex-wrap justify-center gap-6"
            >
              <Link href="/dashboard" className="px-8 py-4 rounded-full bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-[var(--gold-core)] transition-colors duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_var(--gold-glow)]">
                Deploy System
              </Link>
              <Link href="/how-it-works" className="px-8 py-4 rounded-full border border-[var(--border-subtle)] text-white font-bold text-sm uppercase tracking-wider hover:bg-white/5 transition-colors duration-300">
                View Playbook
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <div className="h-[20vh] w-full"></div> {/* Spacer to let hero scroll out */}

        {/* STACKED FEATURE CARDS */}
        <section className="max-w-6xl mx-auto px-6 py-32 space-y-32">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-32 glass-card p-12 md:p-16 flex flex-col lg:flex-row gap-16 items-center shadow-2xl"
          >
            <div className="flex-1 space-y-8">
              <div className="text-[var(--gold-core)] font-mono text-sm tracking-widest uppercase">01 / Operations</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white">Zero-Disaster Deployments.</h2>
              <p className="text-[var(--text-dim)] text-lg leading-relaxed">
                We handle the infrastructure, the CI/CD pipelines, and the global edge networks. When you click deploy, it works perfectly worldwide in under 300ms.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-4 text-sm font-medium"><CheckCircleIcon size={20} className="text-[var(--gold-core)]" /> Automated E2E Testing</li>
                <li className="flex items-center gap-4 text-sm font-medium"><CheckCircleIcon size={20} className="text-[var(--gold-core)]" /> Multi-Region Failover</li>
                <li className="flex items-center gap-4 text-sm font-medium"><CheckCircleIcon size={20} className="text-[var(--gold-core)]" /> Real-time Analytics Sync</li>
              </ul>
            </div>
            <div className="w-full lg:w-[45%] aspect-square rounded-2xl bg-[#050505] border border-[var(--border-subtle)] relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)]"></div>
               <ServerIcon size={120} className="text-[var(--gold-core)]/80 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-40 glass-card p-12 md:p-16 flex flex-col lg:flex-row-reverse gap-16 items-center shadow-2xl"
          >
            <div className="flex-1 space-y-8">
              <div className="text-[var(--gold-core)] font-mono text-sm tracking-widest uppercase">02 / Intelligence</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white">Voice AI at the Edge.</h2>
              <p className="text-[var(--text-dim)] text-lg leading-relaxed">
                Connect deeply with your customers using our sub-400ms latency voice models. Handles complex negotiations, deep technical support, and instant POS synchronization.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-4 text-sm font-medium"><PhoneIcon size={20} className="text-[var(--gold-core)]" /> Human-parity Speech Generation</li>
                <li className="flex items-center gap-4 text-sm font-medium"><PhoneIcon size={20} className="text-[var(--gold-core)]" /> pgVector RAG Database</li>
                <li className="flex items-center gap-4 text-sm font-medium"><PhoneIcon size={20} className="text-[var(--gold-core)]" /> Automatic Sentiment Triage</li>
              </ul>
            </div>
            <div className="w-full lg:w-[45%] aspect-square rounded-2xl bg-[#050505] border border-[var(--border-subtle)] relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 grid-bg-infinite opacity-50"></div>
               <div className="relative text-[160px] filter drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]">🧠</div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-48 glass-card p-12 md:p-16 flex flex-col lg:flex-row gap-16 items-center shadow-2xl"
          >
            <div className="flex-1 space-y-8">
              <div className="text-[var(--gold-core)] font-mono text-sm tracking-widest uppercase">03 / Analytics</div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white">See the entire pipeline.</h2>
              <p className="text-[var(--text-dim)] text-lg leading-relaxed">
                Stop guessing. Our unified telemetry tracks every call, every dropped session, and every dollar processed directly to your bottom line.
              </p>
            </div>
            <div className="w-full lg:w-[45%] aspect-square rounded-2xl bg-[#050505] border border-[var(--border-subtle)] p-8 relative overflow-hidden">
               {/* Abstract chart graphic */}
               <div className="w-full h-full flex items-end gap-4 justify-between pt-12">
                 {[40, 65, 45, 80, 55, 90, 100].map((h, i) => (
                   <motion.div
                     key={i}
                     initial={{ height: 0 }}
                     whileInView={{ height: `${h}%` }}
                     transition={{ duration: 1, delay: i * 0.1 }}
                     className="w-full rounded-t-sm bg-gradient-to-t from-[var(--gold-core)] to-yellow-200"
                   />
                 ))}
               </div>
            </div>
          </motion.div>
        </section>

        {/* CTA FOOTER TRANSITION */}
        <section className="mt-32 pb-40 px-6 text-center relative z-10 bg-gradient-to-b from-transparent to-[#050505]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-12"
          >
            <motion.h2 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tighter">
              Ready to <span className="text-gradient-gold">dominate?</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-[var(--text-dim)] max-w-2xl mx-auto font-light">
              Join the 200+ enterprise teams relying on our WebOps infrastructure.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/contact" className="inline-block px-12 py-5 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                Start Your Project
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
