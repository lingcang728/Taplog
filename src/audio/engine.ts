import { msg, pickText } from '../i18n/messages'
import { createStore, useStore } from '../state/store'
import type { EvidenceAnchor, Lecture, Locale } from '../types/lecture'

export interface ClipChainItem {
  anchor: EvidenceAnchor
  claimId: string
}

export interface AudioPlaybackState {
  lectureId: string | null
  playing: boolean
  rate: number
  currentMs: number
  durationMs: number
  mode: 'idle' | 'bounded' | 'chain' | 'global'
  activeClaimId: string | null
  activeAnchorId: string | null
  clipStartMs: number | null
  clipEndMs: number | null
  chainQueue: ClipChainItem[]
  chainIndex: number
  bridgeNotice: string | null
  usingSyntheticVoice: boolean
}

export const PLAYBACK_RATES: readonly number[] = [1, 1.25, 1.5, 2]

const initialAudioState: AudioPlaybackState = {
  lectureId: null,
  playing: false,
  rate: 1,
  currentMs: 0,
  durationMs: 0,
  mode: 'idle',
  activeClaimId: null,
  activeAnchorId: null,
  clipStartMs: null,
  clipEndMs: null,
  chainQueue: [],
  chainIndex: 0,
  bridgeNotice: null,
  usingSyntheticVoice: false,
}

const audioStore = createStore<AudioPlaybackState>(initialAudioState)

export const useAudioState = <S,>(selector: (state: AudioPlaybackState) => S): S =>
  useStore(audioStore, selector)

export const getAudioState = (): AudioPlaybackState => audioStore.get()

let verifiedListener: ((anchorId: string) => void) | null = null
export function setOnAnchorVerified(cb: ((anchorId: string) => void) | null): void {
  verifiedListener = cb
}

let audioEl: HTMLAudioElement | null = null
let tickerId: ReturnType<typeof setInterval> | number | null = null
let tickerIsRaf = false
let bridgeTimer: ReturnType<typeof setTimeout> | null = null
let lastClockMs = 0
let currentLecture: Lecture | null = null
let currentLocale: Locale = 'zh'
let verifiedFiredForCurrentClip = false

function readNowMs(): number {
  return Date.now()
}

function clearTicker(): void {
  if (tickerId === null) return
  if (tickerIsRaf && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(tickerId as number)
  } else {
    clearInterval(tickerId as ReturnType<typeof setInterval>)
  }
  tickerId = null
  tickerIsRaf = false
}

function clearBridgeTimer(): void {
  if (bridgeTimer !== null) {
    clearTimeout(bridgeTimer)
    bridgeTimer = null
  }
}

function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignore synthesis cancel errors in locked browser contexts.
    }
  }
}

function speakTextFallback(text: string, locale: Locale, rate: number): void {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return
  }
  try {
    window.speechSynthesis.cancel()
    if (!text.trim()) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = Math.min(2, Math.max(0.85, rate))
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  } catch {
    // Non-fatal fallback; the bounded playhead timer still runs cleanly.
  }
}

function ensureAudioElement(url: string): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.preload = 'metadata'
  }
  if (audioEl.src !== url) {
    audioEl.src = url
  }
  return audioEl
}

export function computeExtendedBounds(
  startMs: number,
  endMs: number,
  deltaStartMs: number,
  deltaEndMs: number,
  durationMs: number,
): { startMs: number; endMs: number } {
  const safeDuration = Math.max(1000, durationMs)
  const clampedStart = Math.max(0, Math.min(safeDuration - 1000, startMs + deltaStartMs))
  const clampedEnd = Math.min(safeDuration, Math.max(clampedStart + 1000, endMs + deltaEndMs))
  return { startMs: clampedStart, endMs: clampedEnd }
}

function maybeNotifyVerified(state: AudioPlaybackState, nextMs: number): void {
  if (
    verifiedFiredForCurrentClip ||
    !state.activeAnchorId ||
    state.clipStartMs === null ||
    state.clipEndMs === null
  ) {
    return
  }
  const span = Math.max(1, state.clipEndMs - state.clipStartMs)
  if (nextMs - state.clipStartMs >= span * 0.5 || nextMs >= state.clipEndMs) {
    verifiedFiredForCurrentClip = true
    verifiedListener?.(state.activeAnchorId)
  }
}

