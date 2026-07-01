/**
 * 备忘记录库 — 每条笔记独立生成一个 MD 文件
 * 目录：data/notes/
 * 文件名规则：{noteId}-{关键词}.md
 * 新增笔记 → 创建 MD 文件
 * 删除笔记 → 删除 MD 文件
 * 更新笔记（置顶/完成）→ 重写 MD 文件
 *
 * 每份 MD 文件包含完整的 YAML Front Matter 元数据，方便未来机器人解析。
 */
import { writeFile, mkdir, unlink, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export type NoteData = {
  id: number
  content: string
  type: string
  pinned: boolean
  done: boolean
  entityType: string
  entityId: number
  entityName?: string | null
  createdAt: Date
  author?: string
  appointmentTime?: Date | null
  appointmentLocation?: string | null
  appointmentType?: string | null
  appointmentPerson?: string | null
  articleType?: string | null
  articlePerson?: string | null
  // 沟通字段
  logPerson?: string | null
  // 待办重复字段
  scheduledDate?: Date | null
  repeatType?: string | null
  repeatFrequency?: number | null
  repeatEndDate?: Date | null
  repeatGroupId?: string | null
  repeatPerson?: string | null
  repeatCategory?: string | null
  repeatCustomNum?: number | null
  repeatWeekdays?: string | null
}

const DATA_NOTES_DIR = join(process.cwd(), 'data', 'notes')

async function ensureDir() {
  if (!existsSync(DATA_NOTES_DIR)) {
    await mkdir(DATA_NOTES_DIR, { recursive: true })
  }
}

/**
 * 从笔记内容中提取关键词作为文件名
 * 规则：取前 20 个有效字符，去除特殊符号和空白
 */
function extractKeyword(content: string): string {
  const cleaned = content
    .replace(/[#*`~\-\[\](){}|>'"!?,.;:/\\@#$%^&+=]/g, '')
    .replace(/\s+/g, '')
    .trim()
  const keyword = cleaned.slice(0, 20)
  return keyword || '未命名'
}

function fileName(noteId: number, content: string): string {
  const keyword = extractKeyword(content)
  return `${noteId}-${keyword}.md`
}

/**
 * 根据 noteId 在 data/notes/ 目录中查找已存在的文件
 */
async function findFileById(noteId: number): Promise<string | null> {
  if (!existsSync(DATA_NOTES_DIR)) return null
  const prefix = `${noteId}-`
  const files = await readdir(DATA_NOTES_DIR)
  return files.find((f) => f.startsWith(prefix) && f.endsWith('.md')) ?? null
}

// ── 标签映射 ────────────────────────────────────

function typeLabel(type: string): string {
  if (type === 'todo') return '待办'
  if (type === 'log') return '沟通'
  if (type === 'appointment') return '预约'
  if (type === 'diary') return '日记'
  return '随笔'
}

function entityTypeLabel(entityType: string): string {
  const map: Record<string, string> = {
    global: '全局笔记库',
    candidate: '人才库',
    job: '岗位库',
    company: '企业库',
    match: '匹配结果',
  }
  return map[entityType] ?? entityType
}

// ── YAML 安全转义 ──────────────────────────────

function yamlValue(raw: string): string {
  // 如果包含冒号、引号等特殊字符，用双引号包裹并转义
  if (/[:"'#&{}[\],!*?`@|>%]/.test(raw)) {
    return `"${raw.replace(/"/g, '\\"')}"`
  }
  return raw
}

// ── 构建 MD 内容 ────────────────────────────────

function buildMdContent(note: NoteData): string {
  const lines: string[] = []

  // ══════ YAML Front Matter（机器可读）══════
  lines.push('---')
  lines.push(`note_id: ${note.id}`)
  lines.push(`note_type: ${note.type}`)
  lines.push(`content_preview: ${yamlValue(note.content.slice(0, 80).replace(/\n/g, ' '))}`)
  lines.push(`status: ${note.type === 'todo' ? (note.done ? 'completed' : 'pending') : 'open'}`)
  lines.push(`pinned: ${note.pinned}`)
  lines.push(`entity_type: ${note.entityType}`)
  lines.push(`entity_id: ${note.entityId}`)
  if (note.entityName) {
    lines.push(`entity_name: ${yamlValue(note.entityName)}`)
  }
  lines.push(`entity_library: ${entityTypeLabel(note.entityType)}`)
  lines.push(`author: "${note.author ?? '陈成'}"`)
  lines.push(`created_at: "${note.createdAt.toISOString()}"`)
  if (note.type === 'appointment') {
    if (note.appointmentTime) lines.push(`appointment_time: "${note.appointmentTime.toISOString()}"`)
    if (note.appointmentType) lines.push(`appointment_type: ${note.appointmentType}`)
    if (note.appointmentLocation) lines.push(`appointment_location: ${yamlValue(note.appointmentLocation)}`)
    if (note.appointmentPerson) lines.push(`appointment_person: ${yamlValue(note.appointmentPerson)}`)
  }
  lines.push('---')
  lines.push('')

  // ══════ 人类可读标题 ══════
  const title = note.content.slice(0, 60)
  lines.push(`# ${title}${note.content.length > 60 ? '…' : ''}`)
  lines.push('')

  // ══════ 元信息表格 ══════
  lines.push('| 字段 | 值 |')
  lines.push('|------|-----|')
  lines.push(`| 📂 所属笔记库 | ${entityTypeLabel(note.entityType)} |`)
  if (note.entityType !== 'global') {
    if (note.entityName) {
      lines.push(`| 📌 关联实体 | ${note.entityName}（ID: ${note.entityId}）|`)
    } else {
      lines.push(`| 📌 关联实体 ID | ${note.entityId} |`)
    }
  }
  lines.push('| ✍️ 作者 | 陈成 |')
  lines.push(`| 🏷️ 记录类型 | ${typeLabel(note.type)} |`)
  if (note.type === 'todo') {
    lines.push(`| ✅ 完成状态 | ${note.done ? '已完成' : '待完成'} |`)
  }
  lines.push(`| 📌 置顶 | ${note.pinned ? '是' : '否'} |`)
  if (note.type === 'appointment') {
    if (note.appointmentTime) {
      lines.push(`| 🕐 预约时间 | ${note.appointmentTime.toLocaleString('zh-CN', { hour12: false })} |`)
    }
    if (note.appointmentType) {
      const apptLabels: Record<string, string> = { interview: '面试', business: '商务沟通', todo_appointment: '待办预约', other: '其他' }
      lines.push(`| 📋 预约类型 | ${apptLabels[note.appointmentType] ?? note.appointmentType} |`)
    }
    if (note.appointmentPerson) {
      lines.push(`| 👤 预约人物 | ${note.appointmentPerson} |`)
    }
    if (note.appointmentLocation) {
      lines.push(`| 📍 预约地点 | ${note.appointmentLocation} |`)
    }
  }
  if (note.type === 'diary') {
    if (note.articleType) {
      const articleLabels: Record<string, string> = { diary: '日记', study: '学习笔记', report: '报告内容', web: '网络', reading: '读书笔记', lecture: '讲座笔记' }
      lines.push(`| 📝 文章类型 | ${articleLabels[note.articleType] ?? note.articleType} |`)
    }
    if (note.articlePerson) {
      lines.push(`| 👤 人物 | ${note.articlePerson} |`)
    }
  }
  if (note.type === 'log') {
    if (note.logPerson) {
      lines.push(`| 👤 沟通人物 | ${note.logPerson} |`)
    }
  }
  lines.push(`| 🕐 创建时间 | ${note.createdAt.toLocaleString('zh-CN', { hour12: false })} |`)
  lines.push('')

  // ══════ 正文 ══════
  lines.push('## 内容')
  lines.push('')
  lines.push(note.content)
  lines.push('')

  return lines.join('\n')
}

// ── 公开 API ────────────────────────────────────

export async function writeNoteMd(note: NoteData) {
  await ensureDir()

  const oldFile = await findFileById(note.id)
  if (oldFile) {
    await unlink(join(DATA_NOTES_DIR, oldFile)).catch(() => {})
  }

  const filename = fileName(note.id, note.content)
  const filePath = join(DATA_NOTES_DIR, filename)
  const md = buildMdContent(note)

  await writeFile(filePath, md, 'utf-8')
}

export async function deleteNoteMd(noteId: number) {
  if (!existsSync(DATA_NOTES_DIR)) return

  const oldFile = await findFileById(noteId)
  if (oldFile) {
    await unlink(join(DATA_NOTES_DIR, oldFile)).catch(() => {})
  }
}
