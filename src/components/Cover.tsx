import { memo, useId } from 'react'
import { hashString, pick, random } from '../lib/seed'
import { useWorkspace } from '../state/workspace'

export type CoverFamily = 'dunes' | 'ribbon' | 'petals' | 'orbs'
const FAMILIES: CoverFamily[] = ['dunes', 'ribbon', 'petals', 'orbs']

interface Palette {
  bg: [string, string]
  a: string
  b: string
  c: string
  d: string
}

// Low-chroma, close-hue palettes: a library of lecture notes should feel quiet.
// Index i of LIGHT pairs with index i of DARK so a lecture keeps its character across themes.
const LIGHT: Palette[] = [
  { bg: ['#F3F1F8', '#E2DEF0'], a: '#CBC4E6', b: '#A9A0D4', c: '#E2DCEE', d: '#EFEAF3' },
  { bg: ['#F5F1EF', '#E6DFE6'], a: '#DCCBCF', b: '#B9ADCB', c: '#E9DEDB', d: '#F3ECE8' },
  { bg: ['#F0F1F6', '#DDE0EC'], a: '#C2C8DF', b: '#A0A8CB', c: '#DAD8EB', d: '#ECEEF5' },
  { bg: ['#F4F1EC', '#E5E0DA'], a: '#DAD0C4', b: '#B6AFC8', c: '#E7E0D6', d: '#F3EEE8' },
  { bg: ['#F2F0F7', '#E0DAEE'], a: '#CEC3EA', b: '#9F95CF', c: '#E6DCE6', d: '#F1ECF1' },
]

const DARK: Palette[] = [
  { bg: ['#211F2C', '#18161F'], a: '#38334F', b: '#4A4370', c: '#2C2839', d: '#26232F' },
  { bg: ['#231F25', '#19161C'], a: '#3E3238', b: '#463F5C', c: '#302A2E', d: '#28232A' },
  { bg: ['#1D1F29', '#15161E'], a: '#30354C', b: '#3F4668', c: '#2A2B3A', d: '#23252F' },
  { bg: ['#22201F', '#181718'], a: '#3A3530', b: '#433F55', c: '#2E2B28', d: '#272422' },
  { bg: ['#211E2B', '#17151E'], a: '#3A3352', b: '#4B4372', c: '#2E2836', d: '#27232F' },
]

function coverFamily(seed: string): CoverFamily {
  return FAMILIES[hashString(`${seed}:family`) % FAMILIES.length]!
}

/**
 * Compute the 400x300 viewBox crop matching xMidYMid slice for an aspect ratio.
 */
export function coverCrop(aspect: number): string {
  if (aspect >= 400 / 300) {
    const h = 400 / aspect
    return `0 ${((300 - h) / 2).toFixed(2)} 400 ${h.toFixed(2)}`
  }
  const w = 300 * aspect
  return `${((400 - w) / 2).toFixed(2)} 0 ${w.toFixed(2)} 300`
}

export interface CoverProps {
  seed: string
  family?: CoverFamily
  className?: string
  crop?: string
}

/**
 * Deterministic generative cover. Pure gradients (no SVG filters) so galleries render smoothly.
 */
