import { pauseAudio, setOnAnchorVerified } from '../audio/engine'
import { BUILT_IN_LECTURES } from '../data/lectures'
import type {
  Claim,
  GalleryFilter,
  Lecture,
  Locale,
  ReadingDensity,
  StudyCondition,
  ThemeMode,
  VisualStyle,
  WorkspacePage,
} from '../types/lecture'
import { createStore, useStore } from './store'
import { logTelemetry } from './telemetry'

export type DensityLock = 'free' | 'brief' | 'detailed'

export interface WorkspaceState {
  page: WorkspacePage
  galleryFilter: GalleryFilter
  lectures: Lecture[]
  lectureId: string
  density: ReadingDensity
  briefShowAllChapters: boolean
  style: VisualStyle
  followDensityStyle: boolean
  theme: ThemeMode
  dark: boolean
  locale: Locale
  activeChapterId: string | null
  openClaimId: string | null
  highlightedClaimId: string | null
  verifiedAnchorIds: string[]
  flaggedClaimIds: string[]
  studyMode: boolean
  condition: StudyCondition
  densityLock: DensityLock
  tasksDrawerOpen: boolean
  importDrawerOpen: boolean
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return getSystemDark()
}

export function parseBootParams(search: string): Partial<WorkspaceState> {
  const params = new URLSearchParams(search)
  const patch: Partial<WorkspaceState> = {}

  if (params.get('study') === '1' || params.get('study') === 'true') {
    patch.studyMode = true
    patch.page = 'lecture'
  }
  const cond = params.get('cond')
  if (cond === 'c1' || cond === 'c2' || cond === 'c3' || cond === 'c4') {
    patch.condition = cond
    patch.studyMode = true
    patch.page = 'lecture'
  }
  const view = params.get('view')
  if (view === 'lecture' || view === 'gallery') {
    patch.page = view
  }
  const density = params.get('density')
  if (density === 'brief' || density === 'detailed') {
    patch.density = density
    patch.style = density === 'brief' ? 'mist' : 'paper'
  }
  const style = params.get('style')
  if (style === 'mist' || style === 'paper') {
    patch.style = style
    patch.followDensityStyle = false
  }
  const theme = params.get('theme')
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    patch.theme = theme
  }
  const lang = params.get('lang')
  if (lang === 'zh' || lang === 'en') {
    patch.locale = lang
  }
  const lecture = params.get('lecture')
  if (lecture) {
    const found = BUILT_IN_LECTURES.find(
      (item) => item.id === lecture || item.code.toLowerCase() === lecture.toLowerCase(),
    )
    if (found) {
      patch.lectureId = found.id
      patch.page = patch.page ?? 'lecture'
    }
  }
  return patch
}

const firstLecture = BUILT_IN_LECTURES[0]!
const bootPatch =
  typeof window !== 'undefined' ? parseBootParams(window.location.search) : {}
const bootLecture =
  BUILT_IN_LECTURES.find((item) => item.id === bootPatch.lectureId) ?? firstLecture
const bootTheme: ThemeMode = bootPatch.theme ?? 'system'

const workspaceStore = createStore<WorkspaceState>({
  page: bootPatch.page ?? 'gallery',
  galleryFilter: 'all',
  lectures: BUILT_IN_LECTURES,
  lectureId: bootLecture.id,
  density: bootPatch.density ?? 'brief',
  briefShowAllChapters: false,
  style: bootPatch.style ?? (bootPatch.density === 'detailed' ? 'paper' : 'mist'),
  followDensityStyle: bootPatch.followDensityStyle ?? true,
  theme: bootTheme,
  dark: resolveDark(bootTheme),
  locale: bootPatch.locale ?? 'zh',
  activeChapterId: bootLecture.chapters[0]?.id ?? null,
  openClaimId: null,
  highlightedClaimId: null,
  verifiedAnchorIds: [],
  flaggedClaimIds: [],
  studyMode: bootPatch.studyMode ?? false,
  condition: bootPatch.condition ?? 'c2',
  densityLock: 'free',
  tasksDrawerOpen: false,
  importDrawerOpen: false,
})

function syncDocumentAttributes(state: WorkspaceState): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const effectiveStyle: VisualStyle = state.page === 'gallery' ? 'mist' : state.style
  root.dataset.page = state.page
  root.dataset.style = effectiveStyle
  root.dataset.density = state.density
  root.dataset.theme = state.theme
  root.lang = state.locale === 'zh' ? 'zh-CN' : 'en'
  root.style.colorScheme =
    state.theme === 'light' ? 'only light' : state.theme === 'dark' ? 'only dark' : 'light dark'
}

