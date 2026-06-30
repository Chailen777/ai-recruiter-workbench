'use client'

import { useCallback, useRef, useState } from 'react'
import type { AttachmentInfo } from '@/lib/attachment-utils'

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.md'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string, name: string): string {
  if (type.includes('pdf') || name.endsWith('.pdf')) return '📄'
  if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return '📝'
  if (type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return '📊'
  if (type.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return '📈'
  if (type.includes('image')) return '🖼'
  if (type.includes('text')) return '📃'
  return '📎'
}

type StagedFile = { file: File; id: string }

export function FileAttachments({
  existing,
  prefix = 'attachments',
}: {
  existing?: AttachmentInfo[]
  prefix?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kept, setKept] = useState<AttachmentInfo[]>(existing ?? [])
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [deleted, setDeleted] = useState<string[]>([])

  // Update the real file input's FileList using DataTransfer
  const syncFileInput = useCallback((fileList: StagedFile[]) => {
    const dt = new DataTransfer()
    fileList.forEach((sf) => dt.items.add(sf.file))
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files
    }
  }, [])

  const removeExisting = (att: AttachmentInfo) => {
    setKept((prev) => prev.filter((a) => a.path !== att.path))
    setDeleted((prev) => [...prev, att.path])
  }

  const restoreExisting = (att: AttachmentInfo) => {
    setDeleted((prev) => prev.filter((p) => p !== att.path))
    setKept((prev) => [...prev, att])
  }

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const incoming: StagedFile[] = []
    for (let i = 0; i < fileList.length; i++) {
      incoming.push({ file: fileList[i], id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}` })
    }
    setStaged((prev) => {
      const updated = [...prev, ...incoming]
      syncFileInput(updated)
      return updated
    })
  }

  const removeStaged = (id: string) => {
    setStaged((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      syncFileInput(updated)
      return updated
    })
  }

  const openPreview = (path: string) => {
    window.open(path, '_blank')
  }

  return (
    <div className="span-full file-attachments">
      <span className="ui-form-label">附件</span>

      {/* Keep existing attachments */}
      <input name={`${prefix}Existing`} type="hidden" value={JSON.stringify(kept)} />
      {/* Mark deleted attachments */}
      {deleted.map((p) => (
        <input key={p} name={`${prefix}Deleted`} type="hidden" value={p} />
      ))}

      <div className="file-attachments-list">
        {/* Kept existing files */}
        {kept.map((att) => (
          <div className="file-attachment-chip" key={att.path}>
            <span
              className="file-attachment-link"
              onClick={() => openPreview(att.path)}
              title="点击预览"
            >
              <span className="file-attachment-icon">{fileIcon(att.type, att.name)}</span>
              <span className="file-attachment-name">{att.name}</span>
              <span className="file-attachment-size">{formatSize(att.size)}</span>
            </span>
            <button
              className="file-attachment-delete"
              onClick={() => removeExisting(att)}
              title="删除此附件"
              type="button"
            >
              ×
            </button>
          </div>
        ))}

        {/* Deleted files (can restore) */}
        {deleted.map((path) => {
          const orig = existing?.find((a) => a.path === path)
          if (!orig) return null
          return (
            <div className="file-attachment-chip is-deleted" key={path}>
              <span className="file-attachment-link">
                <span className="file-attachment-icon">🗑</span>
                <span className="file-attachment-name">{orig.name}</span>
                <span className="file-attachment-size">已删除</span>
              </span>
              <button
                className="file-attachment-restore"
                onClick={() => restoreExisting(orig)}
                title="恢复"
                type="button"
              >
                ↩
              </button>
            </div>
          )
        })}

        {/* Staged new files */}
        {staged.map((sf) => (
          <div className="file-attachment-chip is-new" key={sf.id}>
            <span className="file-attachment-link">
              <span className="file-attachment-icon">{fileIcon(sf.file.type, sf.file.name)}</span>
              <span className="file-attachment-name">{sf.file.name}</span>
              <span className="file-attachment-size">{formatSize(sf.file.size)}</span>
              <span className="file-attachment-tag">待上传</span>
            </span>
            <button
              className="file-attachment-delete"
              onClick={() => removeStaged(sf.id)}
              title="移除"
              type="button"
            >
              ×
            </button>
          </div>
        ))}

        {kept.length === 0 && deleted.length === 0 && staged.length === 0 && (
          <span className="file-attachments-empty">暂无附件</span>
        )}
      </div>

      <label className="file-attachments-add">
        <input
          accept={ACCEPT}
          className="file-upload-input"
          multiple
          name={`${prefix}New`}
          onChange={(e) => addFiles(e.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <span className="file-upload-button">+ 添加附件</span>
        <span className="file-upload-hint">支持 PDF、Word、PPT、Excel、图片、TXT 等格式</span>
      </label>
    </div>
  )
}
