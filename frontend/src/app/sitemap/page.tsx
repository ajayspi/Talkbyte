import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import ParticlesBackground from '@/components/marketing/ParticlesBackground';
import { ProcessFlow } from '@/components/ui/ProcessFlow';
import { Reveal } from '@/components/ui/Reveal';
import { USE_CASES, INDUSTRIES } from '@/content/platform';

export const metadata = { title: 'Sitemap — TalkByte' };

const SECTIONS = [
  {
    heading: 'Platform',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Use cases',
    links: USE_CASES.map((u) => ({ href: '/use-cases', label: u.name })),
  },
  {
    heading: 'Industries',
    links: INDUSTRIES.map((i) => ({ href: `/industries/${i.slug}`, label: i.name })),
  },
  {
    heading: 'Company',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/login', label: 'Operator login' },
      { href: '/signup', label: 'Start free' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/cookies', label: 'Cookie Policy' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="relative selection:bg-[var(--gold)] selection:text-black mesh-bg min-h-screen">
      <Navbar />
      <ParticlesBackground />

      <main className="relative z-10 pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-14">
            <p className="section-eyebrow mb-4">Sitemap</p>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white">
              Every page, <span className="text-gradient-gold">one glance</span>
            </h1>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {SECTIONS.map((section, si) => (
              <Reveal key={section.heading} delay={si * 0.06}>
                <h2 className="section-eyebrow mb-4">{section.heading}</h2>
                <ul className="space-y-2.5">
                  {section.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-sm text-white/55 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-20">
            <div className="glass-panel rounded-3xl px-8 py-10 md:px-14">
              <p className="section-eyebrow text-center mb-8">The 30-second version</p>
              <ProcessFlow
                steps={[
                  { icon: 'phone-call', title: 'They call', sub: 'Any hour, any language' },
                  { icon: 'bot', title: 'TalkByte answers', sub: 'Books, sells, resolves' },
                  { icon: 'phone-forwarded', title: 'Or hands off', sub: 'Transcript attached' },
                  { icon: 'circle-dollar', title: 'Revenue captured', sub: 'Paid before hang-up' },
                ]}
              />
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
