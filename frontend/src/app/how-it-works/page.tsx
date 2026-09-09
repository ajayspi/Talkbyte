import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto w-full flex-grow">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">
            How TalkByte Works
          </h1>
          <p className="text-lg text-white/70 mb-12 max-w-2xl">
            Our AI seamlessly answers your phone, takes orders, and syncs directly with your kitchen. It's like having your best staff member on the phones 24/7.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-2xl font-bold text-white mb-4">1. The Phone Rings</h3>
              <p className="text-white/60">Instead of a stressed staff member, TalkByte picks up instantly with a friendly, natural greeting tailored to your restaurant.</p>
            </div>
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-2xl font-bold text-white mb-4">2. Taking the Order</h3>
              <p className="text-white/60">Using advanced conversational AI, TalkByte handles modifications, up-sells naturally, and understands accents perfectly.</p>
            </div>
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-2xl font-bold text-white mb-4">3. Payment & SMS</h3>
              <p className="text-white/60">The caller receives a secure payment link via SMS while on the phone, seamlessly concluding the transaction.</p>
            </div>
            <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
              <h3 className="text-2xl font-bold text-white mb-4">4. POS Integration</h3>
              <p className="text-white/60">The order is instantly injected into your POS system (like Square) and prints in the kitchen. Zero manual entry required.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
