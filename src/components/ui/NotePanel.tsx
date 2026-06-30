'use client'

import { useRef, useState, useTransition, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addNote, deleteNote, editNote, togglePinNote, toggleDoneNote } from '@/app/actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/providers/ToastProvider'

export type NoteItem = {
  id: number
  content: string
  type: string
  pinned: boolean
  done: boolean
  entityType?: string
  entityId?: number
  entityName?: string | null
  createdAt: string  // ISO string（服务端序列化后）
  // 预约字段
  appointmentTime?: string | null
  appointmentLocation?: string | null
  appointmentType?: string | null
  appointmentPerson?: string | null
  // 日记字段
  articleType?: string | null
  articlePerson?: string | null
}

type NotePanelProps = {
  notes: NoteItem[]
  entityType: string
  entityId: number
  /** 笔记发生增删改后通知父组件刷新 */
  onNotesChanged?: () => void
  /** 按创建日期筛选（YYYY-MM-DD），null = 不筛选 */
  filterDate?: string | null
  /** 清除日期筛选回调 */
  onClearFilterDate?: () => void
  /** 搜索关键词（全文匹配） */
  searchTerm?: string
  /** 笔记列表首次加载中，显示骨架屏 */
  loading?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  todo: '待办',
  log: '沟通记录',
  note: '随笔',
  appointment: '预约',
  diary: '日记',
}

const TYPE_COLORS: Record<string, string> = {
  todo: 'note-type-todo',
  log: 'note-type-log',
  note: 'note-type-note',
  appointment: 'note-type-appointment',
  diary: 'note-type-diary',
}

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  diary: '日记',
  study: '学习笔记',
  report: '报告内容',
  web: '网络',
  reading: '读书笔记',
  lecture: '讲座笔记',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} 天前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** 格式化预约时间：MM-DD HH:mm */