function beginClipPlayback(
  lecture: Lecture,
  claimId: string,
  anchor: EvidenceAnchor,
  locale: Locale,
  mode: 'bounded' | 'chain',
  chainQueue: ClipChainItem[],
  chainIndex: number,
  bridgeNotice: string | null,
): void {
  clearTicker()
  clearBridgeTimer()
  currentLecture = lecture
  currentLocale = locale
  verifiedFiredForCurrentClip = false

  const clipStartMs = Math.max(0, anchor.startMs)
  const clipEndMs = Math.min(lecture.durationMs, Math.max(clipStartMs + 1000, anchor.endMs))
  const rate = audioStore.get().rate
  const hasRealAudio = Boolean(lecture.audioUrl)

  if (hasRealAudio && lecture.audioUrl) {
    cancelSpeech()
    const el = ensureAudioElement(lecture.audioUrl)
    if (el) {
      el.playbackRate = rate
      try {
        el.currentTime = clipStartMs / 1000
      } catch {
        // Metadata may still be loading.
      }
      void el.play().catch(() => {})
    }
  } else {
    if (audioEl) audioEl.pause()
    speakTextFallback(pickText(anchor.fullQuote, locale), locale, rate)
  }

  audioStore.set({
    lectureId: lecture.id,
    playing: true,
    currentMs: clipStartMs,
    durationMs: lecture.durationMs,
    mode,
    activeClaimId: claimId,
    activeAnchorId: anchor.id,
    clipStartMs,
    clipEndMs,
    chainQueue,
    chainIndex,
    bridgeNotice,
    usingSyntheticVoice: !hasRealAudio,
  })

  if (bridgeNotice) {
    bridgeTimer = setTimeout(() => {
      if (audioStore.get().bridgeNotice === bridgeNotice) {
        audioStore.set({ bridgeNotice: null })
      }
    }, 2200)
  }

  startTicker()
}

function handleBoundedEnd(): void {
  const state = audioStore.get()
  if (state.activeAnchorId && !verifiedFiredForCurrentClip) {
    verifiedFiredForCurrentClip = true
    verifiedListener?.(state.activeAnchorId)
  }

  if (
    state.mode === 'chain' &&
    currentLecture &&
    state.chainIndex + 1 < state.chainQueue.length
  ) {
    const prev = state.chainQueue[state.chainIndex]?.anchor
    const next = state.chainQueue[state.chainIndex + 1]!
    const gapMins = prev
      ? Math.max(1, Math.round(Math.abs(next.anchor.startMs - prev.endMs) / 60_000))
      : 1
    const notice = msg(currentLocale, 'skippedBridge', { mins: gapMins })
    beginClipPlayback(
      currentLecture,
      next.claimId,
      next.anchor,
      currentLocale,
      'chain',
      state.chainQueue,
      state.chainIndex + 1,
      notice,
    )
    return
  }

  clearTicker()
  cancelSpeech()
  if (audioEl) audioEl.pause()
  audioStore.set({
    playing: false,
    currentMs: state.clipEndMs ?? state.currentMs,
    bridgeNotice: null,
  })
}

function tickPlayhead(): void {
  const state = audioStore.get()
  if (!state.playing) {
    clearTicker()
    return
  }

  const now = readNowMs()
  const deltaMs = Math.max(0, Math.min(500, now - lastClockMs))
  lastClockMs = now

  let nextMs = state.currentMs + deltaMs * state.rate
  if (!state.usingSyntheticVoice && audioEl && !audioEl.paused && Number.isFinite(audioEl.currentTime)) {
    nextMs = audioEl.currentTime * 1000
  }

  maybeNotifyVerified(state, nextMs)

  if (
    (state.mode === 'bounded' || state.mode === 'chain') &&
    state.clipEndMs !== null &&
    nextMs >= state.clipEndMs
  ) {
    handleBoundedEnd()
    return
  }

  if (nextMs >= state.durationMs) {
    clearTicker()
    cancelSpeech()
    if (audioEl) audioEl.pause()
    audioStore.set({ playing: false, currentMs: state.durationMs })
    return
  }

  audioStore.set({ currentMs: nextMs })
}

function startTicker(): void {
  clearTicker()
  lastClockMs = readNowMs()
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    tickerIsRaf = true
    const step = () => {
      if (!audioStore.get().playing) return
      tickPlayhead()
      if (audioStore.get().playing) {
        tickerId = window.requestAnimationFrame(step)
      }
    }
    tickerId = window.requestAnimationFrame(step)
  } else {
    tickerIsRaf = false
    tickerId = setInterval(() => {
      tickPlayhead()
    }, 30)
  }
}

export function playBoundedAnchor(
  lecture: Lecture,
  claimId: string,
  anchor: EvidenceAnchor,
  locale: Locale,
): void {
  const current = audioStore.get()
  if (
    current.lectureId === lecture.id &&
    current.activeAnchorId === anchor.id &&
    current.mode === 'bounded' &&
    !current.playing &&
    current.clipEndMs !== null &&
    current.currentMs < current.clipEndMs - 250
  ) {
    currentLecture = lecture
    currentLocale = locale
    if (lecture.audioUrl && audioEl) {
      audioEl.playbackRate = current.rate
      void audioEl.play().catch(() => {})
    } else {
      speakTextFallback(pickText(anchor.fullQuote, locale), locale, current.rate)
    }
    audioStore.set({ playing: true })
    startTicker()
    return
  }

  beginClipPlayback(lecture, claimId, anchor, locale, 'bounded', [], 0, null)
}

