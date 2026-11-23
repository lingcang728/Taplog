/**
 * Deterministic speech-envelope waveform generation, bucket-max resampling,
 * and proportional clip-window slicing.
 */

function fnv1aHash(seed: string): number {
  let hash = 2166136261 >>> 0
  for (let idx = 0; idx < seed.length; idx++) {
    hash ^= seed.charCodeAt(idx)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash || 1
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function resamplePeaks(peaks: readonly number[], count: number): number[] {
  if (count <= 0) return []
  if (!peaks.length) return new Array<number>(count).fill(0.08)
  const out: number[] = []
  for (let idx = 0; idx < count; idx++) {
    const start = Math.floor((idx * peaks.length) / count)
    const end = Math.max(start + 1, Math.floor(((idx + 1) * peaks.length) / count))
    let peak = 0
    for (let cursor = start; cursor < end && cursor < peaks.length; cursor++) {
      peak = Math.max(peak, Math.abs(peaks[cursor] ?? 0))
    }
    out.push(peak)
  }
  const ceiling = Math.max(...out, 1e-6)
  return out.map((val) => Math.max(0.06, Math.min(1, val / ceiling)))
}

export function seededLecturePeaks(seed: string, count = 240): number[] {
  const rand = mulberry32(fnv1aHash(seed))
  const raw: number[] = []
  while (raw.length < count) {
    const phraseBars = 6 + Math.floor(rand() * 14)
    const phraseAmp = 0.4 + rand() * 0.6
    for (let i = 0; i < phraseBars && raw.length < count; i++) {
      const envelope = Math.sin((Math.PI * (i + 0.5)) / phraseBars)
      raw.push(Math.max(0.07, phraseAmp * (0.3 + 0.7 * envelope) * (0.55 + rand() * 0.45)))
    }
    const pauseBars = 1 + Math.floor(rand() * 3)
    for (let i = 0; i < pauseBars && raw.length < count; i++) {
      raw.push(0.06 + rand() * 0.05)
    }
  }
  return resamplePeaks(raw, count)
}

export function sliceClipPeaks(
  lectureId: string,
  lecturePeaks: readonly number[] | undefined,
  durationMs: number,
  clipStartMs: number,
  clipEndMs: number,
  barCount = 48,
): number[] {
  const source =
    lecturePeaks && lecturePeaks.length > 0
      ? lecturePeaks
      : seededLecturePeaks(`${lectureId}:${clipStartMs}:${clipEndMs}`, Math.max(96, barCount * 2))

  if (durationMs <= 0 || !lecturePeaks || lecturePeaks.length === 0) {
    return resamplePeaks(source, barCount)
  }

  const startRatio = Math.max(0, Math.min(1, clipStartMs / durationMs))
  const endRatio = Math.max(startRatio + 0.002, Math.min(1, clipEndMs / durationMs))
  const startIdx = Math.floor(startRatio * source.length)
  const endIdx = Math.max(startIdx + 2, Math.ceil(endRatio * source.length))
  const segment = source.slice(startIdx, endIdx)

  return segment.length >= 4
    ? resamplePeaks(segment, barCount)
    : seededLecturePeaks(`${lectureId}:${clipStartMs}`, barCount)
}
