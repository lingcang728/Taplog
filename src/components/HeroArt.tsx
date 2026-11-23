import { memo } from 'react'
import { useWorkspace } from '../state/workspace'

const RIBBONS = [
  { d: 'M 120 330 C 420 120, 640 380, 980 150 S 1360 60, 1500 120', w: 120, o: 0.38 },
  { d: 'M 60 300 C 380 180, 700 300, 1000 210 S 1320 120, 1520 200', w: 80, o: 0.44 },
  { d: 'M 260 380 C 520 240, 760 420, 1060 260 S 1340 210, 1540 260', w: 60, o: 0.32 },
  { d: 'M 380 120 C 640 60, 820 230, 1100 120 S 1380 40, 1540 60', w: 46, o: 0.26 },
]

/** Soft misty ribbons behind the gallery hero title. Static by design: quiet, no ambient jitter. */
export const HeroArt = memo(function HeroArt({ className }: { className?: string }) {
  const dark = useWorkspace((state) => state.dark)
  const stops = dark
    ? { a: '#2A2638', b: '#3F3860', c: '#3A2F44', d: '#2E2A33', orb: '#2C2744', edge: 0.12 }
    : { a: '#ECE8F8', b: '#D3CBEF', c: '#EADDE6', d: '#F2E9E2', orb: '#E6E0F6', edge: 0.7 }

  return (
    <svg
      className={className}
      viewBox="0 0 1440 460"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hero-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={stops.a} stopOpacity="0" />
          <stop offset="0.35" stopColor={stops.b} />
          <stop offset="0.7" stopColor={stops.c} />
          <stop offset="1" stopColor={stops.d} stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="hero-orb" cx="0.72" cy="0.32" r="0.42">
          <stop offset="0" stopColor={stops.orb} stopOpacity="0.9" />
          <stop offset="1" stopColor={stops.orb} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="460" fill="url(#hero-orb)" />
      {RIBBONS.map((ribbon, index) => (
        <g key={index} opacity={ribbon.o}>
          <path
            d={ribbon.d}
            fill="none"
            stroke="url(#hero-band)"
            strokeWidth={ribbon.w}
            strokeLinecap="round"
          />
          <path
            d={ribbon.d}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={stops.edge}
            strokeWidth="1.4"
            transform={`translate(0 ${-ribbon.w / 2 + 2})`}
          />
        </g>
      ))}
    </svg>
  )
})