export function playEvidenceChain(
  lecture: Lecture,
  claimId: string,
  anchors: EvidenceAnchor[],
  locale: Locale,
): void {
  if (!anchors.length) return
  const queue: ClipChainItem[] = anchors.map((anchor) => ({ anchor, claimId }))
  beginClipPlayback(lecture, claimId, queue[0]!.anchor, locale, 'chain', queue, 0, null)
}

export function extendActiveClip(
  deltaStartMs: number,
  deltaEndMs: number,
  maxDurationMs: number,
): void {
  const state = audioStore.get()
  if (state.clipStartMs === null || state.clipEndMs === null) return
  const nextBounds = computeExtendedBounds(
    state.clipStartMs,
    state.clipEndMs,
    deltaStartMs,
    deltaEndMs,
    maxDurationMs,
  )
  const rewoundMs =
    deltaStartMs < 0 ? Math.max(nextBounds.startMs, state.currentMs + deltaStartMs) : state.currentMs

  if (!state.usingSyntheticVoice && audioEl && deltaStartMs < 0) {
    try {
      audioEl.currentTime = rewoundMs / 1000
    } catch {
      // Ignore pre-metadata seek error.
    }
  }

  const shouldResume = !state.playing && (deltaEndMs > 0 || deltaStartMs < 0)
  audioStore.set({
    clipStartMs: nextBounds.startMs,
    clipEndMs: nextBounds.endMs,
    currentMs: rewoundMs,
    playing: shouldResume ? true : state.playing,
  })
  if (shouldResume) {
    if (!state.usingSyntheticVoice && audioEl) {
      void audioEl.play().catch(() => {})
    }
    startTicker()
  }
}

export function seekWithinActiveClip(targetMs: number): void {
  const state = audioStore.get()
  if (state.clipStartMs === null || state.clipEndMs === null) return
  const clamped = Math.max(state.clipStartMs, Math.min(state.clipEndMs, targetMs))
  if (!state.usingSyntheticVoice && audioEl) {
    try {
      audioEl.currentTime = clamped / 1000
    } catch {
      // Ignore
    }
  }
  audioStore.set({ currentMs: clamped })
}

export function seekGlobalAudio(lecture: Lecture, targetMs: number, locale: Locale): void {
  currentLecture = lecture
  currentLocale = locale
  const clamped = Math.max(0, Math.min(lecture.durationMs, targetMs))
  const hasRealAudio = Boolean(lecture.audioUrl)

  if (hasRealAudio && lecture.audioUrl) {
    cancelSpeech()
    const el = ensureAudioElement(lecture.audioUrl)
    if (el) {
      el.playbackRate = audioStore.get().rate
      try {
        el.currentTime = clamped / 1000
      } catch {
        // Ignore
      }
      void el.play().catch(() => {})
    }
  } else {
    const seg =
      lecture.transcript.find((s) => clamped >= s.startMs && clamped < s.endMs) ??
      lecture.transcript.find((s) => s.startMs >= clamped)
    if (seg) {
      speakTextFallback(pickText(seg.text, locale), locale, audioStore.get().rate)
    }
  }

  audioStore.set({
    lectureId: lecture.id,
    playing: true,
    currentMs: clamped,
    durationMs: lecture.durationMs,
    mode: 'global',
    activeClaimId: null,
    activeAnchorId: null,
    clipStartMs: null,
    clipEndMs: null,
    chainQueue: [],
    chainIndex: 0,
    bridgeNotice: null,
    usingSyntheticVoice: !hasRealAudio,
  })
  startTicker()
}

export function toggleGlobalPlay(lecture: Lecture, locale: Locale): void {
  const state = audioStore.get()
  if (state.lectureId === lecture.id && state.playing) {
    pauseAudio()
    return
  }
  const resumeAt =
    state.lectureId === lecture.id && state.currentMs < lecture.durationMs - 500
      ? state.currentMs
      : 0
  seekGlobalAudio(lecture, resumeAt, locale)
}

export function pauseAudio(): void {
  clearTicker()
  clearBridgeTimer()
  cancelSpeech()
  if (audioEl) audioEl.pause()
  audioStore.set({ playing: false, bridgeNotice: null })
}

export function setPlaybackRate(rate: number): void {
  if (!PLAYBACK_RATES.includes(rate)) return
  if (audioEl) audioEl.playbackRate = rate
  audioStore.set({ rate })
}

export function resetAudioEngineForTest(): void {
  pauseAudio()
  currentLecture = null
  verifiedFiredForCurrentClip = false
  audioStore.replace(initialAudioState)
}
