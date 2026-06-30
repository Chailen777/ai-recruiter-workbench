/**
 * 将某个实体的笔记列表同步写入 MD 文件
 * 路径规则：public/notes/{entityType}-{entityId}.md
 * global 笔记写入 public/notes/global.md
 */
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

type NoteForMd = {
  id: number
  content: string
  type: string
  pinned: boolean
  done: boolean
  createdAt: Date
}

const NOTES_DIR = join(process.cwd(), 'public', 'notes')

async function ensureNotesDir() {
  if (!existsSync(NOTES_DIR)) {
    await mkdir(NOTES_DIR, { recursive: true })
  }
}

function typeLabel(type: string) {
  if (type === 'todo') return '待办'
  if (type === 'log') return '沟通记录'
  return '笔记'
}

export async function syncNotesToMd(
  entityType: string,
  entityId: number,
  notes: NoteForMd[],
  entityLabel?: string,
) {
  await ensureNotesDir()

  const filename = entityType === 'global'
    ? 'global.md'
    : `${entityType}-${entityId}.md`

  const filePath = join(NOTES_DIR, filename)

  const header = entityType === 'global'
    ? '# 全局备忘录\n\n'
    : `# ${entityLabel ?? entityType} #${entityId} 备忘录\n\n`

  if (notes.length === 0) {
    await writeFile(filePath, header + '_暂无记录_\n', 'utf-8')
    return
  }

  // 置顶优先，然后按 createdAt 倒序
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const lines: string[] = [header]

  for (const note of sorted) {
    const pin = note.pinned ? ' 📌' : ''
    const doneStr = note.type === 'todo'
      ? (note.done ? ' ~~✓ 已完成~~' : ' ○ 待完成')
      : ''
    const dateStr = note.createdAt.toLocaleString('zh-CN', { hour12: false })
    lines.push(`## [${typeLabel(note.type)}]${pin}${doneStr}`)
    lines.push('')
    lines.push(note.content)
    lines.push('')
    lines.push(`> *${dateStr}*`)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  await writeFile(filePath, lines.join('\n'), 'utf-8')
}
