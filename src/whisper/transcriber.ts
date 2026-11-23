import { resamplePeaks } from '../audio/waveform'
import { formatClock } from '../i18n/messages'
import type {
  Chapter,
  Claim,
  FlowNode,
  Lecture,
  Locale,
  TranscriptSegment,
} from '../types/lecture'

export type WhisperLangOption = 'auto' | 'zh' | 'en'

export type TranscribeProgress =
  | { stage: 'decoding' }
  | { stage: 'loading_model' }
  | { stage: 'transcribing'; currentChunk: number; totalChunks: number }

export interface ChunkWindow {
  index: number
  startSample: number
  endSample: number
  offsetMs: number
}

export interface RawTimedSegment {
  startMs: number
  endMs: number
  text: string
}

export type WorkerRequest = {
  audio: Float32Array
  sampleRate: number
  language: 'zh' | 'en' | null
  chunks: ChunkWindow[]
}

export type WorkerMessage =
  | { kind: 'loading_model' }
  | { kind: 'chunk'; currentChunk: number; totalChunks: number }
  | {
      kind: 'done'
      chunks: Array<{ offsetMs: number; segments: RawTimedSegment[] }>
      detectedLang: 'zh' | 'en'
    }
  | { kind: 'error'; message: string }

/**
 * Plans sliding 30s windows with 2s overlap across recordings of any duration
 * (removes the legacy 10-minute cap for long university lectures).
 */
export function planAudioChunks(
  totalSamples: number,
  sampleRate = 16000,
  windowSec = 30,
  overlapSec = 2,
): ChunkWindow[] {
  if (totalSamples <= 0 || sampleRate <= 0) return []
  const winSamples = Math.max(sampleRate, Math.round(windowSec * sampleRate))
  const stepSamples = Math.max(
    Math.round(sampleRate * 5),
    winSamples - Math.round(overlapSec * sampleRate),
  )

  const windows: ChunkWindow[] = []
  let startSample = 0
  let index = 0
  while (startSample < totalSamples) {
    const endSample = Math.min(totalSamples, startSample + winSamples)
    windows.push({
      index,
      startSample,
      endSample,
      offsetMs: Math.round((startSample / sampleRate) * 1000),
    })
    if (endSample >= totalSamples) break
    startSample += stepSamples
    index++
  }
  return windows
}

/**
 * Combines chunk-local timestamps onto one lecture timeline while deduplicating overlap seams.
 */
export function mergeChunkSegments(
  chunks: Array<{ offsetMs: number; segments: RawTimedSegment[] }>,
  durationMs: number,
): RawTimedSegment[] {
  const merged: RawTimedSegment[] = []
  for (const chunk of chunks) {
    for (const seg of chunk.segments) {
      const text = seg.text.replace(/[—–]/g, '-').trim()
      if (!text) continue
      const absStart = Math.max(0, Math.min(durationMs, chunk.offsetMs + seg.startMs))
      const absEnd = Math.max(absStart + 250, Math.min(durationMs, chunk.offsetMs + seg.endMs))
      const prev = merged[merged.length - 1]
      if (prev) {
        const insideOverlap = absStart < prev.endMs - 200
        const headLen = Math.min(8, text.length)
        const tailLen = Math.min(8, prev.text.length)
        const repeatsTail =
          prev.text === text ||
          (headLen >= 4 && prev.text.includes(text.slice(0, headLen))) ||
          (tailLen >= 4 && text.startsWith(prev.text.slice(-tailLen)))
        if (insideOverlap && repeatsTail) {
          prev.endMs = Math.max(prev.endMs, absEnd)
          continue
        }
      }
      merged.push({
        startMs: prev ? Math.max(prev.startMs, absStart) : absStart,
        endMs: absEnd,
        text,
      })
    }
  }
  return merged
}

