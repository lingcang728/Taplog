import type {
  AnchorTier,
  Claim,
  EvidenceAnchor,
  Lecture,
  RelationType,
  StudyCondition,
  TranscriptSegment,
} from '../types/lecture'

export function tierForRelation(relation: RelationType): AnchorTier {
  if (relation === 'origin') return 'origin'
  if (relation === 'caveat' || relation === 'correction') return 'alert'
  return 'elaboration'
}

export interface VisibleAnchors {
  origin: EvidenceAnchor | null
  alerts: EvidenceAnchor[]
  elaborations: EvidenceAnchor[]
  hasTraceability: boolean
}

/**
 * Pure experimental filter: C1, C2, C3, C4 read the exact same Claim text and schema,
 * varying strictly the traceability affordances to prevent confounding variables.
 */
export function visibleAnchorsForCondition(
  claim: Claim,
  condition: StudyCondition,
): VisibleAnchors {
  if (condition === 'c3' || condition === 'c4') {
    return { origin: null, alerts: [], elaborations: [], hasTraceability: false }
  }
  const origin = claim.anchors.find((anchor) => anchor.relation === 'origin') ?? null
  if (condition === 'c1') {
    return {
      origin,
      alerts: [],
      elaborations: [],
      hasTraceability: Boolean(origin),
    }
  }
  return {
    origin,
    alerts: claim.anchors.filter((anchor) => anchor.tier === 'alert'),
    elaborations: claim.anchors.filter((anchor) => anchor.tier === 'elaboration'),
    hasTraceability: claim.anchors.length > 0,
  }
}

/** Find the Claim bound to a FlowNode or MatrixCell id inside a lecture or chapter. */
export function findClaimForSchemaTarget(
  claims: readonly Claim[],
  targetId: string,
): Claim | null {
  return claims.find((claim) => claim.schemaTargetId === targetId) ?? null
}

/** Return up to `radius` surrounding transcript segments around an anchor without scrolling the main page. */
export function surroundingSegments(
  transcript: readonly TranscriptSegment[],
  anchor: Pick<EvidenceAnchor, 'startMs' | 'endMs'>,
  radius = 2,
): { segments: TranscriptSegment[]; focusIds: Set<string> } {
  if (!transcript.length) return { segments: [], focusIds: new Set() }
  let firstMatch = transcript.findIndex(
    (seg) => seg.endMs > anchor.startMs && seg.startMs < anchor.endMs,
  )
  if (firstMatch < 0) {
    firstMatch = transcript.findIndex((seg) => seg.startMs >= anchor.startMs)
    if (firstMatch < 0) firstMatch = transcript.length - 1
  }
  let lastMatch = firstMatch
  while (
    lastMatch + 1 < transcript.length &&
    transcript[lastMatch + 1]!.startMs < anchor.endMs
  ) {
    lastMatch++
  }
  const start = Math.max(0, firstMatch - radius)
  const end = Math.min(transcript.length, lastMatch + 1 + radius)
  const focusIds = new Set<string>()
  for (let idx = firstMatch; idx <= lastMatch; idx++) {
    const seg = transcript[idx]
    if (seg) focusIds.add(seg.id)
  }
  return {
    segments: transcript.slice(start, end),
    focusIds,
  }
}

/** Collect all alerts across a lecture for overview stats and GlobalAudioBar markers. */
export function collectLectureAlerts(lecture: Lecture): Array<{
  claim: Claim
  anchor: EvidenceAnchor
}> {
  const list: Array<{ claim: Claim; anchor: EvidenceAnchor }> = []
  for (const chapter of lecture.chapters) {
    for (const claim of chapter.claims) {
      for (const anchor of claim.anchors) {
        if (anchor.tier === 'alert') list.push({ claim, anchor })
      }
    }
  }
  return list.sort((a, b) => a.anchor.startMs - b.anchor.startMs)
}
