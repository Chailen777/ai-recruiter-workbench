'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { addNote } from '@/app/actions/notes'

export type QuickNoteType = 'note' | 'todo'

interface Props {
  open: boolean
  onClose: () => void
  /** 笔记类型：note = 随笔，todo = 待办 */
  noteType?: QuickNoteType
}

const LABELS = {
  note: { icon: '✦', title: '随笔', placeholder: '输入内容，回车即创建…', btn: '创建随笔' },
  todo: { icon: '☐', title: '待办', placeholder: '输入待办事项，回车即创建…', btn: '创建待办' },
} as const

export function QuickNoteModal({ open, onClose, noteType = 'note' }: Props) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const label = LABELS[noteType]

  // ── 入场动画 ──
  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setContent('')
        textareaRef.current?.focus()
      }))
    }
  }, [open])

  // ── 关闭（带动画） ──
  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setMounted(false)
      setClosing(false)
      onClose()
    }, 180)
  }, [onClose])

  // ── 提交 ──
  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('content', trimmed)
      fd.append('type', noteType)
      fd.append('entityType', 'global')
      fd.append('entityId', '0')
      await addNote(fd)
      // 通知全局刷新笔记列表
      window.dispatchEvent(new CustomEvent('note-created'))
      handleClose()
    } catch {
      // 静默失败，用户可重试
    } finally {
      setSubmitting(false)
    }
  }, [content, submitting, handleClose, noteType])

  // ── 键盘处理 ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }, [handleSubmit, handleClose])

  if (!mounted) return null

  return (
    <div className={`quick-note-backdrop${closing ? ' is-closing' : ''}`}>
      <div className={`quick-note-card${noteType === 'note' ? ' quick-note-card--note' : ''}${closing ? ' is-closing' : ''}`}>
        <div className="quick-note-header">
          <span className="quick-note-label">{label.icon} 快速新建{label.title}</span>
          <button
            type="button"
            className="quick-note-close"
            onClick={handleClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="quick-note-textarea"
          placeholder={label.placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          rows={4}
        />
        <div className="quick-note-footer">
          <span className="quick-note-hint">Enter 创建 · Shift+Enter 换行 · Esc 取消</span>
          <button
            type="button"
            className="quick-note-submit"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            {submitting ? '创建中…' : label.btn}
          </button>
        </div>
      </div>
    </div>
  )
}
