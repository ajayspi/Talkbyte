/**
 * Platform content — generalized, every-business positioning.
 * Use cases mapped from SoundHound's model; industries from SoundHound + Talent Trek.
 */
import {
  Phone, PhoneCall, CalendarClock, Headset, Megaphone, Car,
  HelpCircle, BarChart3, Languages, Bot, type LucideIcon,
} from 'lucide-react';

export type UseCase = {
  slug: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  copy: string;
  chips: string[];
};

export const USE_CASES: UseCase[] = [
  {
    slug: 'voice-commerce',
    icon: Phone,
    name: 'Voice Commerce',
    tagline: 'Talk, pay, done.',
    copy: 'Conversational ordering, bookings and payments over voice — high-volume calls handled without a single hold tone.',
    chips: ['Orders & bookings', 'Payments by SMS', 'Zero hold time'],
  },
  {
    slug: 'front-desk',
    icon: PhoneCall,
    name: 'AI Front Desk',
    tagline: 'Never miss a call again.',
    copy: 'A professional receptionist that answers, qualifies and routes every call, 24/7 — for practices, clinics, trades and agencies.',
    chips: ['Call answering', 'Lead qualification', 'After-hours cover'],
  },
  {
    slug: 'appointment-booking',
    icon: CalendarClock,
    name: 'Appointment Booking',
    tagline: 'Book 24/7. Never double-book.',
    copy: 'Clients book, reschedule and cancel by voice or chat — with smart reminders and two-way calendar sync.',
    chips: ['Calendar sync', 'Smart reminders', 'No-show control'],
  },
  {
    slug: 'contact-center',
    icon: Headset,
    name: 'Contact Center',
    tagline: 'Deflect the routine. Keep the human.',
    copy: 'Resolve routine enquiries end to end and hand off to your team only when it matters — with the full transcript attached.',
    chips: ['Call deflection', 'Human hand-off', 'Live transcripts'],
  },
  {
    slug: 'outbound',
    icon: Megaphone,
    name: 'Outbound Voice',
    tagline: 'Follow up without lifting a finger.',
    copy: 'Reminders, confirmations, renewals and win-backs — outbound calls and SMS that sound like your best person.',
    chips: ['Reminders', 'Confirmations', 'Win-backs'],
  },
  {
    slug: 'drive-thru',
    icon: Car,
    name: 'Drive-Thru AI',
    tagline: 'The lane that sells.',
        copy: 'Menu-adaptive AI ordering for quick-service and drive-thru lanes — faster service, consistent upsells, lower staff load at peak.',
    chips: ['Menu adaptive', 'Upsell always-on', 'Peak throughput'],
  },
  {
    slug: 'employee-assist',
    icon: HelpCircle,
    name: 'Employee Assist',
    tagline: 'Answers for your team, instantly.',
    copy: 'Internal help desk for IT, HR and policy questions — employees ask by voice or chat, tickets route themselves.',
    chips: ['IT help desk', 'HR answers', 'Ticket triage'],
  },
  {
    slug: 'voice-insights',
    icon: BarChart3,
    name: 'Voice Insights',
    tagline: 'Every conversation, measured.',
    copy: 'Transcripts, intent analytics and caller sentiment from every interaction — see what customers actually ask for.',
    chips: ['Transcripts', 'Intent analytics', 'Sentiment'],
  },
  {
    slug: 'multilingual',
    icon: Languages,
    name: 'Multilingual Assistant',
    tagline: 'Speak every language your customers do.',
    copy: 'Voice and chat assistants in 30+ languages and 38 accents — built for diverse communities and global teams.',
    chips: ['30+ languages', '38 accents', 'Auto-switching'],
  },
  {
    slug: 'ai-agent',
    icon: Bot,
    name: 'Autonomous Agent',
    tagline: 'Acts, with guardrails.',
    copy: 'Agents that complete tasks end to end within strict rules — and hand off to humans the moment judgement is needed.',
    chips: ['Rule-bound actions', 'Task completion', 'Safe hand-off'],
  },
];

export type Industry = {
  slug: string;
  name: string;
  headline: string;
  detail: string;
  metric: string;
  metricLabel: string;
};