syncDocumentAttributes(workspaceStore.get())
workspaceStore.subscribe(() => syncDocumentAttributes(workspaceStore.get()))

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    const curr = workspaceStore.get()
    if (curr.theme === 'system') {
      workspaceStore.set({ dark: mq.matches })
    }
  }
  mq.addEventListener('change', onChange)
}

export const useWorkspace = <S,>(selector: (state: WorkspaceState) => S): S =>
  useStore(workspaceStore, selector)

export const getWorkspace = (): WorkspaceState => workspaceStore.get()

export function getActiveLecture(state: WorkspaceState = workspaceStore.get()): Lecture {
  return (
    state.lectures.find((item) => item.id === state.lectureId) ??
    state.lectures[0] ??
    firstLecture
  )
}

export function findClaimById(lecture: Lecture, claimId: string): Claim | null {
  for (const chapter of lecture.chapters) {
    const found = chapter.claims.find((claim) => claim.id === claimId)
    if (found) return found
  }
  return null
}

export function openLecture(lectureId: string): void {
  const curr = workspaceStore.get()
  const target = curr.lectures.find((item) => item.id === lectureId)
  if (!target) return
  const switching = target.id !== curr.lectureId
  if (switching) pauseAudio()
  workspaceStore.set({
    page: 'lecture',
    lectureId: target.id,
    activeChapterId: switching
      ? target.chapters[0]?.id ?? null
      : curr.activeChapterId ?? target.chapters[0]?.id ?? null,
    openClaimId: switching ? null : curr.openClaimId,
    highlightedClaimId: switching ? null : curr.highlightedClaimId,
  })
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
}

export function goToGallery(): void {
  workspaceStore.set({
    page: 'gallery',
    openClaimId: null,
    highlightedClaimId: null,
    tasksDrawerOpen: false,
  })
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
}

export function setGalleryFilter(galleryFilter: GalleryFilter): void {
  workspaceStore.set({ galleryFilter })
}

export function setBriefShowAllChapters(briefShowAllChapters: boolean): void {
  workspaceStore.set({ briefShowAllChapters })
}

export function selectLecture(lectureId: string): void {
  const curr = workspaceStore.get()
  const target = curr.lectures.find((item) => item.id === lectureId)
  if (!target || target.id === curr.lectureId) return
  pauseAudio()
  workspaceStore.set({
    lectureId: target.id,
    activeChapterId: target.chapters[0]?.id ?? null,
    openClaimId: null,
    highlightedClaimId: null,
  })
}

export function addImportedLecture(lecture: Lecture): void {
  const curr = workspaceStore.get()
  pauseAudio()
  workspaceStore.set({
    lectures: [lecture, ...curr.lectures],
    lectureId: lecture.id,
    page: 'lecture',
    activeChapterId: lecture.chapters[0]?.id ?? null,
    openClaimId: null,
    highlightedClaimId: null,
    importDrawerOpen: false,
  })
}

export function setDensity(density: ReadingDensity): void {
  const curr = workspaceStore.get()
  if (curr.densityLock !== 'free' && curr.densityLock !== density) return
  if (curr.density === density) return
  const nextStyle: VisualStyle = curr.followDensityStyle
    ? density === 'brief'
      ? 'mist'
      : 'paper'
    : curr.style
  workspaceStore.set({ density, style: nextStyle })
  logTelemetry({
    lectureId: curr.lectureId,
    condition: curr.condition,
    density,
    action: 'density_change',
    detail: `density=${density};style=${nextStyle}`,
  })
}

export function setVisualStyle(style: VisualStyle, lockManual = true): void {
  const curr = workspaceStore.get()
  workspaceStore.set({
    style,
    followDensityStyle: lockManual ? false : curr.followDensityStyle,
  })
  logTelemetry({
    lectureId: curr.lectureId,
    condition: curr.condition,
    density: curr.density,
    action: 'style_change',
    detail: `style=${style}`,
  })
}

export function setFollowDensityStyle(follow: boolean): void {
  const curr = workspaceStore.get()
  workspaceStore.set({
    followDensityStyle: follow,
    style: follow ? (curr.density === 'brief' ? 'mist' : 'paper') : curr.style,
  })
}

export function setThemeMode(theme: ThemeMode): void {
  workspaceStore.set({ theme, dark: resolveDark(theme) })
}

export function setLocale(locale: Locale): void {
  workspaceStore.set({ locale })
}

export function setActiveChapter(chapterId: string | null): void {
  workspaceStore.set({ activeChapterId: chapterId })
}

