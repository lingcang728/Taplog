import type {
  ReadingDensity,
  RelationType,
  StudyCondition,
  TaskResponse,
  TelemetryAction,
  TelemetryEvent,
} from '../types/lecture'
import { createStore, useStore } from './store'

export interface TelemetryState {
  sessionStartedAtMs: number
  participantId: string
  events: TelemetryEvent[]
  responses: Record<string, TaskResponse>
}

const initialStartedAt = Date.now()

export const telemetry = createStore<TelemetryState>({
  sessionStartedAtMs: initialStartedAt,
  participantId: 'P01',
  events: [],
  responses: {},
})

export const useTelemetry = <S,>(selector: (state: TelemetryState) => S) =>
  useStore(telemetry, selector)

let seq = 0

export function logTelemetry(input: {
  lectureId: string
  condition: StudyCondition
  density: ReadingDensity
  action: TelemetryAction
  claimId?: string
  anchorId?: string
  relation?: RelationType
  detail?: string
}) {
  const now = Date.now()
  const state = telemetry.get()
  const event: TelemetryEvent = {
    id: `ev-${++seq}-${now.toString(36)}`,
    atIso: new Date(now).toISOString(),
    elapsedSessionMs: Math.max(0, now - state.sessionStartedAtMs),
    ...input,
  }
  telemetry.set({ events: [...state.events, event] })

  if (input.action === 'clip_play' || input.action === 'clip_chain_play') {
    const updated: Record<string, TaskResponse> = {}
    let touched = false
    for (const [key, resp] of Object.entries(state.responses)) {
      if (resp.lectureId === input.lectureId && resp.completedAtMs === undefined) {
        updated[key] = { ...resp, clipsPlayedCount: resp.clipsPlayedCount + 1 }
        touched = true
      } else {
        updated[key] = resp
      }
    }
    if (touched) telemetry.set({ responses: updated })
  }
}

export function setParticipantId(participantId: string) {
  telemetry.set({ participantId: participantId.trim() || 'P01' })
}

export function startTaskAttempt(input: {
  taskId: string
  lectureId: string
  condition: StudyCondition
  density: ReadingDensity
}) {
  const key = `${input.condition}:${input.taskId}`
  const existing = telemetry.get().responses[key]
  if (existing) return existing
  const next: TaskResponse = {
    taskId: input.taskId,
    lectureId: input.lectureId,
    condition: input.condition,
    densityAtStart: input.density,
    startedAtMs: Date.now(),
    clipsPlayedCount: 0,
  }
  telemetry.set((curr) => ({
    responses: { ...curr.responses, [key]: next },
  }))
  return next
}

export function submitTaskStep1(input: {
  taskId: string
  lectureId: string
  condition: StudyCondition
  density: ReadingDensity
  optionId: string
  confidence: number
}) {
  const key = `${input.condition}:${input.taskId}`
  const base =
    telemetry.get().responses[key] ??
    startTaskAttempt({
      taskId: input.taskId,
      lectureId: input.lectureId,
      condition: input.condition,
      density: input.density,
    })
  const next: TaskResponse = {
    ...base,
    step1OptionId: input.optionId,
    step1Confidence: input.confidence,
    step1AtMs: Date.now(),
  }
  telemetry.set((curr) => ({
    responses: { ...curr.responses, [key]: next },
  }))
  logTelemetry({
    lectureId: input.lectureId,
    condition: input.condition,
    density: input.density,
    action: 'task_step1_submit',
    detail: `${input.taskId}:opt=${input.optionId}:conf=${input.confidence}`,
  })
}

export function submitTaskFinal(input: {
  taskId: string
  lectureId: string
  condition: StudyCondition
  density: ReadingDensity
  optionId: string
  confidence: number
  correctOptionId: string
}) {
  const key = `${input.condition}:${input.taskId}`
  const base =
    telemetry.get().responses[key] ??
    startTaskAttempt({
      taskId: input.taskId,
      lectureId: input.lectureId,
      condition: input.condition,
      density: input.density,
    })
  const correct = input.optionId === input.correctOptionId
  const next: TaskResponse = {
    ...base,
    finalOptionId: input.optionId,
    finalConfidence: input.confidence,
    completedAtMs: Date.now(),
    correct,
  }
  telemetry.set((curr) => ({
    responses: { ...curr.responses, [key]: next },
  }))
  logTelemetry({
    lectureId: input.lectureId,
    condition: input.condition,
    density: input.density,
    action: 'task_final_submit',
    detail: `${input.taskId}:opt=${input.optionId}:conf=${input.confidence}:correct=${correct}`,
  })
}

export function clearTelemetrySession() {
  telemetry.set({
    sessionStartedAtMs: Date.now(),
    events: [],
    responses: {},
  })
}

function csvCell(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return ''
  const raw = String(value)
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

export function exportTelemetryCsv(state: TelemetryState = telemetry.get()): string {
  const header = [
    'record_type',
    'participant_id',
    'timestamp_iso',
    'elapsed_ms',
    'lecture_id',
    'condition',
    'density',
    'action_or_task',
    'claim_id',
    'anchor_id',
    'relation',
    'step1_option',
    'step1_confidence',
    'final_option',
    'final_confidence',
    'correct',
    'task_duration_ms',
    'clips_played',
    'detail',
  ]
  const rows: string[] = [header.join(',')]

  for (const ev of state.events) {
    rows.push(
      [
        'event',
        state.participantId,
        ev.atIso,
        ev.elapsedSessionMs,
        ev.lectureId,
        ev.condition,
        ev.density,
        ev.action,
        ev.claimId ?? '',
        ev.anchorId ?? '',
        ev.relation ?? '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ev.detail ?? '',
      ]
        .map(csvCell)
        .join(','),
    )
  }

  for (const resp of Object.values(state.responses)) {
    const duration =
      resp.completedAtMs !== undefined
        ? Math.max(0, resp.completedAtMs - resp.startedAtMs)
        : ''
    rows.push(
      [
        'task_response',
        state.participantId,
        resp.completedAtMs ? new Date(resp.completedAtMs).toISOString() : '',
        '',
        resp.lectureId,
        resp.condition,
        resp.densityAtStart,
        resp.taskId,
        '',
        '',
        '',
        resp.step1OptionId ?? '',
        resp.step1Confidence ?? '',
        resp.finalOptionId ?? '',
        resp.finalConfidence ?? '',
        resp.correct ?? '',
        duration,
        resp.clipsPlayedCount,
        '',
      ]
        .map(csvCell)
        .join(','),
    )
  }

  return rows.join('\n')
}

export function exportTelemetryJson(state: TelemetryState = telemetry.get()): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      participantId: state.participantId,
      sessionStartedAt: new Date(state.sessionStartedAtMs).toISOString(),
      responses: Object.values(state.responses),
      events: state.events,
    },
    null,
    2,
  )
}
