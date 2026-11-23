import { ArrowRightIcon } from '@phosphor-icons/react'
import { msg, pickText } from '../../i18n/messages'
import { findClaimForSchemaTarget, visibleAnchorsForCondition } from '../../state/condition'
import { toggleClaimDrawer, useWorkspace } from '../../state/workspace'
import type { Chapter, Lecture } from '../../types/lecture'
import { AnchorBadges } from '../trace/AnchorBadges'

export interface FlowSchemaViewProps {
  lecture: Lecture
  chapter: Chapter
  compact?: boolean
  highlightedClaimId?: string | null
  onHoverClaim?: (claimId: string | null) => void
}

export function FlowSchemaView({
  lecture,
  chapter,
  compact = false,
  highlightedClaimId = null,
  onHoverClaim,
}: FlowSchemaViewProps) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const openClaimId = useWorkspace((s) => s.openClaimId)
  const verifiedIds = useWorkspace((s) => s.verifiedAnchorIds)

  if (chapter.schema.kind !== 'flow') return null
  const { title, nodes } = chapter.schema

  const handleNodeClick = (claimId: string | undefined) => {
    if (!claimId) return
    if (compact) {
      const target = document.querySelector<HTMLElement>(
        `.claim-editorial-row[data-claim-id="${claimId}"]`,
      )
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (condition !== 'c4' && condition !== 'c3') {
        toggleClaimDrawer(claimId)
      }
      return
    }
    if (condition !== 'c4' && condition !== 'c3') {
      toggleClaimDrawer(claimId)
    }
  }

  return (
    <div className="schema-wrap">
      <div className="schema-header">
        <h3 className="schema-title">{pickText(title, locale)}</h3>
        {!compact && condition !== 'c4' && (
          <span className="schema-hint">{msg(locale, 'schemaClickHint')}</span>
        )}
      </div>

      <div className="flow-track">
        {nodes.map((node, index) => {
          const claim = findClaimForSchemaTarget(chapter.claims, node.id)
          const visible = claim ? visibleAnchorsForCondition(claim, condition) : null
          const hasUnverifiedAlert = Boolean(
            visible?.alerts.some((a) => !verifiedIds.includes(a.id)),
          )
          const hasCorrection = Boolean(
            visible?.alerts.some((a) => a.relation === 'correction'),
          )
          const isOpen = Boolean(claim && openClaimId === claim.id)
          const isHighlighted = Boolean(claim && highlightedClaimId === claim.id)

          return (
            <div key={node.id} className="flow-step-group">
              <article
                data-claim-id={!compact && claim ? claim.id : undefined}
                className={[
                  'flow-node-card',
                  compact ? 'is-compact' : '',
                  hasUnverifiedAlert ? 'has-unverified-alert' : '',
                  hasCorrection ? 'has-correction' : '',
                  isHighlighted ? 'is-highlighted' : '',
                  isOpen ? 'is-open' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleNodeClick(claim?.id)}
                onMouseEnter={() => onHoverClaim?.(claim?.id ?? null)}
                onMouseLeave={() => onHoverClaim?.(null)}
              >
                <span className="flow-step-tag">{pickText(node.stepTag, locale)}</span>
                <h4 className="flow-node-title">{pickText(node.title, locale)}</h4>
                {!compact && (
                  <p className="flow-node-caption">{pickText(node.caption, locale)}</p>
                )}

                {claim && (
                  <div className="flow-node-footer">
                    <AnchorBadges
                      lecture={lecture}
                      claim={claim}
                      compact={compact}
                      isOpen={isOpen}
                      onToggleOpen={toggleClaimDrawer}
                    />
                  </div>
                )}
              </article>

              {index < nodes.length - 1 && (
                <div className="flow-edge-connector" aria-hidden="true">
                  {node.edgeLabelToNext && !compact && (
                    <span className="flow-edge-label">
                      {pickText(node.edgeLabelToNext, locale)}
                    </span>
                  )}
                  <ArrowRightIcon size={15} weight="bold" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
