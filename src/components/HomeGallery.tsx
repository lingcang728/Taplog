import { useMemo, type CSSProperties, type RefObject } from 'react'
import { motion } from 'motion/react'
import { ArrowRightIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { pauseAudio, toggleGlobalPlay, useAudioState } from '../audio/engine'
import { formatDuration, msg, pickText } from '../i18n/messages'
import { collectLectureAlerts } from '../state/condition'
import {
  openLecture,
  setGalleryFilter,
  setImportDrawerOpen,
  useWorkspace,
} from '../state/workspace'
import type { Lecture } from '../types/lecture'
import { Cover, type CoverFamily } from './Cover'
import { FilterChips } from './FilterChips'
import { HeroArt } from './HeroArt'
import { MiniWave, PlayRing } from './PlayRing'

const gallerySpring = { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.9 }
const COVER_FAMILIES: CoverFamily[] = ['dunes', 'petals', 'ribbon', 'orbs']

interface Span {
  c: number
  r: number
}

function lectureBentoSpans(count: number): Span[] {
  if (count <= 0) return []
  if (count === 1) return [{ c: 12, r: 2 }]
  if (count === 2) return [{ c: 7, r: 2 }, { c: 5, r: 2 }]
  if (count === 3) return [{ c: 6, r: 2 }, { c: 6, r: 2 }, { c: 12, r: 1 }]
  return Array.from({ length: count }, (_, idx) =>
    idx === 0 ? { c: 7, r: 2 } : idx === 1 ? { c: 5, r: 2 } : { c: 6, r: 2 },
  )
}

function LectureCoverCard({
  lecture,
  span,
  index,
}: {
  lecture: Lecture
  span: Span
  index: number
}) {
  const locale = useWorkspace((s) => s.locale)
  const verifiedIds = useWorkspace((s) => s.verifiedAnchorIds)

  const audioLectureId = useAudioState((s) => s.lectureId)
  const isPlaying = useAudioState((s) => s.playing && s.lectureId === lecture.id)
  const currentMs = useAudioState((s) => (s.lectureId === lecture.id ? s.currentMs : 0))

  const alerts = useMemo(() => collectLectureAlerts(lecture), [lecture])
  const verifiedAlertCount = alerts.filter((a) => verifiedIds.includes(a.anchor.id)).length
  const progress =
    audioLectureId === lecture.id && lecture.durationMs > 0
      ? Math.min(1, currentMs / lecture.durationMs)
      : 0

  const title = pickText(lecture.title, locale)
  const speakerShort = pickText(lecture.speaker, locale).split('·')[0]?.trim() ?? ''
  const family = COVER_FAMILIES[index % COVER_FAMILIES.length]

  const handlePlayToggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (isPlaying) {
      pauseAudio()
      return
    }
    toggleGlobalPlay(lecture, locale)
  }

  return (
    <motion.article
      layout
      className={`lecture-card ${span.c >= 7 ? 'is-featured' : ''}`}
      style={{ '--c': span.c, '--r': span.r, borderRadius: 24 } as CSSProperties}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...gallerySpring, delay: Math.min(index, 6) * 0.05 }}
      whileHover={{ y: -3 }}
    >
      <button
        type="button"
        className="card-hit"
        aria-label={msg(locale, 'galleryOpenLecture', { title })}
        onClick={() => openLecture(lecture.id)}
      />

      <div className="card-cover">
        <Cover seed={lecture.id} family={family} />
      </div>
      <div className="card-shade" aria-hidden="true" />

      <div className="card-top-row">
        <span className="card-code-pill">
          <span>{lecture.code}</span>
          {lecture.humanVerified && (
            <CheckCircleIcon size={12} weight="fill" className="card-verified-dot" />
          )}
        </span>

        {alerts.length > 0 && (
          <span className="card-alert-pill">
            <span className="card-alert-dot" aria-hidden="true" />
            <span>
              {verifiedAlertCount > 0 ? `${verifiedAlertCount}/${alerts.length}` : alerts.length}{' '}
              {msg(locale, 'chapterAlertsCount')}
            </span>
          </span>
        )}
      </div>

      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p className="card-meta">
          <span>{speakerShort}</span>
          <span>·</span>
          <span>{formatDuration(lecture.durationMs, locale)}</span>
          <span>·</span>
          <span>{msg(locale, 'galleryChaptersCount', { count: lecture.chapters.length })}</span>
        </p>
        <MiniWave
          seed={lecture.id}
          peaks={lecture.waveformPeaks}
          bars={span.c >= 7 ? 44 : 32}
          progress={progress}
          className="card-wave"
        />
      </div>

      <button
        type="button"
        className={`card-play ${audioLectureId === lecture.id ? 'is-current' : ''}`}
        aria-label={msg(locale, isPlaying ? 'pauseClip' : 'playClip')}
        onClick={handlePlayToggle}
      >
        <PlayRing playing={isPlaying} progress={progress} size={42} />
      </button>
    </motion.article>
  )
}

