'use client';

/**
 * Animated TalkByte mark — single source of truth for the logo icon.
 * Gold mic capsule + living sound waves + byte-pulse ring + shimmer.
 * Pure CSS keyframes (defined in globals.css) so it animates pre-hydration.
 * Pass `animated={false}` for a static mark (print, reduced-motion fallbacks).
 */
export default function Logo({
  size = 36,
  animated = true,
  className = '',
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const WAVE_PATHS = ['M25 38 Q19.5 50 25 62', 'M15 34 Q7.5 50 15 66', 'M75 38 Q80.5 50 75 62', 'M85 34 Q92.5 50 85 66'];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TalkByte"
    >
      <defs>
        <linearGradient id="tb-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8912C" />
          <stop offset="55%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#FCF6BA" />
        </linearGradient>
      </defs>

      {/* Byte pulse ring */}
      {animated && (
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="url(#tb-logo-grad)"
          strokeWidth="1.6"
          fill="none"
          className="logo-ring"
        />
      )}

      {/* Mic capsule */}
      <rect x="41" y="22" width="18" height="32" rx="9" fill="url(#tb-logo-grad)" />
      {animated && <ellipse cx="46.5" cy="30" rx="3.2" ry="6" fill="#fff" opacity="0.5" className="logo-shine" />}

      {/* Mic bracket + stand */}
      <path
        d="M31 44 v4 a19 19 0 0 0 38 0 v-4"
        stroke="url(#tb-logo-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="50" y1="68" x2="50" y2="79" stroke="url(#tb-logo-grad)" strokeWidth="3.4" strokeLinecap="round" />
      <line x1="37" y1="81" x2="63" y2="81" stroke="url(#tb-logo-grad)" strokeWidth="3.4" strokeLinecap="round" />

      {/* Living sound waves — staggered pulse */}
      {WAVE_PATHS.map((d, i) =>
        animated ? (
          <path
            key={d}
            d={d}
            stroke="url(#tb-logo-grad)"
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            className="logo-wave"
            style={{ animationDelay: `${(i % 2) * 0.28 + (i > 1 ? 0.14 : 0)}s` }}
          />
        ) : (
          <path key={d} d={d} stroke="url(#tb-logo-grad)" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={i % 2 === 0 ? 0.55 : 0.35} />
        )
      )}
    </svg>
  );
}
