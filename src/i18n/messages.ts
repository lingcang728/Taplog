import type { Locale, LocalizedText, RelationType, StudyCondition } from '../types/lecture'

export function pickText(text: LocalizedText, locale: Locale): string {
  return locale === 'zh' ? text.zh : text.en
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (hours > 0) return `${hours}:${pad(mins)}:${pad(secs)}`
  return `${pad(mins)}:${pad(secs)}`
}

export function formatDuration(ms: number, locale: Locale): string {
  const mins = Math.max(1, Math.round(ms / 60_000))
  return locale === 'zh' ? `${mins} 分钟` : `${mins} min`
}

export function formatClipSpan(startMs: number, endMs: number, locale: Locale): string {
  const secs = Math.max(1, Math.round((endMs - startMs) / 1000))
  return locale === 'zh' ? `${secs} 秒` : `${secs}s`
}

export function formatOffsetBadge(offsetMs: number, locale: Locale): string {
  const mins = Math.round(Math.abs(offsetMs) / 60_000)
  const dir = offsetMs >= 0
  if (mins < 1) {
    const secs = Math.max(5, Math.round(Math.abs(offsetMs) / 1000))
    return locale === 'zh'
      ? dir
        ? `+${secs}秒后`
        : `${secs}秒前`
      : dir
        ? `+${secs}s later`
        : `${secs}s earlier`
  }
  return locale === 'zh'
    ? dir
      ? `+${mins}m后`
      : `${mins}m前`
    : dir
      ? `+${mins}m later`
      : `${mins}m earlier`
}

