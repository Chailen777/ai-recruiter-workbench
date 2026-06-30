'use client'

import { createContext, ReactNode, useCallback, useContext, useState, useRef } from 'react'

// ── Types ──

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number // ms, default 4000
}

interface ToastContextValue {
  toasts: ToastMessage[]
  toast: (msg: Omit<ToastMessage, 'id'>) => string
  dismiss: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

// ── Context ──

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// ── Helpers ──

let counter = 0
function uid(): string {
  counter += 1
  return `toast-${counter}-${Date.now()}`
}

const DEFAULT_DURATION = 4000

// ── Provider ──

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (msg: Omit<ToastMessage, 'id'>): string => {
      const id = uid()
      const entry: ToastMessage = { ...msg, id }

      setToasts((prev) => {
        // Limit to 5 visible
        const next = [...prev, entry]
        if (next.length > 5) {
          const removed = next.shift()!
          const timer = timersRef.current.get(removed.id)
          if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })

      const duration = msg.duration ?? DEFAULT_DURATION
      const timer = setTimeout(() => {
        dismiss(id)
      }, duration)
      timersRef.current.set(id, timer)

      return id
    },
    [dismiss]
  )

  const success = useCallback((title: string, description?: string) => toast({ type: 'success', title, description }), [toast])
  const error = useCallback((title: string, description?: string) => toast({ type: 'error', title, description }), [toast])
  const warning = useCallback((title: string, description?: string) => toast({ type: 'warning', title, description }), [toast])
  const info = useCallback((title: string, description?: string) => toast({ type: 'info', title, description }), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  )
}

// ── Hook ──

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
