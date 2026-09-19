"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "18:00", missed: 4, captured: 0 },
  { time: "19:00", missed: 12, captured: 0 },
  { time: "20:00", missed: 18, captured: 0 },
  { time: "21:00", missed: 7, captured: 0 },
  { time: "18:00 (AI)", missed: 0, captured: 4 },
  { time: "19:00 (AI)", missed: 0, captured: 12 },
  { time: "20:00 (AI)", missed: 0, captured: 18 },
  { time: "21:00 (AI)", missed: 0, captured: 7 },
];

export default function AnimatedGraph() {
  return (
    <div className="w-full h-[400px] glass-panel rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Peak Hour Revenue Capture</h3>
        <p className="text-sm text-white/50">Missed calls vs AI-captured orders</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCaptured" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorMissed)" />
            <Area type="monotone" dataKey="captured" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorCaptured)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
