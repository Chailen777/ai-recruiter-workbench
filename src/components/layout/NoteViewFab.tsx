'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type ViewMode = 'calendar' | 'list' | 'timeline' | 'bookmark'

interface ViewOption {
  id: ViewMode
  label: string
  svg: React.ReactNode
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: 'bookmark',
    label: '收藏',
    svg: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V18L12 14L5 18V4Z" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: '日历',
    svg: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="16" height="15" rx="2" />
        <line x1="2" y1="8" x2="18" y2="8" />
        <line x1="7" y1="1" x2="7" y2="5" />
        <line x1="13" y1="1" x2="13" y2="5" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: '列表',
    svg: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="5" x2="19" y2="5"/>
        <line x1="5" y1="10" x2="19" y2="10"/>
        <line x1="5" y1="15" x2="19" y2="15"/>
        <circle cx="2" cy="5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="2" cy="10" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="2" cy="15" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'timeline',
    label: '时间轴',
    svg: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="3" cy="4" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="6" y1="4" x2="19" y2="4"/>
        <circle cx="3" cy="10" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="6" y1="10" x2="19" y2="10"/>
        <circle cx="3" cy="16" r="1.5" fill="currentColor" stroke="none"/>
        <line x1="6" y1="16" x2="19" y2="16"/>
        <line x1="3" y1="5.5" x2="3" y2="8.5" strokeWidth="1.2"/>
        <line x1="3" y1="11.5" x2="3" y2="14.5" strokeWidth="1.2"/>
      </svg>
    ),
  },
]

/* 扇形位置：从右下角向左上方向展开的弧线 */
const FAN_POSITIONS = [
  { x: -135, y: -105 },  // 收藏
  { x: -150, y: -55 },   // 日历
  { x: -150, y:   0 },   // 列表
  { x: -135, y:  55 },   // 时间轴
]

export function NoteViewFab({
  viewMode,
  setViewMode,
  bookmarkCount,
}: {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  bookmarkCount: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [awake, setAwake] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fabRef = useRef<HTMLDivElement>(null)

  /* 唤醒：touch / hover 触发 */
  const wakeUp = useCallback(() => {
    setAwake(true)
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }, [])

  /* 3 秒无操作后回到半透明 */
  const backToIdle = useCallback(() => {
    if (expanded) return
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setAwake(false), 3000)
  }, [expanded])

  useEffect(() => {
    if (expanded) {
      setAwake(true)
      return
    }
    backToIdle()
  }, [expanded, backToIdle])

  /* 点击外部关闭 */
  const handleOutsideClick = useCallback((e: MouseEvent | TouchEvent) => {
    if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
      setExpanded(false)
    }
  }, [])

  useEffect(() => {
    if (!expanded) return
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [expanded, handleOutsideClick])

  const handleSelect = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setExpanded(false)
  }, [setViewMode])

  const currentOption = VIEW_OPTIONS.find((o) => o.id === viewMode) || VIEW_OPTIONS[2]
  const otherOptions = VIEW_OPTIONS.filter((o) => o.id !== viewMode)

  return (
    <div
      className={`note-view-fab${expanded ? ' is-expanded' : ''}${awake ? ' is-awake' : ''}`}
      ref={fabRef}
      onMouseEnter={wakeUp}
      onTouchStart={wakeUp}
    >
      {/* 扇形菜单项 */}
      <div className="note-view-fab-menu">
        {otherOptions.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            className="note-view-fab-option"
            style={{
              '--fx': `${FAN_POSITIONS[i].x}px`,
              '--fy': `${FAN_POSITIONS[i].y}px`,
              transitionDelay: expanded
                ? `${0.04 + i * 0.05}s`
                : `${0.06 - i * 0.015}s`,
            } as React.CSSProperties}
            onClick={() => handleSelect(opt.id)}
          >
            <span className="note-view-fab-opt-icon">{opt.svg}</span>
            <span className="note-view-fab-opt-label">{opt.label}</span>
            {opt.id === 'bookmark' && bookmarkCount > 0 && (
              <span className="note-view-fab-badge">{bookmarkCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 主触发按钮 */}
      <button
        type="button"
        className="note-view-fab-main"
        onClick={() => setExpanded((v) => !v)}
        aria-label={`切换视图，当前${currentOption.label}`}
      >
        {currentOption.svg}
        {viewMode === 'bookmark' && bookmarkCount > 0 && (
          <span className="note-view-fab-main-badge">{bookmarkCount}</span>
        )}
      </button>
    </div>
  )
}
