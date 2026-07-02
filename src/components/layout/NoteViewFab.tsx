'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ViewMode = 'calendar' | 'list' | 'timeline' | 'bookmark'

/* ── 图标 ── */
const PEN_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* 笔尖填充 + 描边，双保险确保可见 */}
    <path d="M14 2L18 6L8 16L4 17L5 13L14 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M13 3L17 7" stroke="currentColor" strokeWidth="1.8" fill="none"/>
  </svg>
)

const HOME_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10L10 3L17 10" />
    <path d="M5 9V16C5 16.5523 5.44772 17 6 17H14C14.5523 17 15 16.5523 15 16V9" />
    <path d="M8 17V12H12V17" />
  </svg>
)

const SEARCH_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="9" cy="9" r="5"/>
    <line x1="13" y1="13" x2="18" y2="18"/>
  </svg>
)

const BOOKMARK_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V18L12 14L5 18V4Z" />
  </svg>
)

const CALENDAR_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="16" height="15" rx="2" />
    <line x1="2" y1="8" x2="18" y2="8" />
    <line x1="7" y1="1" x2="7" y2="5" />
    <line x1="13" y1="1" x2="13" y2="5" />
  </svg>
)

const LIST_ICON = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="5" x2="19" y2="5"/>
    <line x1="5" y1="10" x2="19" y2="10"/>
    <line x1="5" y1="15" x2="19" y2="15"/>
    <circle cx="2" cy="5" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="2" cy="10" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="2" cy="15" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)

const TIMELINE_ICON = (
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
)

/* ── 音效：短促 "咔" 声 ── */
let audioCtx: AudioContext | null = null
function playTick() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = 1800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.04)
  } catch { /* noop */ }
}

/* ── 触觉反馈 ── */
function vibrate(ms: number = 8) {
  try { if (navigator.vibrate) navigator.vibrate(ms) } catch { /* noop */ }
}

/* ── 扇形位置计算 ── */
const FAN_ARC_R = 200
const ANGLE_START = 90
const ANGLE_END = 200
const ITEM_COUNT = 7
const FAN_ANGLES = Array.from({ length: ITEM_COUNT }, (_, i) =>
  ANGLE_START + (ANGLE_END - ANGLE_START) * (i / (ITEM_COUNT - 1))
)
const FAN_POSITIONS = FAN_ANGLES.map((angle) => {
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.round(-FAN_ARC_R * Math.abs(Math.cos(rad))),
    y: Math.round(-FAN_ARC_R * Math.sin(rad)),
  }
})

const LONG_PRESS_MS = 400

