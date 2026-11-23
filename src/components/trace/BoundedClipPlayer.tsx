import { useMemo, useState } from 'react'
import {
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  QuotesIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import {
  extendActiveClip,
  pauseAudio,
  playBoundedAnchor,
  seekWithinActiveClip,
  useAudioState,
} from '../../audio/engine'
import { sliceClipPeaks } from '../../audio/waveform'
import {
  formatClipSpan,
  formatClock,
  formatOffsetBadge,
  msg,
  pickText,
  relationLabel,
} from '../../i18n/messages'
import { surroundingSegments } from '../../state/condition'
import { logTelemetry } from '../../state/telemetry'
import { useWorkspace } from '../../state/workspace'
import type { EvidenceAnchor, Lecture } from '../../types/lecture'

export interface BoundedClipPlayerProps {
  lecture: Lecture
  claimId: string
  anchor: EvidenceAnchor
}

export function BoundedClipPlayer({ lecture, claimId, anchor }: BoundedClipPlayerProps) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const density = useWorkspace((s) => s.density)
  const verified = useWorkspace((s) => s.verifiedAnchorIds.includes(anchor.id))

  const activeAnchorId = useAudioState((s) => s.activeAnchorId)
  const playing = useAudioState((s) => s.playing)
  const currentMs = useAudioState((s) => s.currentMs)
  const clipStartMs = useAudioState((s) => s.clipStartMs)
  const clipEndMs = useAudioState((s) => s.clipEndMs)

  const [showContextLines, setShowContextLines] = useState(false)

  const isActive = activeAnchorId === anchor.id
  const isPlayingThis = isActive && playing
  const effStart = isActive && clipStartMs !== null ? clipStartMs : anchor.startMs
  const effEnd = isActive && clipEndMs !== null ? clipEndMs : anchor.endMs

  const bars = useMemo(
    () => sliceClipPeaks(lecture.id, lecture.waveformPeaks, lecture.durationMs, effStart, effEnd, 44),
    [lecture.id, lecture.waveformPeaks, lecture.durationMs, effStart, effEnd],
  )

  const progress =
    isActive && effEnd > effStart
      ? Math.max(0, Math.min(1, (currentMs - effStart) / (effEnd - effStart)))
      : verified
        ? 1
        : 0

  const contextWindow = useMemo(
    () => (showContextLines ? surroundingSegments(lecture.transcript, anchor, 2) : null),
    [showContextLines, lecture.transcript, anchor],
  )

  const handleTogglePlay = () => {
    if (isPlayingThis) {
      pauseAudio()
      return
    }
    playBoundedAnchor(lecture, claimId, anchor, locale)
    logTelemetry({
      lectureId: lecture.id,
      condition,
      density,
      action: 'clip_play',
      claimId,
      anchorId: anchor.id,
      relation: anchor.relation,
    })
  }

  const handleWaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
    const targetMs = effStart + ratio * (effEnd - effStart)
    if (!isActive) {
      playBoundedAnchor(lecture, claimId, anchor, locale)
    }
    seekWithinActiveClip(targetMs)
  }

  const handleExtend = (deltaStart: number, deltaEnd: number) => {
    if (!isActive) {
      playBoundedAnchor(lecture, claimId, anchor, locale)
    }
    extendActiveClip(deltaStart, deltaEnd, lecture.durationMs)
    logTelemetry({
      lectureId: lecture.id,
      condition,
      density,
      action: 'clip_extend',
      claimId,
      anchorId: anchor.id,
      detail: `dStart=${deltaStart};dEnd=${deltaEnd}`,
    })
  }

  const handleToggleContext = () => {
    const next = !showContextLines
    setShowContextLines(next)
    if (next) {
      logTelemetry({
        lectureId: lecture.id,
        condition,
        density,
        action: 'context_lines_open',
        claimId,
        anchorId: anchor.id,
      })
    }
  }

  const cardTierClass =
    anchor.relation === 'caveat'
      ? ' tier-caveat'
      : anchor.relation === 'correction'
        ? ' tier-correction'
        : ''

  return (
    <div className={`clip-card${cardTierClass}${isActive ? ' is-active' : ''}`}>
      <div className="clip-card-head">
        <div className="clip-meta-left">
          <span className={`clip-rel-tag ${anchor.relation}`}>
            {anchor.relation === 'caveat' && <WarningCircleIcon size={12} weight="fill" />}
            {anchor.relation === 'correction' && <ArrowUUpLeftIcon size={12} weight="bold" />}
            <span>{relationLabel(anchor.relation, locale)}</span>
          </span>
          <span className="clip-clock">
            {formatClock(effStart)} - {formatClock(effEnd)} ({formatClipSpan(effStart, effEnd, locale)})
          </span>
          {anchor.offsetFromOriginMs !== 0 && (
            <span className="clip-clock">· {formatOffsetBadge(anchor.offsetFromOriginMs, locale)}</span>
          )}
        </div>

        {verified && (
          <span className="clip-verified-chip">
            <CheckCircleIcon size={13} weight="fill" />
            <span>{msg(locale, 'verifiedBadge')}</span>
          </span>
        )}
      </div>

      {anchor.contextBridge && (
        <p className="clip-bridge">{pickText(anchor.contextBridge, locale)}</p>
      )}

      <p className="clip-scent">
        {isPlayingThis || verified
          ? pickText(anchor.fullQuote, locale)
          : pickText(anchor.verbatimLead, locale)}
      </p>

      <div className="clip-player-row">
        <button
          type="button"
          className="clip-play-btn"
          onClick={handleTogglePlay}
          aria-label={msg(locale, isPlayingThis ? 'pauseClip' : 'playClip')}
        >
          {isPlayingThis ? (
            <PauseIcon size={14} weight="fill" />
          ) : (
            <PlayIcon size={14} weight="fill" />
          )}
        </button>

        <button
          type="button"
          className="clip-wave-strip"
          onClick={handleWaveClick}
          aria-label={`${formatClock(effStart)} - ${formatClock(effEnd)}`}
        >
          {bars.map((amp, i) => {
            const filled = i / bars.length <= progress
            return (
              <span
                key={i}
                className={`clip-wave-bar${filled ? ' is-filled' : ''}`}
                style={{ height: `${Math.round(Math.max(18, amp * 100))}%` }}
              />
            )
          })}
        </button>
      </div>

      <div className="clip-tools-row">
        <button
          type="button"
          className="clip-tool-btn"
          onClick={() => handleExtend(-10_000, 0)}
        >
          <ClockCounterClockwiseIcon size={12} />
          <span>{msg(locale, 'extendBack10')}</span>
        </button>

        <button
          type="button"
          className="clip-tool-btn"
          onClick={() => handleExtend(0, 15_000)}
        >
          <PlusIcon size={12} />
          <span>{msg(locale, 'extendForward15')}</span>
        </button>

        <button
          type="button"
          className="clip-tool-btn"
          onClick={handleToggleContext}
          aria-expanded={showContextLines}
        >
          <QuotesIcon size={12} />
          <span>
            {msg(locale, showContextLines ? 'hideSurroundingLines' : 'surroundingLines')}
          </span>
        </button>
      </div>

      {showContextLines && contextWindow && (
        <div className="surrounding-box">
          {contextWindow.segments.map((seg) => (
            <div
              key={seg.id}
              className={`surrounding-line${contextWindow.focusIds.has(seg.id) ? ' is-focus' : ''}`}
            >
              <span className="clip-clock">{formatClock(seg.startMs)}</span>
              <span>{pickText(seg.text, locale)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