export const INDUSTRIES: Industry[] = [
  { slug: 'restaurants-qsr', name: 'Restaurants & QSR', headline: 'Two lanes, one voice, zero abandoned cars.', detail: 'Menu-adaptive ordering, phone payments and drive-thru throughput.', metric: '52s', metricLabel: 'peak serve time' },
  { slug: 'hospitality-wellness', name: 'Hospitality & Wellness', headline: 'A concierge who never sleeps.', detail: 'Bookings, room service and guest enquiries handled 24/7.', metric: '98', metricLabel: 'reservation score' },
  { slug: 'healthcare', name: 'Healthcare', headline: 'Appointments without the hold music.', detail: 'Patient booking, triage FAQs and reminder calls, privacy-first.', metric: '-71%', metricLabel: 'no-shows' },
  { slug: 'automotive', name: 'Automotive', headline: 'Books work, not just chats.', detail: 'Service bookings, parts quotes and after-hours showroom leads.', metric: '+31%', metricLabel: 'booked services' },
  { slug: 'retail', name: 'Retail', headline: 'Fast answers on stock, shipping & returns.', detail: 'Always-on support that lifts sales and repeat purchase.', metric: '24/7', metricLabel: 'coverage' },
  { slug: 'professional-services', name: 'Professional Services', headline: 'Every enquiry captured, qualified.', detail: 'Intake, qualification and appointment setting for firms and agencies.', metric: '0', metricLabel: 'missed leads' },
  { slug: 'home-services', name: 'Home Services & Trades', headline: 'On the tools, not on the phone.', detail: 'Job bookings, quoting follow-ups and emergency call triage.', metric: '+38%', metricLabel: 'jobs booked' },
  { slug: 'real-estate', name: 'Real Estate', headline: 'Inspections booked while you sleep.', detail: 'Enquiry qualification, viewing bookings and nurture calls.', metric: '2.4x', metricLabel: 'viewings booked' },
  { slug: 'financial-services', name: 'Financial Services', headline: 'Regulated service, done carefully.', detail: 'Account FAQs and scheduling with guardrails and full audit trails.', metric: '100%', metricLabel: 'calls audited' },
  { slug: 'it-technology', name: 'IT & Technology', headline: 'Smarter, faster support desks.', detail: 'Tier-1 deflection, employee assist and instant knowledge answers.', metric: '-52%', metricLabel: 'ticket volume' },
];


export const STATS = [
  { to: 2.4, decimals: 1, suffix: 'M', label: 'Conversations handled', note: 'and counting, across every vertical' },
  { to: 0.8, decimals: 1, suffix: 's', label: 'Median answer time', note: 'before the second ring' },
  { to: 38, decimals: 0, suffix: '', label: 'Accents, native', note: '30+ languages live' },
  { to: 99.2, decimals: 1, suffix: '%', label: 'First-pass accuracy', note: 'on routine requests' },
];

export const FAQS = [
  { q: 'What is TalkByte?', a: 'TalkByte is a voice AI platform that answers, books, sells and follows up over the phone for any business — restaurants, clinics, trades, firms and franchises. It sounds human, speaks 30+ languages, and connects to the tools you already run.' },
  { q: 'Will my customers know they are talking to an AI?', a: 'We are upfront by design — the assistant introduces itself naturally and offers a human hand-off at any point. Most callers simply care that their task gets done fast and accurately, without hold music.' },
  { q: 'Can it take payments over the phone?', a: 'Yes. Card payments are processed through Stripe via secure SMS payment links sent during the call — tokenised, PCI-compliant handling. No raw card numbers are ever spoken or stored.' },
  { q: 'Does it work with our existing systems?', a: 'We integrate with Square POS, Stripe, calendars, CRM and booking platforms, and we connect to open APIs for everything else. No rip and replace.' },
  { q: 'How long does a deployment take?', a: 'Most deployments go live within 4–8 weeks depending on integrations and content readiness. You approve scripts, intents and success metrics before anything goes live.' },
  { q: 'What happens when the AI does not understand a caller?', a: 'It asks a clarifying question first. If the conversation still cannot be resolved, it seamlessly transfers to your team with the live transcript and caller details already attached.' },
  { q: 'Is my data secure?', a: 'Yes — tenant isolation, encryption in transit and at rest, PII masking, and every agent decision is logged and audit-ready. Rules are enforced at the instruction, task and channel level.' },
  { q: 'How do we get started?', a: 'Book a free demo. We will listen to a sample of your real calls, show you exactly what AI would handle, and scope a pilot with measurable outcomes.' },
];

