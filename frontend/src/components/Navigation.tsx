"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        scrolled ? "bg-[#050505]/80 backdrop-blur-md border-b border-[var(--gold)]/10 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center text-black font-black text-sm group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            TB
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            TalkByte <span className="text-[var(--gold)]">AI</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/features" className="text-white/70 hover:text-[var(--gold)] transition-colors">Platform Features</Link>
          <Link href="/industries" className="text-white/70 hover:text-[var(--gold)] transition-colors">Industries</Link>
          <Link href="/pricing" className="text-white/70 hover:text-[var(--gold)] transition-colors">Pricing</Link>
          <Link href="/faq" className="text-white/70 hover:text-[var(--gold)] transition-colors">FAQ</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Operator Login
          </Link>
          <Link href="/signup" className="px-5 py-2.5 rounded-full glow-btn text-sm font-bold uppercase tracking-wide">
            Start Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#050505] border-b border-[var(--gold)]/10 p-6 flex flex-col gap-4">
          <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium">Platform Features</Link>
          <Link href="/industries" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium">Industries</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium">Pricing</Link>
          <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium">FAQ</Link>
          <div className="h-px bg-white/10 w-full my-2"></div>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium">Operator Login</Link>
          <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="glow-btn text-center py-3 rounded-xl font-bold uppercase">Start Free</Link>
        </div>
      )}
    </motion.nav>
  );
}
