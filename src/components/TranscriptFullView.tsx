import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { seekGlobalAudio, useAudioState } from '../audio/engine'
import { formatClock, formatDuration, msg, pickText } from '../i18n/messages'
import { logTelemetry } from '../state/telemetry'
import { useWorkspace } from '../state/workspace'
import type { Lecture } from '../types/lecture'

function highlightMatches(text: string, query: string): React.ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? <mark key={i}>{part}</mark> : part,
  )
}

export function TranscriptFullView({ lecture }: { lecture: Lecture }) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const density = useWorkspace((s) => s.density)
  const currentMs = useAudioState((s) => s.currentMs)
  const audioLectureId = useAudioState((s) => s.lectureId)

  const [query, setQuery] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    const timer = setTimeout(() => {
      logTelemetry({
        lectureId: lecture.id,
        condition,
        density,
        action: 'transcript_search',
        detail: trimmed,
      })
    }, 450)
    return () => clearTimeout(timer)
  }, [query, lecture.id, condition, density])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lecture.transcript
    return lecture.transcript.filter((seg) =>
      pickText(seg.text, locale).toLowerCase().includes(q),
    )
  }, [lecture.transcript, query, locale])

  return (
    <div className="transcript-view">
      <header className="lecture-header">
        <div className="lecture-header-main">
          <h1 className="lecture-title">{pickText(lecture.title, locale)}</h1>
          <div className="lecture-meta-row">
            <span>{msg(locale, 'fullTranscriptTitle')}</span>
            <span>·</span>
            <span>{formatDuration(lecture.durationMs, locale)}</span>
          </div>
        </div>
      </header>

      <div className="transcript-search-bar">
        <MagnifyingGlassIcon size={18} className="transcript-search-icon" />
        <input
          type="search"
          className="transcript-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={msg(locale, 'searchPlaceholder')}
          aria-label={msg(locale, 'searchPlaceholder')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="chapter-summary">{msg(locale, 'searchNoMatch')}</p>
      ) : (
        <div className="transcript-list">
          {filtered.map((seg) => {
            const isActive =
              audioLectureId === lecture.id &&
              currentMs >= seg.startMs &&
              currentMs < seg.endMs
            return (
              <button
                key={seg.id}
                type="button"
                className={`transcript-row${isActive ? ' is-active' : ''}`}
                onClick={() => seekGlobalAudio(lecture, seg.startMs, locale)}
              >
                <span className="transcript-ts">{formatClock(seg.startMs)}</span>
                <div>
                  {seg.speaker && (
                    <span className="transcript-speaker">{pickText(seg.speaker, locale)}</span>
                  )}
                  <p className="transcript-text">
                    {highlightMatches(pickText(seg.text, locale), query)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
