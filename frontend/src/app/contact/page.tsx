import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <ParticlesBackground />
      <main className="relative z-10 min-h-screen flex flex-col pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto w-full flex-grow">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400 text-center">
            Get in Touch
          </h1>
          <p className="text-lg text-white/70 mb-12 text-center">
            Ready to upgrade your restaurant's phone operations? Drop us a line.
          </p>
          
          <div className="bg-[#1a1030]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-[8px_8px_20px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.06)]">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">First Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Last Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Restaurant Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"></textarea>
              </div>
              <button type="button" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold shadow-[0_0_20px_rgba(157,113,248,0.4)] hover:opacity-90 transition-opacity">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
