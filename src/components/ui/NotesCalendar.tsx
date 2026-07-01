'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getNotesCalendarData, type CalendarDay } from '@/app/actions'
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

export function NotesCalendar({ onDateSelect, selectedDate, entityType, entityId, notes = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 日历内部日期筛选（点击日期后在本弹窗内过滤显示）
  const [localFilterDate, setLocalFilterDate] = useState<string | null>(null)

  // Tab 切换：全部 / 预约日程 / 待办日程
  const [calendarTab, setCalendarTab] = useState<'all' | 'appointment' | 'todo'>('all')

  // 分组折叠状态：key=日期字符串，true=折叠
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-based

  // 日历数据
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)

  // 日历展开/收起（给日程腾空间）
  const [calExpanded, setCalExpanded] = useState(true)

  // 日历图标由 CSS ::before mask-image 渲染，无需在此定义内联 SVG

  useEffect(() => { setMounted(true) }, [])

  // 打开弹窗时加载日历数据
  const handleOpen = useCallback(async () => {
    setOpen(true)
    setLoading(true)
    try {
      const data = await getNotesCalendarData(
        entityType as Parameters<typeof getNotesCalendarData>[0],
        entityId
      )
      setCalendarData(data)
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

  // 过滤 + 分组（仅预约和待办）
  const noteGroups = useMemo(() => {
    // 先过滤：仅 appointment + todo 类型
    let filtered = notes
      .filter((n) => n.type === 'appointment' || n.type === 'todo')

    // Tab 过滤
    if (calendarTab === 'appointment') filtered = filtered.filter((n) => n.type === 'appointment')
    if (calendarTab === 'todo') filtered = filtered.filter((n) => n.type === 'todo')

    // 日期筛选（点击日历某一天）
    if (localFilterDate) {
      filtered = filtered.filter((n) => getGroupDate(n) === localFilterDate)
    }

    // 分组
    const grouped = new Map<string, NoteItem[]>()
    for (const n of filtered) {
      const d = getGroupDate(n)
      const arr = grouped.get(d) ?? []
      arr.push(n)
      if (!grouped.has(d)) grouped.set(d, arr)
    }

    // 组内排序：按时间降序（最新在前）
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
  }, [notes, localFilterDate, calendarTab])

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

  // 折叠/展开分组
  function toggleGroup(dateStr: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

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
              <button
                type="button"
                className="notes-calendar-toggle-btn"
                onClick={() => setCalExpanded(!calExpanded)}
                title={calExpanded ? '收起日历，查看日程' : '展开日历'}
              >
                {calExpanded ? '▲ 收起日历' : '▼ 展开日历'}
              </button>
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

          {/* 图例 + 清除筛选 */}
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

        {/* ── Tab 切换 + 日程列表 ── */}
        <div className="notes-calendar-appt-section">
          {/* 三个 Tab + 清除筛选 */}
          <div className="notes-calendar-tabs">
            <div className="notes-calendar-tabs-group">
              <button
                type="button"
                className={`notes-calendar-tab${calendarTab === 'all' ? ' is-active' : ''}`}
                onClick={() => setCalendarTab('all')}
              >全部</button>
              <button
                type="button"
                className={`notes-calendar-tab${calendarTab === 'appointment' ? ' is-active' : ''}`}
                onClick={() => setCalendarTab('appointment')}
              >📅 预约日程</button>
              <button
                type="button"
                className={`notes-calendar-tab${calendarTab === 'todo' ? ' is-active' : ''}`}
                onClick={() => setCalendarTab('todo')}
              >📋 待办日程</button>
            </div>
            {localFilterDate && (
              <button className="notes-calendar-clear-btn" onClick={() => setLocalFilterDate(null)}>
                清除筛选
              </button>
            )}
          </div>

          {/* 日程列表：按日期分组，可折叠 */}
          <div className="notes-calendar-appt-list">
            {noteGroups.sortedDays.length === 0 ? (
              <div className="notes-calendar-empty">
                {localFilterDate ? `"${localFilterDate}" 当天没有${calendarTab === 'all' ? '预约或待办' : calendarTab === 'appointment' ? '预约' : '待办'}` : '暂无日程'}
              </div>
            ) : (
              noteGroups.sortedDays.map((day) => {
                const dayNotes = noteGroups.grouped.get(day)!
                const isCollapsed = collapsedGroups.has(day)
                const count = dayNotes.length
                return (
                  <div key={day} className="notes-calendar-day-group">
                    <button
                      type="button"
                      className="notes-calendar-group-header"
                      onClick={() => toggleGroup(day)}
                    >
                      <span className="notes-calendar-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
                      <span className="notes-calendar-group-title">{fmtDateHeader(day)}</span>
                      <span className="notes-calendar-group-count">{count} 条</span>
                    </button>
                    {!isCollapsed && (
                      <div className="notes-calendar-group-body">
                        {dayNotes.map((note) => (
                          <div key={note.id} className={`notes-calendar-note-item${note.done && (note.type === 'todo' || note.type === 'appointment') ? ' is-done' : ''}`} data-type={note.type}>
                            <div className="notes-calendar-note-row">
                              <span className="notes-calendar-note-time">
                                {new Date(getSortTime(note)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="notes-calendar-appt-type">
                                {note.type === 'appointment' ? '预约' : '待办'}
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
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

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
