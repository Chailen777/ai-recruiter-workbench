/**
 * 升级脚本：批量重写 data/notes/ 下所有 MD 文件
 * 补全 YAML Front Matter + entityName + entityLibrary
 * 运行：node scripts/upgrade-notes-md.mjs
 *
 * 与 sync-notes-md.mjs 的区别：
 * - 查询实体名称（候选人姓名 / 岗位标题 / 企业名称）
 * - 生成 YAML Front Matter（方便机器人解析）
 * - 补充所属笔记库、关联实体名称等字段
 */
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir, unlink, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const DATA_NOTES_DIR = join(projectRoot, 'data', 'notes')

const prisma = new PrismaClient()

// ── 工具函数 ────────────────────────────────────

function extractKeyword(content) {
  const cleaned = content
    .replace(/[#*`~\-\[\](){}|>'"!?,.;:/\\@#$%^&+=]/g, '')
    .replace(/\s+/g, '')
    .trim()
  return cleaned.slice(0, 20) || '未命名'
}

function typeLabel(type) {
  if (type === 'todo') return '待办'
  if (type === 'log') return '沟通记录'
  return '随笔'
}

function entityTypeLabel(entityType) {
  const map = {
    global: '全局笔记库',
    candidate: '人才库',
    job: '岗位库',
    company: '企业库',
    match: '匹配结果',
  }
  return map[entityType] ?? entityType
}

function yamlValue(raw) {
  if (/[:"'#&{}[\],!*?`@|>%]/.test(raw)) {
    return `"${raw.replace(/"/g, '\\"')}"`
  }
  return raw
}

// ── 构建新版 MD 内容 ─────────────────────────────

function buildMdContent(note) {
  const lines = []

  // ══════ YAML Front Matter（机器可读）══════
  lines.push('---')
  lines.push(`note_id: ${note.id}`)
  lines.push(`note_type: ${note.type}`)
  lines.push(`content_preview: ${yamlValue((note.content || '').slice(0, 80).replace(/\n/g, ' '))}`)
  lines.push(`status: ${note.type === 'todo' ? (note.done ? 'completed' : 'pending') : 'open'}`)
  lines.push(`pinned: ${note.pinned}`)
  lines.push(`entity_type: ${note.entityType}`)
  lines.push(`entity_id: ${note.entityId}`)
  if (note.entityName) {
    lines.push(`entity_name: ${yamlValue(note.entityName)}`)
  }
  lines.push(`entity_library: ${entityTypeLabel(note.entityType)}`)
  lines.push(`created_at: "${note.createdAt.toISOString()}"`)
  lines.push('---')
  lines.push('')

  // ══════ 人类可读标题 ══════
  const content = note.content || ''
  lines.push(`# ${content.slice(0, 60)}${content.length > 60 ? '…' : ''}`)
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
  lines.push(`| 🏷️ 记录类型 | ${typeLabel(note.type)} |`)
  if (note.type === 'todo') {
    lines.push(`| ✅ 完成状态 | ${note.done ? '已完成' : '待完成'} |`)
  }
  lines.push(`| 📌 置顶 | ${note.pinned ? '是' : '否'} |`)
  lines.push(`| 🕐 创建时间 | ${note.createdAt.toLocaleString('zh-CN', { hour12: false })} |`)
  lines.push('')

  // ══════ 正文 ══════
  lines.push('## 内容')
  lines.push('')
  lines.push(content)
  lines.push('')

  return lines.join('\n')
}

// ── 文件操作 ────────────────────────────────────

async function findFileById(noteId) {
  if (!existsSync(DATA_NOTES_DIR)) return null
  const prefix = `${noteId}-`
  const files = await readdir(DATA_NOTES_DIR)
  return files.find((f) => f.startsWith(prefix) && f.endsWith('.md')) ?? null
}

// ── 主程序 ──────────────────────────────────────

async function main() {
  console.log('🔍 正在查询数据库中的所有笔记...\n')

  const notes = await prisma.note.findMany()
  console.log(`找到 ${notes.length} 条笔记`)

  // ── 批量查询实体名称 ──
  const candidateIds = [...new Set(notes.filter(n => n.entityType === 'candidate').map(n => n.entityId))]
  const jobIds = [...new Set(notes.filter(n => n.entityType === 'job').map(n => n.entityId))]
  const companyIds = [...new Set(notes.filter(n => n.entityType === 'company').map(n => n.entityId))]

  console.log(`  候选人: ${candidateIds.length} 个`)
  console.log(`  岗位: ${jobIds.length} 个`)
  console.log(`  企业: ${companyIds.length} 个`)
  console.log('')

  const [candidates, jobs, companies] = await Promise.all([
    candidateIds.length ? prisma.candidate.findMany({ where: { id: { in: candidateIds } }, select: { id: true, name: true } }) : [],
    jobIds.length ? prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true, companyName: true } }) : [],
    companyIds.length ? prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }) : [],
  ])

  const candidateMap = new Map(candidates.map(c => [c.id, c.name]))
  const jobMap = new Map(jobs.map(j => [j.id, `${j.companyName ? j.companyName + ' · ' : ''}${j.title}`]))
  const companyMap = new Map(companies.map(c => [c.id, c.name]))

  // ── 确保目录存在 ──
  if (!existsSync(DATA_NOTES_DIR)) {
    await mkdir(DATA_NOTES_DIR, { recursive: true })
  }

  // ── 逐条重写 ──
  console.log('📝 开始重写 MD 文件...\n')
  let count = 0

  for (const note of notes) {
    // 解析实体名称
    const entityName =
      note.entityType === 'candidate' ? (candidateMap.get(note.entityId) ?? null)
      : note.entityType === 'job' ? (jobMap.get(note.entityId) ?? null)
      : note.entityType === 'company' ? (companyMap.get(note.entityId) ?? null)
      : null

    // 删除旧文件
    const oldFile = await findFileById(note.id)
    if (oldFile) {
      await unlink(join(DATA_NOTES_DIR, oldFile)).catch(() => {})
    }

    // 生成新文件
    const noteWithName = { ...note, entityName }
    const keyword = extractKeyword(note.content || '')
    const filename = `${note.id}-${keyword}.md`
    const filePath = join(DATA_NOTES_DIR, filename)

    const md = buildMdContent(noteWithName)
    await writeFile(filePath, md, 'utf-8')

    const preview = (noteWithName.entityName ? `[${noteWithName.entityName}] ` : '') +
      (note.content || '').slice(0, 40).replace(/\n/g, ' ')
    console.log(`  ✓ ${filename}  ${preview}`)
    count++
  }

  console.log(`\n✅ 完成！共重写 ${count} 个 MD 文件`)
  console.log(`📁 目录：${DATA_NOTES_DIR}`)
  console.log(`\n💡 提示：新文件包含完整 YAML Front Matter 和实体来源信息，方便机器人解析。`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ 升级失败:', e)
  prisma.$disconnect()
  process.exit(1)
})
