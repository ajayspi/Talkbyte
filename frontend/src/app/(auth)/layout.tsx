import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-bg opacity-30 mix-blend-screen z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--gold)]/10 blur-[120px] z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent-violet)]/10 blur-[120px] z-0" />

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 group relative z-10 mb-8">
        <Logo size={40} />
        <span className="text-2xl font-black tracking-tight text-white uppercase">
          TalkByte <span className="text-gradient-gold">OS</span>
        </span>
      </Link>

      {/* Auth Container */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 rounded-3xl border border-[var(--gold)]/20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />
           {children}
        </div>
      </div>

      <p className="mt-8 text-xs text-white/30 relative z-10">© 2026 TalkByte AI. All rights reserved.</p>
    </div>
  );
}
