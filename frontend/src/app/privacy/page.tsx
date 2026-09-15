import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto w-full flex-grow bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
          <h1 className="text-3xl font-bold mb-6 text-white">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none text-white/70 space-y-4">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>At TalkByte AI, we collect minimal personal information necessary to provide our voice AI ordering service to restaurants and their customers. This includes phone numbers of callers, basic order preferences, and SMS payment statuses.</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Information</h2>
            <p>We use the collected information solely for processing restaurant orders, facilitating payments via SMS links, and improving the accuracy of our conversational AI models.</p>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Security</h2>
            <p>We implement industry-standard encryption and security measures to protect both restaurant and customer data. We do not sell any personal information to third parties.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
