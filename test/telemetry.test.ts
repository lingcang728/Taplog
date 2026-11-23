import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearTelemetrySession,
  exportTelemetryCsv,
  exportTelemetryJson,
  logTelemetry,
  setParticipantId,
  submitTaskFinal,
  submitTaskStep1,
  telemetry,
} from '../src/state/telemetry'

describe('Study telemetry & H5 two-step confidence tracking', () => {
  beforeEach(() => {
    clearTelemetrySession()
    setParticipantId('P07')
  })

  it('tracks step1 confidence, increments clipsPlayedCount during verification, and computes final accuracy', () => {
    submitTaskStep1({
      taskId: 'm1-task-t2',
      lectureId: 'lecture-ui-perf',
      condition: 'c1',
      density: 'brief',
      optionId: 'yes',
      confidence: 3,
    })

    logTelemetry({
      lectureId: 'lecture-ui-perf',
      condition: 'c1',
      density: 'brief',
      action: 'clip_play',
      claimId: 'm1-c2-3',
      anchorId: 'm1-a2-3-orig',
      relation: 'origin',
    })

    submitTaskFinal({
      taskId: 'm1-task-t2',
      lectureId: 'lecture-ui-perf',
      condition: 'c1',
      density: 'brief',
      optionId: 'yes',
      confidence: 5,
      correctOptionId: 'no',
    })

    const resp = telemetry.get().responses['c1:m1-task-t2']
    expect(resp).toBeDefined()
    expect(resp?.step1Confidence).toBe(3)
    expect(resp?.finalConfidence).toBe(5)
    expect(resp?.correct).toBe(false)
    expect(resp?.clipsPlayedCount).toBe(1)
  })

  it('exports valid escaped CSV and structured JSON', () => {
    logTelemetry({
      lectureId: 'lecture-ui-perf',
      condition: 'c2',
      density: 'detailed',
      action: 'drawer_open',
      claimId: 'm1-c2-2',
      detail: 'note, with "quotes"',
    })

    const csv = exportTelemetryCsv()
    expect(csv).toContain('record_type,participant_id')
    expect(csv).toContain('P07')
    expect(csv).toContain('"note, with ""quotes"""')

    const parsed = JSON.parse(exportTelemetryJson())
    expect(parsed.participantId).toBe('P07')
    expect(parsed.events.length).toBe(1)
  })
})