interface FanItem {
  id: string
  label: string
  svg: React.ReactNode
  onClick: () => void
  active?: boolean
  isCurrent?: boolean
}

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
  const [radialActive, setRadialActive] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [awake, setAwake] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fabRef = useRef<HTMLDivElement>(null)
  const mainBtnRef = useRef<HTMLButtonElement>(null)
  const activeIndexRef = useRef(-1)
  const radialActiveRef = useRef(false)
  const pointerDownRef = useRef(false)

  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  useEffect(() => { radialActiveRef.current = radialActive }, [radialActive])

  /* 唤醒 */
  const wakeUp = useCallback(() => {
    setAwake(true)
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }, [])

  const backToIdle = useCallback(() => {
    if (radialActive) return
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setAwake(false), 3000)
  }, [radialActive])

  useEffect(() => {
    if (radialActive) {
      setAwake(true)
      return
    }
    backToIdle()
  }, [radialActive, backToIdle])

  /* 构建菜单项（始终7项，固定顺序） */
  const allFanItems: FanItem[] = [
    { id: 'home', label: '首页', svg: HOME_ICON, onClick: () => onHome?.() },
    { id: 'search', label: '搜索', svg: SEARCH_ICON, onClick: () => onSearch?.(), active: searchActive },
    { id: 'compose', label: '笔记', svg: PEN_ICON, onClick: () => onCompose?.(), active: composeActive },
    { id: 'bookmark', label: '收藏', svg: BOOKMARK_ICON, onClick: () => setViewMode('bookmark'), isCurrent: viewMode === 'bookmark' },
    { id: 'calendar', label: '日历', svg: CALENDAR_ICON, onClick: () => setViewMode('calendar'), isCurrent: viewMode === 'calendar' },
    { id: 'list', label: '列表', svg: LIST_ICON, onClick: () => setViewMode('list'), isCurrent: viewMode === 'list' },
    { id: 'timeline', label: '时间轴', svg: TIMELINE_ICON, onClick: () => setViewMode('timeline'), isCurrent: viewMode === 'timeline' },
  ]

  /* 计算触摸角度 → 菜单项索引 */
  const getAngleFromPoint = useCallback((clientX: number, clientY: number): number => {
    if (!mainBtnRef.current) return -1
    const rect = mainBtnRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    // 距离太近，不判定
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 30) return activeIndexRef.current
    // angle: 0° = up, 90° = left, 110° = below-left
    const angleFromUp = Math.atan2(-dx, -dy) * 180 / Math.PI
    return 90 + angleFromUp
  }, [])

  const angleToIndex = useCallback((angle: number): number => {
    if (angle < ANGLE_START - 15 || angle > ANGLE_END + 15) return -1
    const clamped = Math.max(ANGLE_START, Math.min(ANGLE_END, angle))
    let nearest = 0
    let minDist = Infinity
    for (let i = 0; i < FAN_ANGLES.length; i++) {
      const dist = Math.abs(FAN_ANGLES[i] - clamped)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }
    return nearest
  }, [])

  /* ── 指针事件（统一处理鼠标+触摸） ── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    pointerDownRef.current = true
    wakeUp()

    const startX = e.clientX
    const startY = e.clientY

    longPressTimer.current = setTimeout(() => {
      setRadialActive(true)
      vibrate(15)
      const angle = getAngleFromPoint(startX, startY)
      const idx = angleToIndex(angle)
      if (idx >= 0) {
        setActiveIndex(idx)
        playTick()
      }
    }, LONG_PRESS_MS)
  }, [wakeUp, getAngleFromPoint, angleToIndex])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDownRef.current) return
    if (!radialActiveRef.current) return

    const angle = getAngleFromPoint(e.clientX, e.clientY)
    const idx = angleToIndex(angle)
    if (idx !== activeIndexRef.current) {
      setActiveIndex(idx)
      if (idx >= 0) {
        playTick()
        vibrate(8)
      }
    }
  }, [getAngleFromPoint, angleToIndex])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointerDownRef.current = false
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (radialActiveRef.current) {
      const idx = activeIndexRef.current
      setRadialActive(false)
      setActiveIndex(-1)
      if (idx >= 0 && allFanItems[idx]) {
        allFanItems[idx].onClick()
      }
    } else {
      // 短按 → 弹出笔记输入框
      onCompose?.()
    }
  }, [onCompose, allFanItems])

  const handlePointerCancel = useCallback(() => {
    pointerDownRef.current = false
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setRadialActive(false)
    setActiveIndex(-1)
  }, [])

  /* 模糊级别：根据高亮项变化 */
  const blurLevel = radialActive
    ? (activeIndex >= 0 ? Math.max(2, 14 - activeIndex * 1.8) : 14)
    : 0

  return createPortal(
    <div
      className={`note-view-fab${radialActive ? ' is-radial' : ''}${awake ? ' is-awake' : ''}`}
      ref={fabRef}
      onMouseEnter={wakeUp}
      onTouchStart={wakeUp}
    >
      {/* 背景模糊遮罩 */}
      {radialActive && (
        <div
          className="note-view-fab-radial-overlay"
          style={{ backdropFilter: `blur(${blurLevel}px)`, WebkitBackdropFilter: `blur(${blurLevel}px)` }}
        />
      )}

      {/* 扇形菜单项 */}
      <div className="note-view-fab-menu" style={{ zIndex: 10090 }}>
        {allFanItems.map((item, i) => {
          const pos = FAN_POSITIONS[i]
          const isActive = i === activeIndex
          const isVisible = radialActive
          return (
            <button
              key={item.id}
              type="button"
              className={`note-view-fab-option${isActive ? ' is-radial-active' : ''}${item.active ? ' is-action-active' : ''}${item.isCurrent ? ' is-current' : ''}`}
              style={{
                transform: isVisible
                  ? `translate(${pos.x}px, ${pos.y}px) scale(1)`
                  : 'translate(0, 0) scale(0.35)',
                opacity: isVisible ? 1 : 0,
                transition: `
                  transform ${isVisible ? '0.32s' : '0.18s'} cubic-bezier(.16,1,.3,1)
                  ${isVisible ? `${Math.min(i * 28, 180)}ms` : `${Math.max(0, (5 - i) * 18)}ms`},
                  opacity ${isVisible ? '0.25s' : '0.12s'} ease
                  ${isVisible ? `${Math.min(i * 28, 180)}ms` : '0ms'}
                `,
                pointerEvents: isVisible ? 'auto' : 'none',
              } as React.CSSProperties}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                item.onClick()
                setRadialActive(false)
                setActiveIndex(-1)
              }}
            >
              <span className="note-view-fab-opt-icon">{item.svg}</span>
              <span className="note-view-fab-opt-label">{item.label}</span>
              {item.id === 'bookmark' && bookmarkCount > 0 && (
                <span className="note-view-fab-badge">{bookmarkCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 主触发按钮 — 笔图标 */}
      <button
        type="button"
        ref={mainBtnRef}
        className="note-view-fab-main"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={(e) => {
          if (!pointerDownRef.current) return
          handlePointerMove(e)
        }}
        aria-label="笔记"
      >
        {PEN_ICON}
        {composeActive && (
          <span className="note-view-fab-main-dot" />
        )}
      </button>
    </div>,
    document.body
  )
}
