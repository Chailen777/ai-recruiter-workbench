'use client'

import { useRef, useState, useTransition, useMemo } from 'react'
import { addNote, deleteNote, togglePinNote, toggleDoneNote } from '@/app/actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
}

const TYPE_COLORS: Record<string, string> = {
  todo: 'note-type-todo',
  log: 'note-type-log',
  note: 'note-type-note',
  appointment: 'note-type-appointment',
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
  const [inputType, setInputType] = useState<'todo' | 'log' | 'note' | 'appointment'>('note')
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // ── 过滤状态 ──
  const [filterType, setFilterType] = useState<'all' | 'todo' | 'log' | 'note' | 'appointment'>('all')
  const [showOnlyUndone, setShowOnlyUndone] = useState(false)

  // ── 视图模式 ──
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  // ── 预约表单字段 ──
  const [apptTime, setApptTime] = useState('')
  const [apptLocation, setApptLocation] = useState('')
  const [apptType, setApptType] = useState('interview')
  const [apptPerson, setApptPerson] = useState('')

  function handleSubmit() {
    if (!inputValue.trim()) return
    const fd = new FormData()
    fd.set('content', inputValue.trim())
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
    startTransition(async () => {
      try {
        const result = await addNote(fd)
        // result 可能是 { success: boolean } 或 undefined（旧版兼容）
        if (result && !result.success) {
          alert(result.error ?? '添加失败，请重试')
          return
        }
        setInputValue('')
        setApptTime('')
        setApptLocation('')
        setApptType('interview')
        setApptPerson('')
        onNotesChanged?.()
      } catch (err) {
        // 最终兜底：防止未处理错误穿透到 global-error.tsx
        console.error('添加笔记异常:', err)
        alert('添加笔记失败，请稍后重试。')
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
      return (
        n.content.toLowerCase().includes(q) ||
        (n.entityName && n.entityName.toLowerCase().includes(q)) ||
        (n.appointmentPerson && n.appointmentPerson.toLowerCase().includes(q)) ||
        (n.appointmentLocation && n.appointmentLocation.toLowerCase().includes(q)) ||
        (n.appointmentType && (APPT_TYPE_LABELS[n.appointmentType] ?? n.appointmentType).toLowerCase().includes(q)) ||
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
  function handleTabClick(type: 'all' | 'todo' | 'log' | 'note' | 'appointment') {
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

        {/* 输入框 */}
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

        <div className="note-input-footer">
          <span className="note-char-count">{inputValue.length}/500</span>
          <button
            type="submit"
            className="note-add-btn"
            disabled={isPending || !inputValue.trim()}
          >
            {isPending ? '保存中…' : '添加'}
          </button>
        </div>
      </form>

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
                      <p className="note-timeline-content">{note.content}</p>
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

  return (
    <article
      className={`note-card ${note.pinned ? 'is-pinned' : ''} ${note.done && (note.type === 'todo' || note.type === 'appointment') ? 'is-done' : ''} ${isPending ? 'is-pending' : ''}`}
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
        <p className="note-content">{note.content}</p>
      </div>

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
    </article>
  )
}
