import { msg, pickText } from '../../i18n/messages'
import { findClaimForSchemaTarget, visibleAnchorsForCondition } from '../../state/condition'
import { toggleClaimDrawer, useWorkspace } from '../../state/workspace'
import type { Chapter, Lecture } from '../../types/lecture'
import { AnchorBadges } from '../trace/AnchorBadges'

export interface MatrixSchemaViewProps {
  lecture: Lecture
  chapter: Chapter
  compact?: boolean
  highlightedClaimId?: string | null
  onHoverClaim?: (claimId: string | null) => void
}

export function MatrixSchemaView({
  lecture,
  chapter,
  compact = false,
  highlightedClaimId = null,
  onHoverClaim,
}: MatrixSchemaViewProps) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const openClaimId = useWorkspace((s) => s.openClaimId)

  if (chapter.schema.kind !== 'matrix') return null
  const { title, columns, rows } = chapter.schema

  const handleCellClick = (claimId: string | undefined) => {
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

      <div className="matrix-scroll">
        <table className={`matrix-table${compact ? ' is-compact' : ''}`}>
          <thead>
            <tr>
              <th scope="col">{locale === 'zh' ? '方案 / 机制' : 'Mechanism'}</th>
              {columns.map((col) => (
                <th key={col.id} scope="col">
                  {pickText(col.label, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <span className="matrix-row-subject">{pickText(row.subject, locale)}</span>
                  {row.subtitle && !compact && (
                    <span className="matrix-row-sub">{pickText(row.subtitle, locale)}</span>
                  )}
                </th>
                {columns.map((col) => {
                  const cell = row.cells.find((item) => item.columnId === col.id)
                  if (!cell) return <td key={col.id} />
                  const claim = findClaimForSchemaTarget(chapter.claims, cell.id)
                  const visible = claim ? visibleAnchorsForCondition(claim, condition) : null
                  const hasAlerts = Boolean(visible && visible.alerts.length > 0)
                  const isOpen = Boolean(claim && openClaimId === claim.id)
                  const isHighlighted = Boolean(claim && highlightedClaimId === claim.id)

                  return (
                    <td
                      key={cell.id}
                      data-claim-id={!compact && claim ? claim.id : undefined}
                      className={[
                        'matrix-td',
                        claim ? 'is-clickable' : '',
                        hasAlerts ? 'has-alert-cell' : '',
                        isHighlighted ? 'is-highlighted' : '',
                        isOpen ? 'is-open' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleCellClick(claim?.id)}
                      onMouseEnter={() => onHoverClaim?.(claim?.id ?? null)}
                      onMouseLeave={() => onHoverClaim?.(null)}
                    >
                      <div className="matrix-cell-inner">
                        <span className="matrix-cell-value">{pickText(cell.value, locale)}</span>
                        {claim && (
                          <AnchorBadges
                            lecture={lecture}
                            claim={claim}
                            compact={true}
                            isOpen={isOpen}
                            onToggleOpen={toggleClaimDrawer}
                          />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
