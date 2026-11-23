import { env, pipeline } from '@huggingface/transformers'
import wasm from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url'
import loader from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url'
import type { RawTimedSegment, WorkerMessage, WorkerRequest } from './transcriber'

const MODEL_ID = 'onnx-community/whisper-tiny'
const MODEL_REVISION = 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7'

const post = (message: WorkerMessage) => self.postMessage(message)

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    const wasmOptions = env.backends.onnx.wasm
    if (wasmOptions) {
      wasmOptions.numThreads = 1
      wasmOptions.wasmPaths = {
        wasm: new URL(wasm, self.location.href).href,
        mjs: new URL(loader, self.location.href).href,
      }
    }
    const modelPath = import.meta.env.VITE_TAPLOG_MODEL_PATH
    env.allowLocalModels = Boolean(modelPath)
    env.allowRemoteModels = !modelPath
    env.remotePathTemplate = `{model}/resolve/${MODEL_REVISION}/`
    if (modelPath) env.localModelPath = modelPath.replace(/\/?$/, '/')

    post({ kind: 'loading_model' })
    const recognizer = await pipeline('automatic-speech-recognition', MODEL_ID, {
      revision: MODEL_REVISION,
      device: 'wasm',
      dtype: 'q8',
    })

    const results: Array<{ offsetMs: number; segments: RawTimedSegment[] }> = []
    const totalChunks = Math.max(1, data.chunks.length)

    for (let idx = 0; idx < data.chunks.length; idx++) {
      const win = data.chunks[idx]!
      post({ kind: 'chunk', currentChunk: idx + 1, totalChunks })
      const slice = data.audio.subarray(win.startSample, win.endSample)
      const sliceMs = Math.round((slice.length / data.sampleRate) * 1000)

      const raw = await recognizer(slice, {
        task: 'transcribe',
        ...(data.language ? { language: data.language } : {}),
        return_timestamps: true,
      })

      const entry = Array.isArray(raw) ? raw[0] : raw
      const rawChunks =
        (entry as { chunks?: Array<{ text: string; timestamp: [number, number | null] }> })
          ?.chunks ?? []
      const fallbackText = ((entry as { text?: string })?.text ?? '').trim()

      const segments: RawTimedSegment[] =
        rawChunks.length > 0
          ? rawChunks.flatMap(({ text, timestamp: [start, end] }) => {
              const startMs = Math.max(0, Math.min(sliceMs, Math.round((start ?? 0) * 1000)))
              const endMs =
                end === null
                  ? sliceMs
                  : Math.max(startMs + 250, Math.min(sliceMs, Math.round(end * 1000)))
              const trimmed = text.trim()
              return trimmed ? [{ startMs, endMs, text: trimmed }] : []
            })
          : fallbackText
            ? [{ startMs: 0, endMs: sliceMs, text: fallbackText }]
            : []

      results.push({ offsetMs: win.offsetMs, segments })
    }

    post({
      kind: 'done',
      chunks: results,
      detectedLang: data.language ?? 'zh',
    })
  } catch (err) {
    post({
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
