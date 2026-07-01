'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getNotesCalendarData, getAppointmentList, getTodoList, type CalendarDay, type AppointmentListItem, type TodoListItem } from '@/app/actions'
import type { NoteItem } from '@/components/ui/NotePanel'

type Props = {
  onDateSelect: (dateStr: string | null) => void
  selectedDate: string | null
  /** 限定范围：不传 = 全局，传入 = 仅该实体 */
  entityType?: string
  entityId?: number
  /** 笔记数据（来自父组件），用于日历内直接展示 */
  notes?: NoteItem[]
}

// ── 工具函数 ──
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const APPT_TYPE_LABELS: Record<string, string> = {
  interview: '面试',
  business: '商务沟通',
  todo_appointment: '待办预约',
  other: '其他',
}

const REPEAT_LABELS: Record<string, string> = {
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
}

// 日期分组：今天/明天/之后
function formatApptDate(dateStr: string): string {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  if (dateStr === todayStr) return '今天'
  if (dateStr === tomorrowStr) return '明天'
  const [_y, m, d] = dateStr.split('-').map(Number)
  return `${m}月${d}日`
}

export function NotesCalendar({ onDateSelect, selectedDate, entityType, entityId, notes = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 日历内部日期筛选（点击日期后在本弹窗内过滤显示）
  const [localFilterDate, setLocalFilterDate] = useState<string | null>(null)

  // 预约 + 待办分页
  const APPT_PAGE_SIZE = 5
  const TODO_PAGE_SIZE = 5
  const [apptPage, setApptPage] = useState(1)
  const [todoPage, setTodoPage] = useState(1)

  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-based

  // 日历数据
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)

  // 预约列表
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([])

  // 待办列表
  const [todos, setTodos] = useState<TodoListItem[]>([])

  // 日历展开/收起（给预约日程腾空间）
  const [calExpanded, setCalExpanded] = useState(true)

  // 日历图标由 CSS ::before mask-image 渲染，无需在此定义内联 SVG

  useEffect(() => { setMounted(true) }, [])

  // 打开弹窗时加载数据
  const handleOpen = useCallback(async () => {
    setOpen(true)
    setLoading(true)
    try {
      const [data, appts, todoList] = await Promise.all([
        getNotesCalendarData(
          entityType as Parameters<typeof getNotesCalendarData>[0],
          entityId
        ),
        getAppointmentList(
          entityType as Parameters<typeof getAppointmentList>[0],
          entityId
        ),
        getTodoList(
          entityType as Parameters<typeof getTodoList>[0],
          entityId
        ),
      ])
      setCalendarData(data)
      setAppointments(appts)
      setTodos(todoList)
    } catch { /* ignore */ }
    setLoading(false)
  }, [entityType, entityId])

  // 监听快捷键打开日历事件 — 仅全局实例响应，实体级日历通过图标点击打开
  useEffect(() => {
    if (entityType !== undefined) return // 非全局实例不响应全局快捷键
    const handler = () => handleOpen()
    window.addEventListener('notes-calendar-open', handler)
    return () => window.removeEventListener('notes-calendar-open', handler)
  }, [handleOpen, entityType])

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) return // 已在关闭动画中，防止重复触发
    setClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setClosing(false)
      setOpen(false)
      closeTimerRef.current = null
    }, 180)
  }, [])

  const handleDateClick = useCallback((dateStr: string) => {
    if (localFilterDate === dateStr) {
      // 再次点击同一日期 → 取消筛选，显示全部
      setLocalFilterDate(null)
    } else {
      setLocalFilterDate(dateStr)
    }
    // 不关闭弹窗，不跳转到卡片笔记
  }, [localFilterDate])

  // 按日期索引
  const dayIndex = useMemo(() => {
    const m = new Map<string, CalendarDay>()
    for (const d of calendarData) m.set(d.date, d)
    return m
  }, [calendarData])

  // 生成日历网格
  const calendarGrid = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)
    const cells: (number | null)[] = []

    // 前置空白格
    for (let i = 0; i < startDay; i++) cells.push(null)
    // 日期格
    for (let d = 1; d <= totalDays; d++) cells.push(d)

    // 补齐到 7 的倍数
    while (cells.length % 7 !== 0) cells.push(null)

    const todayStr = formatDate(now.getFullYear(), now.getMonth(), now.getDate())

    return { cells, todayStr }
  }, [viewYear, viewMonth, now])

  // 上/下月
  const goPrev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  const goNext = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  // 总数统计
  const totalCounts = useMemo(() => {
    let todos = 0, logs = 0, notes = 0, appts = 0, diaries = 0
    for (const d of calendarData) {
      todos += d.todoCount
      logs += d.logCount
      notes += d.noteCount
      appts += d.apptCount ?? 0
      diaries += d.diaryCount ?? 0
    }
    return { todos, logs, notes, appts, diaries }
  }, [calendarData])

  // ── 笔记展示：过滤 + 分组 + 排序（与卡片笔记统一）──
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

  function localDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('sv-SE')
  }

  const nowDate = new Date()
  const todayStr = localDate(nowDate.toISOString())
  const tomorrowStr = localDate(new Date(nowDate.getTime() + 86400000).toISOString())
  const yesterdayStr = localDate(new Date(nowDate.getTime() - 86400000).toISOString())

  // 分组日期：预约/待办用开始时间，其他用创建时间
  function getGroupDate(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return localDate(n.scheduledDate)
    if (n.type === 'appointment' && n.appointmentTime) return localDate(n.appointmentTime)
    return localDate(n.createdAt)
  }

  // 组内排序时间
  function getSortTime(n: NoteItem): string {
    if (n.type === 'todo' && n.scheduledDate) return n.scheduledDate
    if (n.type === 'appointment' && n.appointmentTime) return n.appointmentTime
    return n.createdAt
  }

  function getDayCategory(dateStr: string): number {
    if (dateStr === todayStr) return 0
    if (dateStr === tomorrowStr) return 1
    if (dateStr === yesterdayStr) return 2
    if (dateStr > todayStr) return 3
    return 4
  }

  // 过滤 + 分组
  const noteGroups = useMemo(() => {
    // 先过滤
    const filtered = localFilterDate
      ? notes.filter((n) => getGroupDate(n) === localFilterDate)
      : notes

    // 分组
    const grouped = new Map<string, NoteItem[]>()
    for (const n of filtered) {
      const d = getGroupDate(n)
      const arr = grouped.get(d) ?? []
      arr.push(n)
      if (!grouped.has(d)) grouped.set(d, arr)
    }

    // 组内排序：按时间升序
    for (const dayNotes of grouped.values()) {
      dayNotes.sort((a, b) => new Date(getSortTime(b)).getTime() - new Date(getSortTime(a)).getTime())
    }

    // 分组排序：今天 → 明天 → 昨天 → 未来 → 过去
    const sortedDays = Array.from(grouped.keys()).sort((a, b) => {
      const catA = getDayCategory(a)
      const catB = getDayCategory(b)
      if (catA !== catB) return catA - catB
      if (catA === 3) return a.localeCompare(b)
      if (catA === 4) return b.localeCompare(a)
      return a.localeCompare(b)
    })

    return { grouped, sortedDays }
  }, [notes, localFilterDate])

  // 日期标题
  function fmtDateHeader(dateStr: string) {
    if (dateStr === todayStr) return '今天'
    if (dateStr === tomorrowStr) return '明天'
    if (dateStr === yesterdayStr) return '昨天'
    const d = new Date(dateStr + 'T00:00:00')
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
  }

  // 内容截断
  function clipContent(s: string, max = 60) {
    if (!s) return ''
    const plain = s.replace(/<[^>]+>/g, '').trim()
    return plain.length > max ? plain.slice(0, max) + '…' : plain
  }

  // ── 预约分页 ──
  const apptTotalPages = Math.max(1, Math.ceil(appointments.length / APPT_PAGE_SIZE))
  const apptPageItems = appointments.slice((apptPage - 1) * APPT_PAGE_SIZE, apptPage * APPT_PAGE_SIZE)

  // ── 待办分页 ──
  const todoTotalPages = Math.max(1, Math.ceil(todos.length / TODO_PAGE_SIZE))
  const todoPageItems = todos.slice((todoPage - 1) * TODO_PAGE_SIZE, todoPage * TODO_PAGE_SIZE)

  // ── 渲染 ──
  const modal = (open || closing) && mounted ? createPortal(
    <div className={`notes-calendar-backdrop${closing ? ' is-closing' : ''}`}>
      <div className={`notes-calendar-modal${closing ? ' is-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-calendar-header">
          <div className="notes-calendar-header-top">
            <h2 className="notes-calendar-title">笔记日历</h2>
            <div className="notes-calendar-nav-inline">
              <button onClick={goPrev} className="notes-calendar-nav-btn" title="上个月">&lt;</button>
              <span className="notes-calendar-month-label">
                {viewYear}年 {viewMonth + 1}月
              </span>
              <button onClick={goNext} className="notes-calendar-nav-btn" title="下个月">&gt;</button>
            </div>
            <div className="notes-calendar-header-actions">
              {appointments.length > 0 && (
                <button
                  type="button"
                  className="notes-calendar-toggle-btn"
                  onClick={() => setCalExpanded(!calExpanded)}
                  title={calExpanded ? '收起日历，查看日程' : '展开日历'}
                >
                  {calExpanded ? '▲ 收起日历' : '▼ 展开日历'}
                </button>
              )}
              <button
                className="notes-calendar-close-btn"
                onClick={handleClose}
                title="关闭日历"
                type="button"
                aria-label="关闭日历"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 图例 */}
          <div className="notes-calendar-legend">
            <span className="notes-calendar-legend-item">
              <span className="notes-calendar-dot todo" />待办
            </span>
            <span className="notes-calendar-legend-item">
              <span className="notes-calendar-dot log" />沟通
            </span>
            <span className="notes-calendar-legend-item">
              <span className="notes-calendar-dot note" />随笔
            </span>
            <span className="notes-calendar-legend-item">
              <span className="notes-calendar-dot appt" />预约
            </span>
            <span className="notes-calendar-legend-item">
              <span className="notes-calendar-dot diary" />日记
            </span>
            {localFilterDate && (
              <button className="notes-calendar-clear-btn" onClick={() => setLocalFilterDate(null)}>
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* Weekday header + Day grid — 同一个 grid 保证对齐 */}
        <div className={`notes-calendar-grid-wrap ${calExpanded ? 'is-expanded' : 'is-collapsed'}`}>
        <div className="notes-calendar-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="notes-calendar-weekday">{w}</div>
          ))}
          {calendarGrid.cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="notes-calendar-cell empty" />

            const dateStr = formatDate(viewYear, viewMonth, day)
            const info = dayIndex.get(dateStr)
            const isToday = dateStr === calendarGrid.todayStr
            const isSelected = dateStr === localFilterDate

            return (
              <button
                key={dateStr}
                className={`notes-calendar-cell${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${info ? ' has-notes' : ''}`}
                onClick={() => handleDateClick(dateStr)}
                title={info ? `待办${info.todoCount} 沟通${info.logCount} 随笔${info.noteCount} 预约${info.apptCount ?? 0} 日记${info.diaryCount ?? 0}` : '无笔记'}
                type="button"
              >
                <span className="notes-calendar-day-num">{day}</span>
                {info && (
                  <span className="notes-calendar-day-badges">
                    {info.todoCount > 0 && <span className="notes-calendar-badge todo">{info.todoCount}</span>}
                    {info.logCount > 0 && <span className="notes-calendar-badge log">{info.logCount}</span>}
                    {info.noteCount > 0 && <span className="notes-calendar-badge note">{info.noteCount}</span>}
                    {(info.apptCount ?? 0) > 0 && <span className="notes-calendar-badge appt">{info.apptCount ?? 0}</span>}
                    {(info.diaryCount ?? 0) > 0 && <span className="notes-calendar-badge diary">{info.diaryCount ?? 0}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        </div>{/* /notes-calendar-grid-wrap */}

        {/* ── 预约列表 ── */}
        {appointments.length > 0 && (
          <div className="notes-calendar-appt-section">
            <div className="notes-calendar-list-header">
              <h3 className="notes-calendar-appt-title">📅 预约日程</h3>
              {apptTotalPages > 1 && (
                <div className="notes-calendar-pagination">
                  <button
                    className="notes-calendar-page-btn"
                    disabled={apptPage <= 1}
                    onClick={() => setApptPage(p => Math.max(1, p - 1))}
                  >◀</button>
                  <span className="notes-calendar-page-info">{apptPage} / {apptTotalPages}</span>
                  <button
                    className="notes-calendar-page-btn"
                    disabled={apptPage >= apptTotalPages}
                    onClick={() => setApptPage(p => Math.min(apptTotalPages, p + 1))}
                  >▶</button>
                </div>
              )}
            </div>
            <div className="notes-calendar-appt-list">
              {(() => {
                let lastDate = ''
                const items: React.ReactNode[] = []
                for (const a of apptPageItems) {
                  if (a.date !== lastDate) {
                    lastDate = a.date
                    items.push(
                      <div key={`date-${a.date}`} className="notes-calendar-appt-date-header">
                        {formatApptDate(a.date)}
                        <span className="notes-calendar-appt-date-sub">{a.date}</span>
                      </div>
                    )
                  }
                  const typeLabel = APPT_TYPE_LABELS[a.type] ?? a.type
                  items.push(
                    <div key={a.id} className={`notes-calendar-appt-item${a.done ? ' is-done' : ''}`}>
                      <div className="notes-calendar-appt-item-row">
                        <span className="notes-calendar-appt-time">{a.time}</span>
                        <span className="notes-calendar-appt-type">{typeLabel}</span>
                        {a.person && <span className="notes-calendar-appt-person">👤 {a.person}</span>}
                        {a.entityName && (
                          <span className="notes-calendar-appt-entity">{a.entityName}</span>
                        )}
                        {a.done && <span className="notes-calendar-appt-done">✓</span>}
                      </div>
                    {a.location && (
                      <div className="notes-calendar-appt-location">📍 {a.location}</div>
                    )}
                    {a.content && (
                      <div className="notes-calendar-appt-content">{a.content}</div>
                    )}
                  </div>
                  )
                }
                return items
              })()}
            </div>
          </div>
        )}

        {/* ── 待办列表 ── */}
        {todos.length > 0 && (
          <div className="notes-calendar-appt-section">
            <div className="notes-calendar-list-header">
              <h3 className="notes-calendar-appt-title">📋 待办日程</h3>
              {todoTotalPages > 1 && (
                <div className="notes-calendar-pagination">
                  <button
                    className="notes-calendar-page-btn"
                    disabled={todoPage <= 1}
                    onClick={() => setTodoPage(p => Math.max(1, p - 1))}
                  >◀</button>
                  <span className="notes-calendar-page-info">{todoPage} / {todoTotalPages}</span>
                  <button
                    className="notes-calendar-page-btn"
                    disabled={todoPage >= todoTotalPages}
                    onClick={() => setTodoPage(p => Math.min(todoTotalPages, p + 1))}
                  >▶</button>
                </div>
              )}
            </div>
            <div className="notes-calendar-appt-list">
              {(() => {
                let lastDate = ''
                const items: React.ReactNode[] = []
                for (const t of todoPageItems) {
                  if (t.date !== lastDate) {
                    lastDate = t.date
                    items.push(
                      <div key={`todo-date-${t.date}`} className="notes-calendar-appt-date-header">
                        {formatApptDate(t.date)}
                        <span className="notes-calendar-appt-date-sub">{t.date}</span>
                      </div>
                    )
                  }
                  items.push(
                    <div key={t.id} className={`notes-calendar-appt-item${t.done ? ' is-done' : ''}`}>
                      <div className="notes-calendar-appt-item-row">
                        <span className="notes-calendar-appt-time">{t.time}</span>
                        {t.repeatType && (
                          <span className="notes-calendar-todo-repeat" title="重复待办">
                            🔄 {REPEAT_LABELS[t.repeatType] ?? t.repeatType}
                          </span>
                        )}
                        {t.entityName && (
                          <span className="notes-calendar-appt-entity">{t.entityName}</span>
                        )}
                        {t.done && <span className="notes-calendar-appt-done">✓</span>}
                      </div>
                      {t.content && (
                        <div className="notes-calendar-appt-content">{t.content}</div>
                      )}
                    </div>
                  )
                }
                return items
              })()}
            </div>
          </div>
        )}

        {/* ── 全部笔记列表（按日期分组，与卡片笔记统一）── */}
        {notes.length > 0 && noteGroups.sortedDays.length > 0 && (
          <div className="notes-calendar-appt-section notes-calendar-notes-section">
            <h3 className="notes-calendar-appt-title">
              {localFilterDate ? `📝 ${localFilterDate} 笔记` : '📝 全部笔记'}
              <span className="notes-calendar-notes-total">（{notes.length} 条）</span>
            </h3>
            <div className="notes-calendar-notes-list">
              {noteGroups.sortedDays.map((day) => {
                const dayNotes = noteGroups.grouped.get(day)!
                return (
                  <div key={day} className="notes-calendar-day-group">
                    <div className="notes-calendar-appt-date-header">
                      {fmtDateHeader(day)}
                      <span className="notes-calendar-appt-date-sub">{dayNotes.length} 条</span>
                    </div>
                    {dayNotes.map((note) => (
                      <div key={note.id} className={`notes-calendar-note-item${note.done && (note.type === 'todo' || note.type === 'appointment') ? ' is-done' : ''}`} data-type={note.type}>
                        <div className="notes-calendar-note-row">
                          <span className="notes-calendar-note-time">
                            {new Date(getSortTime(note)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`note-type-badge ${TYPE_COLORS[note.type]}`}>
                            {TYPE_LABELS[note.type] ?? note.type}
                          </span>
                          {note.repeatGroupId && <span className="calendar-note-repeat">🔄</span>}
                          {note.done && (note.type === 'todo' || note.type === 'appointment') && (
                            <span className="calendar-note-done">✓</span>
                          )}
                        </div>
                        <div className="notes-calendar-note-content">
                          {note.type === 'diary' ? clipContent(note.content, 80) : clipContent(note.content, 100)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer stats — 永远在弹窗最底部 */}
        <div className="notes-calendar-footer">
          <span>累计：</span>
          <span className="notes-calendar-stat todo">{totalCounts.todos} 待办</span>
          <span className="notes-calendar-stat log">{totalCounts.logs} 沟通</span>
          <span className="notes-calendar-stat note">{totalCounts.notes} 随笔</span>
          <span className="notes-calendar-stat appt">{totalCounts.appts} 预约</span>
          <span className="notes-calendar-stat diary">{totalCounts.diaries} 日记</span>
        </div>

        {loading && (
          <div className="notes-calendar-loading">加载中…</div>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        className={`notes-calendar-trigger${selectedDate ? ' is-active' : ''}`}
        onClick={handleOpen}
        title={selectedDate ? `已筛选: ${selectedDate}（点击日历切换或取消）` : '打开笔记日历'}
        type="button"
      />
      {modal}
    </>
  )
}