const MESSAGES = {
  zh: {
    brandSubtitle: '可溯源图文讲座纪要',
    logoLabel: 'Taplog 首页',
    skipToMain: '跳至主要内容',
    heroTitleA: '听过的',
    heroTitleB: '讲座画廊',
    heroSub: '原声 · 图式 · 远端边界',
    filterLabel: '筛选讲座',
    filterAll: '全部讲座',
    filterAlerts: '含远端限定',
    filterImported: '本地导入',
    galleryEmptyTitle: '这个分类下还没有讲座',
    galleryEmptyBody: '切换到全部视图查看内置讲座，或导入一段本地长录音自动转写。',
    galleryChaptersCount: '{count} 章',
    galleryOpenLecture: '打开讲座：{title}',
    galleryImportTitle: '导入本地长讲座录音',
    galleryImportSub: '浏览器内 Whisper 分块转写，不上传服务器 · 预留手机与手表同步',
    galleryImportAction: '导入音频',
    backToGallery: '画廊',
    densityBrief: '结构图式',
    densityBriefHint: '单章聚焦图式与原声骨架',
    densityDetailed: '书页精读',
    densityDetailedHint: '暖白书页讲义 · 批注归边',
    showAllChapters: '展开全部章节',
    focusSingleChapter: '单章聚焦',
    schemaClickHint: '点任意节点查看原声与远端限定',
    readClaimProse: '展开本条讲义精读',
    hideClaimProse: '收起本条讲义',
    styleMist: '雾紫画布',
    stylePaper: '书页精读',
    styleFollowDensity: '随图式/书页自动切换风格',
    appearance: '外观与语言',
    themeSystem: '跟随系统',
    themeLight: '浅色',
    themeDark: '深色',
    importAudio: '导入录音',
    studyModeToggle: '实验台',
    verifiedHuman: '已人工核对',
    unverifiedDraft: '本地转写草稿',
    chaptersLabel: '课程章节',
    chapterAlertsCount: '处远端限定',
    allVerified: '已全部核对',
    rel_origin: '出处',
    rel_caveat: '补条件',
    rel_correction: '纠正',
    rel_reason: '解释原因',
    rel_example: '举例',
    silentMore: '另有 {count} 处原理解释/举例',
    openContext: '展开跨时间上下文',
    closeDrawer: '收起面板',
    jumpToDetailed: '在书页精读中定位',
    jumpToBrief: '在结构图式中定位',
    flagClaim: '标为存疑',
    flaggedClaim: '已标存疑',
    verifiedBadge: '已核对',
    playChain: '连播核心证据',
    playingChain: '连播中',
    playClip: '播放片段',
    pauseClip: '暂停',
    extendBack10: '前 10秒',
    extendForward15: '继续听 +15秒',
    surroundingLines: '前后 5 句原话',
    hideSurroundingLines: '收起前后原话',
    expandElaborations: '展开原因与举例 ({count})',
    collapseElaborations: '收起原因与举例',
    timelineSpanTitle: '本要点在整场讲座中的分布',
    skippedBridge: '跨过 {mins} 分钟',
    syntheticVoiceHint: '示范语音回退播放中',
    globalBarLabel: '讲座全局时间轴',
    boundedModeTag: '有界片段自动暂停',
    freePlayTag: '全局连续播放',
    fullTranscriptTitle: '讲座全文逐字稿（对照视图）',
    searchPlaceholder: '在全文逐字稿中搜索关键词...',
    searchNoMatch: '没有匹配的发言片段，请尝试更换关键词。',
    pureVisualNotice: '当前为纯图文无溯源模式（C4），所有时间戳与音频控件已隐藏。',
    importTitle: '导入讲座录音（浏览器本地转写）',
    importLead: '音频在浏览器本地通过 Whisper WebAssembly 分块识别时间戳，不上传服务器，解除 10 分钟时长限制。',
    chooseAudioFile: '选择本地讲座音频 (.mp3 / .wav / .m4a)',
    transcribeLangAuto: '自动检测语言',
    transcribeLangZh: '中文讲座',
    transcribeLangEn: '英文讲座',
    startTranscribe: '开始本地分块转写',
    cancelTranscribe: '停止',
    stageDecoding: '正在解码音频并生成波形...',
    stageLoadingModel: '正在加载本地 Whisper 量化模型...',
    stageChunkProgress: '正在转写第 {current} / {total} 块音频...',
    importOpenLecture: '在阅读台中打开该讲座草稿',
    hardwareFutureTitle: '从手机或手表同步课堂录音',
    hardwareFutureDesc: '保留 Taplog 抬手速记入口，后续可直接拉取穿戴端打点标记的长录音。',
    hardwareFutureTag: '接口已预留',
    studyBarTitle: '课程实验控制栏',
    participantLabel: '被试编号',
    cond_c1: 'C1 单点溯源（基线）',
    cond_c2: 'C2 分层多点溯源（干预）',
    cond_c3: 'C3 全文转写（对照）',
    cond_c4: 'C4 纯图文无溯源',
    densityLockFree: '自由切换图式/书页',
    densityLockBrief: '锁定结构图式',
    densityLockDetailed: '锁定书页精读',
    openTasksPanel: '实验题卡 ({done}/{total})',
    exportCsv: '导出 CSV',
    exportJson: '导出 JSON',
    resetSession: '重置记录',
    step1Header: '第一步：先仅凭当前图文判断（暂不点播音频）',
    step2Header: '第二步：请使用界面核实后确认最终答案',
    confidenceLabel: '当前把握程度（1=纯猜，5=非常确定）',
    lockStep1Btn: '记录初判并进入核实阶段',
    submitTaskBtn: '提交本题记录',
    taskSaved: '本题记录已保存',
    locateTargetClaim: '定位题目对应章节',
  },
  en: {
    brandSubtitle: 'Traceable Visual Lecture Notes',
    logoLabel: 'Taplog home',
    skipToMain: 'Skip to main content',
    heroTitleA: 'Your',
    heroTitleB: 'lecture gallery',
    heroSub: 'Voice · Schemas · Context',
    filterLabel: 'Filter lectures',
    filterAll: 'All lectures',
    filterAlerts: 'With caveats',
    filterImported: 'Imported',
    galleryEmptyTitle: 'No lectures in this view yet',
    galleryEmptyBody: 'Switch back to all lectures or import a local lecture recording to transcribe in your browser.',
    galleryChaptersCount: '{count} chapters',
    galleryOpenLecture: 'Open lecture: {title}',
    galleryImportTitle: 'Import a local lecture recording',
    galleryImportSub: 'In-browser chunked Whisper ASR · Phone & watch sync slot ready',
    galleryImportAction: 'Import audio',
    backToGallery: 'Gallery',
    densityBrief: 'Schemas',
    densityBriefHint: 'Focused visual structure & audio anchors',
    densityDetailed: 'Editorial',
    densityDetailedHint: 'Warm paper notes · Margin rail',
    showAllChapters: 'All chapters',
    focusSingleChapter: 'Focus chapter',
    schemaClickHint: 'Select any node to inspect scattered audio context',
    readClaimProse: 'Read lecture prose',
    hideClaimProse: 'Hide prose',
    styleMist: 'Mist Canvas',
    stylePaper: 'Editorial Paper',
    styleFollowDensity: 'Match style to view mode',
    appearance: 'Appearance & Language',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    importAudio: 'Import',
    studyModeToggle: 'Study Bar',
    verifiedHuman: 'Verified',
    unverifiedDraft: 'Local ASR draft',
    chaptersLabel: 'Lecture Chapters',
    chapterAlertsCount: 'distant caveats',
    allVerified: 'All verified',
    rel_origin: 'Origin',
    rel_caveat: 'Caveat',
    rel_correction: 'Correction',
    rel_reason: 'Why',
    rel_example: 'Example',
    silentMore: '+{count} why/example clips',
    openContext: 'Inspect scattered context',
    closeDrawer: 'Close panel',
    jumpToDetailed: 'Open in Editorial',
    jumpToBrief: 'Open in Schemas',
    flagClaim: 'Flag uncertainty',
    flaggedClaim: 'Flagged',
    verifiedBadge: 'Verified',
    playChain: 'Play core evidence',
    playingChain: 'Playing chain',
    playClip: 'Play clip',
    pauseClip: 'Pause',
    extendBack10: '-10s earlier',
    extendForward15: 'Listen +15s more',
    surroundingLines: '5 surrounding lines',
    hideSurroundingLines: 'Hide surrounding lines',
    expandElaborations: 'Show Why & Examples ({count})',
    collapseElaborations: 'Hide Why & Examples',
    timelineSpanTitle: 'Where this claim appears across the recording',
    skippedBridge: 'Skipped {mins} min',
    syntheticVoiceHint: 'Demo speech fallback active',
    globalBarLabel: 'Global lecture timeline',
    boundedModeTag: 'Bounded auto-pause',
    freePlayTag: 'Continuous playback',
    fullTranscriptTitle: 'Full Verbatim Transcript (Control View)',
    searchPlaceholder: 'Search verbatim transcript...',
    searchNoMatch: 'No matching segments found. Try a broader keyword.',
    pureVisualNotice: 'Pure visual mode (C4): all timestamps and audio controls are hidden.',
    importTitle: 'Import Lecture Recording (In-Browser Whisper)',
    importLead: 'Audio is decoded and transcribed locally in WebAssembly using sliding chunks with no 10-minute cap.',
    chooseAudioFile: 'Select local lecture audio (.mp3 / .wav / .m4a)',
    transcribeLangAuto: 'Auto-detect language',
    transcribeLangZh: 'Chinese',
    transcribeLangEn: 'English',
    startTranscribe: 'Run chunked local ASR',
    cancelTranscribe: 'Stop',
    stageDecoding: 'Decoding audio & computing waveform...',
    stageLoadingModel: 'Loading quantized Whisper model...',
    stageChunkProgress: 'Transcribing chunk {current} of {total}...',
    importOpenLecture: 'Open draft in workspace',
    hardwareFutureTitle: 'Sync from Phone or Watch',
    hardwareFutureDesc: 'Preserves Taplog quick-mark capture so wearable lecture bookmarks map straight onto chapters.',
    hardwareFutureTag: 'Connector slot ready',
    studyBarTitle: 'HCI Study Control Bar',
    participantLabel: 'Participant ID',
    cond_c1: 'C1 Single-Anchor (Baseline)',
    cond_c2: 'C2 Layered Multi-Anchor',
    cond_c3: 'C3 Full Transcript',
    cond_c4: 'C4 Pure Visual (No Audio)',
    densityLockFree: 'Free Schemas/Editorial toggle',
    densityLockBrief: 'Lock Schemas',
    densityLockDetailed: 'Lock Editorial',
    openTasksPanel: 'Study Tasks ({done}/{total})',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    resetSession: 'Reset Log',
    step1Header: 'Step 1: Initial judgment from visual/text note only (before audio)',
    step2Header: 'Step 2: Verify with interface and confirm final judgment',
    confidenceLabel: 'Confidence (1 = guessing, 5 = certain)',
    lockStep1Btn: 'Lock initial judgment & unlock audio verification',
    submitTaskBtn: 'Save task response',
    taskSaved: 'Response recorded',
    locateTargetClaim: 'Jump to relevant section',
  },
} as const

export type MessageKey = keyof (typeof MESSAGES)['zh']

export function msg(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let template: string = MESSAGES[locale][key] ?? MESSAGES.zh[key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.replaceAll(`{${k}}`, String(v))
    }
  }
  return template
}

export function relationLabel(relation: RelationType, locale: Locale): string {
  return msg(locale, `rel_${relation}`)
}

export function conditionLabel(condition: StudyCondition, locale: Locale): string {
  return msg(locale, `cond_${condition}`)
}
