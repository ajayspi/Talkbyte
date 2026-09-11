import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen bg-[var(--surface-dark)] overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40"></div>
      <ParticlesBackground />
      <Navbar />

      <main className="relative z-10 section-spacing flex flex-col pt-32 pb-24">
        <div className="max-w-5xl mx-auto w-full flex-grow">
          <div className="text-center mb-16">
            <h2 className="text-xs font-mono text-[var(--gold-core)] tracking-[0.2em] uppercase mb-4">Platform Workflow</h2>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
              From <span className="gold-gradient-text">Ring</span> to <span className="gold-gradient-text">Receipt</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Our AI operates with sub-400ms latency to seamlessly answer your phone, take complex orders, and sync directly with your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--gold-border)] to-transparent hidden md:block"></div>

            <div className="glass-panel rounded-3xl p-10 hover:border-[var(--gold-border)] transition-all group">
              <div className="text-4xl font-mono font-bold text-[var(--gold-core)]/30 group-hover:text-[var(--gold-core)] transition-colors mb-4">01</div>
              <h3 className="text-2xl font-bold text-white mb-4">The Phone Rings</h3>
              <p className="text-slate-400 leading-relaxed">Instead of a stressed staff member trying to hear over a busy kitchen, TalkByte picks up instantly with a friendly, natural greeting uniquely configured for your restaurant's brand.</p>
            </div>

            <div className="glass-panel rounded-3xl p-10 md:mt-16 gold-border-glow hover:shadow-[0_0_30px_var(--gold-glow)] transition-all bg-[rgba(212,175,55,0.02)] group">
              <div className="text-4xl font-mono font-bold text-[var(--gold-core)]/30 group-hover:text-[var(--gold-core)] transition-colors mb-4">02</div>
              <h3 className="text-2xl font-bold text-white mb-4">Taking the Order</h3>
              <p className="text-slate-400 leading-relaxed">Using Deepgram STT and GPT-4.1, TalkByte handles complex dietary modifications, naturally up-sells drinks or sides, and understands thick accents with 99.4% accuracy.</p>
            </div>

            <div className="glass-panel rounded-3xl p-10 hover:border-[var(--gold-border)] transition-all group">
              <div className="text-4xl font-mono font-bold text-[var(--gold-core)]/30 group-hover:text-[var(--gold-core)] transition-colors mb-4">03</div>
              <h3 className="text-2xl font-bold text-white mb-4">Payment & SMS</h3>
              <p className="text-slate-400 leading-relaxed">Once the order is confirmed verbally, the caller immediately receives a secure Stripe payment link via SMS while still on the phone, seamlessly concluding the transaction securely.</p>
            </div>

            <div className="glass-panel rounded-3xl p-10 md:mt-16 hover:border-[var(--gold-border)] transition-all group">
              <div className="text-4xl font-mono font-bold text-[var(--gold-core)]/30 group-hover:text-[var(--gold-core)] transition-colors mb-4">04</div>
              <h3 className="text-2xl font-bold text-white mb-4">POS Injection</h3>
              <p className="text-slate-400 leading-relaxed">The second the payment clears, the order is instantly injected into your POS system (like Square or Lightspeed) and prints straight to the kitchen. Zero manual entry.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
