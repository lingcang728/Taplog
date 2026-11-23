import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CheckCircleIcon,
  RowsIcon,
  SquareSplitHorizontalIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { formatClock, formatDuration, msg, pickText } from '../i18n/messages'
import { collectLectureAlerts } from '../state/condition'
import {
  setActiveChapter,
  setBriefShowAllChapters,
  useWorkspace,
} from '../state/workspace'
import type { Lecture } from '../types/lecture'
import { Cover } from './Cover'
import { FlowSchemaView } from './schemas/FlowSchemaView'
import { MatrixSchemaView } from './schemas/MatrixSchemaView'

export function BriefCanvas({ lecture }: { lecture: Lecture }) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const activeChapterId = useWorkspace((s) => s.activeChapterId)
  const showAllChapters = useWorkspace((s) => s.briefShowAllChapters)
  const highlightedClaimId = useWorkspace((s) => s.highlightedClaimId)
  const verifiedIds = useWorkspace((s) => s.verifiedAnchorIds)

  const allAlerts = useMemo(() => collectLectureAlerts(lecture), [lecture])
  const verifiedAlertCount = allAlerts.filter((item) =>
    verifiedIds.includes(item.anchor.id),
  ).length

  const resolvedChapterId =
    lecture.chapters.find((c) => c.id === activeChapterId)?.id ??
    lecture.chapters[0]?.id ??
    null

  const visibleChapters = showAllChapters
    ? lecture.chapters
    : lecture.chapters.filter((c) => c.id === resolvedChapterId)

  const speakerShort = pickText(lecture.speaker, locale).split('·')[0]?.trim() ?? ''

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapter(chapterId)
    if (showAllChapters) {
      document
        .getElementById(`brief-${chapterId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="brief-canvas">
      <header className="lecture-banner">
        <div className="lecture-banner-art" aria-hidden="true">
          <Cover seed={lecture.id} />
        </div>
        <div className="lecture-banner-shade" aria-hidden="true" />

        <div className="lecture-banner-content">
          <div className="lecture-header-main">
            <h1 className="lecture-title">{pickText(lecture.title, locale)}</h1>
            <div className="lecture-meta-row">
              <span>{speakerShort}</span>
              <span>·</span>
              <span>{formatDuration(lecture.durationMs, locale)}</span>
              {lecture.humanVerified && (
                <>
                  <span>·</span>
                  <span className="inline-verified">
                    <CheckCircleIcon size={13} weight="fill" />
                    <span>{msg(locale, 'verifiedHuman')}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {condition === 'c2' && allAlerts.length > 0 && (
            <span className="meta-pill alerts">
              <WarningCircleIcon size={14} weight="fill" />
              <span>
                {verifiedAlertCount}/{allAlerts.length} {msg(locale, 'chapterAlertsCount')}
              </span>
            </span>
          )}
        </div>
      </header>

      {condition === 'c4' && (
        <div className="c4-notice-banner">{msg(locale, 'pureVisualNotice')}</div>
      )}

      <div className="chapter-bar-row">
        <nav className="brief-chapter-strip" aria-label={msg(locale, 'chaptersLabel')}>
          {lecture.chapters.map((chapter) => {
            const unverifiedChapterAlerts = chapter.claims.reduce(
              (count, claim) =>
                count +
                claim.anchors.filter(
                  (a) => a.tier === 'alert' && !verifiedIds.includes(a.id),
                ).length,
              0,
            )
            const active = resolvedChapterId === chapter.id
            return (
              <button
                key={chapter.id}
                type="button"
                className={`chapter-jump-pill${active ? ' active' : ''}`}
                onClick={() => handleSelectChapter(chapter.id)}
              >
                <span className="pill-time">0{chapter.index}</span>
                <span>{pickText(chapter.title, locale)}</span>
                {condition === 'c2' && unverifiedChapterAlerts > 0 && (
                  <span className="pill-alert-dot">{unverifiedChapterAlerts}</span>
                )}
              </button>
            )
          })}
        </nav>

        {lecture.chapters.length > 1 && (
          <button
            type="button"
            className="chapter-mode-toggle"
            onClick={() => setBriefShowAllChapters(!showAllChapters)}
            aria-pressed={showAllChapters}
          >
            {showAllChapters ? <SquareSplitHorizontalIcon size={14} /> : <RowsIcon size={14} />}
            <span>
              {msg(locale, showAllChapters ? 'focusSingleChapter' : 'showAllChapters')}
            </span>
          </button>
        )}
      </div>

      <div className="brief-chapters-stack">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={showAllChapters ? 'all-chapters' : (resolvedChapterId ?? 'none')}
            className="brief-chapters-stack"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.14 } }}
          >
            {visibleChapters.map((chapter) => (
              <section
                key={chapter.id}
                id={`brief-${chapter.id}`}
                className="brief-chapter-card"
                onMouseEnter={() => {
                  if (showAllChapters) setActiveChapter(chapter.id)
                }}
              >
                <div className="chapter-head">
                  <div>
                    <div className="chapter-head-title-wrap">
                      <span className="chapter-index">0{chapter.index}</span>
                      <h2 className="chapter-title">{pickText(chapter.title, locale)}</h2>
                    </div>
                    <p className="chapter-summary">{pickText(chapter.summary, locale)}</p>
                  </div>
                  {condition !== 'c4' && (
                    <span className="chapter-span">
                      {formatClock(chapter.startMs)} - {formatClock(chapter.endMs)}
                    </span>
                  )}
                </div>

                {chapter.schema.kind === 'flow' ? (
                  <FlowSchemaView
                    lecture={lecture}
                    chapter={chapter}
                    compact={false}
                    highlightedClaimId={highlightedClaimId}
                  />
                ) : (
                  <MatrixSchemaView
                    lecture={lecture}
                    chapter={chapter}
                    compact={false}
                    highlightedClaimId={highlightedClaimId}
                  />
                )}
              </section>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
