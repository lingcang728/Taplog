import { CheckCircleIcon, FlagIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { formatClock, formatDuration, msg, pickText } from '../i18n/messages'
import { collectLectureAlerts } from '../state/condition'
import {
  setActiveChapter,
  setHighlightedClaim,
  toggleClaimDrawer,
  useWorkspace,
} from '../state/workspace'
import type { Lecture } from '../types/lecture'
import { FlowSchemaView } from './schemas/FlowSchemaView'
import { MatrixSchemaView } from './schemas/MatrixSchemaView'
import { AnchorBadges } from './trace/AnchorBadges'

export function DetailedNotebook({ lecture }: { lecture: Lecture }) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const activeChapterId = useWorkspace((s) => s.activeChapterId)
  const openClaimId = useWorkspace((s) => s.openClaimId)
  const highlightedClaimId = useWorkspace((s) => s.highlightedClaimId)
  const verifiedIds = useWorkspace((s) => s.verifiedAnchorIds)
  const flaggedIds = useWorkspace((s) => s.flaggedClaimIds)

  const allAlerts = collectLectureAlerts(lecture)
  const verifiedAlertCount = allAlerts.filter((item) =>
    verifiedIds.includes(item.anchor.id),
  ).length

  const scrollToChapter = (chapterId: string) => {
    setActiveChapter(chapterId)
    document
      .getElementById(`detail-${chapterId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="detailed-shell">
      <aside className="detailed-toc" aria-label={msg(locale, 'chaptersLabel')}>
        <span className="toc-heading">{msg(locale, 'chaptersLabel')}</span>
        {lecture.chapters.map((chapter) => {
          const alertCount = chapter.claims.reduce(
            (sum, claim) =>
              sum +
              claim.anchors.filter(
                (a) => a.tier === 'alert' && !verifiedIds.includes(a.id),
              ).length,
            0,
          )
          return (
            <button
              key={chapter.id}
              type="button"
              className={`toc-link${activeChapterId === chapter.id ? ' active' : ''}`}
              onClick={() => scrollToChapter(chapter.id)}
            >
              <span>
                0{chapter.index} · {pickText(chapter.title, locale)}
              </span>
              <span className="toc-link-meta">
                {condition !== 'c4' && <span>{formatClock(chapter.startMs)}</span>}
                {condition === 'c2' && alertCount > 0 && (
                  <span className="pill-alert-dot">{alertCount}</span>
                )}
              </span>
            </button>
          )
        })}
      </aside>

      <article className="detailed-content">
        <header className="lecture-header editorial-head">
          <div className="lecture-header-main">
            <h1 className="lecture-title">{pickText(lecture.title, locale)}</h1>
            <div className="lecture-meta-row">
              <span>{pickText(lecture.speaker, locale)}</span>
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
        </header>

        {condition === 'c4' && (
          <div className="c4-notice-banner">{msg(locale, 'pureVisualNotice')}</div>
        )}

        {lecture.chapters.map((chapter) => (
          <section
            key={chapter.id}
            id={`detail-${chapter.id}`}
            className="detailed-chapter-section"
            onMouseEnter={() => setActiveChapter(chapter.id)}
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

            <div className="detailed-chapter-figure">
              {chapter.schema.kind === 'flow' ? (
                <FlowSchemaView
                  lecture={lecture}
                  chapter={chapter}
                  compact={true}
                  highlightedClaimId={highlightedClaimId}
                  onHoverClaim={setHighlightedClaim}
                />
              ) : (
                <MatrixSchemaView
                  lecture={lecture}
                  chapter={chapter}
                  compact={true}
                  highlightedClaimId={highlightedClaimId}
                  onHoverClaim={setHighlightedClaim}
                />
              )}
            </div>

            <div className="detailed-claims-list">
              {chapter.claims.map((claim) => {
                const isOpen = openClaimId === claim.id
                const isHighlighted = highlightedClaimId === claim.id
                const isFlagged = flaggedIds.includes(claim.id)
                return (
                  <div
                    key={claim.id}
                    data-claim-id={claim.id}
                    className={`claim-editorial-row${isHighlighted ? ' is-highlighted' : ''}${isOpen ? ' is-open' : ''}`}
                    onMouseEnter={() => setHighlightedClaim(claim.id)}
                    onMouseLeave={() => setHighlightedClaim(null)}
                  >
                    <div className="claim-prose-col">
                      <h3 className="claim-heading">
                        <span>{pickText(claim.conciseTitle, locale)}</span>
                      </h3>
                      <p className="claim-body">{pickText(claim.detailedBody, locale)}</p>
                    </div>

                    {condition !== 'c4' && (
                      <div className="claim-margin-rail">
                        <AnchorBadges
                          lecture={lecture}
                          claim={claim}
                          compact={false}
                          isOpen={isOpen}
                          onToggleOpen={toggleClaimDrawer}
                        />
                        {isFlagged && (
                          <span className="claim-flagged-tag">
                            <FlagIcon size={12} weight="fill" />
                            <span>{msg(locale, 'flaggedClaim')}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </article>
    </div>
  )
}
