'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ViewMode = 'calendar' | 'list' | 'timeline' | 'bookmark'

interface ViewOption {
  id: ViewMode
  label: string
  svg: React.ReactNode
}

/* ── 操作项（非视图模式）── */
interface ActionItem {
  id: string
  label: string
  svg: React.ReactNode
  onClick: () => void
  active?: boolean
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

/*
 * 扇形位置：7 项沿圆弧展开，圆心在右下角（FAB 按钮位置）。
 * 角度从 90°（正上方·首页）到 200°（靠近底部·时间轴），等分 6 段。
 * 半径 R = 200px，公式：x = -R*|cos(θ)|, y = -R*sin(θ)
 */
const FAN_ARC_R = 200
const FAN_POSITIONS = Array.from({ length: 7 }, (_, i) => {
  const angle = 90 + (200 - 90) * (i / 6) // 90° → 200°，均匀分布
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.round(-FAN_ARC_R * Math.abs(Math.cos(rad))),
    y: Math.round(-FAN_ARC_R * Math.sin(rad)),
  }
})

export function NoteViewFab({
  viewMode,
  setViewMode,
  bookmarkCount,
  onHome,
  onSearch,
  onCompose,
  searchActive = false,
  composeActive = false,
}: {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  bookmarkCount: number
  onHome?: () => void
  onSearch?: () => void
  onCompose?: () => void
  searchActive?: boolean
  composeActive?: boolean
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

  const handleSelectView = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setExpanded(false)
  }, [setViewMode])

  const handleAction = useCallback((action: () => void) => {
    action()
    setExpanded(false)
  }, [])

  const currentOption = VIEW_OPTIONS.find((o) => o.id === viewMode) || VIEW_OPTIONS[2]
  const otherViewOptions = VIEW_OPTIONS.filter((o) => o.id !== viewMode)

  /* 构建操作项列表 */
  const actionItems: ActionItem[] = [
    {
      id: 'home',
      label: '首页',
      svg: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10L10 3L17 10" />
          <path d="M5 9V16C5 16.5523 5.44772 17 6 17H14C14.5523 17 15 16.5523 15 16V9" />
          <path d="M8 17V12H12V17" />
        </svg>
      ),
      onClick: () => onHome?.(),
    },
    {
      id: 'search',
      label: '搜索',
      svg: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="9" cy="9" r="5"/>
          <line x1="13" y1="13" x2="18" y2="18"/>
        </svg>
      ),
      onClick: () => onSearch?.(),
      active: searchActive,
    },
    {
      id: 'compose',
      label: '笔记',
      svg: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2L18 6L8 16L4 17L5 13L14 2Z" />
          <path d="M13 3L17 7" />
        </svg>
      ),
      onClick: () => onCompose?.(),
      active: composeActive,
    },
  ]

  /* 合并：操作项 + 视图项 */
  const allFanItems = [
    ...actionItems,
    ...otherViewOptions.map((o) => ({
      id: o.id,
      label: o.label,
      svg: o.svg,
      onClick: () => handleSelectView(o.id),
      isView: true,
    })),
  ]

  return createPortal(
    <div
      className={`note-view-fab${expanded ? ' is-expanded' : ''}${awake ? ' is-awake' : ''}`}
      ref={fabRef}
      onMouseEnter={wakeUp}
      onTouchStart={wakeUp}
    >
      {/* 扇形菜单项 */}
      <div className="note-view-fab-menu">
        {allFanItems.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={`note-view-fab-option${'active' in item && item.active ? ' is-action-active' : ''}`}
            style={{
              '--fx': `${FAN_POSITIONS[i].x}px`,
              '--fy': `${FAN_POSITIONS[i].y}px`,
              transitionDelay: expanded
                ? `${0.04 + i * 0.04}s`
                : `${0.08 - i * 0.01}s`,
            } as React.CSSProperties}
            onClick={() => handleAction(item.onClick)}
          >
            <span className="note-view-fab-opt-icon">{item.svg}</span>
            <span className="note-view-fab-opt-label">{item.label}</span>
            {item.id === 'bookmark' && bookmarkCount > 0 && (
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
    </div>,
    document.body
  )
}
