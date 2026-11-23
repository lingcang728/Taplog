import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PauseIcon, PlayIcon, SpeakerHighIcon } from '@phosphor-icons/react'
import {
  PLAYBACK_RATES,
  pauseAudio,
  seekGlobalAudio,
  setPlaybackRate,
  toggleGlobalPlay,
  useAudioState,
} from '../audio/engine'
import { resamplePeaks, seededLecturePeaks } from '../audio/waveform'
import { formatClock, msg, pickText } from '../i18n/messages'
import { collectLectureAlerts } from '../state/condition'
import { useWorkspace } from '../state/workspace'
import type { Lecture } from '../types/lecture'

export function GlobalAudioBar({ lecture }: { lecture: Lecture }) {
  const page = useWorkspace((s) => s.page)
  const lectures = useWorkspace((s) => s.lectures)
  const condition = useWorkspace((s) => s.condition)
  const locale = useWorkspace((s) => s.locale)

  const audioLectureId = useAudioState((s) => s.lectureId)
  const playing = useAudioState((s) => s.playing)
  const currentMs = useAudioState((s) => s.currentMs)
  const rate = useAudioState((s) => s.rate)
  const mode = useAudioState((s) => s.mode)
  const clipStartMs = useAudioState((s) => s.clipStartMs)
  const clipEndMs = useAudioState((s) => s.clipEndMs)
  const usingSynthetic = useAudioState((s) => s.usingSyntheticVoice)

  const targetLecture =
    page === 'gallery' && audioLectureId
      ? lectures.find((item) => item.id === audioLectureId) ?? lecture
      : lecture

  const bars = useMemo(() => {
    const raw =
      targetLecture.waveformPeaks && targetLecture.waveformPeaks.length > 0
        ? targetLecture.waveformPeaks
        : seededLecturePeaks(targetLecture.id, 140)
    return resamplePeaks(raw, 60)
  }, [targetLecture.id, targetLecture.waveformPeaks])

  const alerts = useMemo(() => collectLectureAlerts(targetLecture), [targetLecture])

  // Stay completely hidden on the home gallery unless the user is actively listening;
  // also hidden under pure-visual study condition C4.
  const visible =
    condition !== 'c4' && (page === 'lecture' || (page === 'gallery' && playing))

  const isThisLecture = audioLectureId === targetLecture.id
  const displayMs = isThisLecture ? currentMs : 0
  const isPlayingThis = isThisLecture && playing
  const ratio =
    targetLecture.durationMs > 0
      ? Math.max(0, Math.min(1, displayMs / targetLecture.durationMs))
      : 0

  const isBounded =
    isThisLecture &&
    (mode === 'bounded' || mode === 'chain') &&
    clipStartMs !== null &&
    clipEndMs !== null
  const bracketLeft =
    isBounded && targetLecture.durationMs > 0
      ? (clipStartMs / targetLecture.durationMs) * 100
      : 0
  const bracketWidth =
    isBounded && targetLecture.durationMs > 0
      ? Math.max(0.8, ((clipEndMs - clipStartMs) / targetLecture.durationMs) * 100)
      : 0

  const handleCycleRate = () => {
    const idx = PLAYBACK_RATES.indexOf(rate)
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length] ?? 1
    setPlaybackRate(next)
  }

  const handleTrackSeek = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
    seekGlobalAudio(targetLecture, Math.round(pct * targetLecture.durationMs), locale)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.footer
          className="global-audio-bar"
          aria-label={msg(locale, 'globalBarLabel')}
          initial={{ y: 24, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 320, damping: 30 },
          }}
          exit={{ y: 20, opacity: 0, transition: { duration: 0.16 } }}
        >
          <div className="global-audio-inner">
            <button
              type="button"
              className="global-play-btn"
              onClick={() =>
                isPlayingThis ? pauseAudio() : toggleGlobalPlay(targetLecture, locale)
              }
              aria-label={msg(locale, isPlayingThis ? 'pauseClip' : 'playClip')}
            >
              {isPlayingThis ? (
                <PauseIcon size={16} weight="fill" />
              ) : (
                <PlayIcon size={16} weight="fill" />
              )}
            </button>

            <span className="global-clock">
              {formatClock(displayMs)} / {formatClock(targetLecture.durationMs)}
            </span>

            <div className="global-track-wrap">
              <div className="global-track-meta">
                <span className="mode-status-tag">
                  {page === 'gallery'
                    ? pickText(targetLecture.title, locale)
                    : isBounded
                      ? msg(locale, 'boundedModeTag')
                      : msg(locale, 'freePlayTag')}
                </span>
                {usingSynthetic && isThisLecture && (
                  <span className="synthetic-hint">
                    <SpeakerHighIcon size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    {msg(locale, 'syntheticVoiceHint')}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="global-wave-btn"
                onClick={handleTrackSeek}
                aria-label={msg(locale, 'globalBarLabel')}
              >
                {isBounded && (
                  <span
                    className="global-clip-bracket"
                    style={{ left: `${bracketLeft}%`, width: `${bracketWidth}%` }}
                  />
                )}

                {condition === 'c2' &&
                  alerts.map(({ anchor }) => (
                    <span
                      key={anchor.id}
                      className={`global-alert-tick ${anchor.relation}`}
                      style={{
                        left: `${targetLecture.durationMs > 0 ? (anchor.startMs / targetLecture.durationMs) * 100 : 0}%`,
                      }}
                    />
                  ))}

                {bars.map((amp, idx) => (
                  <span
                    key={idx}
                    className={`global-wave-bar${idx / bars.length <= ratio ? ' is-played' : ''}`}
                    style={{ height: `${Math.round(Math.max(16, amp * 100))}%` }}
                  />
                ))}
              </button>
            </div>

            <div className="global-controls-right">
              <button type="button" className="rate-pill" onClick={handleCycleRate}>
                {rate.toFixed(rate % 1 === 0 ? 1 : 2)}x
              </button>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}
