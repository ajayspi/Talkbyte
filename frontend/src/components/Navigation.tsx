"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#050505]/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-light)] flex items-center justify-center text-black font-black text-sm group-hover:scale-105 transition-transform">
            TB
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TalkByte <span className="text-[var(--gold)]">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#use-cases" className="text-white/70 hover:text-white transition-colors">Use Cases</Link>
          <Link href="#demo" className="text-white/70 hover:text-white transition-colors">Live Demo</Link>
          <Link href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</Link>
          <Link href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <a href="http://talkbyte.172.236.176.251.nip.io/dashboard" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            Login
          </a>
          <Link href="#pricing" className="px-5 py-2.5 rounded-full glow-btn text-sm font-bold uppercase tracking-wide">
            Start Free
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
