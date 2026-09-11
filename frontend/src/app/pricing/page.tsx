import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--surface-dark)] overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40"></div>
      <ParticlesBackground />
      <Navbar />

      <main className="relative z-10 section-spacing flex flex-col pt-32 pb-24">
        <div className="max-w-6xl mx-auto w-full flex-grow text-center">
          <h2 className="text-xs font-mono text-[var(--gold-core)] tracking-[0.2em] uppercase mb-4">Enterprise Licensing</h2>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Scale your <span className="gold-gradient-text">Voice Operations</span>
          </h1>
          <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade infrastructure priced for massive ROI. Deploy AI agents that take hundreds of orders, perfectly, without ever taking a break.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="glass-panel rounded-3xl p-10 hover:border-slate-600 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Growth</h3>
              <p className="text-sm text-slate-400 mb-6">For high-volume single locations.</p>
              <div className="text-4xl font-mono font-bold text-white mb-8">$500<span className="text-lg text-slate-500 font-sans">/mo</span></div>
              <ul className="space-y-4 text-slate-300 mb-10 flex-1">
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> 2,000 orders/mo</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Premium Sub-400ms Voice</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Square POS Direct Sync</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Standard Email Support</li>
              </ul>
              <button className="btn-ghost w-full">Deploy Growth</button>
            </div>
            
            <div className="glass-panel rounded-3xl p-10 gold-border-glow shadow-[0_0_40px_var(--gold-glow)] transform md:-translate-y-4 relative z-10 bg-[rgba(212,175,55,0.02)] flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#BF953F] to-[#FCF6BA] text-black text-xs font-extrabold tracking-widest uppercase px-4 py-1.5 rounded-full">Most Deployed</div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Professional</h3>
              <p className="text-sm text-slate-400 mb-6">For multi-location restaurant groups.</p>
              <div className="text-4xl font-mono font-bold text-[var(--gold-core)] mb-8">$1,500<span className="text-lg text-slate-500 font-sans">/mo</span></div>
              <ul className="space-y-4 text-slate-300 mb-10 flex-1">
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> 10,000 orders/mo</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Multi-Venue Dashboard</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> All POS Integrations</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Priority 24/7 Slack Support</li>
              </ul>
              <button className="btn-premium w-full">Deploy Professional</button>
            </div>
            
            <div className="glass-panel rounded-3xl p-10 hover:border-slate-600 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Enterprise</h3>
              <p className="text-sm text-slate-400 mb-6">For national hospitality chains.</p>
              <div className="text-4xl font-mono font-bold text-white mb-8">$5,000<span className="text-lg text-slate-500 font-sans">/mo</span></div>
              <ul className="space-y-4 text-slate-300 mb-10 flex-1">
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Unlimited routing</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Custom Voice Fine-Tuning</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Dedicated API & Webhooks</li>
                <li className="flex items-center gap-3"><span className="text-[var(--gold-core)]">✦</span> Dedicated Success Manager</li>
              </ul>
              <button className="btn-ghost w-full">Contact Sales</button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