async function decodeToMono16k(
  file: File,
  signal: AbortSignal,
): Promise<{ pcm: Float32Array; durationMs: number; peaks: number[] }> {
  const bytes = await file.arrayBuffer()
  signal.throwIfAborted()

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioCtx()
  let decoded: AudioBuffer
  try {
    decoded = await ctx.decodeAudioData(bytes.slice(0))
  } finally {
    void ctx.close().catch(() => {})
  }
  signal.throwIfAborted()

  const targetRate = 16000
  const targetFrames = Math.max(1, Math.ceil(decoded.duration * targetRate))
  const offline = new OfflineAudioContext(1, targetFrames, targetRate)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start(0)
  const rendered = await offline.startRendering()
  signal.throwIfAborted()

  const pcm = new Float32Array(rendered.getChannelData(0))
  const peaks = resamplePeaks(Array.from(pcm), 280)
  return {
    pcm,
    durationMs: Math.max(1000, Math.round(decoded.duration * 1000)),
    peaks,
  }
}

function buildDraftLecture(
  file: File,
  audioUrl: string,
  durationMs: number,
  peaks: number[],
  segments: RawTimedSegment[],
  uiLocale: Locale,
): Lecture {
  const cleanTitle =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[_—–]+/g, ' ')
      .trim() || 'Imported Lecture'

  const transcript: TranscriptSegment[] = (
    segments.length > 0
      ? segments
      : [{ startMs: 0, endMs: Math.min(durationMs, 12_000), text: cleanTitle }]
  ).map((seg, idx) => ({
    id: `imp-seg-${idx + 1}`,
    startMs: seg.startMs,
    endMs: seg.endMs,
    text: { zh: seg.text, en: seg.text },
  }))

  const chapterSpanMs = 8 * 60_000
  const chapterCount = Math.max(1, Math.ceil(durationMs / chapterSpanMs))
  const chapters: Chapter[] = []

  for (let c = 0; c < chapterCount; c++) {
    const startMs = c * chapterSpanMs
    const endMs = Math.min(durationMs, (c + 1) * chapterSpanMs)
    const slice = transcript.filter(
      (s) => s.startMs >= startMs && (c === chapterCount - 1 ? s.startMs <= endMs : s.startMs < endMs),
    )
    const usable = slice.length > 0 ? slice : transcript.slice(0, 3)
    const bucketSize = Math.max(1, Math.ceil(usable.length / 3))
    const nodes: FlowNode[] = []
    const claims: Claim[] = []

    for (let g = 0; g < 3 && g * bucketSize < usable.length; g++) {
      const group = usable.slice(g * bucketSize, (g + 1) * bucketSize)
      const first = group[0]!
      const last = group[group.length - 1]!
      const mergedText = group.map((item) => item.text.zh).join(' ')
      const conciseZh = mergedText.slice(0, 15).trim() || `要点 ${c + 1}.${g + 1}`
      const conciseEn = mergedText.slice(0, 34).trim() || `Point ${c + 1}.${g + 1}`
      const nodeId = `imp-c${c + 1}-n${g + 1}`
      const claimId = `imp-c${c + 1}-cl${g + 1}`
      const clipEnd = Math.min(durationMs, Math.max(first.startMs + 6000, last.endMs))

      nodes.push({
        id: nodeId,
        stepTag: {
          zh: `片段 ${g + 1} · ${formatClock(first.startMs)}`,
          en: `Clip ${g + 1} · ${formatClock(first.startMs)}`,
        },
        title: { zh: conciseZh, en: conciseEn },
        caption: {
          zh: mergedText.slice(0, 44),
          en: mergedText.slice(0, 76),
        },
      })

      claims.push({
        id: claimId,
        chapterId: `imp-ch-${c + 1}`,
        schemaTargetId: nodeId,
        conciseTitle: { zh: conciseZh, en: conciseEn },
        detailedBody: { zh: mergedText, en: mergedText },
        anchors: [
          {
            id: `${claimId}-origin`,
            relation: 'origin',
            tier: 'origin',
            startMs: first.startMs,
            endMs: clipEnd,
            offsetFromOriginMs: 0,
            verbatimLead: {
              zh: `${first.text.zh.slice(0, 18)}...`,
              en: `${first.text.en.slice(0, 48)}...`,
            },
            fullQuote: { zh: mergedText, en: mergedText },
          },
        ],
      })
    }

    chapters.push({
      id: `imp-ch-${c + 1}`,
      index: c + 1,
      title: {
        zh: `第 ${c + 1} 节 (${formatClock(startMs)} - ${formatClock(endMs)})`,
        en: `Section ${c + 1} (${formatClock(startMs)} - ${formatClock(endMs)})`,
      },
      startMs,
      endMs,
      summary: {
        zh: usable[0]?.text.zh.slice(0, 64) ?? cleanTitle,
        en: usable[0]?.text.en.slice(0, 96) ?? cleanTitle,
      },
      schema: {
        kind: 'flow',
        title: {
          zh: `第 ${c + 1} 节本地转写骨架`,
          en: `Section ${c + 1} Local ASR Flow`,
        },
        subtitle: {
          zh: '由浏览器本地 Whisper 分块识别，可点击直接回听原声',
          en: 'Transcribed locally in WebAssembly; click any node to replay audio',
        },
        nodes,
      },
      claims,
    })
  }

  return {
    id: `local-${Date.now().toString(36)}`,
    code: uiLocale === 'zh' ? '本地' : 'LOCAL',
    title: { zh: cleanTitle, en: cleanTitle },
    speaker: { zh: '本地导入讲座', en: 'Local Audio Import' },
    venue: { zh: '浏览器端 Whisper 分块转写', en: 'In-Browser Whisper Chunked ASR' },
    durationMs,
    humanVerified: false,
    audioUrl,
    waveformPeaks: peaks,
    chapters,
    transcript,
    studyTasks: [],
    importedAt: new Date().toISOString(),
  }
}

