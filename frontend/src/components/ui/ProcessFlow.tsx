'use client';

import {
  Phone, PhoneCall, PhoneForwarded, Bot, Receipt, UserCheck, CalendarCheck,
  Headset, Send, UtensilsCrossed, TicketCheck, BarChart3, Languages,
  CheckCircle2, Search, Workflow, Rocket, AudioWaveform, CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon registry — flow steps pass a string name so step data stays
 * serializable across the server/client boundary.
 */
const ICONS: Record<string, LucideIcon> = {
  phone: Phone,
  'phone-call': PhoneCall,
  'phone-forwarded': PhoneForwarded,
  bot: Bot,
  receipt: Receipt,
  'user-check': UserCheck,
  'calendar-check': CalendarCheck,
  headset: Headset,
  send: Send,
  'utensils-crossed': UtensilsCrossed,
  'ticket-check': TicketCheck,
  'bar-chart': BarChart3,
  languages: Languages,
  'check-circle': CheckCircle2,
  search: Search,
  workflow: Workflow,
  rocket: Rocket,
  'audio-waveform': AudioWaveform,
  'circle-dollar': CircleDollarSign,
};

/**
 * Animated process-flow diagram — icon nodes connected by marching-dash
 * connectors with a traveling gold pulse dot. Horizontal on md+, vertical on
 * mobile. Pure SVG + CSS/SMIL: animates without any client JavaScript.
 */
export type FlowStep = { icon: string; title: string; sub: string };

/** Connector between two nodes: animated dash line + traveling dot (SMIL). */
function Connector({ vertical = false, delay = 0 }: { vertical?: boolean; delay?: number }) {
  const length = vertical ? 56 : 80;
  return (
    <svg
      viewBox={`0 0 ${vertical ? 8 : length} ${vertical ? length : 8}`}
      className={vertical ? 'h-14 w-2 md:hidden' : 'hidden md:block h-2 w-20 flex-shrink'}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1={vertical ? 4 : 0}
        y1={vertical ? 0 : 4}
        x2={vertical ? 4 : length}
        y2={vertical ? length : 4}
        stroke="rgba(212,175,55,0.35)"
        strokeWidth="1.5"
        className="flow-line"
      />
      <circle r="2.6" fill="#D4AF37" className="flow-dot">
        <animate
          attributeName="cx"
          values={vertical ? `4;4` : `0;${length}`}
          dur="2.4s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="cy"
          values={vertical ? `0;${length}` : `4;4`}
          dur="2.4s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

export function ProcessFlow({
  steps,
  className = '',
}: {
  steps: FlowStep[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center md:flex-row md:justify-center ${className}`}>
      {steps.map((step, i) => {
        const Icon = ICONS[step.icon] ?? PhoneCall;
        return (
          <div key={step.title} className="flex flex-col md:flex-row items-center">
            {/* Node */}
            <div className="flex flex-col items-center text-center w-32 md:w-auto">
              <div className="flow-node flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--gold-border)] bg-[var(--bg-panel)]/80 backdrop-blur-sm">
                <Icon size={26} className="text-[var(--gold)]" strokeWidth={1.6} />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-xs leading-snug text-white/45 max-w-[140px]">{step.sub}</p>
            </div>
            {/* Connector to next node */}
            {i < steps.length - 1 && <Connector vertical delay={i * 0.6} />}
          </div>
        );
      })}
    </div>
  );
}
