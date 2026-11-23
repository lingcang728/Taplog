import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react'
import { pauseAudio } from './audio/engine'
import { msg } from './i18n/messages'
import {
  getActiveLecture,
  getWorkspace,
  setDensity,
  setImportDrawerOpen,
  setStudyMode,
  setTasksDrawerOpen,
  toggleClaimDrawer,
  useWorkspace,
} from './state/workspace'
import { TopNav } from './components/TopNav'
import { StudyToolbar } from './components/StudyToolbar'
import { HomeGallery } from './components/HomeGallery'
import { BriefCanvas } from './components/BriefCanvas'
import { DetailedNotebook } from './components/DetailedNotebook'
import { TranscriptFullView } from './components/TranscriptFullView'
import { ContextDrawer } from './components/trace/ContextDrawer'
import { GlobalAudioBar } from './components/GlobalAudioBar'
import { ImportDrawer } from './components/ImportDrawer'

const springTransition = { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.9 }

export function App() {
  const page = useWorkspace((state) => state.page)
  const lecture = useWorkspace((state) => getActiveLecture(state))
  const density = useWorkspace((state) => state.density)
  const condition = useWorkspace((state) => state.condition)
  const locale = useWorkspace((state) => state.locale)
  const style = useWorkspace((state) => state.style)

  const [scrolled, setScrolled] = useState(false)
  const [chipsDocked, setChipsDocked] = useState(false)
  const chipsAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (page === 'gallery') {
      document.title =
        locale === 'zh' ? 'Taplog · 可溯源讲座画廊' : 'Taplog · Lecture Gallery'
    } else {
      document.title =
        locale === 'zh'
          ? `Taplog · ${lecture.title.zh}`
          : `Taplog · ${lecture.title.en}`
    }
  }, [page, lecture.id, locale, lecture.title.en, lecture.title.zh])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (page !== 'gallery') {
      setChipsDocked(false)
      return
    }
    const el = chipsAnchorRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setChipsDocked(!entry?.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [page])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const inEditable =
        Boolean(target) &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target!.tagName) || target!.isContentEditable)

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        setStudyMode(!getWorkspace().studyMode)
        return
      }

      if (event.key === 'Escape') {
        const ws = getWorkspace()
        if (ws.importDrawerOpen) {
          event.preventDefault()
          setImportDrawerOpen(false)
          return
        }
        if (ws.tasksDrawerOpen) {
          event.preventDefault()
          setTasksDrawerOpen(false)
          return
        }
        if (ws.openClaimId) {
          event.preventDefault()
          toggleClaimDrawer(null)
          pauseAudio()
          return
        }
      }

      if (inEditable) return

      if (getWorkspace().page === 'lecture') {
        if (event.key === '1' && event.altKey) {
          event.preventDefault()
          setDensity('brief')
        } else if (event.key === '2' && event.altKey) {
          event.preventDefault()
          setDensity('detailed')
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const activeSurfaceKey =
    page === 'gallery'
      ? 'home-gallery'
      : condition === 'c3'
        ? 'c3-transcript'
        : `${lecture.id}-${density}`

  return (
    <MotionConfig reducedMotion="user" transition={springTransition}>
      <LayoutGroup>
        <div
          className={`app-shell page-${page} style-${page === 'gallery' ? 'mist' : style} density-${density}`}
        >
          <a className="skip-link" href="#main-content">
            {msg(locale, 'skipToMain')}
          </a>

          <TopNav scrolled={scrolled} chipsDocked={chipsDocked} />
          <StudyToolbar />

          <main id="main-content" className={page === 'gallery' ? 'gallery-main' : 'lecture-main'} tabIndex={-1}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSurfaceKey}
                className="lecture-stage"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.14 } }}
              >
                {page === 'gallery' ? (
                  <HomeGallery chipsDocked={chipsDocked} chipsAnchorRef={chipsAnchorRef} />
                ) : condition === 'c3' ? (
                  <TranscriptFullView lecture={lecture} />
                ) : density === 'brief' ? (
                  <BriefCanvas lecture={lecture} />
                ) : (
                  <DetailedNotebook lecture={lecture} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {page === 'lecture' && <ContextDrawer lecture={lecture} />}
          <GlobalAudioBar lecture={lecture} />
          <ImportDrawer />
        </div>
      </LayoutGroup>
    </MotionConfig>
  )
}
