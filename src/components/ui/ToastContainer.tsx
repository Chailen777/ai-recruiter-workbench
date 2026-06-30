'use client'

import { memo, useEffect, useState, useCallback } from 'react'

import { ToastMessage, useToast } from '@/components/providers/ToastProvider'

// ── Icon by type ──

const IconPaths: Record<ToastMessage['type'], string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v4m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.5 20h19a1 1 0 001.29-1.54l-8.6-14.86a1 1 0 00-1.72 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
}

const colorByType: Record<ToastMessage['type'], string> = {
  success: 'var(--ds-color-success, #10b981)',
  error: 'var(--ds-color-danger, #ef4444)',
  warning: 'var(--ds-color-warning, #f59e0b)',
  info: 'var(--ds-color-primary, #3b82f6)',
}

// ── Single toast ──

const ToastItem = memo(function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Enter animation on mount
  useEffect(() => {
    const r = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(r)
  }, [])

  const handleDismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 260)
  }, [onDismiss, toast.id])

  return (
    <div
      aria-live="polite"
      className={`toast-item toast-${toast.type}${visible ? ' toast-enter' : ''}${exiting ? ' toast-exit' : ''}`}
      role="alert"
      style={{ '--toast-color': colorByType[toast.type] } as React.CSSProperties}
    >
      <div className="toast-icon">
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d={IconPaths[toast.type]} />
        </svg>
      </div>
      <div className="toast-body">
        <strong className="toast-title">{toast.title}</strong>
        {toast.description ? <p className="toast-desc">{toast.description}</p> : null}
      </div>
      <button
        aria-label="关闭通知"
        className="toast-close"
        onClick={handleDismiss}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
})

// ── Container ──

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div aria-label="通知" className="toast-container" role="region">
      {toasts.map((t) => (
        <ToastItem key={t.id} onDismiss={dismiss} toast={t} />
      ))}
    </div>
  )
}
