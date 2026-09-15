import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto w-full flex-grow text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-white/70 mb-16 max-w-2xl mx-auto">
            Stop losing revenue to missed calls. Pay a flat fee per month, or go fully performance-based.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <div className="text-4xl font-bold text-teal-400 mb-6">$99<span className="text-lg text-white/40">/mo</span></div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>o" Up to 500 orders/mo</li>
                <li>o" Standard AI Voices</li>
                <li>o" SMS Payment Links</li>
                <li>o" Email Support</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all">Get Started</button>
            </div>
            
            <div className="bg-[#1a1030]/90 backdrop-blur-md border border-purple-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(157,113,248,0.2),8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)] transform scale-105 relative z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-teal-400 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-purple-400 mb-6">$249<span className="text-lg text-white/40">/mo</span></div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>o" Unlimited orders</li>
                <li>o" Premium Voice Clones</li>
                <li>o" Direct POS Injection</li>
                <li>o" Priority Phone Support</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold shadow-[0_0_20px_rgba(157,113,248,0.4)] hover:scale-105 transition-all">Start Free Trial</button>
            </div>
            
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-white mb-6">Custom</div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>o" Multi-location routing</li>
                <li>o" Custom AI Personalities</li>
                <li>o" API Access</li>
                <li>o" Dedicated Account Manager</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all">Contact Sales</button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
