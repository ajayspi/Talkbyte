import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto w-full flex-grow bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
          <h1 className="text-3xl font-bold mb-6 text-white">Terms of Service</h1>
          <div className="prose prose-invert max-w-none text-white/70 space-y-4">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By using the TalkByte AI service, you agree to these Terms of Service. If you do not agree to these terms, please do not use the service.</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Service Description</h2>
            <p>TalkByte AI provides conversational voice AI agents for restaurants to automate phone orders. We integrate with existing POS systems and payment gateways.</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Limitation of Liability</h2>
            <p>TalkByte AI is not responsible for lost revenue due to AI misinterpretation, telecommunication outages, or POS downtime. We strive for 99.9% accuracy but rely on third-party infrastructure.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
