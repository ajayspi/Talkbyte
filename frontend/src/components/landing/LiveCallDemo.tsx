"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, PhoneCall, Play, RotateCcw } from "lucide-react";
import { Waveform } from "@/components/ui/Waveform";

type Line = { who: "caller" | "ai"; text: string };
type Outcome = { label: string; value: string };

type Demo = {
  id: string;
  label: string;
  caller: string;
  transcript: Line[];
  outcomes: Outcome[];
  post: string;
};

/** Scripted conversations — one per business type, no backend required. */
export const DEMOS: Demo[] = [
  {
    id: "qsr",
    label: "Restaurant order",
    caller: "0412 555 019",
    transcript: [
      { who: "ai", text: "Thanks for calling Bella Napoli, how can I help?" },
      { who: "caller", text: "Can I get two margheritas and a garlic bread, pickup?" },
      { who: "ai", text: "Two margheritas, one garlic bread, pickup. Ready in about 18 minutes — would you like to add tiramisu for $7?" },
      { who: "caller", text: "Yeah, go on then." },
      { who: "ai", text: "Perfect. That is $61.50 all up. I will text you a payment link now — you are all set." },
    ],
    outcomes: [
      { label: "2 × Margherita", value: "$46.00" },
      { label: "Garlic bread", value: "$8.50" },
      { label: "Tiramisu (add-on accepted)", value: "$7.00" },
    ],
    post: "Order posted to POS · ticket #4192 · kitchen notified",
  },
  {
    id: "clinic",
    label: "Clinic booking",
    caller: "03 9002 7714",
    transcript: [
      { who: "ai", text: "Morgan & Co Dental, this is Ava. How can I help today?" },
      { who: "caller", text: "I need a check-up, and I have a chipped tooth that's a bit sore." },
      { who: "ai", text: "I am sorry to hear that. I have a 9:40 tomorrow with Dr Nguyen, or 2:15 this afternoon if it is urgent. Which suits you better?" },
      { who: "caller", text: "This afternoon, please." },
      { who: "ai", text: "Booked for 2:15 today, and I have flagged the chipped tooth so the team can plan. Confirmation and reminder sent by SMS." },
    ],
    outcomes: [
      { label: "Appointment", value: "Today 2:15 PM" },
      { label: "Practitioner", value: "Dr Nguyen" },
      { label: "Symptom flagged", value: "Chipped tooth" },
    ],
    post: "Added to practice calendar · intake form sent · reminder scheduled",
  },
  {
    id: "trades",
    label: "Emergency job",
    caller: "0455 118 220",
    transcript: [
      { who: "ai", text: "Northline Plumbing after hours, what is the emergency?" },
      { who: "caller", text: "Burst pipe under the kitchen sink, water everywhere." },
      { who: "ai", text: "Understood. I have your address as 14 Campbell Street — is that right? I am dispatching the on-call crew now, ETA 40 minutes." },
      { who: "caller", text: "Yes, that's right. Thank you." },
      { who: "ai", text: "A technician is assigned and I have taken a $99 callout deposit. He will call you when he is five minutes away." },
    ],
    outcomes: [
      { label: "Address confirmed", value: "14 Campbell St" },
      { label: "Crew dispatched", value: "ETA 40 min" },
      { label: "Deposit", value: "$99.00" },
    ],
    post: "Job created in CRM · technician SMS'd · card captured",
  },
];

/** Interactive scripted call player — the homepage showpiece. */
export default function LiveCallDemo() {
  const reduce = useReducedMotion();
  const [demoIdx, setDemoIdx] = useState(0);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const demo = DEMOS[demoIdx];
  const total = demo.transcript.length;

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    stop();
    setStep(0);
    setPlaying(true);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setStep(-1);
  }, [stop]);

  useEffect(() => {
    if (!playing) return;
    const tick = reduce ? 700 : 1800;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s >= total - 1) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, tick);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, reduce, total]);

  const switchDemo = (i: number) => {
    reset();
    setDemoIdx(i);
  };

  const visible = demo.transcript.slice(0, step + 1);
  const done = step >= total - 1;
  const revealed = step < 0 ? 0 : Math.min(demo.outcomes.length, Math.floor((step / total) * demo.outcomes.length) + 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      {/* Call panel */}
      <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {DEMOS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => switchDemo(i)}
              className={`rounded-full border px-4 py-2 font-mono-grotesk text-[11px] uppercase tracking-[0.18em] transition-all ${
                i === demoIdx
                  ? "border-[rgba(217,164,65,0.6)] bg-[rgba(217,164,65,0.12)] text-[#f7dfa0]"
                  : "border-white/10 text-white/50 hover:border-[rgba(217,164,65,0.35)] hover:text-white/80"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgba(217,164,65,0.4)] bg-[rgba(217,164,65,0.08)]">
            <PhoneCall size={19} className="text-[#f7dfa0]" />
            {playing && (
              <span className="absolute inset-0 animate-ping rounded-full border border-[rgba(217,164,65,0.5)]" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-white">Incoming · {demo.caller}</p>
            <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.2em] text-[#f7dfa0]/80">
              {playing ? "Live · TalkByte answering" : done ? "Call complete · 0.8s answer" : "Ready"}
            </p>
          </div>
          <div className="ml-auto hidden w-32 sm:block">
            <Waveform active={playing} bars={14} className="h-8" />
          </div>
        </div>

        <div className="mt-6 min-h-[236px] space-y-3">
          {visible.length === 0 && (
            <p className="pt-16 text-center text-sm text-white/40">
              Press play to hear a real conversation, start to finish.
            </p>
          )}
          {visible.map((line, i) => (
            <motion.div
              key={`${demo.id}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32 }}
              className={`flex ${line.who === "ai" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  line.who === "ai"
                    ? "border border-[rgba(217,164,65,0.28)] bg-[rgba(217,164,65,0.08)] text-white/85"
                    : "border border-white/10 bg-white/[0.05] text-white/70"
                }`}
              >
                <span className="mb-1 block font-mono-grotesk text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {line.who === "ai" ? "TalkByte" : "Caller"}
                </span>
                {line.text}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {!playing && !done && (
            <button onClick={play} className="glow-btn inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              <Play size={14} /> {step < 0 ? "Hear a live call" : "Resume"}
            </button>
          )}
          {playing && (
            <button onClick={stop} className="ghost-btn rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              Pause
            </button>
          )}
          {step >= 0 && (
            <button onClick={reset} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-white">
              <RotateCcw size={13} /> Replay
            </button>
          )}
        </div>
      </div>



      {/* Outcome panel */}
      <div className="glass-panel flex flex-col rounded-3xl p-6 md:p-8">
        <p className="font-mono-grotesk text-[11px] uppercase tracking-[0.24em] text-[#f7dfa0]">What your business receives</p>
        <div className="mt-5 flex-1 space-y-3">
          {demo.outcomes.map((o, i) => (
            <motion.div
              key={o.label}
              initial={false}
              animate={{ opacity: i < revealed ? 1 : 0.25 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="text-sm text-white/70">{o.label}</span>
              <span className="font-display text-lg text-[#fff3cf]">{o.value}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: done ? 1 : 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-400/[0.08] px-4 py-3"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
          <p className="text-sm leading-relaxed text-emerald-100/90">{demo.post}</p>
        </motion.div>
      </div>
    </div>
  );
}