function formatApptTime(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${mm}-${dd} 周${week} ${hh}:${min}`
}

const APPT_TYPE_LABELS: Record<string, string> = {
  interview: '面试',
  business: '商务沟通',
  todo_appointment: '待办预约',
  other: '其他',
}

export function NotePanel({ notes, entityType, entityId, onNotesChanged, filterDate, onClearFilterDate, searchTerm, loading = false }: NotePanelProps) {
  const [inputType, setInputType] = useState<'todo' | 'log' | 'note' | 'appointment' | 'diary'>('note')
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const { success, error } = useToast()

  // ── 过滤状态 ──
  const [filterType, setFilterType] = useState<'all' | 'todo' | 'log' | 'note' | 'appointment' | 'diary'>('all')
  const [showOnlyUndone, setShowOnlyUndone] = useState(false)

  // ── 视图模式 ──
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  // ── 预约表单字段 ──
  const [apptTime, setApptTime] = useState('')
  const [apptLocation, setApptLocation] = useState('')
  const [apptType, setApptType] = useState('interview')
  const [apptPerson, setApptPerson] = useState('')

  // ── 日记表单字段 ──
  const [articleType, setArticleType] = useState('diary')
  const [articlePerson, setArticlePerson] = useState('')
  const diaryEditorRef = useRef<HTMLDivElement>(null)

  // ── 日记草稿自动保存（localStorage）──
  const [draftSavedAt, setDraftSavedAt] = useState<string>('')
  const [draftVersion, setDraftVersion] = useState(0)
  const DRAFT_KEY = 'note-diary-draft'

  // ── 日记全屏模式 ──
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenEditorRef = useRef<HTMLDivElement>(null)
  const fullscreenContentRef = useRef('')
  // ── 字数统计（纯文本字符数）──
  const [diaryCharCount, setDiaryCharCount] = useState(0)
  const MAX_DIARY_CHARS = 10000

  /** 更新字数统计 */
  const updateDiaryCharCount = useCallback(() => {
    const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
    const text = (ref.current?.innerText ?? '').trim()
    setDiaryCharCount(text.length)
  }, [isFullscreen])

  // 挂载时恢复草稿
  useEffect(() => {
    if (inputType !== 'diary') return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw && diaryEditorRef.current) {
        const draft = JSON.parse(raw)
        if (draft.html) {
          diaryEditorRef.current.innerHTML = draft.html
          setArticleType(draft.articleType ?? 'diary')
          setArticlePerson(draft.articlePerson ?? '')
        }
      }
    } catch { /* ignore */ }
  }, [inputType])

  // 切换到日记类型时初始化字数统计
  useEffect(() => {
    if (inputType === 'diary') {
      requestAnimationFrame(() => updateDiaryCharCount())
    }
  }, [inputType, updateDiaryCharCount])

  // 输入时自动保存草稿（debounce 2s）
  useEffect(() => {
    if (inputType !== 'diary') return
    const timer = setTimeout(() => {
      const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
      const html = ref.current?.innerHTML ?? ''
      if (!html.trim()) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          html,
          articleType,
          articlePerson,
          ts: Date.now(),
        }))
        setDraftSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
      } catch { /* ignore */ }
    }, 2000)
    return () => clearTimeout(timer)
  }, [inputType, articleType, articlePerson, draftVersion, isFullscreen])

  function handleSubmit() {
    // 日记类型从 contentEditable 获取内容
    let content = inputValue.trim()
    if (inputType === 'diary') {
      const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
      content = (ref.current?.innerHTML ?? '').trim()
    }
    if (!content) return

    const fd = new FormData()
    fd.set('content', content)
    fd.set('type', inputType)
    fd.set('entityType', entityType)
    fd.set('entityId', String(entityId))
    // 预约字段
    if (inputType === 'appointment') {
      if (apptTime) fd.set('appointmentTime', apptTime)
      if (apptLocation.trim()) fd.set('appointmentLocation', apptLocation.trim())
      fd.set('appointmentType', apptType)
      if (apptPerson.trim()) fd.set('appointmentPerson', apptPerson.trim())
    }
    // 日记字段
    if (inputType === 'diary') {
      fd.set('articleType', articleType)
      if (articlePerson.trim()) fd.set('articlePerson', articlePerson.trim())
    }
    startTransition(async () => {
      try {
        const result = await addNote(fd)
        if (!result.success) {
          error('保存失败', result.message)
          return
        }

        setInputValue('')
        setApptTime('')
        setApptLocation('')
        setApptType('interview')
        setApptPerson('')
        setArticleType('diary')
        setArticlePerson('')
        if (diaryEditorRef.current) diaryEditorRef.current.innerHTML = ''
        if (fullscreenEditorRef.current) fullscreenEditorRef.current.innerHTML = ''
        setIsFullscreen(false)
        setDiaryCharCount(0)
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        setDraftSavedAt('')
        success('笔记已保存')
        onNotesChanged?.()
      } catch (err) {
        // 最终兜底：防止未处理错误穿透到 global-error.tsx
        console.error('添加笔记异常:', err)
        error('保存失败', '网络请求异常，请稍后重试')
      }
    })
  }

  // ── 置顶优先，时间倒序（memoized）──
  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notes])

  // ── 根据 filterType 过滤（memoized）──
  const filtered = useMemo(() => {
    return sorted.filter((n) => {
      if (filterType === 'all') return true
      if ((filterType === 'todo' || filterType === 'appointment') && showOnlyUndone) return n.type === filterType && !n.done
      return n.type === filterType
    })
  }, [sorted, filterType, showOnlyUndone])

  // ── 按日期筛选（memoized）──
  const dateFiltered = useMemo(() => {
    if (!filterDate) return filtered
    return filtered.filter((n) => {
      const targetDate = n.type === 'appointment' && n.appointmentTime
        ? n.appointmentTime
        : n.createdAt
      return targetDate.slice(0, 10) === filterDate
    })
  }, [filtered, filterDate])

  // ── 搜索过滤（memoized）──
  const searchFiltered = useMemo(() => {
    if (!searchTerm) return dateFiltered
    const q = searchTerm.toLowerCase()
    return dateFiltered.filter((n) => {
      // 对于日记类型，content 是 HTML，需要去除标签再搜索
      const plainContent = n.type === 'diary'
        ? n.content.replace(/<[^>]+>/g, '')
        : n.content
      return (
        plainContent.toLowerCase().includes(q) ||
        (n.entityName && n.entityName.toLowerCase().includes(q)) ||
        (n.appointmentPerson && n.appointmentPerson.toLowerCase().includes(q)) ||
        (n.appointmentLocation && n.appointmentLocation.toLowerCase().includes(q)) ||
        (n.appointmentType && (APPT_TYPE_LABELS[n.appointmentType] ?? n.appointmentType).toLowerCase().includes(q)) ||
        (n.articleType && (ARTICLE_TYPE_LABELS[n.articleType] ?? n.articleType).toLowerCase().includes(q)) ||
        (n.articlePerson && n.articlePerson.toLowerCase().includes(q)) ||
        (TYPE_LABELS[n.type] && TYPE_LABELS[n.type].toLowerCase().includes(q))
      )
    })
  }, [dateFiltered, searchTerm])

  // ── 未完成待办计数（memoized）──
  const undoneTodoCount = useMemo(() => {
    return notes.filter((n) => n.type === 'todo' && !n.done).length
  }, [notes])

  // ── 未完成预约计数（memoized）──
  const undoneAppointmentCount = useMemo(() => {
    return notes.filter((n) => n.type === 'appointment' && !n.done).length
  }, [notes])

  // ── 标签点击：设置过滤类型 + 输入类型 ──
  function handleTabClick(type: 'all' | 'todo' | 'log' | 'note' | 'appointment' | 'diary') {
    setFilterType(type)
    setShowOnlyUndone(false)
    if (type !== 'all') {
      setInputType(type)
    } else {
      // 点击「全部」时重置输入类型为「随笔」，隐藏特定类型表单
      setInputType('note')
    }
  }

  // ── 双击"待办"：仅显示未完成 ──
  function handleTodoDblClick() {
    if (filterType === 'todo' && showOnlyUndone) {
      // 如果已经在仅显示未完成状态，切回全部待办
      setShowOnlyUndone(false)
    } else {
      setFilterType('todo')
      setInputType('todo')
      setShowOnlyUndone(true)
    }
  }

  // ── 双击"预约"：仅显示未完成 ──
  function handleAppointmentDblClick() {
    if (filterType === 'appointment' && showOnlyUndone) {
      setShowOnlyUndone(false)
    } else {
      setFilterType('appointment')
      setInputType('appointment')
      setShowOnlyUndone(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── 富文本工具栏命令 ──
  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
    ref.current?.focus()
  }, [isFullscreen])

  // ── 全屏切换 ──
  const enterFullscreen = useCallback(() => {
    fullscreenContentRef.current = diaryEditorRef.current?.innerHTML ?? ''
    setIsFullscreen(true)
  }, [])

  const exitFullscreen = useCallback(() => {
    fullscreenContentRef.current = fullscreenEditorRef.current?.innerHTML ?? ''
    setIsFullscreen(false)
  }, [])

  // 全屏模式挂载/卸载时同步内容
  useEffect(() => {
    if (isFullscreen) {
      // 进入全屏：设置内容到全屏编辑器
      if (fullscreenEditorRef.current) {
        fullscreenEditorRef.current.innerHTML = fullscreenContentRef.current
        fullscreenEditorRef.current.focus()
      }
      updateDiaryCharCount()
    } else {
      // 退出全屏：恢复内容到内联编辑器
      if (diaryEditorRef.current && fullscreenContentRef.current) {
        diaryEditorRef.current.innerHTML = fullscreenContentRef.current
      }
      updateDiaryCharCount()
    }
  }, [isFullscreen, updateDiaryCharCount])

  return (
    <div className="note-panel">
      {/* ── 快速输入区 ── */}
      <form
        ref={formRef}
        className="note-input-area"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="type" value={inputType} />

        {/* 类型切换（含全部 + 过滤标签） */}
        <div className="note-type-tabs" role="group" aria-label="笔记类型过滤">
          {/* 全部 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'all' ? 'active note-type-all' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            全部
          </button>

          {/* 待办 — 带未完成徽章 + 双击仅显示未完成 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'todo' ? 'active' : ''} ${TYPE_COLORS.todo} ${filterType === 'todo' && showOnlyUndone ? 'is-undone-filter' : ''}`}
            onClick={() => handleTabClick('todo')}
            onDoubleClick={handleTodoDblClick}
            title={showOnlyUndone ? '双击：显示全部待办' : '双击：仅显示未完成待办'}
          >
            {TYPE_LABELS.todo}
            {undoneTodoCount > 0 && (
              <span className="note-type-badge-count" aria-label={`${undoneTodoCount} 条未完成`}>
                {undoneTodoCount}
              </span>
            )}
          </button>

          {/* 沟通记录 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'log' ? 'active' : ''} ${TYPE_COLORS.log}`}
            onClick={() => handleTabClick('log')}
          >
            {TYPE_LABELS.log}
          </button>

          {/* 随笔 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'note' ? 'active' : ''} ${TYPE_COLORS.note}`}
            onClick={() => handleTabClick('note')}
          >
            {TYPE_LABELS.note}
          </button>

          {/* 预约 — 带未完成徽章 + 双击仅显示未完成 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'appointment' ? 'active' : ''} ${TYPE_COLORS.appointment} ${filterType === 'appointment' && showOnlyUndone ? 'is-undone-filter' : ''}`}
            onClick={() => handleTabClick('appointment')}
            onDoubleClick={handleAppointmentDblClick}
            title={showOnlyUndone ? '双击：显示全部预约' : '双击：仅显示未完成预约'}
          >
            {TYPE_LABELS.appointment}
            {undoneAppointmentCount > 0 && (
              <span className="note-type-badge-count" aria-label={`${undoneAppointmentCount} 个预约未完成`}>
                {undoneAppointmentCount}
              </span>
            )}
          </button>

          {/* 日记 */}
          <button
            type="button"
            className={`note-type-tab ${filterType === 'diary' ? 'active' : ''} ${TYPE_COLORS.diary}`}
            onClick={() => handleTabClick('diary')}
          >
            {TYPE_LABELS.diary}
          </button>

        </div>

        {/* 视图切换 */}
        <div className="note-view-toggle">
          <button
            type="button"
            className={`note-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            列表
          </button>
          <button
            type="button"
            className={`note-view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="时间轴视图"
          >
            时间轴
          </button>
        </div>

        {/* 预约专用表单字段 */}
        {inputType === 'appointment' && (
          <div className="note-appointment-form">
            <button
              type="button"
              className="note-appt-close-btn"
              onClick={() => setInputType('note')}
              aria-label="关闭预约表单"
              title="关闭预约表单"
            >✕</button>
            <div className="note-appt-row">
              <label className="note-appt-label">时间</label>
              <input
                type="datetime-local"
                className="note-appt-datetime"
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
              />
            </div>
            <div className="note-appt-row">
              <label className="note-appt-label">类型</label>
              <select
                className="note-appt-select"
                value={apptType}
                onChange={(e) => setApptType(e.target.value)}
              >
                <option value="interview">面试</option>
                <option value="business">商务沟通</option>
                <option value="todo_appointment">待办预约</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="note-appt-row">
              <label className="note-appt-label">人物</label>
              <input
                type="text"
                className="note-appt-input"
                value={apptPerson}
                onChange={(e) => setApptPerson(e.target.value)}
                placeholder="面试官/联系人姓名…"
                maxLength={50}
              />
            </div>
            <div className="note-appt-row">
              <label className="note-appt-label">地点</label>
              <input
                type="text"
                className="note-appt-input"
                value={apptLocation}
                onChange={(e) => setApptLocation(e.target.value)}
                placeholder="地点/公司名称/会议室…"
                maxLength={100}
              />
            </div>
          </div>
        )}

        {/* 日记专用表单字段 */}
        {inputType === 'diary' && (
          <div className="note-diary-form">
            <button
              type="button"
              className="note-appt-close-btn"
              onClick={() => setInputType('note')}
              aria-label="关闭日记表单"
              title="关闭日记表单"
            >✕</button>
            <div className="note-appt-row">
              <label className="note-appt-label">类型</label>
              <select
                className="note-appt-select"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
              >
                <option value="diary">日记</option>
                <option value="study">学习笔记</option>
                <option value="report">报告内容</option>
                <option value="web">网络</option>
                <option value="reading">读书笔记</option>
                <option value="lecture">讲座笔记</option>
              </select>
            </div>
            <div className="note-appt-row">
              <label className="note-appt-label">人物</label>
              <input
                type="text"
                className="note-appt-input"
                value={articlePerson}
                onChange={(e) => setArticlePerson(e.target.value)}
                placeholder="相关人物…"
                maxLength={50}
              />
            </div>
            {/* 富文本工具栏 */}
            <div className="note-diary-toolbar">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }} title="粗体" className="note-diary-tool-btn"><b>B</b></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }} title="斜体" className="note-diary-tool-btn"><i>I</i></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline') }} title="下划线" className="note-diary-tool-btn"><u>U</u></button>
              <span className="note-diary-tool-divider" />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h3>') }} title="大标题" className="note-diary-tool-btn">H1</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h4>') }} title="小标题" className="note-diary-tool-btn">H2</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<p>') }} title="正文" className="note-diary-tool-btn">P</button>
              <span className="note-diary-tool-divider" />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList') }} title="无序列表" className="note-diary-tool-btn">• 列表</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList') }} title="有序列表" className="note-diary-tool-btn">1. 列表</button>
              <span className="note-diary-tool-divider" />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<blockquote>') }} title="引用" className="note-diary-tool-btn">❝</button>
              <label className="note-diary-tool-btn note-diary-color-btn" title="文字颜色">
                <span className="note-diary-color-icon">A</span>
                <input
                  type="color"
                  onMouseDown={(e) => e.preventDefault()}
                  onChange={(e) => execCmd('foreColor', e.target.value)}
                  className="note-diary-color-input"
                />
              </label>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat') }} title="清除格式" className="note-diary-tool-btn">✕格式</button>
              <button
                type="button"
                className="note-diary-tool-btn note-diary-fullscreen-btn"
                onClick={(e) => { e.preventDefault(); enterFullscreen() }}
                title="全屏写作模式"
              >
                ⛶ 全屏
              </button>
            </div>
          </div>
        )}

        {/* 输入框 — 日记用富文本编辑器，其他用 textarea */}
        {inputType === 'diary' ? (
          <div
            ref={diaryEditorRef}
            className="note-diary-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="写下日记或文章…支持加粗、斜体、标题、列表等排版…"
            onInput={() => { setDraftVersion(v => v + 1); updateDiaryCharCount() }}
            onBeforeInput={(e) => {
              const text = (e.currentTarget as HTMLDivElement).innerText
              if (text.length >= MAX_DIARY_CHARS && e.nativeEvent.inputType.startsWith('insert')) {
                e.preventDefault()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
        ) : (
          <textarea
            className="note-textarea"
            name="content"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputType === 'todo' ? '输入待办事项，回车保存…' : inputType === 'log' ? '记录沟通内容，回车保存…' : inputType === 'appointment' ? '预约事项描述，如：面试张某某 产品经理…' : '写下随笔，回车保存…'}
            rows={2}
            maxLength={500}
          />
        )}

        <div className="note-input-footer">
          {inputType === 'diary' ? (
            <>
              <span className={`note-diary-char-count ${diaryCharCount >= MAX_DIARY_CHARS ? 'is-max' : ''} ${diaryCharCount >= MAX_DIARY_CHARS * 0.8 ? 'is-warning' : ''}`}>
                {diaryCharCount.toLocaleString()} / {MAX_DIARY_CHARS.toLocaleString()} 字
              </span>
              <span className="note-char-count note-draft-status">
                {draftSavedAt ? `✓ 草稿已自动保存 ${draftSavedAt}` : '输入时自动保存草稿…'}
              </span>
            </>
          ) : (
            <span className="note-char-count">{inputValue.length}/500</span>
          )}
          <button
            type="submit"
            className="note-add-btn"
            disabled={isPending}
          >
            {isPending ? '保存中…' : '添加'}
          </button>
        </div>
      </form>

      {/* ── 日记全屏写作模式 ── */}
      {isFullscreen && inputType === 'diary' && typeof document !== 'undefined' && createPortal(
        <div className="note-diary-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="全屏写作模式">
          {/* 顶部栏：标题 + 文章类型/人物 + 字数 + 退出 */}
          <div className="note-diary-fs-header">
            <div className="note-diary-fs-header-left">
              <span className="note-diary-fs-title">✍️ 创作模式</span>
              <select
                className="note-diary-fs-select"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
              >
                <option value="diary">日记</option>
                <option value="study">学习笔记</option>
                <option value="report">报告内容</option>
                <option value="web">网络</option>
                <option value="reading">读书笔记</option>
                <option value="lecture">讲座笔记</option>
              </select>
              <input
                type="text"
                className="note-diary-fs-input"
                value={articlePerson}
                onChange={(e) => setArticlePerson(e.target.value)}
                placeholder="相关人物…"
                maxLength={50}
              />
            </div>
            <div className="note-diary-fs-header-right">
              <span className={`note-diary-char-count ${diaryCharCount >= MAX_DIARY_CHARS ? 'is-max' : ''} ${diaryCharCount >= MAX_DIARY_CHARS * 0.8 ? 'is-warning' : ''}`}>
                {diaryCharCount.toLocaleString()} / {MAX_DIARY_CHARS.toLocaleString()} 字
              </span>
              <button
                type="button"
                className="note-diary-fs-exit-btn"
                onClick={() => exitFullscreen()}
                title="退出全屏 (ESC)"
              >
                退出全屏 ✕
              </button>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="note-diary-toolbar note-diary-fs-toolbar">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }} title="粗体" className="note-diary-tool-btn"><b>B</b></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }} title="斜体" className="note-diary-tool-btn"><i>I</i></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline') }} title="下划线" className="note-diary-tool-btn"><u>U</u></button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h3>') }} title="大标题" className="note-diary-tool-btn">H1</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h4>') }} title="小标题" className="note-diary-tool-btn">H2</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<p>') }} title="正文" className="note-diary-tool-btn">P</button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList') }} title="无序列表" className="note-diary-tool-btn">• 列表</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList') }} title="有序列表" className="note-diary-tool-btn">1. 列表</button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<blockquote>') }} title="引用" className="note-diary-tool-btn">❝</button>
            <label className="note-diary-tool-btn note-diary-color-btn" title="文字颜色">
              <span className="note-diary-color-icon">A</span>
              <input
                type="color"
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => execCmd('foreColor', e.target.value)}
                className="note-diary-color-input"
              />
            </label>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat') }} title="清除格式" className="note-diary-tool-btn">✕格式</button>
          </div>

          {/* 全屏编辑器 */}
          <div
            ref={fullscreenEditorRef}
            className="note-diary-editor note-diary-fs-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="在此安心创作…支持加粗、斜体、标题、列表、引用等排版…"
            onInput={() => { setDraftVersion(v => v + 1); updateDiaryCharCount() }}
            onBeforeInput={(e) => {
              const text = (e.currentTarget as HTMLDivElement).innerText
              if (text.length >= MAX_DIARY_CHARS && e.nativeEvent.inputType.startsWith('insert')) {
                e.preventDefault()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleSubmit()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                exitFullscreen()
              }
            }}
          />

          {/* 底部状态栏 */}
          <div className="note-diary-fs-footer">
            <span className="note-draft-status">
              {draftSavedAt ? `✓ 草稿已自动保存 ${draftSavedAt}` : '输入时自动保存草稿…'}
            </span>
            <span className="note-diary-fs-hint">ESC 退出全屏 · Ctrl+Enter 保存</span>
          </div>
        </div>,
        document.body
      )}

      {/* ── 日期筛选提示条 ── */}
      {filterDate && (
        <div className="note-filter-date-bar">
          <div className="note-filter-date-left">
            <span className="filter-date-label">筛选: {filterDate}</span>
            <span className="filter-date-count">{searchFiltered.length} 条笔记</span>
          </div>
          <button
            type="button"
            className="filter-date-clear-btn"
            onClick={onClearFilterDate}
            title="取消日期筛选"
          >
            × 取消
          </button>
        </div>
      )}

      {/* ── 笔记列表 / 时间轴（加载中显示骨架屏）── */}
      {loading ? (
        <NoteSkeleton />
      ) : viewMode === 'list' ? (
        <div className="note-list">
          {searchFiltered.length === 0 ? (
            <div className="note-empty">
              <span className="note-empty-icon">✦</span>
              <p>{searchTerm ? `没有匹配"${searchTerm}"的笔记` : filterDate ? `"${filterDate}" 当天没有记录` : filterType === 'all' ? '还没有记录' : `没有"${TYPE_LABELS[filterType] ?? filterType}"记录`}</p>
              <p className="note-empty-hint">{searchTerm ? '尝试其他关键词' : filterDate ? '选择其他日期查看笔记' : '用上面的输入框添加待办、沟通记录或随笔'}</p>
            </div>
          ) : (
            searchFiltered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onChanged={onNotesChanged}
              />
            ))
          )}
        </div>
      ) : (
        <TimelineView notes={searchFiltered} onChanged={onNotesChanged} searchTerm={searchTerm} filterDate={filterDate} filterType={filterType} showOnlyUndone={showOnlyUndone} onClearFilterDate={onClearFilterDate} />
      )}
    </div>
  )
}

