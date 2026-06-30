/**
 * 一次性脚本：将数据库中所有已有笔记同步生成 MD 文件到 data/notes/
 * 运行：node scripts/sync-notes-md.mjs
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

function extractKeyword(content) {
  const cleaned = content
    .replace(/[#*`~\-\[\](){}|>'"!?,.;:\/\\@#$%^&+=]/g, '')
    .replace(/\s+/g, '')
    .trim()
  return cleaned.slice(0, 20) || '未命名'
}

function typeLabel(type) {
  if (type === 'todo') return '待办'
  if (type === 'log') return '沟通记录'
  return '笔记'
}

function entityLabel(entityType, entityId) {
  if (entityType === 'global') return '全局备忘'
  const map = { job: '岗位', candidate: '候选人', company: '企业', match: '匹配' }
  return `${map[entityType] ?? entityType} #${entityId}`
}

function buildMdContent(note) {
  const lines = []
  lines.push(`# ${note.content.slice(0, 50)}${note.content.length > 50 ? '…' : ''}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(`- **记录类型**：${typeLabel(note.type)}`)
  lines.push(`- **所属**：${entityLabel(note.entityType, note.entityId)}`)
  lines.push(`- **创建时间**：${note.createdAt.toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`- **置顶**：${note.pinned ? '是' : '否'}`)
  if (note.type === 'todo') {
    lines.push(`- **状态**：${note.done ? '已完成' : '待完成'}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 内容')
  lines.push('')
  lines.push(note.content)
  lines.push('')
  return lines.join('\n')
}

async function findFileById(noteId) {
  if (!existsSync(DATA_NOTES_DIR)) return null
  const prefix = `${noteId}-`
  const files = await readdir(DATA_NOTES_DIR)
  return files.find((f) => f.startsWith(prefix) && f.endsWith('.md')) ?? null
}

async function main() {
  if (!existsSync(DATA_NOTES_DIR)) {
    await mkdir(DATA_NOTES_DIR, { recursive: true })
  }

  const notes = await prisma.note.findMany()
  console.log(`找到 ${notes.length} 条笔记，开始生成 MD 文件...`)

  let count = 0
  for (const note of notes) {
    // 先删除旧文件
    const oldFile = await findFileById(note.id)
    if (oldFile) {
      await unlink(join(DATA_NOTES_DIR, oldFile)).catch(() => {})
    }

    const keyword = extractKeyword(note.content)
    const filename = `${note.id}-${keyword}.md`
    const filePath = join(DATA_NOTES_DIR, filename)
    const md = buildMdContent(note)
    await writeFile(filePath, md, 'utf-8')
    count++
    console.log(`  ✓ ${filename}`)
  }

  console.log(`\n完成！共生成 ${count} 个 MD 文件，目录：data/notes/`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