export async function transcribeLocalLectureFile(
  file: File,
  lang: WhisperLangOption,
  uiLocale: Locale,
  signal: AbortSignal,
  onProgress: (progress: TranscribeProgress) => void,
): Promise<Lecture> {
  onProgress({ stage: 'decoding' })
  const { pcm, durationMs, peaks } = await decodeToMono16k(file, signal)
  const chunks = planAudioChunks(pcm.length, 16000, 30, 2)

  const worker = new Worker(new URL('./transcriber.worker.ts', import.meta.url), {
    type: 'module',
  })

  const rawChunks = await new Promise<Array<{ offsetMs: number; segments: RawTimedSegment[] }>>(
    (resolve, reject) => {
      const cleanup = () => {
        signal.removeEventListener('abort', onAbort)
        worker.terminate()
      }
      const onAbort = () => {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal.addEventListener('abort', onAbort, { once: true })

      worker.onerror = (err) => {
        cleanup()
        reject(new Error(err.message || 'Whisper worker failed'))
      }
      worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
        if (data.kind === 'loading_model') {
          onProgress({ stage: 'loading_model' })
        } else if (data.kind === 'chunk') {
          onProgress({
            stage: 'transcribing',
            currentChunk: data.currentChunk,
            totalChunks: data.totalChunks,
          })
        } else if (data.kind === 'done') {
          cleanup()
          resolve(data.chunks)
        } else if (data.kind === 'error') {
          cleanup()
          reject(new Error(data.message))
        }
      }

      const payload: WorkerRequest = {
        audio: pcm,
        sampleRate: 16000,
        language: lang === 'auto' ? null : lang,
        chunks,
      }
      worker.postMessage(payload, [pcm.buffer])
    },
  )

  const merged = mergeChunkSegments(rawChunks, durationMs)
  const audioUrl = URL.createObjectURL(file)
  return buildDraftLecture(file, audioUrl, durationMs, peaks, merged, uiLocale)
}
