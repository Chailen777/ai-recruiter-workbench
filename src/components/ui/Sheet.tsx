'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Sheet 宽度，默认 520px */
  width?: number
}

/**
 * 右侧滑出面板 — 替代居中 Dialog，让用户可同时看到列表和表单。
 * 通过 Portal 渲染到 document.body，确保在所有元素最顶层显示。
 * 键盘 Escape 可关闭，外部区域点击可关闭。
 */
export function Sheet({ open, onClose, title, children, footer, width = 520 }: SheetProps) {
  const [mounted, setMounted] = useState(false)

  // SSR 安全：仅在客户端挂载后才用 Portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Escape 关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  // 锁住 body 滚动
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
      {/* 半透明遮罩（不可点击关闭，仅视觉层） */}
      <div
        aria-hidden="true"
        className="sheet-backdrop"
      />

      {/* 右侧滑出面板 */}
      <aside
        aria-label={title}
        aria-modal="true"
        className="sheet-panel"
        role="dialog"
        style={{ '--sheet-width': `${width}px` } as React.CSSProperties}
      >
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button
            aria-label="关闭"
            className="sheet-close"
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 20 20"
              width={20}
              height={20}
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="sheet-body">
          {children}
        </div>

        {footer ? (
          <div className="sheet-foot">
            {footer}
          </div>
        ) : null}
      </aside>
    </>,
    document.body
  )
}
