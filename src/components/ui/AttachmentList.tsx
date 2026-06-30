import { parseAttachments, type AttachmentInfo } from '@/lib/attachment-utils'

function fileIcon(att: AttachmentInfo): string {
  const t = att.type
  const n = att.name.toLowerCase()
  if (t.includes('pdf') || n.endsWith('.pdf')) return '📄'
  if (t.includes('word') || n.endsWith('.doc') || n.endsWith('.docx')) return '📝'
  if (t.includes('presentation') || n.endsWith('.ppt') || n.endsWith('.pptx')) return '📊'
  if (t.includes('sheet') || n.endsWith('.xls') || n.endsWith('.xlsx')) return '📈'
  if (t.includes('image')) return '🖼'
  if (t.includes('text') || n.endsWith('.txt') || n.endsWith('.md')) return '📃'
  return '📎'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentList({ attachments }: { attachments: string | null }) {
  const list = parseAttachments(attachments)

  if (list.length === 0) {
    return (
      <div className="attachment-list-empty">
        <p className="muted">暂无附件</p>
      </div>
    )
  }

  return (
    <div className="attachment-list-section">
      <div className="attachment-list">
        {list.map((att) => (
          <a
            className="attachment-chip"
            href={att.path}
            key={att.path}
            rel="noopener noreferrer"
            target="_blank"
            title={`打开 ${att.name}`}
          >
            <span className="attachment-chip-icon">{fileIcon(att)}</span>
            <span className="attachment-chip-name">{att.name}</span>
            <span className="attachment-chip-size">{formatSize(att.size)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
