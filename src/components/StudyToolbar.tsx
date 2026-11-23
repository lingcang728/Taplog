import { useState } from 'react'
import {
  CheckCircleIcon,
  DownloadSimpleIcon,
  FlaskIcon,
  ListBulletsIcon,
  XIcon,
} from '@phosphor-icons/react'
import { conditionLabel, msg, pickText } from '../i18n/messages'
import {
  clearTelemetrySession,
  exportTelemetryCsv,
  exportTelemetryJson,
  setParticipantId,
  startTaskAttempt,
  submitTaskFinal,
  submitTaskStep1,
  useTelemetry,
} from '../state/telemetry'
import {
  focusClaim,
  getActiveLecture,
  setDensityLock,
  setStudyCondition,
  setStudyMode,
  setTasksDrawerOpen,
  useWorkspace,
  type DensityLock,
} from '../state/workspace'
import type { StudyCondition, StudyTask } from '../types/lecture'

function triggerTextDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function StudyTaskCard({ task, lectureId }: { task: StudyTask; lectureId: string }) {
  const locale = useWorkspace((s) => s.locale)
  const condition = useWorkspace((s) => s.condition)
  const density = useWorkspace((s) => s.density)
  const response = useTelemetry((s) => s.responses[`${condition}:${task.id}`])

  const [selectedOpt, setSelectedOpt] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(3)

  const isDone = Boolean(response?.completedAtMs)
  const needsStep1 = Boolean(task.twoStepConfidence && !response?.step1OptionId)

  const handleLocate = () => {
    startTaskAttempt({ taskId: task.id, lectureId, condition, density })
    focusClaim(task.targetClaimId, false)
  }

  const handleLockStep1 = () => {
    if (!selectedOpt) return
    submitTaskStep1({
      taskId: task.id,
      lectureId,
      condition,
      density,
      optionId: selectedOpt,
      confidence,
    })
  }

  const handleFinalSubmit = () => {
    if (!selectedOpt) return
    submitTaskFinal({
      taskId: task.id,
      lectureId,
      condition,
      density,
      optionId: selectedOpt,
      confidence,
      correctOptionId: task.correctOptionId,
    })
  }

  return (
    <div className={`task-card${isDone ? ' is-done' : ''}`}>
      <p className="task-prompt">{pickText(task.prompt, locale)}</p>

      {task.twoStepConfidence && !isDone && (
        <div className={`task-step-banner${needsStep1 ? '' : ' step2'}`}>
          {msg(locale, needsStep1 ? 'step1Header' : 'step2Header')}
        </div>
      )}

      {!isDone ? (
        <>
          <div className="task-options">
            {task.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="task-opt-btn"
                aria-pressed={selectedOpt === opt.id}
                onClick={() => {
                  startTaskAttempt({ taskId: task.id, lectureId, condition, density })
                  setSelectedOpt(opt.id)
                }}
              >
                {pickText(opt.label, locale)}
              </button>
            ))}
          </div>

          <div className="field-group">
            <span className="field-label">{msg(locale, 'confidenceLabel')}</span>
            <div className="confidence-row">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  className="conf-btn"
                  aria-pressed={confidence === score}
                  onClick={() => setConfidence(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-actions">
            {needsStep1 ? (
              <button
                type="button"
                className="drawer-btn primary"
                disabled={!selectedOpt}
                onClick={handleLockStep1}
              >
                {msg(locale, 'lockStep1Btn')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="drawer-btn primary"
                  disabled={!selectedOpt}
                  onClick={handleFinalSubmit}
                >
                  {msg(locale, 'submitTaskBtn')}
                </button>
                <button type="button" className="drawer-btn" onClick={handleLocate}>
                  {msg(locale, 'locateTargetClaim')}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="clip-verified-chip">
          <CheckCircleIcon size={15} weight="fill" />
          <span>
            {msg(locale, 'taskSaved')}
            {response?.step1Confidence !== undefined
              ? ` (Step1=${response.step1Confidence} -> Final=${response.finalConfidence})`
              : ` (Conf=${response?.finalConfidence})`}
          </span>
        </div>
      )}
    </div>
  )
}

export function StudyToolbar() {
  const studyMode = useWorkspace((s) => s.studyMode)
  const condition = useWorkspace((s) => s.condition)
  const densityLock = useWorkspace((s) => s.densityLock)
  const tasksDrawerOpen = useWorkspace((s) => s.tasksDrawerOpen)
  const locale = useWorkspace((s) => s.locale)
  const lecture = useWorkspace((s) => getActiveLecture(s))

  const participantId = useTelemetry((s) => s.participantId)
  const responses = useTelemetry((s) => s.responses)

  if (!studyMode) return null

  const conditions: StudyCondition[] = ['c1', 'c2', 'c3', 'c4']
  const doneCount = lecture.studyTasks.filter(
    (task) => Boolean(responses[`${condition}:${task.id}`]?.completedAtMs),
  ).length

  return (
    <>
      <div className="study-ribbon" role="region" aria-label={msg(locale, 'studyBarTitle')}>
        <div className="study-ribbon-inner">
          <div className="study-group">
            <span className="study-badge">
              <FlaskIcon size={15} weight="fill" />
              <span>{msg(locale, 'studyBarTitle')}</span>
            </span>

            <label className="clip-clock" htmlFor="study-pid">
              {msg(locale, 'participantLabel')}
            </label>
            <input
              id="study-pid"
              className="study-pid-input"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
            />

            <div className="study-cond-bar" role="group" aria-label="Study Conditions">
              {conditions.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  className="study-cond-btn"
                  aria-pressed={condition === cond}
                  onClick={() => setStudyCondition(cond)}
                  title={conditionLabel(cond, locale)}
                >
                  {cond.toUpperCase()}
                </button>
              ))}
            </div>

            <select
              className="field-select"
              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
              value={densityLock}
              aria-label="Density Lock"
              onChange={(e) => setDensityLock(e.target.value as DensityLock)}
            >
              <option value="free">{msg(locale, 'densityLockFree')}</option>
              <option value="brief">{msg(locale, 'densityLockBrief')}</option>
              <option value="detailed">{msg(locale, 'densityLockDetailed')}</option>
            </select>
          </div>

          <div className="study-group">
            {lecture.studyTasks.length > 0 && (
              <button
                type="button"
                className={`drawer-btn${tasksDrawerOpen ? ' primary' : ''}`}
                onClick={() => setTasksDrawerOpen(!tasksDrawerOpen)}
              >
                <ListBulletsIcon size={14} />
                <span>
                  {msg(locale, 'openTasksPanel', {
                    done: doneCount,
                    total: lecture.studyTasks.length,
                  })}
                </span>
              </button>
            )}

            <button
              type="button"
              className="drawer-btn"
              onClick={() =>
                triggerTextDownload(
                  `taplog-study-${participantId}-${condition}.csv`,
                  exportTelemetryCsv(),
                  'text/csv;charset=utf-8',
                )
              }
            >
              <DownloadSimpleIcon size={13} />
              <span>{msg(locale, 'exportCsv')}</span>
            </button>

            <button
              type="button"
              className="drawer-btn"
              onClick={() =>
                triggerTextDownload(
                  `taplog-study-${participantId}-${condition}.json`,
                  exportTelemetryJson(),
                  'application/json;charset=utf-8',
                )
              }
            >
              <DownloadSimpleIcon size={13} />
              <span>{msg(locale, 'exportJson')}</span>
            </button>

            <button
              type="button"
              className="drawer-btn"
              onClick={() => clearTelemetrySession()}
            >
              {msg(locale, 'resetSession')}
            </button>

            <button
              type="button"
              className="drawer-btn"
              onClick={() => setStudyMode(false)}
              aria-label={msg(locale, 'closeDrawer')}
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      {tasksDrawerOpen && lecture.studyTasks.length > 0 && (
        <aside className="study-tasks-sheet" aria-label={msg(locale, 'studyBarTitle')}>
          <div className="sheet-head">
            <h3 className="sheet-title">{conditionLabel(condition, locale)}</h3>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setTasksDrawerOpen(false)}
              aria-label={msg(locale, 'closeDrawer')}
            >
              <XIcon size={15} />
            </button>
          </div>
          {lecture.studyTasks.map((task) => (
            <StudyTaskCard key={`${condition}:${task.id}`} task={task} lectureId={lecture.id} />
          ))}
        </aside>
      )}
    </>
  )
}
