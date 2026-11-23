import {
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
  WarningCircleIcon,
  WaveformIcon,
} from '@phosphor-icons/react'
import { pauseAudio, playBoundedAnchor, useAudioState } from '../../audio/engine'
import { formatClock, formatOffsetBadge, msg, relationLabel } from '../../i18n/messages'
import { visibleAnchorsForCondition } from '../../state/condition'
import { logTelemetry } from '../../state/telemetry'
import { useWorkspace } from '../../state/workspace'
import type { Claim, Lecture } from '../../types/lecture'

export interface AnchorBadgesProps {
  lecture: Lecture
  claim: Claim
  compact?: boolean
  isOpen?: boolean
  onToggleOpen: (claimId: string) => void
}

export function AnchorBadges({
  lecture,
  claim,
  compact = false,
  isOpen = false,
  onToggleOpen,
}: AnchorBadgesProps) {
  const condition = useWorkspace((s) => s.condition)
  const density = useWorkspace((s) => s.density)
  const locale = useWorkspace((s) => s.locale)
  const verifiedIds = useWorkspace((s) => s.verifiedAnchorIds)

  const activeAnchorId = useAudioState((s) => s.activeAnchorId)
  const isPlaying = useAudioState((s) => s.playing)

  const visible = visibleAnchorsForCondition(claim, condition)
  if (!visible.hasTraceability) return null

  const origin = visible.origin
  const originPlaying = Boolean(origin && isPlaying && activeAnchorId === origin.id)

  const handleOriginClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!origin) return
    if (originPlaying) {
      pauseAudio()
      return
    }
    playBoundedAnchor(lecture, claim.id, origin, locale)
    logTelemetry({
      lectureId: lecture.id,
      condition,
      density,
      action: 'clip_play',
      claimId: claim.id,
      anchorId: origin.id,
      relation: 'origin',
    })
  }

  return (
    <div className="anchor-badges">
      {origin && (
        <button
          type="button"
          className={`origin-pill${originPlaying ? ' is-playing' : ''}`}
          onClick={handleOriginClick}
          title={msg(locale, originPlaying ? 'pauseClip' : 'playClip')}
        >
          {originPlaying ? (
            <PauseIcon size={12} weight="fill" />
          ) : (
            <PlayIcon size={12} weight="fill" />
          )}
          <span>{formatClock(origin.startMs)}</span>
        </button>
      )}

      {visible.alerts.map((anchor) => {
        const verified = verifiedIds.includes(anchor.id)
        const isCorrection = anchor.relation === 'correction'
        return (
          <button
            key={anchor.id}
            type="button"
            className={`alert-pill ${anchor.relation}${verified ? ' is-verified' : ''}${isOpen ? ' is-open' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleOpen(claim.id)
            }}
            aria-expanded={isOpen}
          >
            {verified ? (
              <CheckCircleIcon size={13} weight="fill" />
            ) : isCorrection ? (
              <ArrowUUpLeftIcon size={13} weight="bold" />
            ) : (
              <WarningCircleIcon size={13} weight="fill" />
            )}
            <span>
              {relationLabel(anchor.relation, locale)} · {formatOffsetBadge(anchor.offsetFromOriginMs, locale)}
            </span>
          </button>
        )
      })}

      {visible.alerts.length === 0 && visible.elaborations.length > 0 && (
        <button
          type="button"
          className="silent-more-pill"
          onClick={(e) => {
            e.stopPropagation()
            onToggleOpen(claim.id)
          }}
          aria-expanded={isOpen}
          title={msg(locale, 'silentMore', { count: visible.elaborations.length })}
        >
          <WaveformIcon size={13} />
          <span>
            {compact
              ? `+${visible.elaborations.length}`
              : msg(locale, 'silentMore', { count: visible.elaborations.length })}
          </span>
        </button>
      )}
    </div>
  )
}
