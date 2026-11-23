import { motion } from 'motion/react'
import { msg } from '../i18n/messages'
import { setGalleryFilter, useWorkspace } from '../state/workspace'
import type { GalleryFilter } from '../types/lecture'

const OPTIONS: GalleryFilter[] = ['all', 'alerts', 'imported']
const chipSpring = { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.85 }

export function FilterChips({ compact = false }: { compact?: boolean }) {
  const filter = useWorkspace((s) => s.galleryFilter)
  const locale = useWorkspace((s) => s.locale)

  const labelFor = (option: GalleryFilter) => {
    if (option === 'all') return msg(locale, 'filterAll')
    if (option === 'alerts') return msg(locale, 'filterAlerts')
    return msg(locale, 'filterImported')
  }

  return (
    <motion.div
      className={`chips ${compact ? 'chips-compact' : ''}`}
      role="radiogroup"
      aria-label={msg(locale, 'filterLabel')}
      initial={compact ? { opacity: 0, y: -4 } : false}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.16 } }}
    >
      {OPTIONS.map((option) => {
        const active = filter === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? 'chip active' : 'chip'}
            onClick={() => setGalleryFilter(option)}
          >
            {active && (
              <motion.span
                layoutId={compact ? 'chip-pill-compact' : 'chip-pill'}
                className="chip-pill"
                transition={chipSpring}
              />
            )}
            <span className="chip-label">{labelFor(option)}</span>
          </button>
        )
      })}
    </motion.div>
  )
}
