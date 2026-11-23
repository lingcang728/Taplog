import { describe, expect, it } from 'vitest'
import { BUILT_IN_LECTURES } from '../src/data/lectures'
import {
  collectLectureAlerts,
  findClaimForSchemaTarget,
  surroundingSegments,
  visibleAnchorsForCondition,
} from '../src/state/condition'

describe('Built-in lectures data integrity', () => {
  it('contains zero em-dashes or en-dashes across all lecture copy', () => {
    const serialized = JSON.stringify(BUILT_IN_LECTURES)
    expect(serialized).not.toMatch(/[—–]/)
  })

  it('binds every claim schemaTargetId to an actual FlowNode or MatrixCell and overlaps verbatim transcript', () => {
    for (const lecture of BUILT_IN_LECTURES) {
      expect(lecture.chapters.length).toBeGreaterThanOrEqual(3)
      expect(lecture.studyTasks.length).toBe(4)

      for (const chapter of lecture.chapters) {
        const validIds = new Set<string>()
        if (chapter.schema.kind === 'flow') {
          for (const node of chapter.schema.nodes) validIds.add(node.id)
        } else {
          for (const row of chapter.schema.rows) {
            for (const cell of row.cells) validIds.add(cell.id)
          }
        }

        for (const claim of chapter.claims) {
          expect(validIds.has(claim.schemaTargetId)).toBe(true)
          expect(findClaimForSchemaTarget(chapter.claims, claim.schemaTargetId)?.id).toBe(claim.id)
          expect(claim.anchors.some((a) => a.relation === 'origin')).toBe(true)

          for (const anchor of claim.anchors) {
            expect(anchor.startMs).toBeGreaterThanOrEqual(0)
            expect(anchor.endMs).toBeGreaterThan(anchor.startMs)
            expect(anchor.endMs).toBeLessThanOrEqual(lecture.durationMs)
            const window = surroundingSegments(lecture.transcript, anchor, 2)
            expect(window.segments.length).toBeGreaterThan(0)
            expect(window.focusIds.size).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('includes distant >= 14 minute caveats/corrections in both M1 and M2', () => {
    for (const lecture of BUILT_IN_LECTURES) {
      const alerts = collectLectureAlerts(lecture)
      expect(alerts.length).toBeGreaterThanOrEqual(2)
      expect(alerts.some((item) => item.anchor.offsetFromOriginMs >= 14 * 60_000)).toBe(true)
    }
  })
})

describe('visibleAnchorsForCondition experimental isolation', () => {
  const m1 = BUILT_IN_LECTURES[0]!
  const caveatClaim = m1.chapters[1]!.claims[1]! // m1-c2-2: origin + example + caveat

  it('hides all traceability under C3 and C4', () => {
    for (const cond of ['c3', 'c4'] as const) {
      const vis = visibleAnchorsForCondition(caveatClaim, cond)
      expect(vis.hasTraceability).toBe(false)
      expect(vis.origin).toBeNull()
      expect(vis.alerts).toHaveLength(0)
      expect(vis.elaborations).toHaveLength(0)
    }
  })

  it('exposes strictly single origin under C1 baseline while keeping claim wording identical', () => {
    const c1 = visibleAnchorsForCondition(caveatClaim, 'c1')
    const c2 = visibleAnchorsForCondition(caveatClaim, 'c2')
    expect(c1.hasTraceability).toBe(true)
    expect(c1.origin?.id).toBe(c2.origin?.id)
    expect(c1.alerts).toHaveLength(0)
    expect(c1.elaborations).toHaveLength(0)
  })

  it('separates alert tier (caveat/correction) from elaboration tier (reason/example) under C2', () => {
    const c2 = visibleAnchorsForCondition(caveatClaim, 'c2')
    expect(c2.origin?.relation).toBe('origin')
    expect(c2.alerts.map((a) => a.relation)).toEqual(['caveat'])
    expect(c2.elaborations.map((a) => a.relation)).toEqual(['example'])
  })
})