export function toggleClaimDrawer(claimId: string | null): void {
  const curr = workspaceStore.get()
  const nextOpen = claimId && curr.openClaimId === claimId ? null : claimId
  let nextChapter = curr.activeChapterId
  if (nextOpen) {
    const lecture = getActiveLecture(curr)
    const claim = findClaimById(lecture, nextOpen)
    if (claim) nextChapter = claim.chapterId
  }
  workspaceStore.set({
    activeChapterId: nextChapter,
    openClaimId: nextOpen,
    highlightedClaimId: nextOpen,
  })
  if (nextOpen) {
    logTelemetry({
      lectureId: curr.lectureId,
      condition: curr.condition,
      density: curr.density,
      action: 'drawer_open',
      claimId: nextOpen,
    })
  }
}

export function focusClaim(claimId: string, openDrawer = false): void {
  const curr = workspaceStore.get()
  const lecture = getActiveLecture(curr)
  const claim = findClaimById(lecture, claimId)
  if (!claim) return

  workspaceStore.set({
    page: 'lecture',
    activeChapterId: claim.chapterId,
    highlightedClaimId: claim.id,
    openClaimId: openDrawer ? claim.id : curr.openClaimId,
  })

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-claim-id="${claim.id}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }
}

export function setHighlightedClaim(claimId: string | null): void {
  workspaceStore.set({ highlightedClaimId: claimId })
}

export function jumpToClaimInDensity(claimId: string, targetDensity: ReadingDensity): void {
  const curr = workspaceStore.get()
  const lecture = getActiveLecture(curr)
  const claim = findClaimById(lecture, claimId)
  const effectiveDensity =
    curr.densityLock !== 'free' && curr.densityLock !== targetDensity
      ? curr.density
      : targetDensity
  const nextStyle: VisualStyle = curr.followDensityStyle
    ? effectiveDensity === 'brief'
      ? 'mist'
      : 'paper'
    : curr.style

  workspaceStore.set({
    page: 'lecture',
    density: effectiveDensity,
    style: nextStyle,
    activeChapterId: claim?.chapterId ?? curr.activeChapterId,
    openClaimId: claimId,
    highlightedClaimId: claimId,
  })

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-claim-id="${claimId}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }
}

export function markAnchorVerified(anchorId: string): void {
  const curr = workspaceStore.get()
  if (curr.verifiedAnchorIds.includes(anchorId)) return
  workspaceStore.set({
    verifiedAnchorIds: [...curr.verifiedAnchorIds, anchorId],
  })
  logTelemetry({
    lectureId: curr.lectureId,
    condition: curr.condition,
    density: curr.density,
    action: 'anchor_verified',
    anchorId,
  })
}

setOnAnchorVerified(markAnchorVerified)

export function toggleClaimFlag(claimId: string): void {
  const curr = workspaceStore.get()
  const exists = curr.flaggedClaimIds.includes(claimId)
  const next = exists
    ? curr.flaggedClaimIds.filter((id) => id !== claimId)
    : [...curr.flaggedClaimIds, claimId]
  workspaceStore.set({ flaggedClaimIds: next })
  logTelemetry({
    lectureId: curr.lectureId,
    condition: curr.condition,
    density: curr.density,
    action: 'claim_flag_toggle',
    claimId,
    detail: exists ? 'unflagged' : 'flagged',
  })
}

export function setStudyMode(enabled: boolean): void {
  const curr = workspaceStore.get()
  workspaceStore.set({
    studyMode: enabled,
    page: enabled ? 'lecture' : curr.page,
    tasksDrawerOpen: enabled ? curr.tasksDrawerOpen : false,
  })
}

export function setStudyCondition(condition: StudyCondition): void {
  const curr = workspaceStore.get()
  if (curr.condition === condition) return
  pauseAudio()
  workspaceStore.set({
    condition,
    openClaimId: null,
  })
  logTelemetry({
    lectureId: curr.lectureId,
    condition,
    density: curr.density,
    action: 'condition_change',
    detail: `cond=${condition}`,
  })
}

export function setDensityLock(lock: DensityLock): void {
  const curr = workspaceStore.get()
  if (lock === 'free') {
    workspaceStore.set({ densityLock: 'free' })
    return
  }
  const nextStyle: VisualStyle = curr.followDensityStyle
    ? lock === 'brief'
      ? 'mist'
      : 'paper'
    : curr.style
  workspaceStore.set({
    densityLock: lock,
    density: lock,
    style: nextStyle,
  })
}

export function setTasksDrawerOpen(open: boolean): void {
  workspaceStore.set({ tasksDrawerOpen: open })
}

export function setImportDrawerOpen(open: boolean): void {
  workspaceStore.set({ importDrawerOpen: open })
}