export const Cover = memo(function Cover({ seed, family, className, crop }: CoverProps) {
  const dark = useWorkspace((state) => state.dark)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const next = random(hashString(seed))
  const palette = pick(dark ? DARK : LIGHT, next)
  const hi = dark ? 0.18 : 1
  const kind = family ?? coverFamily(seed)
  const id = (name: string) => `${uid}${name}`

  return (
    <svg
      className={className}
      viewBox={crop ?? '0 0 400 300'}
      preserveAspectRatio={crop ? 'none' : 'xMidYMid slice'}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={palette.bg[0]} />
          <stop offset="1" stopColor={palette.bg[1]} />
        </linearGradient>
        <radialGradient id={id('haze')} cx="0.2" cy="0.12" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5 * hi} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {[palette.a, palette.b, palette.c, palette.d].map((color, index) => (
          <linearGradient key={index} id={id(`g${index}`)} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="1" />
            <stop offset="1" stopColor={palette.bg[0]} stopOpacity="0.4" />
          </linearGradient>
        ))}
        <linearGradient id={id('band')} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor={palette.b} stopOpacity="0.75" />
          <stop offset="0.55" stopColor={palette.d} stopOpacity="0.85" />
          <stop offset="1" stopColor={palette.c} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={id('petal')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={palette.d} stopOpacity="0.9" />
          <stop offset="0.6" stopColor={palette.bg[0]} stopOpacity="0.7" />
          <stop offset="1" stopColor={palette.a} stopOpacity="0.85" />
        </linearGradient>
        {[palette.a, palette.c, palette.b].map((color, index) => (
          <radialGradient
            key={index}
            id={id(`orb${index}`)}
            cx="0.34"
            cy="0.3"
            r="0.78"
            fx="0.3"
            fy="0.24"
          >
            <stop offset="0" stopColor={dark ? palette.d : '#FFFFFF'} stopOpacity="0.9" />
            <stop offset="0.45" stopColor={color} stopOpacity="0.6" />
            <stop offset="1" stopColor={color} stopOpacity="0.95" />
          </radialGradient>
        ))}
        <radialGradient id={id('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.d} stopOpacity="0.9" />
          <stop offset="1" stopColor={palette.d} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id('bg')})`} />
      {kind === 'dunes' && <Dunes next={next} id={id} />}
      {kind === 'ribbon' && <Ribbons next={next} id={id} hi={hi} />}
      {kind === 'petals' && <Petals next={next} id={id} />}
      {kind === 'orbs' && <Orbs next={next} id={id} hi={hi} shadow={palette.b} />}
      <rect width="400" height="300" fill={`url(#${id('haze')})`} />
    </svg>
  )
})

type Part = { next: () => number; id: (name: string) => string }
const n = (value: number) => Math.round(value * 10) / 10

function Dunes({ next, id }: Part) {
  const layers = [0, 1, 2, 3].map((index) => {
    const base = 120 + index * 42 + next() * 18
    const lift = 30 + next() * 50
    const x1 = 60 + next() * 120
    const x2 = 220 + next() * 120
    return {
      d: `M -20 ${n(base)} C ${n(x1)} ${n(base - lift)}, ${n(x2)} ${n(base + lift * 0.6)}, 420 ${n(base - lift * 0.4)} L 420 320 L -20 320 Z`,
      fill: `url(#${id(`g${index}`)})`,
      opacity: 0.6 + index * 0.12,
    }
  })
  return (
    <>
      {layers.map((layer, index) => (
        <path key={index} d={layer.d} fill={layer.fill} opacity={layer.opacity} />
      ))}
    </>
  )
}

function Ribbons({ next, id, hi }: Part & { hi: number }) {
  const bands = [0, 1, 2].map((index) => {
    const y1 = 70 + index * 55 + next() * 40
    const y2 = 40 + index * 60 + next() * 60
    const th1 = 26 + next() * 40
    const th2 = 30 + next() * 46
    const c1x = 90 + next() * 80
    const c1y = y1 + (next() - 0.5) * 160
    const c2x = 250 + next() * 80
    const c2y = y2 + (next() - 0.5) * 160
    const top = `M -40 ${n(y1)} C ${n(c1x)} ${n(c1y)}, ${n(c2x)} ${n(c2y)}, 440 ${n(y2)}`
    const shape = `${top} L 440 ${n(y2 + th2)} C ${n(c2x)} ${n(c2y + th2)}, ${n(c1x)} ${n(c1y + th1)}, -40 ${n(y1 + th1)} Z`
    return { top, shape, opacity: 0.6 + index * 0.14 }
  })
  return (
    <>
      {bands.map((band, index) => (
        <g key={index} opacity={band.opacity}>
          <path d={band.shape} fill={`url(#${id('band')})`} />
          <path
            d={band.top}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.5 * hi}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </>
  )
}

function Petals({ next, id }: Part) {
  const cx = 230 + next() * 120
  const cy = 200 + next() * 90
  const start = -200 + next() * 40
  const count = 6 + Math.floor(next() * 3)
  return (
    <>
      <circle cx={n(cx)} cy={n(cy)} r="120" fill={`url(#${id('glow')})`} />
      {Array.from({ length: count }, (_, index) => {
        const rx = 110 + next() * 60
        const ry = 26 + next() * 20
        const angle = start + index * (150 / count) + next() * 8
        return (
          <g key={index} transform={`translate(${n(cx)} ${n(cy)}) rotate(${n(angle)})`}>
            <ellipse
              cx={n(rx * 0.82)}
              cy="0"
              rx={n(rx)}
              ry={n(ry)}
              fill={`url(#${id('petal')})`}
              opacity={0.6 + next() * 0.28}
            />
          </g>
        )
      })}
    </>
  )
}

function Orbs({ next, id, hi, shadow }: Part & { hi: number; shadow: string }) {
  const orbs = [
    { cx: 240 + next() * 60, cy: 110 + next() * 40, r: 92 + next() * 28, g: 0 },
    { cx: 120 + next() * 60, cy: 190 + next() * 40, r: 64 + next() * 22, g: 1 },
    { cx: 330 + next() * 40, cy: 235 + next() * 30, r: 26 + next() * 14, g: 2 },
  ]
  return (
    <>
      {orbs.map((orb, index) => (
        <g key={index}>
          <ellipse
            cx={n(orb.cx + orb.r * 0.15)}
            cy={n(orb.cy + orb.r * 1.02)}
            rx={n(orb.r * 0.8)}
            ry={n(orb.r * 0.14)}
            fill={shadow}
            opacity="0.1"
          />
          <circle cx={n(orb.cx)} cy={n(orb.cy)} r={n(orb.r)} fill={`url(#${id(`orb${orb.g}`)})`} />
          <circle
            cx={n(orb.cx)}
            cy={n(orb.cy)}
            r={n(orb.r - 0.8)}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.45 * hi}
            strokeWidth="1.1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </>
  )
}
