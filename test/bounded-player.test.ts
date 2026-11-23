import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeExtendedBounds,
  extendActiveClip,
  getAudioState,
  playBoundedAnchor,
  playEvidenceChain,
  resetAudioEngineForTest,
  setOnAnchorVerified,
} from '../src/audio/engine'
import type { EvidenceAnchor, Lecture } from '../src/types/lecture'

const anchorOrigin: EvidenceAnchor = {
  id: 'a-origin',
  relation: 'origin',
  tier: 'origin',
  startMs: 60_000,
  endMs: 66_000,
  offsetFromOriginMs: 0,
  verbatimLead: { zh: '原处前导...', en: 'Origin lead...' },
  fullQuote: { zh: '原处完整句子。', en: 'Origin full sentence.' },
}

const anchorCaveat: EvidenceAnchor = {
  id: 'a-caveat',
  relation: 'caveat',
  tier: 'alert',
  startMs: 1_500_000,
  endMs: 1_506_000,
  offsetFromOriginMs: 1_440_000,
  verbatimLead: { zh: '补条件前导...', en: 'Caveat lead...' },
  fullQuote: { zh: '补条件完整句子。', en: 'Caveat full sentence.' },
}

const sampleLecture: Lecture = {
  id: 'lec-test',
  code: 'T1',
  title: { zh: '测试讲座', en: 'Test Lecture' },
  speaker: { zh: '讲者', en: 'Speaker' },
  venue: { zh: '教室', en: 'Room' },
  durationMs: 2_000_000,
  humanVerified: true,
  chapters: [],
  transcript: [],
  studyTasks: [],
}

describe('Bounded clip audio engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetAudioEngineForTest()
  })

  afterEach(() => {
    setOnAnchorVerified(null)
    resetAudioEngineForTest()
    vi.useRealTimers()
  })

  it('clamps extended bounds safely within [0, durationMs]', () => {
    expect(computeExtendedBounds(5000, 20_000, -10_000, 0, 100_000)).toEqual({
      startMs: 0,
      endMs: 20_000,
    })
    expect(computeExtendedBounds(80_000, 92_000, 0, 15_000, 100_000)).toEqual({
      startMs: 80_000,
      endMs: 100_000,
    })
  })

  it('auto-pauses cleanly at clipEndMs and fires verification once at >= 50% played', () => {
    const verified: string[] = []
    setOnAnchorVerified((id) => verified.push(id))

    playBoundedAnchor(sampleLecture, 'c1', anchorOrigin, 'zh')
    expect(getAudioState().playing).toBe(true)
    expect(getAudioState().clipEndMs).toBe(66_000)

    vi.advanceTimersByTime(3500)
    expect(verified).toEqual(['a-origin'])

    vi.advanceTimersByTime(3200)
    expect(getAudioState().playing).toBe(false)
    expect(getAudioState().currentMs).toBe(66_000)
    expect(verified).toEqual(['a-origin'])
  })

  it('extends window backwards by -10s and forwards by +15s and resumes playback', () => {
    playBoundedAnchor(sampleLecture, 'c1', anchorOrigin, 'zh')
    vi.advanceTimersByTime(6500)
    expect(getAudioState().playing).toBe(false)

    extendActiveClip(0, 15_000, sampleLecture.durationMs)
    expect(getAudioState().clipEndMs).toBe(81_000)
    expect(getAudioState().playing).toBe(true)

    extendActiveClip(-10_000, 0, sampleLecture.durationMs)
    expect(getAudioState().clipStartMs).toBe(50_000)
  })

  it('steps through an evidence chain across a 24-minute skip and stops at the end', () => {
    const verified: string[] = []
    setOnAnchorVerified((id) => verified.push(id))

    playEvidenceChain(sampleLecture, 'c1', [anchorOrigin, anchorCaveat], 'zh')
    expect(getAudioState().mode).toBe('chain')
    expect(getAudioState().activeAnchorId).toBe('a-origin')

    vi.advanceTimersByTime(6300)
    expect(getAudioState().activeAnchorId).toBe('a-caveat')
    expect(getAudioState().chainIndex).toBe(1)
    expect(getAudioState().bridgeNotice).toContain('24')

    vi.advanceTimersByTime(6500)
    expect(getAudioState().playing).toBe(false)
    expect(verified).toEqual(['a-origin', 'a-caveat'])
  })
})
