'use client'

import { useRef, useState, useTransition, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addNote, deleteNote, editNote, togglePinNote, toggleBookmarkNote, toggleDoneNote, editNoteWithScope, deleteNoteWithScope } from '@/app/actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/providers/ToastProvider'
import { formatAppDateTime, formatAppDate, toAppDateTimeLocal } from '@/lib/app-date-time'

export type NoteItem = {
  id: number
  content: string
  type: string
  pinned: boolean
  bookmarked: boolean
  done: boolean
  person?: string | null
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
  // 沟通字段
  logPerson?: string | null
  // 待办重复字段
  scheduledDate?: string | null
  repeatType?: string | null
  repeatFrequency?: number | null
  repeatEndDate?: string | null
  repeatGroupId?: string | null
  repeatPerson?: string | null
  repeatCategory?: string | null
  repeatCustomNum?: number | null
  repeatWeekdays?: string | null // 如 "1,3,5"
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
  /** 视图模式（由父组件控制） */
  viewMode?: 'calendar' | 'list' | 'timeline' | 'bookmark'
  /** 手机端底部编辑栏是否可见 */
  mobileComposeVisible?: boolean
  /** 关闭手机端底部编辑栏 */
  onCloseMobileCompose?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  todo: '待办',
  log: '沟通',
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

const REPEAT_LABELS: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
  quarterly: '每季度',
  halfyearly: '每半年',
  workday: '工作日',
  weekday: '每周几',
  custom: '自定义',
}

const WEEKDAY_OPTIONS = [
  { value: '1', label: '周一' },
  { value: '2', label: '周二' },
  { value: '3', label: '周三' },
  { value: '4', label: '周四' },
  { value: '5', label: '周五' },
  { value: '6', label: '周六' },
  { value: '7', label: '周日' },
]

const CATEGORY_LABELS: Record<string, string> = {
  birthday: '生日',
  study: '读书学习',
  meeting: '开会',
  exercise: '锻炼身体',
  work: '工作',
  leisure: '休闲',
  kids: '孩子',
  parents: '父母',
  friends: '朋友',
  family: '家人',
  other_life: '其他生活事项',
}

/** 事项类型图标映射（用于卡片显示） */
const CATEGORY_ICONS: Record<string, string> = {
  birthday: '🎂',
  study: '📚',
  meeting: '💼',
  exercise: '🏃',
  work: '💻',
  leisure: '🎮',
  kids: '👶',
  parents: '👴',
  friends: '🤝',
  family: '👨‍👩‍👧‍👦',
  other_life: '📋',
}

/** 事项类型卡片颜色（左边框色） */
const CATEGORY_COLORS: Record<string, string> = {
  birthday: 'pink',
  study: 'brown',
  meeting: 'blue',
  exercise: 'green',
  work: 'blue',
  leisure: 'gold',
  kids: 'mint',
  parents: 'warmOrange',
  friends: 'cyan',
  family: 'purple',
  other_life: 'gray',
}

/** 获取事项类型显示文字：图标 + 文字 */
function getCategoryDisplay(category: string): string {
  const icon = CATEGORY_ICONS[category] ?? ''
  const label = CATEGORY_LABELS[category] ?? category
  return icon ? `${icon} ${label}` : label
}

/** 获取事项类型对应的颜色类名 */
function getCategoryColorClass(category: string | null | undefined): string {
  if (!category) return ''
  const color = CATEGORY_COLORS[category]
  return color ? `cat-${color}` : ''
}

/** 构建待办信息行（有值就显示，不以 repeatType 为前提） */
function buildTodoInfoLine(note: NoteItem): string {
  const parts: string[] = []
  if (note.repeatType) {
    const label = formatRepeatLabel(note.repeatType, note.repeatWeekdays)
    parts.push(`🔄 ${label}`)
  }
  if (note.repeatPerson) parts.push(note.repeatPerson)
  if (note.repeatCategory) parts.push(getCategoryDisplay(note.repeatCategory))
  if (note.scheduledDate) parts.push(formatAppDateTime(note.scheduledDate))
  return parts.join(' · ')
}

/** 构建待办卡片多行结构化信息（JSX 片段数组） */
function buildTodoDetailRows(note: NoteItem) {
  const rows: { icon: string; label: string; value: string }[] = []
  
  // 开始时间 ⏰
  if (note.scheduledDate) {
    rows.push({ icon: '⏰', label: '开始时间', value: formatAppDateTime(note.scheduledDate) })
  }
  // 频率 🔄
  if (note.repeatType) {
    const freqLabel = formatRepeatLabel(note.repeatType, note.repeatWeekdays)
    const freqNum = note.repeatFrequency && note.repeatFrequency > 1
      ? `每${note.repeatFrequency}${note.repeatType === 'weekly' ? '周' : note.repeatType === 'monthly' ? '月' : note.repeatType === 'yearly' ? '年' : note.repeatType === 'quarterly' ? '季度' : note.repeatType === 'halfyearly' ? '半年' : '天'}`
      : ''
    rows.push({ icon: '🔄', label: '频率', value: freqNum ? `${freqLabel} ${freqNum}` : freqLabel })
  }
  // 截止时间 📅
  if (note.repeatEndDate) {
    rows.push({ icon: '📅', label: '截止时间', value: formatAppDate(note.repeatEndDate) })
  }
  // 人员 👤
  if (note.repeatPerson) {
    rows.push({ icon: '👤', label: '人员', value: note.repeatPerson })
  }
  // 类型 📂（生日用 🎂）
  if (note.repeatCategory) {
    rows.push({ icon: '📂', label: '类型', value: getCategoryDisplay(note.repeatCategory) })
  }
  
  return rows
}

/** 根据 repeatType 和 repeatWeekdays 生成显示文字 */
function formatRepeatLabel(repeatType: string, repeatWeekdays?: string | null): string {
  if (repeatType === 'weekday' && repeatWeekdays) {
    const days = repeatWeekdays.split(',').map((d) => {
      const opt = WEEKDAY_OPTIONS.find((o) => o.value === d.trim())
      return opt ? opt.label : d
    })
    return days.join('、')
  }
  return REPEAT_LABELS[repeatType] ?? repeatType
}

