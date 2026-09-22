/** Homepage content — generalized for every business, not just restaurants. */

export const HERO_METRICS = [
{ to: 0.8, decimals: 1, suffix: 's', label: 'Median answer time', note: 'Every ring answered before the second tone' },
{ to: 99.98, decimals: 2, suffix: '%', label: 'Call capture', note: 'Peak hours, storms, holidays, staff shortages' },
{ to: 14, decimals: 0, suffix: '', label: 'Countries live', note: '38 accents handled natively in production' },
{ to: 4.9, decimals: 1, suffix: '/5', label: 'Caller rating', note: 'Across 2.4M scored conversations' },
];
export const TICKER_ITEMS = [
'Restaurants & QSR', 'Medical & dental clinics', 'Trades & home services', 'Law & accounting firms',
'Real estate agencies', 'Hotels & wellness', 'Automotive service', 'Franchises & multi-site',
];
export const COMPARISON_ROWS = [
{ label: 'Answers before second ring', manual: 'Missed 31% at peak', talkbyte: '0.8s median, 24/7', delta: '+31% capture' },
{ label: 'Request accuracy', manual: '86% first-pass', talkbyte: '99.2% first-pass', delta: '+13.2 pts' },
{ label: 'Average handle time', manual: '3m 48s', talkbyte: '1m 52s', delta: '-51%' },
{ label: 'Add-on offered', manual: '9%, inconsistent', talkbyte: '27% every call', delta: '3.0x' },
{ label: 'Booking or payment secured', manual: 'Pay later, no-show risk', talkbyte: 'Pre-paid by SMS link', delta: '-94% no-shows' },
{ label: 'Posted to your systems', manual: 'Re-typed, error prone', talkbyte: 'Synced in 2.1s', delta: 'Zero keying' },
];
export const SCENARIOS = [
{ id: 'monday-open', index: '01', title: 'Monday 08:12, before the doors even open', venue: 'Morgan & Co Dental, 3 chairs, 2 lines ringing', stat: '31 bookings before open',
before: 'Front desk juggling patients, voicemail filling up, three callers giving up in the queue.',
during: ['Line 1: new patient booked into the 9:40 slot.', 'Line 2: reschedule handled, reminder SMS sent.', 'Line 3: pricing question answered from your fee list.'],
after: '31 appointments booked before the first patient arrives. Nobody sat on hold.' },
{ id: 'storm-week', index: '02', title: 'Storm week, three crews, no office staff', venue: 'Northline Plumbing, emergency surge', stat: '+38% jobs captured',
before: 'Every call is an emergency and every missed call is a competitor\u2019s job.',
during: ['TalkByte triages urgency and postcode coverage.', 'Job details captured, photos requested by SMS.', 'Deposit collected before dispatch.'],
after: 'Revenue up 38% on the same storm last year. Zero lost job sheets.' },
{ id: 'multi-site', index: '03', title: 'Multi-site rollout, 24 locations, one voice', venue: 'Ember & Oak Group, 24 sites', stat: '24 sites in 1 afternoon',
before: 'Every site sounds different. Pricing drifts. Onboarding eats weeks.',
during: ['Brand voice configured once, deployed everywhere.', 'Services, fees and hours pushed centrally.', 'Accents and languages switch per location.'],
after: 'Launch consistency 98 of 100. Training cost per site falls to zero.' },
{ id: 'partner-meeting', index: '04', title: 'A partner meeting, but the phone keeps ringing', venue: 'Halloran Legal, 6 fee earners', stat: '0 missed enquiries',
before: 'Reception is part-time. New enquiries land in voicemail and go cold by morning.',
during: ['Matter type and conflict basics captured up front.', 'Consultations booked straight into partner diaries.', 'Urgent matters escalated by SMS within seconds.'],
after: 'Zero missed enquiries in a quarter. Intake quality up, admin hours down.' },
];

export const OPERATING_MODEL = [
{ step: '01', title: 'Answer', time: '0.8 seconds', copy: 'Dedicated local number or overflow routing. No hold music, no IVR maze.' },
{ step: '02', title: 'Understand', time: 'Real time', copy: '38 accents, product questions, edge cases and exceptions resolved live.' },
{ step: '03', title: 'Transact', time: '12 seconds', copy: 'Booking confirmed or payment collected by SMS link before hang-up.' },
{ step: '04', title: 'Execute', time: '2.1 seconds', copy: 'Posted to your calendar, CRM or POS. Humans only handle exceptions.' },
];
export { INDUSTRIES } from './platform';
export const GLOBAL_SIGNALS = [
{ city: 'Sydney', detail: 'Peak Monday load, 41 concurrent calls', load: 92 },
{ city: 'London', detail: 'Morning rush, 6 languages active', load: 74 },
{ city: 'Dubai', detail: 'Holiday hours, multilingual routing', load: 68 },
{ city: 'Singapore', detail: 'Lunch surge, 3 brands live', load: 81 },
{ city: 'New York', detail: 'Lunch rush, multi-site cluster', load: 77 },
{ city: 'Mumbai', detail: 'Late-night window, prepaid flow', load: 63 },
];

/** Trust section — guardrails and proof, one line each. */
export const GUARDRAILS = [
{ title: 'Layered guardrails', copy: 'Rules enforced at instruction, task and channel level — not just a polite prompt.' },
{ title: 'PII masking', copy: 'Sensitive caller data is never spoken back and never stored in transcripts.' },
{ title: 'Tenant isolation', copy: 'Your data, your models, your numbers. Nothing shared between customers.' },
{ title: 'Audit-ready', copy: 'Every decision, escalation and transfer is logged and exportable.' },
];

export const TESTIMONIALS = [
{ metric: '59%', metricLabel: 'of call volume automated', quote: 'It answers faster than we ever did and books straight into the diary. Our front desk finally does front desk work.', name: 'Practice Manager', org: 'Multi-site dental group' },
{ metric: '3.2x', metricLabel: 'more after-hours bookings', quote: 'Half our enquiries used to arrive after hours and go cold. Now they are booked and paid before we open.', name: 'Operations Lead', org: 'Home services franchise' },
{ metric: '-71%', metricLabel: 'average handle time', quote: 'Routine questions never reach a person anymore, and the ones that do come with the whole conversation attached.', name: 'Customer Care Director', org: 'Financial services firm' },
];
