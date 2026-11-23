import { beforeEach, describe, expect, it } from 'vitest'
import { BUILT_IN_LECTURES } from '../src/data/lectures'
import {
  focusClaim,
  getWorkspace,
  goToGallery,
  openLecture,
  parseBootParams,
  setStudyMode,
  toggleClaimDrawer,
} from '../src/state/workspace'

describe('Three-level navigation hierarchy & study deep-linking', () => {
  beforeEach(() => {
    setStudyMode(false)
    goToGallery()
  })

  it('defaults to the quiet home gallery when no study/lecture URL params are present', () => {
    const patch = parseBootParams('')
    expect(patch.page).toBeUndefined()
    expect(patch.studyMode).toBeUndefined()
    expect(getWorkspace().page).toBe('gallery')
  })

  it('jumps straight to lecture detail when ?study=1 or ?cond=c1 or ?lecture=m2 is specified', () => {
    const studyBoot = parseBootParams('?study=1')
    expect(studyBoot.studyMode).toBe(true)
    expect(studyBoot.page).toBe('lecture')

    const m2Study = parseBootParams('?study=1&lecture=m2&cond=c1')
    expect(m2Study.page).toBe('lecture')
    expect(m2Study.condition).toBe('c1')
    expect(m2Study.lectureId).toBe(BUILT_IN_LECTURES[1]?.id)
  })

  it('switches activeChapterId automatically when focusing or opening a claim in another chapter', () => {
    const m1 = BUILT_IN_LECTURES[0]!
    const ch3Claim = m1.chapters[2]!.claims[0]!
    openLecture(m1.id)
    expect(getWorkspace().page).toBe('lecture')
    expect(getWorkspace().activeChapterId).toBe(m1.chapters[0]!.id)

    focusClaim(ch3Claim.id, false)
    expect(getWorkspace().activeChapterId).toBe(ch3Claim.chapterId)
    expect(getWorkspace().highlightedClaimId).toBe(ch3Claim.id)

    const ch2Claim = m1.chapters[1]!.claims[1]!
    toggleClaimDrawer(ch2Claim.id)
    expect(getWorkspace().activeChapterId).toBe(ch2Claim.chapterId)
    expect(getWorkspace().openClaimId).toBe(ch2Claim.id)
  })

  it('transitions directly into lecture detail when study mode is enabled from the gallery', () => {
    expect(getWorkspace().page).toBe('gallery')
    setStudyMode(true)
    expect(getWorkspace().studyMode).toBe(true)
    expect(getWorkspace().page).toBe('lecture')
  })
})
