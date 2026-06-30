'use client'

import { useState, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════
   悬浮卡片笔记按钮 — 每个页面右下角的笔记入口
   点击展开右侧笔记面板 / 桌面笔记
   ═══════════════════════════════════════════════════════ */

export function DeskNoteFab() {
  const [noteCount, setNoteCount] = useState(0)

  // 从 localStorage 获取简单未完成计数（轻量，不发起额外请求）
  const refreshCount = useCallback(() => {
    try {
      const cached = localStorage.getItem('dn-undo-counts')
      if (cached) {
        const { todo = 0, appointment = 0 } = JSON.parse(cached)
        setNoteCount(todo + appointment)
      }
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    refreshCount()
    const onStorage = () => refreshCount()
    window.addEventListener('storage', onStorage)
    // 自定义事件：笔记变更后触发
    window.addEventListener('notes-changed', refreshCount)

    // 跨窗口消息（桌面笔记 → 主平台）
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'notes-changed') refreshCount()
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('notes-changed', refreshCount)
      window.removeEventListener('message', onMessage)
    }
  }, [refreshCount])

  return (
    <button
      aria-label="打开卡片笔记"
      className="dn-fab"
      onClick={() => window.dispatchEvent(new CustomEvent('open-desk-note'))}
      title="卡片笔记"
      type="button"
    >
      <svg
        aria-hidden="true"
        className="dn-fab-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {noteCount > 0 && (
        <span className="dn-fab-badge">{noteCount > 99 ? '99+' : noteCount}</span>
      )}
    </button>
  )
}
