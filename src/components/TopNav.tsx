import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeftIcon,
  BookOpenTextIcon,
  CaretDownIcon,
  DesktopIcon,
  MoonIcon,
  SlidersHorizontalIcon,
  SquaresFourIcon,
  SunIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react'
import { formatDuration, msg, pickText } from '../i18n/messages'
import {
  getActiveLecture,
  goToGallery,
  selectLecture,
  setDensity,
  setFollowDensityStyle,
  setImportDrawerOpen,
  setLocale,
  setThemeMode,
  setVisualStyle,
  useWorkspace,
} from '../state/workspace'
import { FilterChips } from './FilterChips'
import { LogoMark } from './LogoMark'

export function TopNav({
  scrolled,
  chipsDocked,
}: {
  scrolled: boolean
  chipsDocked: boolean
}) {
  const page = useWorkspace((s) => s.page)
  const lectures = useWorkspace((s) => s.lectures)
  const activeLecture = useWorkspace((s) => getActiveLecture(s))
  const density = useWorkspace((s) => s.density)
  const densityLock = useWorkspace((s) => s.densityLock)
  const style = useWorkspace((s) => s.style)
  const followDensityStyle = useWorkspace((s) => s.followDensityStyle)
  const theme = useWorkspace((s) => s.theme)
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)

  const [lectureMenuOpen, setLectureMenuOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const lectureMenuRef = useRef<HTMLDivElement | null>(null)
  const appearanceRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (lectureMenuRef.current && !lectureMenuRef.current.contains(target)) {
        setLectureMenuOpen(false)
      }
      if (appearanceRef.current && !appearanceRef.current.contains(target)) {
        setAppearanceOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const densityDisabled = condition === 'c3'
  const isGallery = page === 'gallery'

  return (
    <header className={`top-nav ${isGallery ? 'is-gallery' : 'is-lecture'} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="top-nav-inner">
        <div className="nav-left">
          {isGallery ? (
            <button
              type="button"
              className="brand-lockup"
              aria-label={msg(locale, 'logoLabel')}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <LogoMark size={24} />
              <span className="brand-name">Taplog</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="back-gallery-btn"
                onClick={goToGallery}
              >
                <ArrowLeftIcon size={15} />
                <span>{msg(locale, 'backToGallery')}</span>
              </button>

              <span className="nav-divider" aria-hidden="true" />

              <div className="lecture-picker-wrap" ref={lectureMenuRef}>
                <button
                  type="button"
                  className="lecture-picker-btn"
                  onClick={() => setLectureMenuOpen((v) => !v)}
                  aria-expanded={lectureMenuOpen}
                >
                  <span className="lecture-code-chip">{activeLecture.code}</span>
                  <span className="lecture-picker-title">
                    {pickText(activeLecture.title, locale)}
                  </span>
                  <CaretDownIcon size={13} />
                </button>

                {lectureMenuOpen && (
                  <div className="nav-popover align-left" role="menu">
                    <span className="popover-label">
                      {locale === 'zh' ? '切换讲座' : 'Switch Lecture'}
                    </span>
                    {lectures.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className={`lecture-menu-item${item.id === activeLecture.id ? ' active' : ''}`}
                        onClick={() => {
                          selectLecture(item.id)
                          setLectureMenuOpen(false)
                        }}
                      >
                        <span className="lecture-menu-top">
                          <span className="lecture-code-chip">{item.code}</span>
                          <span>{pickText(item.title, locale)}</span>
                        </span>
                        <span className="lecture-menu-meta">
                          {pickText(item.speaker, locale)} · {formatDuration(item.durationMs, locale)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="nav-center">
          {isGallery ? (
            <AnimatePresence initial={false}>
              {chipsDocked && <FilterChips compact />}
            </AnimatePresence>
          ) : (
            <nav className="density-switch" aria-label="Reading Mode">
              <button
                type="button"
                className="density-tab"
                aria-pressed={density === 'brief'}
                disabled={densityDisabled || densityLock === 'detailed'}
                title={msg(locale, 'densityBriefHint')}
                onClick={() => setDensity('brief')}
              >
                {density === 'brief' && !densityDisabled && (
                  <motion.span layoutId="density-pill" className="density-pill-bg" />
                )}
                <SquaresFourIcon size={15} />
                <span>{msg(locale, 'densityBrief')}</span>
              </button>

              <button
                type="button"
                className="density-tab"
                aria-pressed={density === 'detailed'}
                disabled={densityDisabled || densityLock === 'brief'}
                title={msg(locale, 'densityDetailedHint')}
                onClick={() => setDensity('detailed')}
              >
                {density === 'detailed' && !densityDisabled && (
                  <motion.span layoutId="density-pill" className="density-pill-bg" />
                )}
                <BookOpenTextIcon size={15} />
                <span>{msg(locale, 'densityDetailed')}</span>
              </button>
            </nav>
          )}
        </div>

        <div className="nav-right">
          {isGallery ? (
            <button
              type="button"
              className="nav-action-btn"
              onClick={() => setImportDrawerOpen(true)}
              aria-label={msg(locale, 'importAudio')}
              title={msg(locale, 'importAudio')}
            >
              <UploadSimpleIcon size={15} />
              <span className="nav-action-label">{msg(locale, 'importAudio')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setImportDrawerOpen(true)}
              aria-label={msg(locale, 'importAudio')}
              title={msg(locale, 'importAudio')}
            >
              <UploadSimpleIcon size={17} />
            </button>
          )}

          <div className="popover-wrap" ref={appearanceRef}>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setAppearanceOpen((v) => !v)}
              aria-expanded={appearanceOpen}
              aria-label={msg(locale, 'appearance')}
              title={msg(locale, 'appearance')}
            >
              <SlidersHorizontalIcon size={17} />
            </button>

            {appearanceOpen && (
              <div className="nav-popover" role="dialog" aria-label={msg(locale, 'appearance')}>
                {!isGallery && (
                  <div className="popover-section">
                    <span className="popover-label">
                      {locale === 'zh' ? '详情页风格' : 'Detail Style'}
                    </span>
                    <div className="seg-row">
                      <button
                        type="button"
                        className="seg-btn"
                        aria-pressed={style === 'mist'}
                        onClick={() => setVisualStyle('mist', true)}
                      >
                        {msg(locale, 'styleMist')}
                      </button>
                      <button
                        type="button"
                        className="seg-btn"
                        aria-pressed={style === 'paper'}
                        onClick={() => setVisualStyle('paper', true)}
                      >
                        {msg(locale, 'stylePaper')}
                      </button>
                    </div>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={followDensityStyle}
                        onChange={(e) => setFollowDensityStyle(e.target.checked)}
                      />
                      <span>{msg(locale, 'styleFollowDensity')}</span>
                    </label>
                  </div>
                )}

                <div className="popover-section">
                  <span className="popover-label">
                    {locale === 'zh' ? '明暗外观' : 'Theme'}
                  </span>
                  <div className="seg-row cols-3">
                    <button
                      type="button"
                      className="seg-btn"
                      aria-pressed={theme === 'system'}
                      onClick={() => setThemeMode('system')}
                    >
                      <DesktopIcon size={13} />
                      <span>{msg(locale, 'themeSystem')}</span>
                    </button>
                    <button
                      type="button"
                      className="seg-btn"
                      aria-pressed={theme === 'light'}
                      onClick={() => setThemeMode('light')}
                    >
                      <SunIcon size={13} />
                      <span>{msg(locale, 'themeLight')}</span>
                    </button>
                    <button
                      type="button"
                      className="seg-btn"
                      aria-pressed={theme === 'dark'}
                      onClick={() => setThemeMode('dark')}
                    >
                      <MoonIcon size={13} />
                      <span>{msg(locale, 'themeDark')}</span>
                    </button>
                  </div>
                </div>

                <div className="popover-section">
                  <span className="popover-label">
                    {locale === 'zh' ? '界面与素材语言' : 'Language'}
                  </span>
                  <div className="seg-row">
                    <button
                      type="button"
                      className="seg-btn"
                      aria-pressed={locale === 'zh'}
                      onClick={() => setLocale('zh')}
                    >
                      中文
                    </button>
                    <button
                      type="button"
                      className="seg-btn"
                      aria-pressed={locale === 'en'}
                      onClick={() => setLocale('en')}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
