import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { UploadSimpleIcon, WatchIcon, XIcon } from '@phosphor-icons/react'
import { msg } from '../i18n/messages'
import {
  addImportedLecture,
  setImportDrawerOpen,
  useWorkspace,
} from '../state/workspace'
import {
  transcribeLocalLectureFile,
  type TranscribeProgress,
  type WhisperLangOption,
} from '../whisper/transcriber'

export function ImportDrawer() {
  const open = useWorkspace((s) => s.importDrawerOpen)
  const locale = useWorkspace((s) => s.locale)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lang, setLang] = useState<WhisperLangOption>('auto')
  const [progress, setProgress] = useState<TranscribeProgress | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const closeSheet = () => {
    if (busy) {
      abortRef.current?.abort()
      setBusy(false)
      setProgress(null)
    }
    setImportDrawerOpen(false)
  }

  const handleStart = async () => {
    if (!selectedFile || busy) return
    setErrorMsg(null)
    setBusy(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const lecture = await transcribeLocalLectureFile(
        selectedFile,
        lang,
        locale,
        controller.signal,
        (next) => setProgress(next),
      )
      addImportedLecture(lecture)
      setSelectedFile(null)
      setProgress(null)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setErrorMsg(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const progressText = !progress
    ? ''
    : progress.stage === 'decoding'
      ? msg(locale, 'stageDecoding')
      : progress.stage === 'loading_model'
        ? msg(locale, 'stageLoadingModel')
        : msg(locale, 'stageChunkProgress', {
            current: progress.currentChunk,
            total: progress.totalChunks,
          })

  const progressPercent = !progress
    ? 0
    : progress.stage === 'decoding'
      ? 14
      : progress.stage === 'loading_model'
        ? 28
        : Math.round(30 + (progress.currentChunk / Math.max(1, progress.totalChunks)) * 70)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSheet}
        >
          <motion.aside
            className="import-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={msg(locale, 'importTitle')}
            initial={{ x: 40, opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-head">
              <h2 className="sheet-title">{msg(locale, 'importTitle')}</h2>
              <button
                type="button"
                className="nav-icon-btn"
                onClick={closeSheet}
                aria-label={msg(locale, 'closeDrawer')}
              >
                <XIcon size={16} />
              </button>
            </div>

            <p className="import-lead">{msg(locale, 'importLead')}</p>

            <div className="dropzone-card">
              <UploadSimpleIcon size={28} style={{ color: 'var(--accent)' }} />
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="file-hidden"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] ?? null)
                  setErrorMsg(null)
                }}
              />
              <button
                type="button"
                className="drawer-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {msg(locale, 'chooseAudioFile')}
              </button>
              {selectedFile && (
                <span className="clip-clock">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="whisper-lang-select">
                {locale === 'zh' ? '识别语言偏好' : 'Recognition Language'}
              </label>
              <select
                id="whisper-lang-select"
                className="field-select"
                value={lang}
                disabled={busy}
                onChange={(e) => setLang(e.target.value as WhisperLangOption)}
              >
                <option value="auto">{msg(locale, 'transcribeLangAuto')}</option>
                <option value="zh">{msg(locale, 'transcribeLangZh')}</option>
                <option value="en">{msg(locale, 'transcribeLangEn')}</option>
              </select>
            </div>

            <div className="drawer-actions">
              <button
                type="button"
                className="drawer-btn primary"
                disabled={!selectedFile || busy}
                onClick={handleStart}
              >
                {msg(locale, 'startTranscribe')}
              </button>
              {busy && (
                <button
                  type="button"
                  className="drawer-btn"
                  onClick={() => abortRef.current?.abort()}
                >
                  {msg(locale, 'cancelTranscribe')}
                </button>
              )}
            </div>

            {progress && (
              <div className="progress-card" role="status">
                <span>{progressText}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}

            {errorMsg && <div className="import-error">{errorMsg}</div>}

            <div className="hardware-slot-card">
              <WatchIcon size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <h3 className="hardware-slot-title">
                  <span>{msg(locale, 'hardwareFutureTitle')}</span>
                  <span className="lecture-code-chip">{msg(locale, 'hardwareFutureTag')}</span>
                </h3>
                <p className="hardware-slot-desc">{msg(locale, 'hardwareFutureDesc')}</p>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
