'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// ── Context ──

type NotesRefreshContextValue = {
  /** 每次笔记变动后 +1，RightPanel 监听此值触发重载 */
  counter: number
  /** 任意笔记面板增删改后调用，通知全局刷新 */
  triggerRefresh: () => void
}

const NotesRefreshContext = createContext<NotesRefreshContextValue>({
  counter: 0,
  triggerRefresh: () => {},
})

// ── Hook ──

export function useNotesRefresh() {
  return useContext(NotesRefreshContext)
}

// ── Provider ──

export function NotesRefreshProvider({ children }: { children: ReactNode }) {
  const [counter, setCounter] = useState(0)

  const triggerRefresh = useCallback(() => {
    setCounter((c) => c + 1)
  }, [])

  // 监听快捷建笔记创建事件，自动触发刷新
  useEffect(() => {
    const handler = () => triggerRefresh()
    window.addEventListener('note-created', handler)
    return () => window.removeEventListener('note-created', handler)
  }, [triggerRefresh])

  return (
    <NotesRefreshContext.Provider value={{ counter, triggerRefresh }}>
      {children}
    </NotesRefreshContext.Provider>
  )
}
