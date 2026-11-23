import { describe, expect, it } from 'vitest'
import { mergeChunkSegments, planAudioChunks } from '../src/whisper/transcriber'

describe('Long-lecture chunked Whisper planner', () => {
  it('plans sliding 30s chunks with 2s overlap across a 45-minute lecture (no 10-minute cap)', () => {
    const sampleRate = 16000
    const totalSamples = 45 * 60 * sampleRate
    const chunks = planAudioChunks(totalSamples, sampleRate, 30, 2)

    expect(chunks.length).toBeGreaterThan(90)
    expect(chunks[0]).toEqual({
      index: 0,
      startSample: 0,
      endSample: 30 * sampleRate,
      offsetMs: 0,
    })
    expect(chunks[1]?.offsetMs).toBe(28_000)
    expect(chunks[chunks.length - 1]?.endSample).toBe(totalSamples)
  })

  it('merges chunk timestamps monotonically and deduplicates overlap-seam repetitions', () => {
    const merged = mergeChunkSegments(
      [
        {
          offsetMs: 0,
          segments: [
            { startMs: 0, endMs: 14_000, text: '第一段讲解核心机制' },
            { startMs: 28_100, endMs: 29_900, text: '边界条件在这里出现' },
          ],
        },
        {
          offsetMs: 28_000,
          segments: [
            { startMs: 120, endMs: 2_300, text: '边界条件在这里出现' },
            { startMs: 2_600, endMs: 15_000, text: '后面接着分析实测数据' },
          ],
        },
      ],
      60_000,
    )

    expect(merged).toHaveLength(3)
    expect(merged[1]?.text).toBe('边界条件在这里出现')
    expect(merged[1]?.endMs).toBe(30_300)
    expect(merged[2]?.startMs).toBe(30_600)
  })
})
