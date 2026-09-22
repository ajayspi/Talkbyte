'use client';

const HEIGHTS = [34, 62, 96, 52, 80, 44, 100, 58, 90, 40, 72, 54, 98, 46, 84, 60];

/** Animated voice waveform — pure CSS bars, staggered. Set `active={false}` to freeze. */
export function Waveform({
  active = true,
  bars = 16,
  className = '',
}: {
  active?: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`waveform-bar ${active ? '' : 'paused'}`}
          style={{
            height: HEIGHTS[i % HEIGHTS.length] / 2,
            animationDelay: `${(i % 8) * 0.09}s`,
            animationDuration: `${1 + ((i * 37) % 5) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
