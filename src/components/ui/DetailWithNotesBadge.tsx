'use client'

import { useState, useCallback, cloneElement, isValidElement } from 'react'
import type { ReactElement } from 'react'
import { DetailTabView } from './DetailTabView'
import { NotesCalendar } from './NotesCalendar'

/**
 * 客户端桥接组件：
 * - 管理未完成待办计数（todoCount）
 * - 管理日历筛选日期（filterDate）
 * - 管理笔记搜索关键词（searchTerm）
 * - 通过 cloneElement 将 onTodoCountChange + filterDate + searchTerm 注入笔记面板
 * - 将计数传给 DetailTabView 显示红色徽章
 * - Tab 行右侧渲染日历按钮 + 搜索框
 */
export function DetailWithNotesBadge({
  detailContent,
  notesContent,
  entityType = 'global',
  entityId = 0,
}: {
  detailContent: React.ReactNode
  notesContent: React.ReactNode
  /** 日历限定范围（不传 = 全局） */
  entityType?: string
  entityId?: number
}) {
  const [todoCount, setTodoCount] = useState(0)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleDateSelect = useCallback((dateStr: string | null) => {
    setFilterDate(dateStr)
  }, [])

  const notesWithBadge = isValidElement(notesContent)
    ? cloneElement(notesContent as ReactElement<Record<string, unknown>>, {
        onTodoCountChange: setTodoCount,
        filterDate,
        onClearFilterDate: () => setFilterDate(null),
        searchTerm,
      })
    : notesContent

  // 日历按钮 + 搜索框（渲染在 Tab 行右侧）
  const toolbar = (
    <div className="detail-toolbar">
      <NotesCalendar
        onDateSelect={handleDateSelect}
        selectedDate={filterDate}
        entityType={entityType}
        entityId={entityId}
      />
      <div className="note-search-wrap">
        <svg className="note-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.5"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14"/>
        </svg>
        <input
          type="text"
          className="note-search-input"
          placeholder="搜索笔记…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="搜索笔记"
        />
        {searchTerm && (
          <button
            type="button"
            className="note-search-clear"
            onClick={() => setSearchTerm('')}
            title="清除搜索"
            aria-label="清除搜索"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )

  return (
    <DetailTabView
      detailContent={detailContent}
      notesContent={notesWithBadge}
      todoCount={todoCount}
      extraAction={toolbar}
    />
  )
}
