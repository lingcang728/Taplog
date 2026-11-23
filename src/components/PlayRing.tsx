import { useMemo } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { resamplePeaks, seededLecturePeaks } from '../audio/waveform'

export function PlayRing({
  playing,
  progress,
  size = 40,
}: {
  playing: boolean
  progress: number
  size?: number
}) {
  const radius = size / 2 - 1.5
  const length = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))

  return (
    <span className="play-ring" style={{ width: size, height: size }}>
      <svg
        className="ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={radius} className="ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-fill"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - clamped)}
        />
      </svg>
      {playing ? (
        <PauseIcon size={Math.round(size * 0.38)} weight="fill" />
      ) : (
        <PlayIcon size={Math.round(size * 0.38)} weight="fill" />
      )}
    </span>
  )
}

export function MiniWave({
  seed,
  peaks,
  bars = 38,
  progress = 0,
  className = '',
}: {
  seed: string
  peaks?: number[]
  bars?: number
  progress?: number
  className?: string
}) {
  const values = useMemo(() => {
    const base = peaks && peaks.length > 0 ? peaks : seededLecturePeaks(seed, 96)
    return resamplePeaks(base, bars)
  }, [seed, peaks, bars])

  const width = bars * 5
  const height = 24

  return (
    <svg
      className={`mini-wave ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {values.map((amp, index) => {
        const h = Math.max(3, Math.round(amp * (height - 2)))
        const y = Math.round((height - h) / 2)
        const played = progress > 0 && index / values.length <= progress
        return (
          <rect
            key={index}
            x={index * 5 + 1}
            y={y}
            width="2.6"
            height={h}
            rx="1.3"
            className={played ? 'played' : undefined}
          />
        )
      })}
    </svg>
  )
}
