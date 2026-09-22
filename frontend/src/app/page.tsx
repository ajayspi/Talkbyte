"use client";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, PhoneCall, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import HeroVisual from "@/components/landing/GoldGlobe";
import AnimatedGraph from "@/components/landing/AnimatedGraph";
import NodeNetwork from "@/components/landing/NodeNetwork";
import { IndustryTicker, MetricsStrip } from "@/components/landing/HeroPanels";
import ScenarioTabs from "@/components/landing/ScenarioTabs";
import ComparisonTable from "@/components/landing/ComparisonTable";
import LiveCallDemo from "@/components/landing/LiveCallDemo";
import { GlobalSignals, IndustryGrid, OperatingModel, GuardrailList, Testimonials } from "@/components/landing/HomepageSections";
if (typeof window !== "undefined") { gsap.registerPlugin(ScrollTrigger); }
export default function Home() {
const container = useRef<HTMLDivElement>(null);
useGSAP(() => {
const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
tl.from(".hero-badge", { y: 28, opacity: 0, duration: 0.7 });
tl.from(".hero-title .line", { y: 64, opacity: 0, duration: 1, stagger: 0.12, ease: "power4.out" }, "-=0.35");
tl.from(".hero-desc", { y: 22, opacity: 0, duration: 0.7 }, "-=0.55");
tl.from(".hero-btns .btn", { y: 18, opacity: 0, duration: 0.55, stagger: 0.08 }, "-=0.45");
tl.from(".hero-proof", { y: 16, opacity: 0, duration: 0.55, stagger: 0.07 }, "-=0.35");
tl.from(".hero-visual", { y: 34, opacity: 0, scale: 0.97, duration: 1.1, ease: "expo.out" }, "-=0.9");
gsap.utils.toArray<HTMLElement>(".gsap-rise").forEach((el) => {
gsap.from(el, { scrollTrigger: { trigger: el, start: "top 86%" }, y: 36, opacity: 0, duration: 0.8, ease: "power3.out" });
});
gsap.to(".bg-glow-1", { yPercent: 34, ease: "none", scrollTrigger: { trigger: container.current, start: "top top", end: "bottom top", scrub: true } });
gsap.to(".bg-glow-2", { yPercent: -24, ease: "none", scrollTrigger: { trigger: container.current, start: "top top", end: "bottom top", scrub: true } });
}, { scope: container });
return (
<div ref={container} className="relative min-h-screen overflow-hidden bg-[#070605] font-sans text-[#f5efe2]">
<Navbar />
<div className="bg-glow-1 pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,164,65,0.22),transparent_65%)] blur-3xl" aria-hidden />
<div className="bg-glow-2 pointer-events-none absolute right-[-180px] top-[38%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(224,101,58,0.14),transparent_65%)] blur-3xl" aria-hidden />
<div className="grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
<main className="relative z-10">
<section className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-32 md:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
<div>
<p className="hero-badge inline-flex items-center gap-2 rounded-full border border-[rgba(217,164,65,0.4)] bg-[rgba(217,164,65,0.08)] px-4 py-2 font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-[#f7dfa0]">
<Sparkles size={13} /> Global voice infrastructure
</p>
<h1 className="hero-title font-display mt-6 text-5xl leading-[0.98] md:text-7xl">
<span className="line block">Every call answered.</span>
<span className="line block text-gradient-gold">Every booking captured.</span>
<span className="line block text-white/90">Every caller understood.</span>
</h1>
<p className="hero-desc mt-6 max-w-xl text-lg leading-relaxed text-white/65">
TalkByte is the voice AI layer for ambitious businesses of every kind: a multilingual AI receptionist that answers in 0.8 seconds, sells like your best person, collects payment before hang-up, and posts straight to your calendar, POS or CRM.
</p>
<div className="hero-btns mt-8 flex flex-wrap gap-4">
<Link href="/contact" className="btn glow-btn inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.14em]"><PhoneCall size={16} /> Deploy TalkByte</Link>
<Link href="/how-it-works" className="btn ghost-btn inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white"><PlayCircle size={16} /> Watch it work</Link>
</div>
<div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
<span className="hero-proof inline-flex items-center gap-2 text-sm text-white/65"><BadgeCheck size={15} className="text-[#f7dfa0]" /> No hardware, live in 48 hours</span>
<span className="hero-proof inline-flex items-center gap-2 text-sm text-white/65"><ShieldCheck size={15} className="text-[#f7dfa0]" /> PCI-DSS payments, SOC 2 controls</span>
<span className="hero-proof inline-flex items-center gap-2 text-sm text-white/65"><ArrowRight size={15} className="text-[#f7dfa0]" /> Square, Stripe, calendars & CRMs</span>
</div>
<div className="mt-10"><MetricsStrip /></div>
</div>
<div className="hero-visual"><HeroVisual /></div>
</section>
<section className="mx-auto max-w-7xl px-6 pb-6"><IndustryTicker /></section>
<section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
<div className="gsap-rise mb-10">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Operating model</p>
<h2 className="font-display mt-3 max-w-2xl text-4xl leading-tight md:text-5xl">From ring to revenue in four automated moves.</h2>
<p className="mt-3 max-w-xl text-white/60">Not a phone bot. A revenue system with telephony, payments, POS, staffing, and compliance wired into one accountable flow.</p>
</div>
<OperatingModel />
</section>
<section className="mx-auto max-w-7xl px-6 py-10 md:py-16">
<div className="gsap-rise mb-8 max-w-3xl">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Hear it work</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Three industries, three conversations, no script to believe.</h2>
<p className="mt-3 text-white/60">Press play. Every line is what a caller actually says — and what your business gets back.</p>
</div>
<div className="gsap-rise"><LiveCallDemo /></div>
</section>
<section className="mx-auto max-w-7xl px-6 py-6 md:py-10">
<div className="gsap-rise mb-8">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Reality, not promises</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Nights your team will recognize.</h2>
<p className="mt-3 max-w-3xl text-white/60">Each scenario is modeled from real TalkByte service data.</p>
</div>
<ScenarioTabs />
</section>
<section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
<div className="gsap-rise mb-8">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Old phone vs TalkByte</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">An unfair comparison, shown fairly.</h2>
</div>
<ComparisonTable />
</section>
<section className="border-y border-white/10 bg-black/30">
<div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
<div className="gsap-rise">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Revenue intelligence</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Peak hours stop leaking the moment TalkByte goes live.</h2>
<p className="mt-4 max-w-lg leading-relaxed text-white/60">Red is abandoned demand; gold is demand TalkByte captures and posts automatically.</p>
</div>
<div className="gsap-rise"><AnimatedGraph /></div>
</div>
</section>
<section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
<div className="gsap-rise mb-10 text-center">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">One platform, every format</p>
<h2 className="font-display mx-auto mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">Industries are sub-pages. Each one is a deployment plan.</h2>
</div>
<IndustryGrid />
</section>
<section className="mx-auto max-w-7xl px-6 pb-16 md:pb-24">
<div className="glass-panel grid gap-10 overflow-hidden rounded-[28px] p-8 md:grid-cols-[1fr_1.1fr] md:p-12">
<div className="gsap-rise">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Under the hood</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Calls, payments, POS, and staff — one nervous system.</h2>
<Link href="/how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#f7dfa0]">Explore the architecture <ArrowRight size={16} /></Link>
</div>
<div className="gsap-rise"><NodeNetwork /></div>
<div className="gsap-rise md:col-span-2"><GuardrailList /></div>
</div>
</section>
<section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
<div className="gsap-rise mb-10 max-w-3xl">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Real impact</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">The numbers customers put on the record.</h2>
</div>
<Testimonials />
</section>
<section className="mx-auto max-w-7xl px-6 pb-16 md:pb-24">
<div className="gsap-rise mb-8">
<p className="font-mono-grotesk text-xs uppercase tracking-[0.28em] text-[#f7dfa0]">Global operations</p>
<h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Always on. Every timezone.</h2>
</div>
<GlobalSignals />
<div className="mt-12 overflow-hidden rounded-[28px] border border-[rgba(217,164,65,0.28)] bg-gradient-to-br from-[rgba(217,164,65,0.14)] via-black to-black p-8 text-center md:p-12">
<h3 className="font-display mx-auto max-w-3xl text-3xl leading-tight md:text-5xl">Your busiest night is about to become your best-reviewed one.</h3>
<div className="mt-8 flex flex-wrap justify-center gap-4">
<Link href="/contact" className="glow-btn rounded-full px-9 py-4 text-sm font-black uppercase tracking-[0.14em]">Start the pilot</Link>
<Link href="/pricing" className="ghost-btn rounded-full px-9 py-4 text-sm font-black uppercase tracking-[0.14em] text-white">See pricing</Link>
</div>
</div>
</section>
</main>
<Footer />
</div>
);
}