/* ── 时间轴视图 ── */
function TimelineView({ notes, onChanged: _onChanged, searchTerm, filterDate, filterType, showOnlyUndone, onClearFilterDate }: {
  notes: NoteItem[]
  onChanged?: () => void
  searchTerm?: string
  filterDate?: string | null
  filterType?: string
  showOnlyUndone?: boolean
  onClearFilterDate?: () => void
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  if (notes.length === 0) {
    // 根据当前筛选上下文生成不同提示
    let title = '没有匹配的记录'
    let hint = ''
    let showClearBtn = false

    if (searchTerm) {
      title = `没有匹配"${searchTerm}"的记录`
      hint = '尝试其他关键词'
    } else if (filterDate) {
      title = `${filterDate} 当天没有记录`
      hint = '选择其他日期查看笔记'
      showClearBtn = true
    } else if (filterType && filterType !== 'all') {
      const typeLabel = TYPE_LABELS[filterType] ?? filterType
      if (showOnlyUndone && (filterType === 'todo' || filterType === 'appointment')) {
        title = `没有未完成的${typeLabel}`
        hint = '双击标签查看全部记录'
      } else {
        title = `没有"${typeLabel}"记录`
        hint = '选择其他类型查看'
      }
    } else if (filterType === 'all') {
      title = '还没有记录'
      hint = '用上面的输入框添加待办、沟通记录或随笔'
    }

    return (
      <div className="note-timeline-empty">
        <div className="note-timeline-empty-inner">
          <span className="note-empty-icon">✦</span>
          <p className="note-timeline-empty-title">{title}</p>
          {hint && <p className="note-timeline-empty-hint">{hint}</p>}
          {showClearBtn && onClearFilterDate && (
            <button
              type="button"
              className="note-timeline-empty-clear"
              onClick={onClearFilterDate}
            >
              清除日期筛选
            </button>
          )}
        </div>
      </div>
    )
  }

  // 用本地日期提取，避免 UTC 时区导致凌晨笔记归错日期
  function localDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('sv-SE') // YYYY-MM-DD 本地时间
  }

  // 按本地创建日期分组，组内按时间升序
  const grouped = new Map<string, NoteItem[]>()
  for (const n of notes) {
    const d = localDate(n.createdAt)
    const arr = grouped.get(d) ?? []
    arr.push(n)
    if (!grouped.has(d)) grouped.set(d, arr)
  }
  // 按日期降序排列（今天在最上面）
  const sortedDays = Array.from(grouped.keys()).sort().reverse()

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDateHeader(dateStr: string) {
    const now = new Date()
    const today = localDate(now.toISOString())
    const yesterday = localDate(new Date(now.getTime() - 86400000).toISOString())
    if (dateStr === today) return '今天'
    if (dateStr === yesterday) return '昨天'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  }

  function toggleGroup(day: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <div className="note-timeline">
      {sortedDays.map((day) => {
        const isCollapsed = collapsedGroups.has(day)
        const dayNotes = grouped.get(day)!
        return (
          <div key={day} className={`note-timeline-group ${isCollapsed ? 'is-collapsed' : ''}`}>
            <div
              className="note-timeline-date-header"
              onClick={() => toggleGroup(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGroup(day) }}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? '点击展开' : '点击折叠'}
            >
              <span className={`note-timeline-chevron ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
              <span className="note-timeline-date-dot" />
              <span className="note-timeline-date-label">{fmtDateHeader(day)}</span>
              <span className="note-timeline-date-count">{dayNotes.length} 条</span>
            </div>
            {!isCollapsed && (
              <div className="note-timeline-entries">
                {dayNotes.map((note) => (
                  <div key={note.id} className={`note-timeline-entry ${note.done && (note.type === 'todo' || note.type === 'appointment') ? 'is-done' : ''}`}>
                    <div className="note-timeline-line">
                      <div className={`note-timeline-dot ${TYPE_COLORS[note.type]}`} />
                    </div>
                    <div className="note-timeline-body">
                      <div className="note-timeline-meta">
                        <span className="note-timeline-time">{fmtTime(note.createdAt)}</span>
                        <span className={`note-type-badge ${TYPE_COLORS[note.type]}`}>
                          {TYPE_LABELS[note.type] ?? note.type}
                        </span>
                        {note.done && (note.type === 'todo' || note.type === 'appointment') && (
                          <span className="note-timeline-done-mark">✓ 已完成</span>
                        )}
                      </div>
                      <p className="note-timeline-content">{note.type === 'diary' ? note.content.replace(/<[^>]+>/g, '') : note.content}</p>
                      {/* 预约信息 */}
                      {note.type === 'appointment' && (note.appointmentTime || note.appointmentPerson || note.appointmentLocation) && (
                        <div className="note-timeline-appt">
                          {note.appointmentTime && (
                            <span className="note-timeline-appt-item">
                              🕐 {formatApptTime(note.appointmentTime)}
                            </span>
                          )}
                          {note.appointmentType && (
                            <span className="note-timeline-appt-item">
                              📋 {APPT_TYPE_LABELS[note.appointmentType] ?? note.appointmentType}
                            </span>
                          )}
                          {note.appointmentPerson && (
                            <span className="note-timeline-appt-item">
                              👤 {note.appointmentPerson}
                            </span>
                          )}
                          {note.appointmentLocation && (
                            <span className="note-timeline-appt-item">
                              📍 {note.appointmentLocation}
                            </span>
                          )}
                        </div>
                      )}
                      {/* 日记信息 */}
                      {note.type === 'diary' && (note.articleType || note.articlePerson) && (
                        <div className="note-timeline-appt">
                          {note.articleType && (
                            <span className="note-timeline-appt-item">
                              📝 {ARTICLE_TYPE_LABELS[note.articleType] ?? note.articleType}
                            </span>
                          )}
                          {note.articlePerson && (
                            <span className="note-timeline-appt-item">
                              👤 {note.articlePerson}
                            </span>
                          )}
                        </div>
                      )}
                      {/* 实体来源 */}
                      {note.entityName && note.entityType && note.entityType !== 'global' && (
                        <div className="note-timeline-source">
                          <span className="note-entity-label">{ENTITY_LABELS[note.entityType] ?? note.entityType}</span>
                          <span className="note-entity-name">{note.entityName}</span>
                        </div>
                      )}
                      <span className="note-global-author">作者：陈成</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── 骨架屏 ── */
function NoteSkeleton() {
  // 生成 3 条不同宽度的占位条，模拟笔记卡片外观
  return (
    <div className="note-skeleton" aria-busy="true" role="status" aria-label="加载中">
      <span className="sr-only">加载中…</span>
      {[82, 64, 73].map((w, i) => (
        <div key={i} className="note-skeleton-card">
          <div className="note-skeleton-line note-skeleton-line-short" style={{ width: `${w}%` }} />
          <div className="note-skeleton-line note-skeleton-line-long" />
          {i < 2 && <div className="note-skeleton-line note-skeleton-line-mid" />}
        </div>
      ))}
    </div>
  )
}

const ENTITY_LABELS: Record<string, string> = {
  candidate: '候选人',
  job: '岗位',
  company: '企业',
  match: '匹配',
  knowledge: '知识库',
  school: '学校库',
  chart: '图表库',
  info: '信息库',
  contact: '人脉库',
  project: '项目库',
}

function NoteCard({ note, onChanged }: { note: NoteItem; onChanged?: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── 编辑模式状态 ──
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [editApptTime, setEditApptTime] = useState(
    note.appointmentTime ? note.appointmentTime.slice(0, 16) : ''
  )
  const [editApptLocation, setEditApptLocation] = useState(note.appointmentLocation ?? '')
  const [editApptType, setEditApptType] = useState(note.appointmentType ?? 'interview')
  const [editApptPerson, setEditApptPerson] = useState(note.appointmentPerson ?? '')
  // 日记编辑状态
  const [editArticleType, setEditArticleType] = useState(note.articleType ?? 'diary')
  const [editArticlePerson, setEditArticlePerson] = useState(note.articlePerson ?? '')
  const editDiaryRef = useRef<HTMLDivElement>(null)
  // 日记折叠状态
  const [diaryExpanded, setDiaryExpanded] = useState(false)
  // 判断日记是否够长需要折叠（纯文本 > 120 字）
  const diaryPlainLength = note.type === 'diary'
    ? note.content.replace(/<[^>]+>/g, '').trim().length
    : 0
  const diaryIsLong = diaryPlainLength > 120

  // ── 编辑模式全屏 ──
  const [isEditFullscreen, setIsEditFullscreen] = useState(false)
  const editFullscreenRef = useRef<HTMLDivElement>(null)
  const editFullscreenContentRef = useRef('')
  const [editCharCount, setEditCharCount] = useState(0)
  const MAX_EDIT_DIARY_CHARS = 10000

  const updateEditCharCount = useCallback(() => {
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    const text = (ref.current?.innerText ?? '').trim()
    setEditCharCount(text.length)
  }, [isEditFullscreen])

  const enterEditFullscreen = useCallback(() => {
    editFullscreenContentRef.current = editDiaryRef.current?.innerHTML ?? ''
    setIsEditFullscreen(true)
  }, [])

  const exitEditFullscreen = useCallback(() => {
    editFullscreenContentRef.current = editFullscreenRef.current?.innerHTML ?? ''
    setIsEditFullscreen(false)
  }, [])

  useEffect(() => {
    if (isEditFullscreen) {
      if (editFullscreenRef.current) {
        editFullscreenRef.current.innerHTML = editFullscreenContentRef.current
        editFullscreenRef.current.focus()
      }
      updateEditCharCount()
    } else {
      if (editDiaryRef.current && editFullscreenContentRef.current) {
        editDiaryRef.current.innerHTML = editFullscreenContentRef.current
      }
      updateEditCharCount()
    }
  }, [isEditFullscreen, updateEditCharCount])

  // ── 日记编辑自动保存 ──
  const [autoSavedAt, setAutoSavedAt] = useState<string>('')
  const [autoSaving, setAutoSaving] = useState(false)
  const [contentVersion, setContentVersion] = useState(0) // 每次 onInput 递增，触发 autoSave 计时
  const lastSavedHtmlRef = useRef<string>(note.content)

  /** 自动保存到服务器（静默，不关闭编辑模式） */
  const autoSaveDiary = useCallback(async () => {
    if (note.type !== 'diary' || !isEditing) return
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    const html = (ref.current?.innerHTML ?? '').trim()
    if (!html || html === lastSavedHtmlRef.current) return
    setAutoSaving(true)
    try {
      const fd = new FormData()
      fd.set('id', String(note.id))
      fd.set('content', html)
      fd.set('articleType', editArticleType)
      if (editArticlePerson.trim()) fd.set('articlePerson', editArticlePerson.trim())
      await editNote(fd)
      lastSavedHtmlRef.current = html
      setAutoSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    } catch (err) {
      console.error('自动保存失败:', err)
    } finally {
      setAutoSaving(false)
    }
  }, [note.id, note.type, isEditing, editArticleType, editArticlePerson, isEditFullscreen])

  // 编辑模式下，内容变化后 4 秒自动保存
  useEffect(() => {
    if (note.type !== 'diary' || !isEditing) return
    const timer = setTimeout(() => { autoSaveDiary() }, 4000)
    return () => clearTimeout(timer)
  }, [note.type, isEditing, autoSaveDiary, contentVersion])

  /** 通用：构造 FormData → startTransition 调用 server action → 通知刷新 */
  function runAction(fn: (fd: FormData) => Promise<void>) {
    return () => {
      startTransition(async () => {
        try {
          const fd = new FormData()
          fd.set('id', String(note.id))
          await fn(fd)
          onChanged?.()
        } catch (err) {
          console.error('笔记操作异常:', err)
          alert('操作失败，请稍后重试。')
        }
      })
    }
  }

  function handleEditSave() {
    // 日记类型从 contentEditable 获取内容
    let content = editContent.trim()
    if (note.type === 'diary') {
      const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
      content = (ref.current?.innerHTML ?? '').trim()
    }
    if (!content) return
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('id', String(note.id))
        fd.set('content', content)
        if (note.type === 'appointment') {
          if (editApptTime) fd.set('appointmentTime', editApptTime)
          if (editApptLocation.trim()) fd.set('appointmentLocation', editApptLocation.trim())
          fd.set('appointmentType', editApptType)
          if (editApptPerson.trim()) fd.set('appointmentPerson', editApptPerson.trim())
        }
        if (note.type === 'diary') {
          fd.set('articleType', editArticleType)
          if (editArticlePerson.trim()) fd.set('articlePerson', editArticlePerson.trim())
        }
        await editNote(fd)
        setIsEditing(false)
        setIsEditFullscreen(false)
        onChanged?.()
      } catch (err) {
        console.error('编辑笔记异常:', err)
        alert('保存失败，请稍后重试。')
      }
    })
  }

  function handleEditCancel() {
    // 还原编辑前的值
    setEditContent(note.content)
    setEditApptTime(note.appointmentTime ? note.appointmentTime.slice(0, 16) : '')
    setEditApptLocation(note.appointmentLocation ?? '')
    setEditApptType(note.appointmentType ?? 'interview')
    setEditApptPerson(note.appointmentPerson ?? '')
    setEditArticleType(note.articleType ?? 'diary')
    setEditArticlePerson(note.articlePerson ?? '')
    setIsEditing(false)
    setIsEditFullscreen(false)
  }

  // ── 编辑模式富文本工具栏 ──
  const execEditCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    ref.current?.focus()
  }, [isEditFullscreen])

  // 进入编辑模式时初始化日记内容和字数统计
  useEffect(() => {
    if (isEditing && note.type === 'diary') {
      // 延迟一帧确保 editDiaryRef 已挂载，手动设置 innerHTML
      // 不能用 dangerouslySetInnerHTML，否则每次重渲染 React 都会覆盖用户输入
      requestAnimationFrame(() => {
        if (editDiaryRef.current) {
          editDiaryRef.current.innerHTML = note.content
          // 重置自动保存的基准内容
          lastSavedHtmlRef.current = note.content
        }
        updateEditCharCount()
      })
    }
  }, [isEditing, note.type, updateEditCharCount])

  return (
    <article
      className={`note-card ${note.pinned ? 'is-pinned' : ''} ${note.done && (note.type === 'todo' || note.type === 'appointment') ? 'is-done' : ''} ${isPending ? 'is-pending' : ''} ${isEditing ? 'is-editing' : ''}`}
      data-type={note.type}
    >
      {/* ── 类型标签 + 来源 + 置顶标记 ── */}
      <div className="note-card-header">
        <span className={`note-type-badge ${TYPE_COLORS[note.type]}`}>
          {TYPE_LABELS[note.type] ?? note.type}
        </span>
        {note.entityName && note.entityType && note.entityType !== 'global' && (
          <span className="note-entity-source">
            <span className="note-entity-label">{ENTITY_LABELS[note.entityType] ?? note.entityType}</span>
            <span className="note-entity-name">{note.entityName}</span>
          </span>
        )}
        {note.pinned && <span className="note-pin-mark" title="已置顶">📌</span>}
        <span className="note-date">{formatDate(note.createdAt)}</span>
      </div>

      {isEditing ? (
        /* ── 编辑模式 ── */
        <div className="note-card-edit">
          {/* 预约字段编辑 */}
          {note.type === 'appointment' && (
            <div className="note-edit-appt">
              <div className="note-edit-appt-row">
                <label className="note-edit-label">时间</label>
                <input
                  type="datetime-local"
                  className="note-edit-datetime"
                  value={editApptTime}
                  onChange={(e) => setEditApptTime(e.target.value)}
                />
              </div>
              <div className="note-edit-appt-row">
                <label className="note-edit-label">类型</label>
                <select
                  className="note-edit-select"
                  value={editApptType}
                  onChange={(e) => setEditApptType(e.target.value)}
                >
                  <option value="interview">面试</option>
                  <option value="business">商务沟通</option>
                  <option value="todo_appointment">待办预约</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="note-edit-appt-row">
                <label className="note-edit-label">人物</label>
                <input
                  type="text"
                  className="note-edit-input"
                  value={editApptPerson}
                  onChange={(e) => setEditApptPerson(e.target.value)}
                  placeholder="面试官/联系人姓名…"
                  maxLength={50}
                />
              </div>
              <div className="note-edit-appt-row">
                <label className="note-edit-label">地点</label>
                <input
                  type="text"
                  className="note-edit-input"
                  value={editApptLocation}
                  onChange={(e) => setEditApptLocation(e.target.value)}
                  placeholder="地点/公司名称/会议室…"
                  maxLength={100}
                />
              </div>
            </div>
          )}
          {/* 日记字段编辑 */}
          {note.type === 'diary' && (
            <div className="note-edit-appt">
              <div className="note-edit-appt-row">
                <label className="note-edit-label">类型</label>
                <select
                  className="note-edit-select"
                  value={editArticleType}
                  onChange={(e) => setEditArticleType(e.target.value)}
                >
                  <option value="diary">日记</option>
                  <option value="study">学习笔记</option>
                  <option value="report">报告内容</option>
                  <option value="web">网络</option>
                  <option value="reading">读书笔记</option>
                  <option value="lecture">讲座笔记</option>
                </select>
              </div>
              <div className="note-edit-appt-row">
                <label className="note-edit-label">人物</label>
                <input
                  type="text"
                  className="note-edit-input"
                  value={editArticlePerson}
                  onChange={(e) => setEditArticlePerson(e.target.value)}
                  placeholder="相关人物…"
                  maxLength={50}
                />
              </div>
            </div>
          )}
          {/* 日记用富文本编辑器，其他用 textarea */}
          {note.type === 'diary' ? (
            <>
              {/* 富文本工具栏 */}
              <div className="note-diary-toolbar">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('bold') }} title="粗体" className="note-diary-tool-btn"><b>B</b></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('italic') }} title="斜体" className="note-diary-tool-btn"><i>I</i></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('underline') }} title="下划线" className="note-diary-tool-btn"><u>U</u></button>
                <span className="note-diary-tool-divider" />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<h3>') }} title="大标题" className="note-diary-tool-btn">H1</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<h4>') }} title="小标题" className="note-diary-tool-btn">H2</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<p>') }} title="正文" className="note-diary-tool-btn">P</button>
                <span className="note-diary-tool-divider" />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('insertUnorderedList') }} title="无序列表" className="note-diary-tool-btn">• 列表</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('insertOrderedList') }} title="有序列表" className="note-diary-tool-btn">1. 列表</button>
                <span className="note-diary-tool-divider" />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<blockquote>') }} title="引用" className="note-diary-tool-btn">❝</button>
                <label className="note-diary-tool-btn note-diary-color-btn" title="文字颜色">
                  <span className="note-diary-color-icon">A</span>
                  <input
                    type="color"
                    onMouseDown={(e) => e.preventDefault()}
                    onChange={(e) => execEditCmd('foreColor', e.target.value)}
                    className="note-diary-color-input"
                  />
                </label>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('removeFormat') }} title="清除格式" className="note-diary-tool-btn">✕格式</button>
                <button
                  type="button"
                  className="note-diary-tool-btn note-diary-fullscreen-btn"
                  onClick={(e) => { e.preventDefault(); enterEditFullscreen() }}
                  title="全屏写作模式"
                >
                  ⛶ 全屏
                </button>
              </div>
              <div
                ref={editDiaryRef}
                className="note-diary-editor"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="编辑日记内容…"
                onInput={() => { setContentVersion(v => v + 1); updateEditCharCount() }}
                onBeforeInput={(e) => {
                  const text = (e.currentTarget as HTMLDivElement).innerText
                  if (text.length >= MAX_EDIT_DIARY_CHARS && e.nativeEvent.inputType.startsWith('insert')) {
                    e.preventDefault()
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleEditSave()
                  }
                }}
              />
              {/* 字数统计 + 自动保存状态提示 */}
              <div className="note-diary-autosave-status">
                <span className={`note-diary-char-count ${editCharCount >= MAX_EDIT_DIARY_CHARS ? 'is-max' : ''} ${editCharCount >= MAX_EDIT_DIARY_CHARS * 0.8 ? 'is-warning' : ''}`}>
                  {editCharCount.toLocaleString()} / {MAX_EDIT_DIARY_CHARS.toLocaleString()} 字
                </span>
                <span style={{ marginLeft: '8px' }}>
                  {autoSaving ? '⏳ 正在自动保存…' : autoSavedAt ? `✓ 已自动保存 ${autoSavedAt}` : '✏️ 编辑时自动保存…'}
                </span>
              </div>
            </>
          ) : (
            <textarea
              className="note-edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={500}
              rows={3}
              autoFocus
            />
          )}
          <div className="note-edit-actions">
            <span className="note-edit-char-count">{note.type === 'diary' ? '' : `${editContent.length}/500`}</span>
            <button
              type="button"
              className="note-edit-btn note-edit-save"
              disabled={isPending}
              onClick={handleEditSave}
            >
              {isPending ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              className="note-edit-btn note-edit-cancel"
              disabled={isPending}
              onClick={handleEditCancel}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 内容 ── */}
          <div className="note-card-body">
            {/* todo / 预约 复选框 */}
            {(note.type === 'todo' || note.type === 'appointment') && (
              <button
                type="button"
                className={`note-check ${note.done ? 'checked' : ''}`}
                title={note.done ? '标记为未完成' : '标记为完成'}
                disabled={isPending}
                onClick={runAction(toggleDoneNote)}
              >
                {note.done ? '✓' : '○'}
              </button>
            )}
            {note.type === 'diary' ? (
              <div className="note-diary-content-wrap">
                <div
                  className={`note-content note-diary-content${diaryIsLong && !diaryExpanded ? ' collapsed' : ''}`}
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                {diaryIsLong && (
                  <button
                    type="button"
                    className="note-diary-toggle"
                    onClick={() => setDiaryExpanded(v => !v)}
                  >
                    {diaryExpanded ? '收起 ↑' : '展开全文 ↓'}
                  </button>
                )}
              </div>
            ) : (
              <p className="note-content">{note.content}</p>
            )}
          </div>

          {/* ── 日记信息条 ── */}
          {note.type === 'diary' && (note.articleType || note.articlePerson) && (
            <div className="note-diary-bar">
              {note.articleType && (
                <span className="note-diary-type-tag">
                  {ARTICLE_TYPE_LABELS[note.articleType] ?? note.articleType}
                </span>
              )}
              {note.articlePerson && (
                <span className="note-diary-person-tag">
                  <svg className="note-appt-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3"/>
                    <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                  </svg>
                  <span>{note.articlePerson}</span>
                </span>
              )}
            </div>
          )}

          {/* ── 预约信息卡 ── */}
          {note.type === 'appointment' && (note.appointmentTime || note.appointmentLocation || note.appointmentType || note.appointmentPerson) && (
            <div className="note-appointment-bar">
              <div className="note-appt-main">
                {/* 时间 — 主力展示 */}
                {note.appointmentTime && (
                  <span className="note-appt-time">
                    <svg className="note-appt-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="7"/>
                      <polyline points="8,4 8,8 11,10"/>
                    </svg>
                    <span className="note-appt-time-text">{formatApptTime(note.appointmentTime)}</span>
                  </span>
                )}
                {/* 类型标签 */}
                {note.appointmentType && (
                  <span className="note-appt-type-tag">
                    {APPT_TYPE_LABELS[note.appointmentType] ?? note.appointmentType}
                  </span>
                )}
                {/* 人物 */}
                {note.appointmentPerson && (
                  <span className="note-appt-person-tag">
                    <svg className="note-appt-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="5" r="3"/>
                      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                    </svg>
                    <span>{note.appointmentPerson}</span>
                  </span>
                )}
              </div>
              {/* 地点 — 第二行 */}
              {note.appointmentLocation && (
                <div className="note-appt-sub">
                  <svg className="note-appt-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 14s6-5 6-8.5A6 6 0 0 0 2 5.5C2 9 8 14 8 14Z"/>
                    <circle cx="8" cy="5.5" r="1.5"/>
                  </svg>
                  <span className="note-appt-location-text">{note.appointmentLocation}</span>
                </div>
              )}
            </div>
          )}

          {/* ── 操作按钮 ── */}
          <div className="note-card-actions">
            <button
              type="button"
              className="note-action-btn note-edit-trigger"
              title="编辑"
              disabled={isPending}
              onClick={() => setIsEditing(true)}
            >
              编辑
            </button>

            <button
              type="button"
              className={`note-action-btn ${note.pinned ? 'active' : ''}`}
              title={note.pinned ? '取消置顶' : '置顶'}
              disabled={isPending}
              onClick={runAction(togglePinNote)}
            >
              {note.pinned ? '取消置顶' : '置顶'}
            </button>

            <button
              type="button"
              className="note-action-btn note-delete-btn"
              title="删除"
              disabled={isPending}
              onClick={() => setConfirmOpen(true)}
            >
              删除
            </button>

            <span className="note-global-author">作者：陈成</span>
          </div>
        </>
      )}

      {/* ── 删除确认弹窗 ── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          runAction(deleteNote)()
        }}
        title="删除笔记"
        message={`确认删除这条${TYPE_LABELS[note.type] ?? '笔记'}？删除后不可恢复。`}
        confirmLabel="删除"
        variant="danger"
      />

      {/* ── 编辑模式全屏写作 ── */}
      {isEditFullscreen && note.type === 'diary' && typeof document !== 'undefined' && createPortal(
        <div className="note-diary-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="全屏编辑模式">
          <div className="note-diary-fs-header">
            <div className="note-diary-fs-header-left">
              <span className="note-diary-fs-title">✍️ 编辑模式</span>
              <select
                className="note-diary-fs-select"
                value={editArticleType}
                onChange={(e) => setEditArticleType(e.target.value)}
              >
                <option value="diary">日记</option>
                <option value="study">学习笔记</option>
                <option value="report">报告内容</option>
                <option value="web">网络</option>
                <option value="reading">读书笔记</option>
                <option value="lecture">讲座笔记</option>
              </select>
              <input
                type="text"
                className="note-diary-fs-input"
                value={editArticlePerson}
                onChange={(e) => setEditArticlePerson(e.target.value)}
                placeholder="相关人物…"
                maxLength={50}
              />
            </div>
            <div className="note-diary-fs-header-right">
              <span className={`note-diary-char-count ${editCharCount >= MAX_EDIT_DIARY_CHARS ? 'is-max' : ''} ${editCharCount >= MAX_EDIT_DIARY_CHARS * 0.8 ? 'is-warning' : ''}`}>
                {editCharCount.toLocaleString()} / {MAX_EDIT_DIARY_CHARS.toLocaleString()} 字
              </span>
              <button
                type="button"
                className="note-diary-fs-exit-btn"
                onClick={() => exitEditFullscreen()}
                title="退出全屏 (ESC)"
              >
                退出全屏 ✕
              </button>
            </div>
          </div>

          <div className="note-diary-toolbar note-diary-fs-toolbar">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('bold') }} title="粗体" className="note-diary-tool-btn"><b>B</b></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('italic') }} title="斜体" className="note-diary-tool-btn"><i>I</i></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('underline') }} title="下划线" className="note-diary-tool-btn"><u>U</u></button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<h3>') }} title="大标题" className="note-diary-tool-btn">H1</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<h4>') }} title="小标题" className="note-diary-tool-btn">H2</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<p>') }} title="正文" className="note-diary-tool-btn">P</button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('insertUnorderedList') }} title="无序列表" className="note-diary-tool-btn">• 列表</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('insertOrderedList') }} title="有序列表" className="note-diary-tool-btn">1. 列表</button>
            <span className="note-diary-tool-divider" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('formatBlock', '<blockquote>') }} title="引用" className="note-diary-tool-btn">❝</button>
            <label className="note-diary-tool-btn note-diary-color-btn" title="文字颜色">
              <span className="note-diary-color-icon">A</span>
              <input
                type="color"
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => execEditCmd('foreColor', e.target.value)}
                className="note-diary-color-input"
              />
            </label>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execEditCmd('removeFormat') }} title="清除格式" className="note-diary-tool-btn">✕格式</button>
          </div>

          <div
            ref={editFullscreenRef}
            className="note-diary-editor note-diary-fs-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="编辑日记内容…"
            onInput={() => { setContentVersion(v => v + 1); updateEditCharCount() }}
            onBeforeInput={(e) => {
              const text = (e.currentTarget as HTMLDivElement).innerText
              if (text.length >= MAX_EDIT_DIARY_CHARS && e.nativeEvent.inputType.startsWith('insert')) {
                e.preventDefault()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleEditSave()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                exitEditFullscreen()
              }
            }}
          />

          <div className="note-diary-fs-footer">
            <span>
              {autoSaving ? '⏳ 正在自动保存…' : autoSavedAt ? `✓ 已自动保存 ${autoSavedAt}` : '✏️ 编辑时自动保存…'}
            </span>
            <span className="note-diary-fs-hint">ESC 退出全屏 · Ctrl+Enter 保存</span>
          </div>
        </div>,
        document.body
      )}
    </article>
  )
}
