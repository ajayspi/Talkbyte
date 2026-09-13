import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
             </svg>
           </div>
           TalkByte AI
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-[#111111] p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
