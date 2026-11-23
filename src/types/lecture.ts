export type Locale = 'zh' | 'en'
export type ThemeMode = 'system' | 'light' | 'dark'
export type WorkspacePage = 'gallery' | 'lecture'
export type GalleryFilter = 'all' | 'alerts' | 'imported'
export type ReadingDensity = 'brief' | 'detailed'
export type VisualStyle = 'mist' | 'paper'
export type StudyCondition = 'c1' | 'c2' | 'c3' | 'c4'
export type RelationType = 'origin' | 'caveat' | 'correction' | 'reason' | 'example'
export type AnchorTier = 'origin' | 'alert' | 'elaboration'

export interface LocalizedText {
  zh: string
  en: string
}

export interface TranscriptSegment {
  id: string
  startMs: number
  endMs: number
  speaker?: LocalizedText
  text: LocalizedText
}

export interface EvidenceAnchor {
  id: string
  relation: RelationType
  tier: AnchorTier
  startMs: number
  endMs: number
  /** Milliseconds between this clip and the claim's primary origin clip. */
  offsetFromOriginMs: number
  /** Short situational header so listeners dropped 20+ min ahead know what is happening. */
  contextBridge?: LocalizedText
  /** First 15-20 chars / ~12 words of verbatim speech + ellipsis (Information Scent). */
  verbatimLead: LocalizedText
  /** Complete verbatim sentence(s) spoken in [startMs, endMs]. */
  fullQuote: LocalizedText
}

export interface Claim {
  id: string
  chapterId: string
  /** ID of the corresponding FlowNode or MatrixCell so Brief and Detailed views share one truth. */
  schemaTargetId: string
  /** Compressed node/headline label (<= 15 chars in zh) shared identically across C1, C2, C4. */
  conciseTitle: LocalizedText
  /** Detailed editorial prose explaining the claim in its chapter context without spoiling distant caveats. */
  detailedBody: LocalizedText
  anchors: EvidenceAnchor[]
}

export interface FlowNode {
  id: string
  stepTag: LocalizedText
  title: LocalizedText
  caption: LocalizedText
  edgeLabelToNext?: LocalizedText
}

export interface MatrixColumn {
  id: string
  label: LocalizedText
}

export interface MatrixCell {
  id: string
  columnId: string
  value: LocalizedText
}

export interface MatrixRow {
  id: string
  subject: LocalizedText
  subtitle?: LocalizedText
  cells: MatrixCell[]
}

export type VisualSchema =
  | {
      kind: 'flow'
      title: LocalizedText
      subtitle: LocalizedText
      nodes: FlowNode[]
    }
  | {
      kind: 'matrix'
      title: LocalizedText
      subtitle: LocalizedText
      columns: MatrixColumn[]
      rows: MatrixRow[]
    }

export interface Chapter {
  id: string
  index: number
  title: LocalizedText
  startMs: number
  endMs: number
  summary: LocalizedText
  schema: VisualSchema
  claims: Claim[]
}

export type StudyTaskKind = 't1' | 't2' | 't3' | 't4'

export interface StudyOption {
  id: string
  label: LocalizedText
}

export interface StudyTask {
  id: string
  kind: StudyTaskKind
  targetClaimId: string
  prompt: LocalizedText
  options: StudyOption[]
  correctOptionId: string
  /** T2 uses a 2-step confidence check (before audio vs after audio verification) to test H5. */
  twoStepConfidence?: boolean
}

export interface Lecture {
  id: string
  code: string
  title: LocalizedText
  speaker: LocalizedText
  venue: LocalizedText
  durationMs: number
  humanVerified: boolean
  /** Optional real audio URL (local ObjectURL from import or public asset). Synthesized speech/tone fallback when absent. */
  audioUrl?: string | null
  waveformPeaks?: number[]
  chapters: Chapter[]
  transcript: TranscriptSegment[]
  studyTasks: StudyTask[]
  importedAt?: string
}

export type TelemetryAction =
  | 'condition_change'
  | 'density_change'
  | 'style_change'
  | 'drawer_open'
  | 'elaboration_expand'
  | 'clip_play'
  | 'clip_chain_play'
  | 'clip_extend'
  | 'context_lines_open'
  | 'anchor_verified'
  | 'claim_flag_toggle'
  | 'transcript_search'
  | 'task_step1_submit'
  | 'task_final_submit'

export interface TelemetryEvent {
  id: string
  atIso: string
  elapsedSessionMs: number
  lectureId: string
  condition: StudyCondition
  density: ReadingDensity
  action: TelemetryAction
  claimId?: string
  anchorId?: string
  relation?: RelationType
  detail?: string
}

export interface TaskResponse {
  taskId: string
  lectureId: string
  condition: StudyCondition
  densityAtStart: ReadingDensity
  startedAtMs: number
  step1OptionId?: string
  step1Confidence?: number
  step1AtMs?: number
  finalOptionId?: string
  finalConfidence?: number
  completedAtMs?: number
  correct?: boolean
  clipsPlayedCount: number
}
