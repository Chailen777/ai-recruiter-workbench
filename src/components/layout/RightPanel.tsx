'use client'

import { useCallback, useEffect, useState, useRef } from 'react'

import { useMounted } from '@/hooks/useMounted'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { NoteViewFab } from '@/components/layout/NoteViewFab'
import { getAllNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

// ── Note type for NotePanel ──

function toNoteItem(n: Record<string, unknown>): NoteItem {
  return {
    id: n.id as number,
    content: n.content as string,
    type: n.type as string,
    pinned: Boolean(n.pinned),
    bookmarked: Boolean(n.bookmarked),
    done: Boolean(n.done),
    person: (n.person as string) ?? null,
    entityType: n.entityType as string,
    entityId: n.entityId as number,
    entityName: (n.entityName ?? null) as string | null,
    createdAt: new Date(n.createdAt as string).toISOString(),
    appointmentTime: (n.appointmentTime as string) ?? null,
    appointmentLocation: (n.appointmentLocation as string) ?? null,
    appointmentType: (n.appointmentType as string) ?? null,
    appointmentPerson: (n.appointmentPerson as string) ?? null,
    articleType: (n.articleType as string) ?? null,
    articlePerson: (n.articlePerson as string) ?? null,
    logPerson: (n.logPerson as string) ?? null,
    scheduledDate: (n.scheduledDate as string) ?? null,
    repeatType: (n.repeatType as string) ?? null,
    repeatFrequency: (n.repeatFrequency as number) ?? null,
    repeatEndDate: (n.repeatEndDate as string) ?? null,
    repeatGroupId: (n.repeatGroupId as string) ?? null,
    repeatPerson: (n.repeatPerson as string) ?? null,
    repeatCategory: (n.repeatCategory as string) ?? null,
    repeatWeekdays: (n.repeatWeekdays as string) ?? null,
    repeatCustomNum: (n.repeatCustomNum as number) ?? null,
  }
}

// ── Collapsed toggle icon ──

function ToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 20 20"
      style={{ width: 18, height: 18 }}
    >
      <path d={collapsed ? 'M13 5l-6 6 6 6' : 'M7 5l6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Main component ──

const STORAGE_KEY = 'ai-recruiter-right-panel-collapsed'

export function RightPanel() {
  const mounted = useMounted()

  // ── 日历筛选 ──
  const [filterDate, setFilterDate] = useState<string | null>(null)

  // ── 搜索（带 debounce）──
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [searchInputValue, setSearchInputValue] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleExpandSearch = useCallback(() => {
    setSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])

  const handleCollapseSearch = useCallback(() => {
    // 有输入内容时不收起
    if (searchInputValue) return
    setSearchExpanded(false)
  }, [searchInputValue])

  // ── 滚动驱动的 header 显隐 + 15s 自动隐藏 ──
  const bodyRef = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const headerHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showHeaderWithTimer = useCallback(() => {
    setHeaderVisible(true)
    if (headerHideTimerRef.current) clearTimeout(headerHideTimerRef.current)
    headerHideTimerRef.current = setTimeout(() => {
      // 只在非顶部时隐藏，顶部始终显示（同时检查 panel body 和页面滚动）
      const bodyScrollTop = bodyRef.current?.scrollTop ?? 0
      const pageScrollY = window.scrollY ?? 0
      if (bodyScrollTop > 10 || pageScrollY > 10) {
        setHeaderVisible(false)
      }
    }, 15000)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value)
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current)
    }
    searchDebounceTimer.current = setTimeout(() => {
      setGlobalSearchTerm(value)
    }, 200)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchInputValue('')
    setGlobalSearchTerm('')
    setSearchExpanded(false)
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current)
    }
  }, [])

  // ── 视图模式（四个互斥：日历 / 列表 / 时间轴 / 收藏）──
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'timeline' | 'bookmark'>('list')

  // ── Collapse state (persisted to localStorage) ──
  const [collapsed, setCollapsed] = useState(true) // 默认折叠
  // 从 localStorage 读取初始折叠状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      // 首次访问保持折叠，避免手机端加载后被全屏笔记面板遮住
      setCollapsed(saved === null ? true : saved === 'true')
    } catch { /* localStorage 不可用 */ }
  }, [])

  // 监听 DeskNoteFab 点击事件，展开面板
  useEffect(() => {
    const handler = () => {
      setCollapsed((v) => {
        const next = !v
        try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* noop */ }
        return next
      })
    }
    window.addEventListener('open-desk-note', handler)
    return () => window.removeEventListener('open-desk-note', handler)
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* noop */ }
      return next
    })
  }, [])

  // ── 滚动时显示 header + 启动 15s 自动隐藏计时 ──
  useEffect(() => {
    const el = bodyRef.current
    if (!el || collapsed) return

    const handler = () => showHeaderWithTimer()
    // 桌面端：panel body 滚动；移动端：页面整体滚动；同时监听两者以兼容所有场景
    el.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('scroll', handler, { passive: true })

    // 首次展开面板时启动计时
    showHeaderWithTimer()

    return () => {
      el.removeEventListener('scroll', handler)
      window.removeEventListener('scroll', handler)
      if (headerHideTimerRef.current) clearTimeout(headerHideTimerRef.current)
    }
  }, [collapsed, showHeaderWithTimer])

  // ── Global notes (loaded client-side) ──
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [notesLoaded, setNotesLoaded] = useState(false)

  const { counter: refreshCounter } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getAllNotes().then((rows) => {
      setNotes(rows.map(toNoteItem))
      setNotesLoaded(true)
    }).catch(() => setNotesLoaded(true))
  }, [])

  useEffect(() => {
    // 仅在面板展开后才加载笔记数据（减少首屏 API 请求）
    if (!collapsed || refreshCounter > 0) {
      loadNotes()
    }
  }, [collapsed, notesLoaded, loadNotes, refreshCounter])

  // 收藏计数（基于已加载的笔记数据）
  const bookmarkCount = notes.filter((n) => n.bookmarked).length

  if (!mounted) return null

  return (
    <aside
      aria-label="全局备忘录面板"
      className={`app-right-panel${collapsed ? ' is-collapsed' : ''}${headerVisible ? '' : ' is-header-hidden'}`}
      data-collapsed={collapsed ? 'true' : 'false'}
      id="global-note-panel"
    >
      {/* ── 折叠切换按钮 + 标题（始终可见） ── */}
      <div className="app-right-panel-header">
        <button
          aria-label={collapsed ? '展开备忘录面板' : '收起备忘录面板'}
          className="app-right-panel-toggle"
          onClick={toggleCollapse}
          title={collapsed ? '展开备忘录面板' : '收起备忘录面板'}
          type="button"
        >
          <ToggleIcon collapsed={collapsed} />
        </button>
        {!collapsed && (
          <span className="app-right-panel-title">卡片笔记</span>
        )}
        {collapsed ? null : (
          <>
            {/* 搜索框 — 点击展开，失焦无内容时收起 */}
            <div className={`note-header-search${searchExpanded ? ' is-expanded' : ''}`}>
              {searchExpanded ? (
                <>
                  <svg className="note-header-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="9" cy="9" r="5"/>
                    <line x1="13" y1="13" x2="18" y2="18"/>
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="note-header-search-input"
                    placeholder="搜索笔记..."
                    value={searchInputValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onBlur={handleCollapseSearch}
                    aria-label="搜索笔记"
                  />
                  {searchInputValue && (
                    <button
                      type="button"
                      className="note-header-search-clear"
                      onClick={handleClearSearch}
                      title="清除搜索"
                      aria-label="清除搜索"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <line x1="5" y1="5" x2="15" y2="15"/>
                        <line x1="15" y1="5" x2="5" y2="15"/>
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="note-header-search-toggle"
                  onClick={handleExpandSearch}
                  title="搜索笔记"
                  aria-label="搜索笔记"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="9" cy="9" r="5"/>
                    <line x1="13" y1="13" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {/* 视图切换：📌收藏 / 📅日历 / 📋列表 / ⏱时间轴 */}
            <div className="notes-view-toggle">
              <button
                type="button"
                className={`notes-icon-btn ${viewMode === 'bookmark' ? 'is-active' : ''}`}
                onClick={() => { handleClearSearch(); setViewMode('bookmark') }}
                title="查看收藏"
                aria-label="查看收藏"
                style={{ position: 'relative' }}
              >
                📌
                {bookmarkCount > 0 && (
                  <span className="notes-icon-badge">{bookmarkCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`notes-icon-btn ${viewMode === 'calendar' ? 'is-active' : ''}`}
                onClick={() => { handleClearSearch(); setViewMode('calendar') }}
                title="日历视图"
                aria-label="日历视图"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="16" height="15" rx="2" />
                  <line x1="2" y1="8" x2="18" y2="8" />
                  <line x1="7" y1="1" x2="7" y2="5" />
                  <line x1="13" y1="1" x2="13" y2="5" />
                </svg>
              </button>
              <button
                type="button"
                className={`notes-icon-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                onClick={() => { handleClearSearch(); setViewMode('list') }}
                title="列表视图"
                aria-label="列表视图"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="5" x2="19" y2="5"/>
                  <line x1="5" y1="10" x2="19" y2="10"/>
                  <line x1="5" y1="15" x2="19" y2="15"/>
                  <circle cx="2" cy="5" r="1.2" fill="currentColor" stroke="none"/>
                  <circle cx="2" cy="10" r="1.2" fill="currentColor" stroke="none"/>
                  <circle cx="2" cy="15" r="1.2" fill="currentColor" stroke="none"/>
                </svg>
              </button>
              <button
                type="button"
                className={`notes-icon-btn ${viewMode === 'timeline' ? 'is-active' : ''}`}
                onClick={() => { handleClearSearch(); setViewMode('timeline') }}
                title="时间轴视图"
                aria-label="时间轴视图"
              >
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
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 展开时显示内容 ── */}
      {!collapsed && (
        <div className="app-right-panel-body" ref={bodyRef}>
          {/* 全局备忘录 */}
          <ErrorBoundary>
          <NotePanel
            entityType="global"
            entityId={0}
            notes={notes}
            onNotesChanged={loadNotes}
            filterDate={filterDate}
            onClearFilterDate={() => setFilterDate(null)}
            searchTerm={globalSearchTerm}
            loading={!notesLoaded}
            viewMode={viewMode}
          />
          </ErrorBoundary>
          {/* 手机端：右下角视图切换浮动按钮 */}
          <NoteViewFab
            viewMode={viewMode}
            setViewMode={(mode) => { handleClearSearch(); setViewMode(mode) }}
            bookmarkCount={bookmarkCount}
          />
        </div>
      )}
    </aside>
  )
}
