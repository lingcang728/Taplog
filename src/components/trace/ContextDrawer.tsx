import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpenTextIcon,
  CaretDownIcon,
  CaretUpIcon,
  FlagIcon,
  PauseIcon,
  PlayIcon,
  SquaresFourIcon,
  XIcon,
} from '@phosphor-icons/react'
import {
  pauseAudio,
  playBoundedAnchor,
  playEvidenceChain,
  useAudioState,
} from '../../audio/engine'
import { formatClock, msg, pickText, relationLabel } from '../../i18n/messages'
import { visibleAnchorsForCondition } from '../../state/condition'
import { logTelemetry } from '../../state/telemetry'
import {
  findClaimById,
  jumpToClaimInDensity,
  toggleClaimDrawer,
  toggleClaimFlag,
  useWorkspace,
} from '../../state/workspace'
import type { EvidenceAnchor, Lecture } from '../../types/lecture'
import { BoundedClipPlayer } from './BoundedClipPlayer'

export function ContextDrawer({ lecture }: { lecture: Lecture }) {
  const openClaimId = useWorkspace((s) => s.openClaimId)
  const condition = useWorkspace((s) => s.condition)
  const density = useWorkspace((s) => s.density)
  const densityLock = useWorkspace((s) => s.densityLock)
  const locale = useWorkspace((s) => s.locale)
  const flaggedIds = useWorkspace((s) => s.flaggedClaimIds)

  const audioMode = useAudioState((s) => s.mode)
  const activeClaimId = useAudioState((s) => s.activeClaimId)
  const playing = useAudioState((s) => s.playing)
  const bridgeNotice = useAudioState((s) => s.bridgeNotice)

  const [showElaborations, setShowElaborations] = useState(false)
  const [showProsePreview, setShowProsePreview] = useState(false)

  useEffect(() => {
    setShowElaborations(false)
    setShowProsePreview(false)
  }, [openClaimId])

  const claim =
    openClaimId && condition !== 'c3' && condition !== 'c4'
      ? findClaimById(lecture, openClaimId)
      : null

  const chapter = claim
    ? lecture.chapters.find((c) => c.id === claim.chapterId) ?? null
    : null

  const visible = claim ? visibleAnchorsForCondition(claim, condition) : null
  const canShow = Boolean(claim && visible?.hasTraceability)

  const primaryClips: EvidenceAnchor[] = visible
    ? [...(visible.origin ? [visible.origin] : []), ...visible.alerts]
    : []
  const allVisibleClips = visible ? [...primaryClips, ...visible.elaborations] : []

  const isFlagged = Boolean(claim && flaggedIds.includes(claim.id))
  const isPlayingChain = Boolean(
    claim && playing && audioMode === 'chain' && activeClaimId === claim.id,
  )

  const chainTotalSec = primaryClips.reduce(
    (sum, item) => sum + Math.max(1, Math.round((item.endMs - item.startMs) / 1000)),
    0,
  )

  const minMs = primaryClips.length ? Math.min(...primaryClips.map((a) => a.startMs)) : 0
  const maxMs = primaryClips.length ? Math.max(...primaryClips.map((a) => a.startMs)) : 0
  const spanLeftPct = lecture.durationMs > 0 ? (minMs / lecture.durationMs) * 100 : 0
  const spanWidthPct =
    lecture.durationMs > 0 ? Math.max(0, ((maxMs - minMs) / lecture.durationMs) * 100) : 0

  const handleClose = () => {
    toggleClaimDrawer(null)
  }

  const handleChainClick = () => {
    if (!claim) return
    if (isPlayingChain) {
      pauseAudio()
      return
    }
    playEvidenceChain(lecture, claim.id, primaryClips, locale)
    logTelemetry({
      lectureId: lecture.id,
      condition,
      density,
      action: 'clip_chain_play',
      claimId: claim.id,
      detail: `clips=${primaryClips.length}`,
    })
  }

  const handleExpandElaborations = () => {
    if (!claim || !visible) return
    const next = !showElaborations
    setShowElaborations(next)
    if (next) {
      logTelemetry({
        lectureId: lecture.id,
        condition,
        density,
        action: 'elaboration_expand',
        claimId: claim.id,
        detail: `count=${visible.elaborations.length}`,
      })
    }
  }

  const canJumpDensity = densityLock === 'free'

  return (
    <AnimatePresence>
      {canShow && claim && visible && (
        <>
          <motion.div
            key="trace-scrim"
            className="trace-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            onClick={handleClose}
          />

          <motion.aside
            key={claim.id}
            className="trace-sheet"
            role="dialog"
            aria-label={pickText(claim.conciseTitle, locale)}
            initial={{ x: 40, opacity: 0.85 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { type: 'spring', stiffness: 360, damping: 36, mass: 0.85 },
            }}
            exit={{ x: 32, opacity: 0, transition: { duration: 0.16 } }}
          >
            <div className="trace-sheet-head">
              <div className="trace-sheet-title-wrap">
                {chapter && (
                  <span className="trace-sheet-chapter">
                    0{chapter.index} · {pickText(chapter.title, locale)}
                  </span>
                )}
                <h3 className="drawer-heading">{pickText(claim.conciseTitle, locale)}</h3>
              </div>

              <button
                type="button"
                className="nav-icon-btn"
                onClick={handleClose}
                aria-label={msg(locale, 'closeDrawer')}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="trace-sheet-toolbar">
              {condition === 'c2' && primaryClips.length >= 2 && (
                <button type="button" className="drawer-btn primary" onClick={handleChainClick}>
                  {isPlayingChain ? (
                    <PauseIcon size={13} weight="fill" />
                  ) : (
                    <PlayIcon size={13} weight="fill" />
                  )}
                  <span>
                    {isPlayingChain
                      ? msg(locale, 'playingChain')
                      : `${msg(locale, 'playChain')} (${chainTotalSec}s)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                className={`drawer-btn${isFlagged ? ' flagged' : ''}`}
                onClick={() => toggleClaimFlag(claim.id)}
                aria-pressed={isFlagged}
              >
                <FlagIcon size={13} weight={isFlagged ? 'fill' : 'regular'} />
                <span>{msg(locale, isFlagged ? 'flaggedClaim' : 'flagClaim')}</span>
              </button>

              {canJumpDensity && (
                <button
                  type="button"
                  className="drawer-btn"
                  onClick={() =>
                    jumpToClaimInDensity(claim.id, density === 'brief' ? 'detailed' : 'brief')
                  }
                >
                  {density === 'brief' ? (
                    <BookOpenTextIcon size={13} />
                  ) : (
                    <SquaresFourIcon size={13} />
                  )}
                  <span>
                    {msg(locale, density === 'brief' ? 'jumpToDetailed' : 'jumpToBrief')}
                  </span>
                </button>
              )}
            </div>

            <div className="trace-sheet-scroll">
              {density === 'brief' && (
                <div className="trace-prose-box">
                  <button
                    type="button"
                    className="trace-prose-toggle"
                    onClick={() => setShowProsePreview((v) => !v)}
                    aria-expanded={showProsePreview}
                  >
                    <span>
                      {msg(locale, showProsePreview ? 'hideClaimProse' : 'readClaimProse')}
                    </span>
                    {showProsePreview ? <CaretUpIcon size={13} /> : <CaretDownIcon size={13} />}
                  </button>
                  {showProsePreview && (
                    <p className="trace-prose-body">{pickText(claim.detailedBody, locale)}</p>
                  )}
                </div>
              )}

              {condition === 'c2' && allVisibleClips.length >= 2 && (
                <div className="mini-timeline-box">
                  <div className="mini-timeline-head">
                    <span>{msg(locale, 'timelineSpanTitle')}</span>
                    {bridgeNotice && activeClaimId === claim.id && (
                      <span className="bridge-toast">{bridgeNotice}</span>
                    )}
                  </div>
                  <div className="mini-timeline-rail">
                    <div className="mini-timeline-base" />
                    {spanWidthPct > 2 && (
                      <div
                        className="mini-timeline-span"
                        style={{ left: `${spanLeftPct}%`, width: `${spanWidthPct}%` }}
                      />
                    )}
                    {allVisibleClips.map((anchor) => {
                      const leftPct =
                        lecture.durationMs > 0
                          ? Math.max(
                              1.5,
                              Math.min(98.5, (anchor.startMs / lecture.durationMs) * 100),
                            )
                          : 0
                      const pinClass =
                        anchor.relation === 'origin'
                          ? 'origin'
                          : anchor.tier === 'alert'
                            ? anchor.relation
                            : 'elaboration'
                      return (
                        <button
                          key={anchor.id}
                          type="button"
                          className={`mini-timeline-pin ${pinClass}`}
                          style={{ left: `${leftPct}%` }}
                          title={`${relationLabel(anchor.relation, locale)} · ${formatClock(anchor.startMs)}`}
                          onClick={() => playBoundedAnchor(lecture, claim.id, anchor, locale)}
                        />
                      )
                    })}
                  </div>
                  <div className="mini-timeline-ends">
                    <span>00:00</span>
                    <span>{formatClock(lecture.durationMs)}</span>
                  </div>
                </div>
              )}

              <div className="clips-stack">
                {primaryClips.map((anchor) => (
                  <BoundedClipPlayer
                    key={anchor.id}
                    lecture={lecture}
                    claimId={claim.id}
                    anchor={anchor}
                  />
                ))}
              </div>

              {condition === 'c2' && visible.elaborations.length > 0 && (
                <>
                  <button
                    type="button"
                    className="elaboration-toggle"
                    onClick={handleExpandElaborations}
                    aria-expanded={showElaborations}
                  >
                    {showElaborations ? <CaretUpIcon size={13} /> : <CaretDownIcon size={13} />}
                    <span>
                      {showElaborations
                        ? msg(locale, 'collapseElaborations')
                        : msg(locale, 'expandElaborations', {
                            count: visible.elaborations.length,
                          })}
                    </span>
                  </button>

                  {showElaborations && (
                    <div className="clips-stack">
                      {visible.elaborations.map((anchor) => (
                        <BoundedClipPlayer
                          key={anchor.id}
                          lecture={lecture}
                          claimId={claim.id}
                          anchor={anchor}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
