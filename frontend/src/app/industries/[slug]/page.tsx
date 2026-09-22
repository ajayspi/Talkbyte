import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import IndustryDetail from '@/components/landing/IndustryDetail';
import { INDUSTRIES } from '@/content/homepage';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = INDUSTRIES.find((item) => item.slug === slug);
  return {
    title: industry ? `${industry.name} — TalkByte AI` : 'Industry — TalkByte AI',
    description: industry?.detail ?? 'TalkByte industry deployment plan.',
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = INDUSTRIES.find((item) => item.slug === slug);
  if (!industry) notFound();
  return (
    <div className="min-h-screen bg-[#070605] text-[#f5efe2]">
      <Navbar />
      <IndustryDetail slug={slug} />
      <Footer />
    </div>
  );
}

export function generateStaticParams() {
  return INDUSTRIES.map((industry) => ({ slug: industry.slug }));
}