export function HomeGallery({
  chipsDocked,
  chipsAnchorRef,
}: {
  chipsDocked: boolean
  chipsAnchorRef: RefObject<HTMLDivElement | null>
}) {
  const lectures = useWorkspace((s) => s.lectures)
  const filter = useWorkspace((s) => s.galleryFilter)
  const locale = useWorkspace((s) => s.locale)

  const filteredLectures = useMemo(() => {
    if (filter === 'all') return lectures
    if (filter === 'alerts') {
      return lectures.filter((lecture) => collectLectureAlerts(lecture).length > 0)
    }
    return lectures.filter((lecture) => Boolean(lecture.importedAt))
  }, [lectures, filter])

  const spans = useMemo(() => lectureBentoSpans(filteredLectures.length), [filteredLectures.length])

  return (
    <div className="home">
      <section className="hero">
        <HeroArt className="hero-art" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...gallerySpring, delay: 0.04 }}
        >
          <h1>
            <span>{msg(locale, 'heroTitleA')}</span>
            <span>{msg(locale, 'heroTitleB')}</span>
          </h1>
          <p>{msg(locale, 'heroSub')}</p>
        </motion.div>

        <div className="hero-chips" ref={chipsAnchorRef}>
          {!chipsDocked && <FilterChips />}
        </div>
      </section>

      <div id="gallery" className="gallery" tabIndex={-1}>
        {filteredLectures.length === 0 ? (
          <div className="gallery-empty">
            <div className="empty-art">
              <Cover seed="taplog-empty-shelf" family="orbs" />
            </div>
            <h2>{msg(locale, 'galleryEmptyTitle')}</h2>
            <p>{msg(locale, 'galleryEmptyBody')}</p>
            <div className="drawer-actions">
              <button
                type="button"
                className="tap-button"
                onClick={() => setGalleryFilter('all')}
              >
                {msg(locale, 'filterAll')}
              </button>
              <button
                type="button"
                className="tap-button tap-button-primary"
                onClick={() => setImportDrawerOpen(true)}
              >
                {msg(locale, 'galleryImportAction')}
              </button>
            </div>
          </div>
        ) : (
          <div className="bento">
            {filteredLectures.map((lecture, index) => (
              <LectureCoverCard
                key={lecture.id}
                lecture={lecture}
                span={spans[index] ?? { c: 6, r: 2 }}
                index={index}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="import-strip-card"
          onClick={() => setImportDrawerOpen(true)}
        >
          <div className="import-strip-stack" aria-hidden="true">
            <span className="import-thumb" style={{ '--i': 1 } as CSSProperties}>
              <Cover seed="taplog-import-a" family="dunes" />
            </span>
            <span className="import-thumb" style={{ '--i': 2 } as CSSProperties}>
              <Cover seed="taplog-import-b" family="petals" />
            </span>
            <span className="import-thumb" style={{ '--i': 3 } as CSSProperties}>
              <Cover seed="taplog-import-c" family="orbs" />
            </span>
          </div>

          <div className="import-strip-text">
            <strong>{msg(locale, 'galleryImportTitle')}</strong>
            <small>{msg(locale, 'galleryImportSub')}</small>
          </div>

          <span className="import-strip-cta">
            <span>{msg(locale, 'galleryImportAction')}</span>
            <ArrowRightIcon size={15} />
          </span>
        </button>
      </div>
    </div>
  )
}