export function NotePanel({ notes, entityType, entityId, onNotesChanged, filterDate, onClearFilterDate, searchTerm, loading = false, viewMode: externalViewMode, mobileComposeVisible = false, onCloseMobileCompose }: NotePanelProps) {
  const [inputType, setInputType] = useState<'todo' | 'log' | 'note' | 'appointment' | 'diary'>('note')
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const { success, error } = useToast()

  // ── 过滤状态 ──
  const [filterType, setFilterType] = useState<'all' | 'todo' | 'log' | 'note' | 'appointment' | 'diary'>('all')
  const [showOnlyUndone, setShowOnlyUndone] = useState(false)

  // ── 视图模式（优先使用外部传入的）──
  const [internalViewMode, setInternalViewMode] = useState<'calendar' | 'list' | 'timeline' | 'bookmark'>('list')
  const viewMode = externalViewMode ?? internalViewMode

  // ── 预约表单字段 ──
  const [apptTime, setApptTime] = useState('')
  const [apptLocation, setApptLocation] = useState('')
  const [apptType, setApptType] = useState('interview')
  const [apptPerson, setApptPerson] = useState('')

  // ── 日记表单字段 ──
  const [articleType, setArticleType] = useState('diary')
  const [articlePerson, setArticlePerson] = useState('')
  const diaryEditorRef = useRef<HTMLDivElement>(null)

  // ── 沟通表单字段 ──
  const [logPerson, setLogPerson] = useState('')

  // 重复待办：是否展开配置面板
  const [showRepeat, setShowRepeat] = useState(false)

  // 重复待办附加字段
  const [repeatPerson, setRepeatPerson] = useState('')
  const [repeatCategory, setRepeatCategory] = useState('')
  const [repeatCustomNum, setRepeatCustomNum] = useState<number | ''>('')
  const [todoWeekdays, setTodoWeekdays] = useState<string[]>([])

  // ── 待办表单字段 ──
  const [todoDate, setTodoDate] = useState('')       // datetime-local 格式
  const [todoRepeat, setTodoRepeat] = useState('')   // '' | weekly | monthly | yearly
  const [todoFreq, setTodoFreq] = useState(1)        // 频率
  const [todoEndDate, setTodoEndDate] = useState('') // date 格式 (YYYY-MM-DD)

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

  // ── 滚动监听：当前可视日期组（用于吸顶日期指示器）──
  const [activeDateGroup, setActiveDateGroup] = useState<string | null>(null)
  function fmtActiveDateHeader(dateStr: string): string {
    const now = new Date()
    const todayStr = now.toLocaleDateString('sv-SE')
    const tomorrowStr = new Date(now.getTime() + 86400000).toLocaleDateString('sv-SE')
    const yesterdayStr = new Date(now.getTime() - 86400000).toLocaleDateString('sv-SE')
    if (dateStr === todayStr) return '今天'
    if (dateStr === tomorrowStr) return '明天'
    if (dateStr === yesterdayStr) return '昨天'
    const d = new Date(dateStr + 'T00:00:00')
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
  }

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

  // ── 滚动监听：IntersectionObserver 驱动吸顶日期指示器 ──
  useEffect(() => {
    if (viewMode !== 'list' && viewMode !== 'timeline' && viewMode !== 'bookmark') {
      setActiveDateGroup(null)
      return
    }

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      let bestEntry: IntersectionObserverEntry | null = null
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!bestEntry || entry.boundingClientRect.top < bestEntry.boundingClientRect.top) {
            bestEntry = entry
          }
        }
      }
      if (bestEntry) {
        const day = (bestEntry.target as HTMLElement).dataset.date
        if (day) setActiveDateGroup(day)
      }
    }

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '-44px 0px 0px 0px',
      threshold: [0, 0.5, 1],
    })

    const raf = requestAnimationFrame(() => {
      const headers = document.querySelectorAll<HTMLElement>('.note-list-date-header, .note-timeline-date-header')
      headers.forEach((el) => observer.observe(el))
    })

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [viewMode, finalFiltered])

  function handleSubmit() {
    // 日记类型从 contentEditable 获取内容
    let content = inputValue.trim()
    if (inputType === 'diary') {
      const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
      content = (ref.current?.innerHTML ?? '').trim()
    }
    if (!content) return

    if (inputType === 'todo' && todoRepeat) {
      if (!todoDate) {
        error('无法创建重复待办', '请先选择待办时间')
        return
      }
      if (!todoEndDate) {
        error('无法创建重复待办', '请选择重复截止日期')
        return
      }
      if (!Number.isInteger(todoFreq) || todoFreq < 1 || todoFreq > 99) {
        error('无法创建重复待办', '重复频率必须是 1–99 的整数')
        return
      }
      if (todoEndDate < todoDate.slice(0, 10)) {
        error('无法创建重复待办', '重复截止日期不能早于首次待办时间')
        return
      }
    }

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
    // 沟通字段
    if (inputType === 'log') {
      if (logPerson.trim()) fd.set('logPerson', logPerson.trim())
    }
    // 待办字段
    if (inputType === 'todo') {
      if (todoDate) fd.set('scheduledDate', todoDate)
      if (todoRepeat) {
        fd.set('repeatType', todoRepeat)
        fd.set('repeatFrequency', String(todoFreq))
        if (todoEndDate) fd.set('repeatEndDate', todoEndDate)
        // 重复待办附加字段
        if (repeatPerson.trim()) fd.set('repeatPerson', repeatPerson.trim())
        if (repeatCategory) fd.set('repeatCategory', repeatCategory)
        if (repeatCustomNum) fd.set('repeatCustomNum', String(repeatCustomNum))
        if (todoWeekdays.length > 0) fd.set('repeatWeekdays', todoWeekdays.join(','))
      }
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
        setLogPerson('')
        setTodoDate('')
        setTodoRepeat('')
        setTodoFreq(1)
        setTodoEndDate('')
        setRepeatPerson('')
        setRepeatCategory('')
        setRepeatCustomNum('')
        setTodoWeekdays([])
        setShowRepeat(false)
        if (diaryEditorRef.current) diaryEditorRef.current.innerHTML = ''
        if (fullscreenEditorRef.current) fullscreenEditorRef.current.innerHTML = ''
        setIsFullscreen(false)
        setDiaryCharCount(0)
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        setDraftSavedAt('')
        if (result.success && result.createdCount !== undefined) {
          success(`已创建 ${result.createdCount} 个重复待办`)
        } else {
          success('笔记已保存')
        }
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

  // ── 本地今天日期（memoized，按天刷新）──
  const getLocalToday = useCallback(() => {
    return new Date().toLocaleDateString('sv-SE')
  }, [])

  // ── 根据 filterType 过滤（memoized）──
  // 收藏视图：跳过 Tab 筛选，用全量数据；搜索时保留 filterType 关联筛选
  const filtered = useMemo(() => {
    if (viewMode === 'bookmark') return sorted
    return sorted.filter((n) => {
      if (filterType === 'all') {
        // 「今天」：今天创建的笔记 + 今天预约/待办
        const today = getLocalToday()
        if (n.type === 'todo' && n.scheduledDate) {
          return new Date(n.scheduledDate).toLocaleDateString('sv-SE') === today
        }
        if (n.type === 'appointment' && n.appointmentTime) {
          return new Date(n.appointmentTime).toLocaleDateString('sv-SE') === today
        }
        // 其他类型：按创建时间判断
        return new Date(n.createdAt).toLocaleDateString('sv-SE') === today
      }
      if ((filterType === 'todo' || filterType === 'appointment') && showOnlyUndone) return n.type === filterType && !n.done
      return n.type === filterType
    })
  }, [sorted, filterType, showOnlyUndone, getLocalToday, viewMode])

  // ── 按日期筛选（memoized）──
  const dateFiltered = useMemo(() => {
    // 收藏视图：跳过日期筛选，显示全量收藏
    if (viewMode === 'bookmark' || !filterDate) return filtered
    return filtered.filter((n) => {
      const targetDate = n.type === 'todo' && n.scheduledDate
        ? n.scheduledDate
        : n.type === 'appointment' && n.appointmentTime
        ? n.appointmentTime
        : n.createdAt
      return targetDate.slice(0, 10) === filterDate
    })
  }, [filtered, filterDate, viewMode])

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

  // ── 收藏筛选（memoized）──
  const finalFiltered = useMemo(() => {
    if (viewMode !== 'bookmark') return searchFiltered
    return searchFiltered.filter((n) => n.bookmarked)
  }, [searchFiltered, viewMode])

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
      // 点击「今天」时重置输入类型为「随笔」，隐藏特定类型表单
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

  // ── 富文本选区保存/恢复（用于 select 下拉不丢失光标）──
  const savedSelectionRef = useRef<Range | null>(null)
  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
      if (ref.current && ref.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange()
      }
    }
  }, [isFullscreen])
  const execCmdWithRestore = useCallback((command: string, value?: string) => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedSelectionRef.current)
      }
    }
    const ref = isFullscreen ? fullscreenEditorRef : diaryEditorRef
    ref.current?.focus()
    document.execCommand(command, false, value)
    setDraftVersion(v => v + 1)
    updateDiaryCharCount()
  }, [isFullscreen, updateDiaryCharCount])

  /** 手动保存草稿（不退出编辑，给用户安全感） */
  function handleManualSaveDraft() {
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
      success('草稿已保存')
    } catch { /* ignore */ }
  }

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
      {/* ── 类型导航条（抽出 form 外，所有视图始终可见）── */}
      <div className="note-type-tabs" role="group" aria-label="笔记类型过滤">
        {/* 今天 */}
        <button
          type="button"
          className={`note-type-tab ${filterType === 'all' ? 'active note-type-all' : ''}`}
          onClick={() => handleTabClick('all')}
        >
          今天
        </button>

        {/* 待办 — 带未完成徽章 + 双击仅显示未完成 */}
        <button
          type="button"
          className={`note-type-tab ${filterType === 'todo' ? 'active' : ''} ${filterType === 'todo' && showOnlyUndone ? 'is-undone-filter' : ''}`}
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

        {/* 沟通 */}
        <button
          type="button"
          className={`note-type-tab ${filterType === 'log' ? 'active' : ''}`}
          onClick={() => handleTabClick('log')}
        >
          {TYPE_LABELS.log}
        </button>

        {/* 随笔 */}
        <button
          type="button"
          className={`note-type-tab ${filterType === 'note' ? 'active' : ''}`}
          onClick={() => handleTabClick('note')}
        >
          {TYPE_LABELS.note}
        </button>

        {/* 预约 — 带未完成徽章 + 双击仅显示未完成 */}
        <button
          type="button"
          className={`note-type-tab ${filterType === 'appointment' ? 'active' : ''} ${filterType === 'appointment' && showOnlyUndone ? 'is-undone-filter' : ''}`}
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
          className={`note-type-tab ${filterType === 'diary' ? 'active' : ''}`}
          onClick={() => handleTabClick('diary')}
        >
          {TYPE_LABELS.diary}
        </button>
      </div>

      {/* ── 快速输入区（日历/收藏视图下隐藏）── */}
      {(viewMode !== 'calendar' && viewMode !== 'bookmark') && (
      <form
        ref={formRef}
        className={`note-input-area${mobileComposeVisible ? ' is-mobile-visible' : ''}`}
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        {/* 手机端关闭按钮：macOS 风格红色按钮，在输入框左上角外面 */}
        {mobileComposeVisible && onCloseMobileCompose && (
          <button
            type="button"
            className="note-compose-close-btn"
            onClick={onCloseMobileCompose}
            aria-label="关闭输入框"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15"/>
              <line x1="15" y1="5" x2="5" y2="15"/>
            </svg>
          </button>
        )}
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="type" value={inputType} />

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
              <select
                className="note-diary-tool-select"
                onMouseDown={() => saveSelection()}
                onChange={(e) => { const v = e.target.value; if (v) execCmdWithRestore('formatBlock', `<${v}>`); e.target.selectedIndex = 0 }}
                title="标题格式"
              >
                <option value="">标题</option>
                <option value="h2">标题一</option>
                <option value="h3">标题二</option>
                <option value="h4">标题三</option>
                <option value="p">正文</option>
              </select>
              <select
                className="note-diary-tool-select"
                onMouseDown={() => saveSelection()}
                onChange={(e) => { const v = e.target.value; if (v) execCmdWithRestore('fontSize', v); e.target.selectedIndex = 0 }}
                title="字号"
              >
                <option value="">字号</option>
                <option value="2">小</option>
                <option value="3">正常</option>
                <option value="4">大</option>
                <option value="5">特大</option>
                <option value="6">超大</option>
              </select>
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

        {/* 待办专用表单字段 */}
        {inputType === 'todo' && (
          <div className="note-todo-form">
            {/* 展开重复待办面板按钮 */}
            {!showRepeat ? (
              <div className="note-repeat-bar">
                <button
                  type="button"
                  className="note-repeat-toggle-btn"
                  onClick={() => setShowRepeat(true)}
                >
                  🔄 重复待办
                </button>
              </div>
            ) : (
              <div className="note-repeat-panel">
                <button
                  type="button"
                  className="note-appt-close-btn"
                  onClick={() => {
                    setShowRepeat(false)
                    setTodoRepeat('')
                    setTodoEndDate('')
                    setTodoWeekdays([])
                    setRepeatCustomNum('')
                    setRepeatPerson('')
                    setRepeatCategory('')
                  }}
                  aria-label="关闭重复待办配置"
                  title="关闭重复待办配置"
                >✕</button>
                <div className="note-appt-row">
                  <label className="note-appt-label">时间</label>
                  <input
                    type="datetime-local"
                    className="note-appt-input"
                    value={todoDate}
                    onChange={(e) => setTodoDate(e.target.value)}
                    required
                  />
                </div>
                <div className="note-appt-row">
                  <label className="note-appt-label">重复</label>
                  <select
                    className="note-appt-select"
                    value={todoRepeat}
                    onChange={(e) => setTodoRepeat(e.target.value)}
                  >
                    <option value="">不重复</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="yearly">每年</option>
                    <option value="quarterly">每季度</option>
                    <option value="halfyearly">每半年</option>
                    <option value="workday">工作日</option>
                    <option value="weekday">每周几</option>
                    <option value="custom">自定义</option>
                  </select>
                  {todoRepeat && todoRepeat !== 'workday' && todoRepeat !== 'custom' && todoRepeat !== 'weekday' && (
                    <>
                      <span className="note-todo-freq-label">每</span>
                      <input
                        type="number"
                        className="note-todo-freq-input"
                        value={todoFreq}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') { setTodoFreq(1); return }
                          setTodoFreq(Math.min(99, Math.max(1, Number(raw) || 1)))
                        }}
                        min={1}
                        max={99}
                        step={1}
                        required
                        style={{ width: '50px' }}
                      />
                      <span className="note-todo-freq-label">
                        {todoRepeat === 'daily' ? '天' : todoRepeat === 'weekly' ? '周' : todoRepeat === 'monthly' ? '月' : todoRepeat === 'yearly' ? '年' : todoRepeat === 'quarterly' ? '季' : todoRepeat === 'halfyearly' ? '半年' : '天'}
                      </span>
                    </>
                  )}
                  {todoRepeat === 'workday' && (
                    <span className="note-todo-freq-label">（周一到周五）</span>
                  )}
                  {todoRepeat === 'custom' && (
                    <>
                      <span className="note-todo-freq-label">第</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="note-todo-freq-input"
                        value={repeatCustomNum === '' ? '' : repeatCustomNum}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          if (raw === '') { setRepeatCustomNum(''); return }
                          const n = Number(raw)
                          if (n >= 1 && n <= 366) setRepeatCustomNum(n)
                        }}
                        placeholder="天"
                        style={{ width: '56px' }}
                      />
                      <span className="note-todo-freq-label">天/年/季度</span>
                    </>
                  )}
                </div>
                {todoRepeat === 'weekday' && (
                  <div className="note-appt-row" style={{ flexWrap: 'wrap', gap: '4px' }}>
                    {WEEKDAY_OPTIONS.map((opt) => {
                      const checked = todoWeekdays.includes(opt.value)
                      return (
                        <label
                          key={opt.value}
                          className={`note-weekday-chip${checked ? ' note-weekday-chip--active' : ''}`}
                        >
                          <input
                            type="checkbox"
                            value={opt.value}
                            checked={checked}
                            onChange={() => {
                              setTodoWeekdays((prev) =>
                                prev.includes(opt.value)
                                  ? prev.filter((v) => v !== opt.value)
                                  : [...prev, opt.value]
                              )
                            }}
                            style={{ display: 'none' }}
                          />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )}
                <div className="note-appt-row">
                  <label className="note-appt-label">截止</label>
                  <input
                    type="date"
                    className="note-appt-input"
                    value={todoEndDate}
                    onChange={(e) => setTodoEndDate(e.target.value)}
                    min={todoDate ? todoDate.slice(0, 10) : undefined}
                  />
                </div>
                <div className="note-appt-row">
                  <label className="note-appt-label">人员</label>
                  <input
                    type="text"
                    name="repeatPerson"
                    className="note-appt-input"
                    value={repeatPerson}
                    onChange={(e) => setRepeatPerson(e.target.value)}
                    placeholder="如：陈成（选填）"
                  />
                </div>
                <div className="note-appt-row">
                  <label className="note-appt-label">类型</label>
                  <select
                    name="repeatCategory"
                    className="note-appt-select"
                    value={repeatCategory}
                    onChange={(e) => setRepeatCategory(e.target.value)}
                  >
                    <option value="">无</option>
                    <option value="birthday">🎂 生日</option>
                    <option value="study">📚 读书学习</option>
                    <option value="meeting">💼 开会</option>
                    <option value="exercise">🏃 锻炼身体</option>
                    <option value="work">💻 工作</option>
                    <option value="leisure">🎮 休闲</option>
                    <option value="kids">👶 孩子</option>
                    <option value="parents">👴 父母</option>
                    <option value="friends">🤝 朋友</option>
                    <option value="family">👨‍👩‍👧‍👦 家人</option>
                    <option value="other_life">📋 其他生活事项</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 沟通专用表单字段 */}
        {inputType === 'log' && (
          <div className="note-todo-form note-log-form">
            <div className="note-appt-row">
              <label className="note-appt-label">人物</label>
              <input
                type="text"
                className="note-appt-input"
                value={logPerson}
                onChange={(e) => setLogPerson(e.target.value)}
                placeholder="沟通对象姓名（选填）"
              />
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
          <div className="note-input-footer-btns">
            {inputType === 'diary' && (
              <button
                type="button"
                className="note-diary-save-btn"
                onClick={handleManualSaveDraft}
                disabled={isPending}
              >
                保存
              </button>
            )}
            <button
              type="submit"
              className="note-add-btn"
              disabled={isPending}
            >
              {isPending ? '保存中…' : '添加'}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* ── 日记全屏写作模式 ── */}
      {isFullscreen && inputType === 'diary' && typeof document !== 'undefined' && createPortal(
        <div className="note-diary-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="全屏写作模式">
          {/* 顶部栏：标题 + 文章类型/人物 + 字数 */}
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
            <select
              className="note-diary-tool-select"
              onMouseDown={() => saveSelection()}
              onChange={(e) => { const v = e.target.value; if (v) execCmdWithRestore('formatBlock', `<${v}>`); e.target.selectedIndex = 0 }}
              title="标题格式"
            >
              <option value="">标题</option>
              <option value="h2">标题一</option>
              <option value="h3">标题二</option>
              <option value="h4">标题三</option>
              <option value="p">正文</option>
            </select>
            <select
              className="note-diary-tool-select"
              onMouseDown={() => saveSelection()}
              onChange={(e) => { const v = e.target.value; if (v) execCmdWithRestore('fontSize', v); e.target.selectedIndex = 0 }}
              title="字号"
            >
              <option value="">字号</option>
              <option value="2">小</option>
              <option value="3">正常</option>
              <option value="4">大</option>
              <option value="5">特大</option>
              <option value="6">超大</option>
            </select>
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
            <div className="note-diary-fs-footer-right">
              <span className="note-diary-fs-hint">ESC 退出全屏 · Ctrl+Enter 添加</span>
              <button
                type="button"
                className="note-diary-save-btn"
                onClick={handleManualSaveDraft}
                disabled={isPending}
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 日期筛选提示条 ── */}
      {filterDate && (
        <div className="note-filter-date-bar">
          <div className="note-filter-date-left">
            <span className="filter-date-label">筛选: {filterDate}</span>
            <span className="filter-date-count">{finalFiltered.length} 条笔记</span>
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

      {/* ── 吸顶日期指示器（滚动时显示当前日期组）── */}
      {activeDateGroup && viewMode !== 'calendar' && (
        <div className="note-date-indicator">
          {fmtActiveDateHeader(activeDateGroup)}
        </div>
      )}

      {/* ── 笔记列表 / 时间轴 / 日历（加载中显示骨架屏）── */}
      {loading ? (
        <NoteSkeleton />
      ) : viewMode === 'calendar' ? (
        <CalendarView notes={notes} onChanged={onNotesChanged} searchTerm={searchTerm} />
      ) : viewMode === 'list' || viewMode === 'bookmark' ? (
        <ListView notes={finalFiltered} onChanged={onNotesChanged} searchTerm={searchTerm} filterDate={filterDate} filterType={filterType} showOnlyUndone={showOnlyUndone} onClearFilterDate={onClearFilterDate} viewMode={viewMode} />
      ) : (
        <TimelineView notes={finalFiltered} onChanged={onNotesChanged} searchTerm={searchTerm} filterDate={filterDate} filterType={filterType} showOnlyUndone={showOnlyUndone} onClearFilterDate={onClearFilterDate} />
      )}
    </div>
  )
}

/* ── 日历工具函数 ── */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function fmtCalDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/* ── 获取分组日期（与列表视图统一）── */
function getGroupDate(n: NoteItem): string {
  const d = n.type === 'todo' && n.scheduledDate ? new Date(n.scheduledDate)
    : n.type === 'appointment' && n.appointmentTime ? new Date(n.appointmentTime)
    : new Date(n.createdAt)
  return d.toLocaleDateString('sv-SE')
}
function getSortTime(n: NoteItem): string {
  return (n.type === 'todo' && n.scheduledDate) ? n.scheduledDate
    : (n.type === 'appointment' && n.appointmentTime) ? n.appointmentTime
    : n.createdAt
}
function getDayCategory(dateStr: string, t: string, tm: string, y: string): number {
  if (dateStr === t) return 0
  if (dateStr === tm) return 1
  if (dateStr === y) return 2
  if (dateStr > t) return 3
  return 4
}

/* ── 日历视图（内嵌在卡片笔记中） ── */
function CalendarView({ notes, onChanged, searchTerm }: {
  notes: NoteItem[]
  onChanged?: () => void
  searchTerm?: string
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [calendarTab, setCalendarTab] = useState<'all' | 'appointment' | 'todo'>('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const now = useMemo(() => new Date(), [])
  const todayStr = now.toLocaleDateString('sv-SE')
  const tomorrowStr = new Date(now.getTime() + 86400000).toLocaleDateString('sv-SE')
  const yesterdayStr = new Date(now.getTime() - 86400000).toLocaleDateString('sv-SE')

  // ── 日历网格 ──
  const calendarGrid = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)
    const cells: (number | null)[] = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return { cells, todayStr: fmtCalDate(now.getFullYear(), now.getMonth(), now.getDate()) }
  }, [viewYear, viewMonth, now])

  // ── 筛选：仅含手动时间的预约/待办 ──
  const calendarNotes = useMemo(() => {
    let filtered = notes.filter((n) => {
      if (n.type === 'appointment' && n.appointmentTime) return true
      if (n.type === 'todo' && n.scheduledDate) return true
      return false
    })
    // 搜索过滤
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((n) => n.content.toLowerCase().includes(q))
    }
    // Tab 过滤
    if (calendarTab === 'appointment') filtered = filtered.filter((n) => n.type === 'appointment')
    if (calendarTab === 'todo') filtered = filtered.filter((n) => n.type === 'todo')
    // 日期筛选（点击日历格子）
    if (filterDate) {
      filtered = filtered.filter((n) => getGroupDate(n) === filterDate)
    }
    return filtered
  }, [notes, searchTerm, calendarTab, filterDate])

  // ── 分组（与列表视图排序一致）──
  const noteGroups = useMemo(() => {
    const grouped = new Map<string, NoteItem[]>()
    for (const n of calendarNotes) {
      const d = getGroupDate(n)
      const arr = grouped.get(d) ?? []
      arr.push(n)
      if (!grouped.has(d)) grouped.set(d, arr)
    }
    // 组内降序
    for (const dayNotes of grouped.values()) {
      dayNotes.sort((a, b) => new Date(getSortTime(b)).getTime() - new Date(getSortTime(a)).getTime())
    }
    // 分组排序：今天 → 明天 → 昨天 → 未来(升序) → 过去(降序)
    const sortedDays = Array.from(grouped.keys()).sort((a, b) => {
      const catA = getDayCategory(a, todayStr, tomorrowStr, yesterdayStr)
      const catB = getDayCategory(b, todayStr, tomorrowStr, yesterdayStr)
      if (catA !== catB) return catA - catB
      if (catA === 3) return a.localeCompare(b)
      if (catA === 4) return b.localeCompare(a)
      return a.localeCompare(b)
    })
    return { grouped, sortedDays }
  }, [calendarNotes, todayStr, tomorrowStr, yesterdayStr])

  // 日期标题
  function fmtDateHeader(dateStr: string) {
    if (dateStr === todayStr) return '今天'
    if (dateStr === tomorrowStr) return '明天'
    if (dateStr === yesterdayStr) return '昨天'
    const d = new Date(dateStr + 'T00:00:00')
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
  }

  function toggleGroup(dateStr: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr)
      return next
    })
  }

  // ── 每月按日期索引的笔记数量（用于日历格子角标）──
  const monthNoteCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of notes) {
      if (n.type === 'appointment' && n.appointmentTime) {
        const d = n.appointmentTime.slice(0, 10)
        m.set(d, (m.get(d) ?? 0) + 1)
      } else if (n.type === 'todo' && n.scheduledDate) {
        const d = n.scheduledDate.slice(0, 10)
        m.set(d, (m.get(d) ?? 0) + 1)
      }
    }
    return m
  }, [notes])

  return (
    <div className="note-calendar-view">
      {/* ── 月份导航 ── */}
      <div className="note-calendar-nav">
        <button type="button" className="note-calendar-nav-btn" onClick={() => {
          if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
          else setViewMonth(viewMonth - 1)
        }} title="上个月">&lt;</button>
        <span className="note-calendar-month-label">{viewYear}年 {viewMonth + 1}月</span>
        <button type="button" className="note-calendar-nav-btn" onClick={() => {
          if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
          else setViewMonth(viewMonth + 1)
        }} title="下个月">&gt;</button>
        {filterDate && (
          <button type="button" className="note-calendar-clear-btn" onClick={() => setFilterDate(null)}>
            清除日期
          </button>
        )}
      </div>

      {/* ── 日历网格 ── */}
      <div className="note-calendar-grid-wrap">
        <div className="note-calendar-grid">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w} className="note-calendar-weekday">{w}</div>
          ))}
          {calendarGrid.cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="note-calendar-cell empty" />
            const dateStr = fmtCalDate(viewYear, viewMonth, day)
            const count = monthNoteCounts.get(dateStr) ?? 0
            const isToday = dateStr === calendarGrid.todayStr
            const isSelected = dateStr === filterDate
            return (
              <button
                key={dateStr}
                type="button"
                className={`note-calendar-cell${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${count > 0 ? ' has-notes' : ''}`}
                onClick={() => setFilterDate(isSelected ? null : dateStr)}
                title={count > 0 ? `${count} 条日程` : '无日程'}
              >
                <span className="note-calendar-day-num">{day}</span>
                {count > 0 && <span className="note-calendar-day-dot" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab：全部 / 预约日程 / 待办日程 ── */}
      <div className="note-calendar-tabs">
        <button type="button" className={`note-calendar-tab${calendarTab === 'all' ? ' is-active' : ''}`} onClick={() => setCalendarTab('all')}>全部</button>
        <button type="button" className={`note-calendar-tab${calendarTab === 'appointment' ? ' is-active' : ''}`} onClick={() => setCalendarTab('appointment')}>📅 预约日程</button>
        <button type="button" className={`note-calendar-tab${calendarTab === 'todo' ? ' is-active' : ''}`} onClick={() => setCalendarTab('todo')}>📋 待办日程</button>
      </div>

      {/* ── 日程卡片列表 ── */}
      <div className="note-calendar-list">
        {noteGroups.sortedDays.length === 0 ? (
          <div className="note-calendar-empty">
            {filterDate ? `${filterDate} 无${calendarTab === 'appointment' ? '预约' : calendarTab === 'todo' ? '待办' : '日程'}` : `暂无${calendarTab === 'appointment' ? '预约' : calendarTab === 'todo' ? '待办' : '日程'}`}
          </div>
        ) : (
          noteGroups.sortedDays.map((day) => {
            const dayNotes = noteGroups.grouped.get(day)!
            const isCollapsed = collapsedGroups.has(day)
            return (
              <div key={day} className="note-calendar-day-group">
                <button type="button" className="note-calendar-group-header" onClick={() => toggleGroup(day)}>
                  <span className="note-calendar-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
                  <span className="note-calendar-group-title">{fmtDateHeader(day)}</span>
                  <span className="note-calendar-group-count">{dayNotes.length} 条</span>
                </button>
                {!isCollapsed && (
                  <div className="note-calendar-group-body">
                    {dayNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onChanged={onChanged} searchTerm={searchTerm} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ── 列表视图（按日期分组折叠） ── */
function ListView({ notes, onChanged, searchTerm, filterDate, filterType, showOnlyUndone, onClearFilterDate, viewMode }: {
  notes: NoteItem[]
  onChanged?: () => void
  searchTerm?: string
  filterDate?: string | null
  filterType?: string
  showOnlyUndone?: boolean
  onClearFilterDate?: () => void
  viewMode?: string
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  if (notes.length === 0) {
    let title = '没有匹配的记录'
    let hint = ''
    let showClearBtn = false

    if (viewMode === 'bookmark') {
      title = '还没有收藏的笔记'
      hint = '点卡片上的 📌 按钮收藏重要笔记'
    } else if (searchTerm) {
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
      title = '今天还没有记录'
      hint = '用上面的输入框添加待办、沟通或随笔'
    }

    return (
      <div className="note-list">
        <div className="note-empty">
          <span className="note-empty-icon">✦</span>
          <p>{title}</p>
          <p className="note-empty-hint">{hint}</p>
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

  // 用本地日期提取，避免 UTC 时区问题
  function localDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('sv-SE')
  }

  // 获取笔记用于分组的日期：预约/待办用开始时间，其他用创建时间
  function getGroupDate(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return localDate(n.scheduledDate)
    if (n.type === 'appointment' && n.appointmentTime) return localDate(n.appointmentTime)
    return localDate(n.createdAt)
  }

  // 获取笔记用于组内排序的时间
  function getSortTime(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return n.scheduledDate
    if (n.type === 'appointment' && n.appointmentTime) return n.appointmentTime
    return n.createdAt
  }

  // 日期分组类别：0=今天 1=明天 2=昨天 3=未来 4=过去
  function getDayCategory(dateStr: string, today: string, tomorrow: string, yesterday: string): number {
    if (dateStr === today) return 0
    if (dateStr === tomorrow) return 1
    if (dateStr === yesterday) return 2
    if (dateStr > today) return 3
    return 4
  }

  // 按日期分组
  const grouped = new Map<string, NoteItem[]>()
  for (const n of notes) {
    const d = getGroupDate(n)
    const arr = grouped.get(d) ?? []
    arr.push(n)
    if (!grouped.has(d)) grouped.set(d, arr)
  }

  // 组内按时间升序
  for (const dayNotes of grouped.values()) {
    dayNotes.sort((a, b) => new Date(getSortTime(b)).getTime() - new Date(getSortTime(a)).getTime())
  }

  // 构建今天/明天/昨天基准
  const now = new Date()
  const todayStr = localDate(now.toISOString())
  const tomorrowStr = localDate(new Date(now.getTime() + 86400000).toISOString())
  const yesterdayStr = localDate(new Date(now.getTime() - 86400000).toISOString())

  // 按自定义排序：今天 → 明天 → 昨天 → 未来 → 过去
  const sortedDays = Array.from(grouped.keys()).sort((a, b) => {
    const catA = getDayCategory(a, todayStr, tomorrowStr, yesterdayStr)
    const catB = getDayCategory(b, todayStr, tomorrowStr, yesterdayStr)
    if (catA !== catB) return catA - catB
    // 同类别内：未来升序，过去降序（最近在前）
    if (catA === 3) return a.localeCompare(b)      // 未来：升序
    if (catA === 4) return b.localeCompare(a)       // 过去：降序
    return a.localeCompare(b)                       // 今天/明天/昨天
  })

  // 日期标题：今天/明天/昨天用相对，其他用绝对日期
  function fmtDateHeader(dateStr: string) {
    if (dateStr === todayStr) return '今天'
    if (dateStr === tomorrowStr) return '明天'
    if (dateStr === yesterdayStr) return '昨天'
    const d = new Date(dateStr + 'T00:00:00')
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
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
    <div className="note-list">
      {sortedDays.map((day) => {
        const isCollapsed = collapsedGroups.has(day)
        const dayNotes = grouped.get(day)!
        return (
          <div key={day} className={`note-list-group ${isCollapsed ? 'is-collapsed' : ''}`}>
            <div
              className="note-list-date-header"
              data-date={day}
              onClick={() => toggleGroup(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleGroup(day) }}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? '点击展开' : '点击折叠'}
            >
              <span className={`note-list-chevron ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
              <span className="note-list-date-label">{fmtDateHeader(day)}</span>
              <span className="note-list-date-count">{dayNotes.length} 条</span>
            </div>
            {!isCollapsed && (
              <div className="note-list-entries">
                {dayNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onChanged={onChanged}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
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
      title = '今天还没有记录'
      hint = '用上面的输入框添加待办、沟通或随笔'
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

  // 获取笔记用于分组的日期：预约/待办用开始时间，其他用创建时间
  function getGroupDate(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return localDate(n.scheduledDate)
    if (n.type === 'appointment' && n.appointmentTime) return localDate(n.appointmentTime)
    return localDate(n.createdAt)
  }

  // 获取笔记用于组内排序的时间
  function getSortTime(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return n.scheduledDate
    if (n.type === 'appointment' && n.appointmentTime) return n.appointmentTime
    return n.createdAt
  }

  // 日期分组类别：0=今天 1=明天 2=昨天 3=未来 4=过去
  function getDayCategory(dateStr: string, today: string, tomorrow: string, yesterday: string): number {
    if (dateStr === today) return 0
    if (dateStr === tomorrow) return 1
    if (dateStr === yesterday) return 2
    if (dateStr > today) return 3
    return 4
  }

  // 按日期分组
  const grouped = new Map<string, NoteItem[]>()
  for (const n of notes) {
    const d = getGroupDate(n)
    const arr = grouped.get(d) ?? []
    arr.push(n)
    if (!grouped.has(d)) grouped.set(d, arr)
  }

  // 组内按时间升序
  for (const dayNotes of grouped.values()) {
    dayNotes.sort((a, b) => new Date(getSortTime(b)).getTime() - new Date(getSortTime(a)).getTime())
  }

  // 构建今天/明天/昨天基准
  const now = new Date()
  const todayStr = localDate(now.toISOString())
  const tomorrowStr = localDate(new Date(now.getTime() + 86400000).toISOString())
  const yesterdayStr = localDate(new Date(now.getTime() - 86400000).toISOString())

  // 按自定义排序：今天 → 明天 → 昨天 → 未来 → 过去
  const sortedDays = Array.from(grouped.keys()).sort((a, b) => {
    const catA = getDayCategory(a, todayStr, tomorrowStr, yesterdayStr)
    const catB = getDayCategory(b, todayStr, tomorrowStr, yesterdayStr)
    if (catA !== catB) return catA - catB
    // 同类别内：未来升序，过去降序（最近在前）
    if (catA === 3) return a.localeCompare(b)      // 未来：升序
    if (catA === 4) return b.localeCompare(a)       // 过去：降序
    return a.localeCompare(b)                       // 今天/明天/昨天
  })

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 日期标题：今天/明天/昨天用相对，其他用绝对日期
  function fmtDateHeader(dateStr: string) {
    if (dateStr === todayStr) return '今天'
    if (dateStr === tomorrowStr) return '明天'
    if (dateStr === yesterdayStr) return '昨天'
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
              data-date={day}
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
                        <span className="note-timeline-time">{fmtTime(note.scheduledDate || note.appointmentTime || note.createdAt)}</span>
                        <span className={`note-type-badge ${TYPE_COLORS[note.type]}`}>
                          {TYPE_LABELS[note.type] ?? note.type}
                        </span>
                        {note.repeatGroupId && <span className="note-timeline-repeat" title="重复待办">🔄</span>}
                        {note.done && (note.type === 'todo' || note.type === 'appointment') && (
                          <span className="note-timeline-done-mark">✓ 已完成</span>
                        )}
                      </div>
                      <p className="note-timeline-content">{note.type === 'diary' ? note.content.replace(/<[^>]+>/g, '') : note.content}</p>
                      {/* 待办信息 - 多行结构化 */}
                      {note.type === 'todo' && (() => {
                        const rows = buildTodoDetailRows(note)
                        if (rows.length === 0) return null
                        return (
                          <div className={`note-todo-detail-card ${getCategoryColorClass(note.repeatCategory)}`}>
                            {rows.map((row, idx) => (
                              <div key={idx} className="note-todo-detail-row">
                                <span className="note-todo-detail-label">{row.icon} {row.label}</span>
                                <span className="note-todo-detail-value">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
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

/** 搜索高亮：将文本中的关键词用 <mark> 包裹，不区分大小写 */
function highlightText(text: string, keyword: string): string {
  if (!keyword.trim()) return text
  const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function NoteCard({ note, onChanged, searchTerm }: { note: NoteItem; onChanged?: () => void; searchTerm?: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── 编辑模式状态 ──
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const [editPerson, setEditPerson] = useState(note.person ?? '')
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
  // 沟通编辑状态
  const [editLogPerson, setEditLogPerson] = useState(note.logPerson ?? '')
  // 待办编辑状态
  const [editTodoDate, setEditTodoDate] = useState(
    note.scheduledDate ? toAppDateTimeLocal(note.scheduledDate) : ''
  )
  // 编辑弹窗：重复待办人员+类型
  const [editRepeatPerson, setEditRepeatPerson] = useState(note.repeatPerson ?? '')
  const [editRepeatCategory, setEditRepeatCategory] = useState(note.repeatCategory ?? '')
  // 编辑弹窗：重复待办频率+截止（可编辑）
  const [editRepeatType, setEditRepeatType] = useState(note.repeatType ?? '')
  const [editRepeatFrequency, setEditRepeatFrequency] = useState(note.repeatFrequency ? String(note.repeatFrequency) : '')
  const [editRepeatEndDate, setEditRepeatEndDate] = useState(note.repeatEndDate ? note.repeatEndDate.slice(0, 10) : '')
  const [editRepeatWeekdays, setEditRepeatWeekdays] = useState(note.repeatWeekdays ?? '')
  // 重复待办编辑/删除范围选择
  const [editScopeOpen, setEditScopeOpen] = useState(false)
  const [editScope, setEditScope] = useState<string>('single')
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false)
  const [deleteScope, setDeleteScope] = useState<string>('single')
  const isRecurring = !!note.repeatGroupId
  // 日记折叠状态
  const [diaryExpanded, setDiaryExpanded] = useState(false)
  // 判断日记是否够长需要折叠（纯文本 > 300 字，约5行）
  const diaryPlainLength = note.type === 'diary'
    ? note.content.replace(/<[^>]+>/g, '').trim().length
    : 0
  const diaryIsLong = diaryPlainLength > 300
  // 待办内容折叠（非日记类型，> 150 字，约5行）
  const [contentExpanded, setContentExpanded] = useState(false)
  const contentIsLong = note.type !== 'diary' && note.content.trim().length > 150

  // 人物标识前缀 — 显示格式：【人物名】内容
  const rawContent = note.person ? `【${note.person}】${note.content}` : note.content
  const displayContent = searchTerm ? highlightText(rawContent, searchTerm) : rawContent

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

    // 重复待办：弹出范围选择
    if (note.type === 'todo' && isRecurring) {
      setEditScopeOpen(true)
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('id', String(note.id))
        fd.set('content', content)
        if (editPerson.trim()) fd.set('person', editPerson.trim())
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
        if (note.type === 'log') {
          if (editLogPerson.trim()) fd.set('logPerson', editLogPerson.trim())
        }
        if (note.type === 'todo' && editTodoDate) {
          fd.set('scheduledDate', editTodoDate)
        }
        // 待办人员+类型+重复字段（所有待办都支持）
        if (note.type === 'todo') {
          fd.set('repeatPerson', editRepeatPerson.trim())
          fd.set('repeatCategory', editRepeatCategory)
          if (editRepeatType) fd.set('repeatType', editRepeatType)
          if (editRepeatFrequency) fd.set('repeatFrequency', editRepeatFrequency)
          if (editRepeatEndDate) fd.set('repeatEndDate', editRepeatEndDate)
          if (editRepeatWeekdays) fd.set('repeatWeekdays', editRepeatWeekdays)
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

  /** 带范围的编辑保存（重复待办） */
  function handleEditSaveWithScope(scope: string) {
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
        fd.set('scope', scope)
        if (editPerson.trim()) fd.set('person', editPerson.trim())
        if (note.type === 'todo' && editTodoDate) {
          fd.set('scheduledDate', editTodoDate)
        }
        // 待办人员+类型+重复字段（所有待办都支持）
        if (note.type === 'todo') {
          fd.set('repeatPerson', editRepeatPerson.trim())
          fd.set('repeatCategory', editRepeatCategory)
          if (editRepeatType) fd.set('repeatType', editRepeatType)
          if (editRepeatFrequency) fd.set('repeatFrequency', editRepeatFrequency)
          if (editRepeatEndDate) fd.set('repeatEndDate', editRepeatEndDate)
          if (editRepeatWeekdays) fd.set('repeatWeekdays', editRepeatWeekdays)
        }
        await editNoteWithScope(fd)
        setEditScopeOpen(false)
        setIsEditing(false)
        setIsEditFullscreen(false)
        onChanged?.()
      } catch (err) {
        console.error('编辑笔记异常:', err)
        alert('保存失败，请稍后重试。')
      }
    })
  }

  /** 确认范围后提交编辑（从 scope 弹窗点击确定时调用） */
  function handleEditScopeConfirm() {
    handleEditSaveWithScope(editScope)
  }

  /** 确认删除范围后提交 */
  function handleDeleteScopeConfirm() {
    handleDeleteWithScope(deleteScope)
  }

  /** 带范围的删除（重复待办） */
  function handleDeleteWithScope(scope: string) {
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('id', String(note.id))
        fd.set('scope', scope)
        await deleteNoteWithScope(fd)
        setDeleteScopeOpen(false)
        setConfirmOpen(false)
        onChanged?.()
      } catch (err) {
        console.error('删除笔记异常:', err)
        alert('删除失败，请稍后重试。')
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
    setEditLogPerson(note.logPerson ?? '')
    setEditTodoDate(note.scheduledDate ? toAppDateTimeLocal(note.scheduledDate) : '')
    setIsEditing(false)
    setIsEditFullscreen(false)
  }

  // ── 编辑模式富文本工具栏 ──
  const execEditCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    ref.current?.focus()
  }, [isEditFullscreen])

  // ── 编辑模式选区保存/恢复（用于 select 下拉不丢失光标）──
  const savedEditSelectionRef = useRef<Range | null>(null)
  const saveEditSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
      if (ref.current && ref.current.contains(range.commonAncestorContainer)) {
        savedEditSelectionRef.current = range.cloneRange()
      }
    }
  }, [isEditFullscreen])
  const execEditCmdWithRestore = useCallback((command: string, value?: string) => {
    if (savedEditSelectionRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedEditSelectionRef.current)
      }
    }
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    ref.current?.focus()
    document.execCommand(command, false, value)
    setContentVersion(v => v + 1)
    updateEditCharCount()
  }, [isEditFullscreen, updateEditCharCount])

  /** 手动保存到服务器（不退出编辑，给用户安全感） */
  function handleManualSaveDiary() {
    if (note.type !== 'diary') return
    const ref = isEditFullscreen ? editFullscreenRef : editDiaryRef
    const html = (ref.current?.innerHTML ?? '').trim()
    if (!html) return
    startTransition(async () => {
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
        console.error('手动保存失败:', err)
      }
    })
  }

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
        {note.repeatGroupId && <span className="note-repeat-mark" title="重复待办">🔄</span>}
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
          {/* 待办字段编辑 */}
          {note.type === 'todo' && (
            <div className="note-edit-appt">
              <div className="note-edit-appt-row">
                <label className="note-edit-label">⏰ 时间</label>
                <input
                  type="datetime-local"
                  className="note-edit-datetime"
                  value={editTodoDate}
                  onChange={(e) => setEditTodoDate(e.target.value)}
                />
              </div>
              {/* 重复信息（所有待办都可编辑） */}
              {note.repeatType && (
                <>
                  <div className="note-edit-appt-row">
                    <label className="note-edit-label">🔄 频率</label>
                    <select
                      className="note-edit-select"
                      value={editRepeatType}
                      onChange={(e) => setEditRepeatType(e.target.value)}
                    >
                      {Object.entries(REPEAT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {editRepeatType === 'weekday' && (
                    <div className="note-edit-appt-row">
                      <label className="note-edit-label"></label>
                      <div className="note-weekday-row">
                        {WEEKDAY_OPTIONS.map((opt) => {
                          const active = editRepeatWeekdays.split(',').includes(opt.value)
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`note-weekday-chip${active ? ' note-weekday-chip--active' : ''}`}
                              onClick={() => {
                                const parts = editRepeatWeekdays.split(',').filter(Boolean)
                                const next = active
                                  ? parts.filter((v) => v !== opt.value)
                                  : [...parts, opt.value]
                                setEditRepeatWeekdays(next.join(','))
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {(editRepeatType === 'custom' || (editRepeatFrequency && Number(editRepeatFrequency) > 1)) && (
                    <div className="note-edit-appt-row">
                      <label className="note-edit-label"></label>
                      <span className="note-repeat-custom-wrap">
                        每
                        <input
                          type="text"
                          inputMode="numeric"
                          className="note-repeat-custom-input"
                          value={editRepeatFrequency}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            setEditRepeatFrequency(v ? String(Math.min(Number(v), 366)) : '')
                          }}
                          placeholder="1"
                          maxLength={3}
                        />
                        {editRepeatType === 'daily' ? '天' : editRepeatType === 'weekly' ? '周' : editRepeatType === 'monthly' ? '月' : editRepeatType === 'quarterly' ? '季度' : editRepeatType === 'halfyearly' ? '半年' : '年'}
                      </span>
                    </div>
                  )}
                  <div className="note-edit-appt-row">
                    <label className="note-edit-label">📅 截止</label>
                    <input
                      type="date"
                      className="note-edit-datetime"
                      value={editRepeatEndDate}
                      onChange={(e) => setEditRepeatEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              {/* 待办没有重复类型时，也允许添加频率 */}
              {!note.repeatType && (
                <>
                  <div className="note-edit-appt-row">
                    <label className="note-edit-label">🔄 频率</label>
                    <select
                      className="note-edit-select"
                      value={editRepeatType}
                      onChange={(e) => setEditRepeatType(e.target.value)}
                    >
                      <option value="">不重复</option>
                      {Object.entries(REPEAT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {editRepeatType === 'weekday' && (
                    <div className="note-edit-appt-row">
                      <label className="note-edit-label"></label>
                      <div className="note-weekday-row">
                        {WEEKDAY_OPTIONS.map((opt) => {
                          const active = editRepeatWeekdays.split(',').includes(opt.value)
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`note-weekday-chip${active ? ' note-weekday-chip--active' : ''}`}
                              onClick={() => {
                                const parts = editRepeatWeekdays.split(',').filter(Boolean)
                                const next = active
                                  ? parts.filter((v) => v !== opt.value)
                                  : [...parts, opt.value]
                                setEditRepeatWeekdays(next.join(','))
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {(editRepeatType === 'custom' || (editRepeatFrequency && Number(editRepeatFrequency) > 1)) && (
                    <div className="note-edit-appt-row">
                      <label className="note-edit-label"></label>
                      <span className="note-repeat-custom-wrap">
                        每
                        <input
                          type="text"
                          inputMode="numeric"
                          className="note-repeat-custom-input"
                          value={editRepeatFrequency}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            setEditRepeatFrequency(v ? String(Math.min(Number(v), 366)) : '')
                          }}
                          placeholder="1"
                          maxLength={3}
                        />
                        {editRepeatType === 'daily' ? '天' : editRepeatType === 'weekly' ? '周' : editRepeatType === 'monthly' ? '月' : editRepeatType === 'quarterly' ? '季度' : editRepeatType === 'halfyearly' ? '半年' : '年'}
                      </span>
                    </div>
                  )}
                  {editRepeatType && (
                    <div className="note-edit-appt-row">
                      <label className="note-edit-label">📅 截止</label>
                      <input
                        type="date"
                        className="note-edit-datetime"
                        value={editRepeatEndDate}
                        onChange={(e) => setEditRepeatEndDate(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
              {/* 人员、类型：所有待办都显示 */}
              <div className="note-edit-appt-row">
                <label className="note-edit-label">👤 人员</label>
                <input
                  type="text"
                  className="note-edit-input"
                  value={editRepeatPerson}
                  onChange={(e) => setEditRepeatPerson(e.target.value)}
                  placeholder="如：陈成（选填）"
                  maxLength={30}
                />
              </div>
              <div className="note-edit-appt-row">
                <label className="note-edit-label">📂 类型</label>
                <select
                  className="note-edit-select"
                  value={editRepeatCategory}
                  onChange={(e) => setEditRepeatCategory(e.target.value)}
                >
                  <option value="">未分类</option>
                  <option value="birthday">🎂 生日</option>
                  <option value="study">📚 读书学习</option>
                  <option value="meeting">💼 开会</option>
                  <option value="exercise">🏃 锻炼身体</option>
                  <option value="work">💻 工作</option>
                  <option value="leisure">🎮 休闲</option>
                  <option value="kids">👶 孩子</option>
                  <option value="parents">👴 父母</option>
                  <option value="friends">🤝 朋友</option>
                  <option value="family">👨‍👩‍👧‍👦 家人</option>
                  <option value="other_life">📋 其他生活事项</option>
                </select>
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
                <select
                  className="note-diary-tool-select"
                  onMouseDown={() => saveEditSelection()}
                  onChange={(e) => { const v = e.target.value; if (v) execEditCmdWithRestore('formatBlock', `<${v}>`); e.target.selectedIndex = 0 }}
                  title="标题格式"
                >
                  <option value="">标题</option>
                  <option value="h2">标题一</option>
                  <option value="h3">标题二</option>
                  <option value="h4">标题三</option>
                  <option value="p">正文</option>
                </select>
                <select
                  className="note-diary-tool-select"
                  onMouseDown={() => saveEditSelection()}
                  onChange={(e) => { const v = e.target.value; if (v) execEditCmdWithRestore('fontSize', v); e.target.selectedIndex = 0 }}
                  title="字号"
                >
                  <option value="">字号</option>
                  <option value="2">小</option>
                  <option value="3">正常</option>
                  <option value="4">大</option>
                  <option value="5">特大</option>
                  <option value="6">超大</option>
                </select>
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
          {/* 人物标识（所有类型通用） */}
          <div className="note-edit-person">
            <label className="note-edit-label">👤 人物</label>
            <input
              type="text"
              className="note-edit-input"
              value={editPerson}
              onChange={(e) => setEditPerson(e.target.value)}
              placeholder="关联人物姓名…"
              maxLength={50}
            />
          </div>
          <div className="note-edit-actions">
            <span className="note-edit-char-count">{note.type === 'diary' ? '' : `${editContent.length}/500`}</span>
            {note.type === 'diary' && (
              <button
                type="button"
                className="note-edit-btn"
                disabled={isPending}
                onClick={handleManualSaveDiary}
              >
                {isPending ? '保存中…' : '保存'}
              </button>
            )}
            <button
              type="button"
              className="note-edit-btn note-edit-save"
              disabled={isPending}
              onClick={handleEditSave}
            >
              完成
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
                  dangerouslySetInnerHTML={{ __html: (() => {
                    const raw = note.person ? `<span class="note-person-prefix">【${note.person}】</span>${note.content}` : note.content
                    return searchTerm ? highlightText(raw, searchTerm) : raw
                  })() }}
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
              <div className="note-content-wrap">
                <p
                  className={`note-content${contentIsLong && !contentExpanded ? ' note-content-clamped' : ''}`}
                  dangerouslySetInnerHTML={{ __html: displayContent }}
                />
                {contentIsLong && (
                  <button
                    type="button"
                    className="note-content-toggle"
                    onClick={() => setContentExpanded(v => !v)}
                  >
                    {contentExpanded ? '收起 ↑' : '展开全文 ↓'}
                  </button>
                )}
              </div>
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

          {/* ── 待办信息卡 - 多行结构化 ── */}
          {note.type === 'todo' && (() => {
            const rows = buildTodoDetailRows(note)
            if (rows.length === 0) return null
            return (
              <div className={`note-todo-detail-card ${getCategoryColorClass(note.repeatCategory)}`}>
                {rows.map((row, idx) => (
                  <div key={idx} className="note-todo-detail-row">
                    <span className="note-todo-detail-label">{row.icon} {row.label}</span>
                    <span className="note-todo-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
            )
          })()}

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
              className={`note-action-btn ${note.bookmarked ? 'active' : ''}`}
              title={note.bookmarked ? '取消收藏' : '收藏'}
              disabled={isPending}
              onClick={runAction(toggleBookmarkNote)}
            >
              📌 {note.bookmarked ? '已收藏' : '收藏'}
            </button>

            <button
              type="button"
              className="note-action-btn note-delete-btn"
              title="删除"
              disabled={isPending}
              onClick={() => isRecurring ? setDeleteScopeOpen(true) : setConfirmOpen(true)}
            >
              删除
            </button>
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

      {/* ── 编辑范围选择弹窗（重复待办） ── */}
      {editScopeOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="confirm-backdrop" onClick={() => { setEditScopeOpen(false); setEditScope('single') }} />
          <div className="confirm-panel scope-panel" role="alertdialog" aria-modal="true">
            <h2 className="confirm-title">修改范围</h2>
            <p className="confirm-message">这是一条重复待办，请选择修改范围：</p>
            <div className="scope-options">
              <label
                className={`scope-option${editScope === 'single' ? ' scope-option--active' : ''}`}
                onClick={() => setEditScope('single')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>仅修改当条</strong>
                  <small>当前卡片脱离重复，变成独立待办</small>
                </span>
              </label>
              <label
                className={`scope-option${editScope === 'future' ? ' scope-option--active' : ''}`}
                onClick={() => setEditScope('future')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>修改当前及以后</strong>
                  <small>从当前日期开始的重复实例都将更新</small>
                </span>
              </label>
              <label
                className={`scope-option${editScope === 'all' ? ' scope-option--active' : ''}`}
                onClick={() => setEditScope('all')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>修改全部重复</strong>
                  <small>所有重复实例一起更新</small>
                </span>
              </label>
            </div>
            <div className="scope-actions">
              <button className="scope-btn scope-btn--confirm" type="button" disabled={isPending} onClick={handleEditScopeConfirm}>
                确定
              </button>
              <button className="scope-btn scope-btn--cancel" type="button" onClick={() => { setEditScopeOpen(false); setEditScope('single') }}>
                取消
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── 删除范围选择弹窗（重复待办） ── */}
      {deleteScopeOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="confirm-backdrop" onClick={() => { setDeleteScopeOpen(false); setDeleteScope('single') }} />
          <div className="confirm-panel scope-panel" role="alertdialog" aria-modal="true">
            <h2 className="confirm-title">删除范围</h2>
            <p className="confirm-message">这是一条重复待办，请选择删除范围：</p>
            <div className="scope-options">
              <label
                className={`scope-option${deleteScope === 'single' ? ' scope-option--active' : ''}`}
                onClick={() => setDeleteScope('single')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>仅删除当条</strong>
                  <small>只删除当前这一条，其余保持不变</small>
                </span>
              </label>
              <label
                className={`scope-option${deleteScope === 'future' ? ' scope-option--active' : ''}`}
                onClick={() => setDeleteScope('future')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>删除当前及以后</strong>
                  <small>从当前日期开始的所有重复实例都将删除</small>
                </span>
              </label>
              <label
                className={`scope-option${deleteScope === 'all' ? ' scope-option--active' : ''}`}
                onClick={() => setDeleteScope('all')}
              >
                <span className="scope-option-radio" />
                <span className="scope-option-text">
                  <strong>删除全部重复</strong>
                  <small>删除所有重复实例，此操作不可恢复</small>
                </span>
              </label>
            </div>
            <div className="scope-actions">
              <button className="scope-btn scope-btn--danger" type="button" disabled={isPending} onClick={handleDeleteScopeConfirm}>
                确定删除
              </button>
              <button className="scope-btn scope-btn--cancel" type="button" onClick={() => { setDeleteScopeOpen(false); setDeleteScope('single') }}>
                取消
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

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
            <select
              className="note-diary-tool-select"
              onMouseDown={() => saveEditSelection()}
              onChange={(e) => { const v = e.target.value; if (v) execEditCmdWithRestore('formatBlock', `<${v}>`); e.target.selectedIndex = 0 }}
              title="标题格式"
            >
              <option value="">标题</option>
              <option value="h2">标题一</option>
              <option value="h3">标题二</option>
              <option value="h4">标题三</option>
              <option value="p">正文</option>
            </select>
            <select
              className="note-diary-tool-select"
              onMouseDown={() => saveEditSelection()}
              onChange={(e) => { const v = e.target.value; if (v) execEditCmdWithRestore('fontSize', v); e.target.selectedIndex = 0 }}
              title="字号"
            >
              <option value="">字号</option>
              <option value="2">小</option>
              <option value="3">正常</option>
              <option value="4">大</option>
              <option value="5">特大</option>
              <option value="6">超大</option>
            </select>
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
            <div className="note-diary-fs-footer-right">
              <span className="note-diary-fs-hint">ESC 退出全屏 · Ctrl+Enter 完成</span>
              <button
                type="button"
                className="note-diary-save-btn"
                onClick={handleManualSaveDiary}
                disabled={isPending}
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  )
}
