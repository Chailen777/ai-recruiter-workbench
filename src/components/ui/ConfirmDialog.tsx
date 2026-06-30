'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
}

/**
 * 通用确认弹窗 — 用于删除等不可逆操作前的二次确认。
 * 通过 Portal 渲染到 document.body，确保在最顶层显示。
 * 键盘 Escape 取消，Enter 确认。
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onConfirm()
    },
    [onClose, onConfirm]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="confirm-backdrop"
      />
      <div
        aria-label={title}
        aria-modal="true"
        className="confirm-panel"
        role="alertdialog"
      >
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onClose} type="button">
            {cancelLabel}
          </button>
          <button
            className={`confirm-btn ${variant}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
