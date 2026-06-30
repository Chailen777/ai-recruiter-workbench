'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { syncNotesToMd } from '@/lib/notes-md'
import { writeNoteMd, deleteNoteMd, type NoteData } from '@/lib/notes-data-md'

type EntityType = 'global' | 'job' | 'candidate' | 'company' | 'match' | 'knowledge' | 'school' | 'chart' | 'info' | 'contact' | 'project'

export type AddNoteResult =
  | { success: true; noteId: number; createdCount?: number }
  | { success: false; code: 'INVALID_CONTENT' | 'DATABASE_UNAVAILABLE' | 'SAVE_FAILED'; message: string }

const TRANSIENT_DATABASE_CODES = new Set(['P1001', 'P2024'])

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPrismaErrorCode(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code
  if (error instanceof Prisma.PrismaClientInitializationError) return error.errorCode ?? 'PRISMA_INIT'
  return null
}

function isTransientDatabaseError(error: unknown) {
  const code = getPrismaErrorCode(error)
  return code ? TRANSIENT_DATABASE_CODES.has(code) : false
}

async function createNoteWithRetry(data: Prisma.NoteCreateInput) {
  try {
    return await prisma.note.create({ data })
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error

    // 仅对“连接未建立/连接池无可用连接”重试一次，避免重复写入。
    await delay(350)
    return prisma.note.create({ data })
  }
}

// ── 辅助：根据 entityType + entityId 查询实体名称 ──
async function getEntityName(entityType: string, entityId: number): Promise<string | null> {
  if (entityType === 'global' || entityId === 0) return null
  try {
    if (entityType === 'candidate') {
      const c = await prisma.candidate.findUnique({ where: { id: entityId }, select: { name: true } })
      return c?.name ?? null
    }
    if (entityType === 'job') {
      const j = await prisma.job.findUnique({ where: { id: entityId }, select: { title: true, companyName: true } })
      if (!j) return null
      return j.companyName ? `${j.companyName} · ${j.title}` : j.title
    }
    if (entityType === 'company') {
      const c = await prisma.company.findUnique({ where: { id: entityId }, select: { name: true } })
      return c?.name ?? null
    }
    if (entityType === 'knowledge') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const k = await (prisma as any).knowledge.findUnique({ where: { id: entityId }, select: { title: true } })
      return (k as { title: string } | null)?.title ?? null
    }
    if (entityType === 'school') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = await (prisma as any).school.findUnique({ where: { id: entityId }, select: { name: true } })
      return (s as { name: string } | null)?.name ?? null
    }
    if (entityType === 'chart') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = await (prisma as any).chart.findUnique({ where: { id: entityId }, select: { title: true } })
      return (c as { title: string } | null)?.title ?? null
    }
    if (entityType === 'info') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const i = await (prisma as any).info.findUnique({ where: { id: entityId }, select: { title: true } })
      return (i as { title: string } | null)?.title ?? null
    }
    if (entityType === 'contact') {
      const c = await prisma.contact.findUnique({ where: { id: entityId }, select: { name: true } })
      return c?.name ?? null
    }
    if (entityType === 'project') {
      const p = await prisma.project.findUnique({ where: { id: entityId }, select: { name: true } })
      return p?.name ?? null
    }
  } catch { /* 实体表可能不存在 */ }
  return null
}

// 页面路径映射，用于 revalidatePath
// 注意：global 笔记不在首页展示，不需要 revalidate /home
function revalidateForEntity(entityType: EntityType, _entityId: number) {
  // global 笔记不 revalidate 首页（首页不展示笔记数据，且 fetchDashboardStats 22
  // 个并行查询在 Neon 上间歇失败会崩溃到 global-error.tsx）
  if (entityType === 'global') return
  const map: Record<string, string> = {
    job: '/jobs',
    candidate: '/candidates',
    company: '/companies',
    match: '/match',
    knowledge: '/knowledge',
    school: '/schools',
    chart: '/charts',
    info: '/info',
    contact: '/contacts',
    project: '/projects',
  }
  const base = map[entityType]
  if (base) {
    try { revalidatePath(base) } catch { /* revalidation failure is non-critical */ }
  }
}

// 同步 MD 文件的公共函数（未 migrate 时静默跳过）
async function syncMd(entityType: EntityType, entityId: number) {
  try {
    const notes = await prisma.note.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    })
    await syncNotesToMd(entityType, entityId, notes)
  } catch { /* Note 表尚不存在，跳过 MD 同步 */ }
}

/** 把 Prisma Note 拼成 NoteData 并传入 entityName */
async function toNoteData(note: {
  id: number
  content: string
  type: string
  pinned: boolean
  done: boolean
  entityType: string
  entityId: number
  createdAt: Date
  appointmentTime?: Date | null
  appointmentLocation?: string | null
  appointmentType?: string | null
  appointmentPerson?: string | null
  articleType?: string | null
  articlePerson?: string | null
  scheduledDate?: Date | null
  repeatType?: string | null
  repeatFrequency?: number | null
  repeatEndDate?: Date | null
  repeatGroupId?: string | null
}): Promise<NoteData> {
  return {
    id: note.id,
    content: note.content,
    type: note.type,
    pinned: note.pinned,
    done: note.done,
    entityType: note.entityType,
    entityId: note.entityId,
    entityName: await getEntityName(note.entityType, note.entityId),
    createdAt: note.createdAt,
    appointmentTime: note.appointmentTime ?? null,
    appointmentLocation: note.appointmentLocation ?? null,
    appointmentType: note.appointmentType ?? null,
    appointmentPerson: note.appointmentPerson ?? null,
    articleType: note.articleType ?? null,
    articlePerson: note.articlePerson ?? null,
    scheduledDate: note.scheduledDate ?? null,
    repeatType: note.repeatType ?? null,
    repeatFrequency: note.repeatFrequency ?? null,
    repeatEndDate: note.repeatEndDate ?? null,
    repeatGroupId: note.repeatGroupId ?? null,
  }
}

// ── 查询笔记（供客户端组件使用）─────────────────
export async function getNotes(entityType: EntityType, entityId: number) {
  try {
    const rows = await prisma.note.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((n) => ({
      id: n.id,
      content: n.content,
      type: n.type,
      pinned: n.pinned,
      done: n.done,
      entityType: n.entityType,
      entityId: n.entityId,
      createdAt: n.createdAt.toISOString(),
      appointmentTime: n.appointmentTime?.toISOString() ?? null,
      appointmentLocation: n.appointmentLocation ?? null,
      appointmentType: n.appointmentType ?? null,
      appointmentPerson: n.appointmentPerson ?? null,
      articleType: n.articleType ?? null,
      articlePerson: n.articlePerson ?? null,
      scheduledDate: n.scheduledDate?.toISOString() ?? null,
      repeatType: n.repeatType ?? null,
      repeatFrequency: n.repeatFrequency ?? null,
      repeatEndDate: n.repeatEndDate?.toISOString() ?? null,
      repeatGroupId: n.repeatGroupId ?? null,
    }))
  } catch {
    return []
  }
}

// ── 新增笔记 ───────────────────────────────────
export async function addNote(formData: FormData): Promise<AddNoteResult> {
  const content = (formData.get('content') as string)?.trim()
  const type = (formData.get('type') as string) || 'note'
  const entityType = (formData.get('entityType') as EntityType) || 'global'
  const entityId = Number(formData.get('entityId') ?? 0)

  if (!content) {
    return { success: false, code: 'INVALID_CONTENT', message: '请输入笔记内容' }
  }

  try {
    // 预约字段
    const appointmentTime = type === 'appointment' ? (formData.get('appointmentTime') as string) || null : null
    const appointmentLocation = type === 'appointment' ? (formData.get('appointmentLocation') as string)?.trim() || null : null
    const appointmentType = type === 'appointment' ? (formData.get('appointmentType') as string) || null : null
    const appointmentPerson = type === 'appointment' ? (formData.get('appointmentPerson') as string)?.trim() || null : null

    // 日记字段
    const articleType = type === 'diary' ? (formData.get('articleType') as string) || null : null
    const articlePerson = type === 'diary' ? (formData.get('articlePerson') as string)?.trim() || null : null

    // 待办重复字段
    const isTodo = type === 'todo'
    const scheduledDateStr = isTodo ? (formData.get('scheduledDate') as string) || null : null
    const repeatType = isTodo ? (formData.get('repeatType') as string) || null : null
    const repeatFrequency = isTodo ? Number(formData.get('repeatFrequency') ?? 1) || 1 : null
    const repeatEndDateStr = isTodo ? (formData.get('repeatEndDate') as string) || null : null

    // ── 重复待办：生成多条记录 ──
    if (isTodo && scheduledDateStr && repeatType) {
      const startDate = new Date(scheduledDateStr)
      const endDate = repeatEndDateStr ? new Date(repeatEndDateStr + 'T23:59:59') : null
      const groupId = randomUUID()
      const frequency = repeatFrequency || 1

      // 计算所有重复日期
      const dates: Date[] = []
      const current = new Date(startDate)
      let safetyCount = 0
      while (safetyCount < 365) { // 最多365次重复
        if (endDate && current > endDate) break
        dates.push(new Date(current))
        if (repeatType === 'weekly') {
          current.setDate(current.getDate() + 7 * frequency)
        } else if (repeatType === 'monthly') {
          current.setMonth(current.getMonth() + frequency)
        } else if (repeatType === 'yearly') {
          current.setFullYear(current.getFullYear() + frequency)
        } else {
          break // 不支持的类型，只创建一条
        }
        safetyCount++
      }

      // 批量创建
      const records = dates.map((d) => ({
        content,
        type,
        entityType,
        entityId,
        scheduledDate: d,
        repeatType,
        repeatFrequency: frequency,
        repeatEndDate: endDate,
        repeatGroupId: groupId,
      }))

      const created = await prisma.note.createMany({ data: records })
      const firstNote = await prisma.note.findFirst({
        where: { repeatGroupId: groupId },
        orderBy: { scheduledDate: 'asc' },
      })

      try { await syncMd(entityType, entityId) } catch {}
      if (firstNote) {
        try { await writeNoteMd(await toNoteData(firstNote)) } catch {}
      }

      revalidateForEntity(entityType, entityId)
      return { success: true, noteId: firstNote?.id ?? 0, createdCount: created.count }
    }

    // ── 普通待办（无重复）或其他类型 ──
    const note = await createNoteWithRetry({
      content, type, entityType, entityId,
      ...(appointmentTime ? { appointmentTime: new Date(appointmentTime) } : {}),
      ...(appointmentLocation ? { appointmentLocation } : {}),
      ...(appointmentType ? { appointmentType } : {}),
      ...(appointmentPerson ? { appointmentPerson } : {}),
      ...(articleType ? { articleType } : {}),
      ...(articlePerson ? { articlePerson } : {}),
      ...(isTodo && scheduledDateStr ? { scheduledDate: new Date(scheduledDateStr) } : {}),
    })

    // MD 文件同步（Vercel 只读文件系统会静默失败，不影响核心功能）
    try { await syncMd(entityType, entityId) } catch { /* Vercel 文件系统不可写 */ }
    try { await writeNoteMd(await toNoteData(note)) } catch { /* Vercel 文件系统不可写 */ }

    revalidateForEntity(entityType, entityId)
    return { success: true, noteId: note.id }
  } catch (error) {
    const prismaCode = getPrismaErrorCode(error)
    console.error('[notes.addNote] 保存笔记失败', {
      prismaCode,
      entityType,
      entityId,
      type,
      error: error instanceof Error ? error.message : String(error),
    })

    if (isTransientDatabaseError(error)) {
      return {
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: '数据库连接暂时繁忙，请稍后重试',
      }
    }

    return {
      success: false,
      code: 'SAVE_FAILED',
      message: '笔记保存失败，请重试',
    }
  }
}

// ── 删除笔记 ───────────────────────────────────
export async function deleteNote(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!id) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  await prisma.note.delete({ where: { id } })

  // MD 文件同步（Vercel 文件系统不可写时静默失败）
  try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  try { await deleteNoteMd(note.id) } catch {}

  revalidateForEntity(note.entityType as EntityType, note.entityId)
}

// ── 切换置顶 ───────────────────────────────────
export async function togglePinNote(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!id) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  const updated = await prisma.note.update({
    where: { id },
    data: { pinned: !note.pinned },
  })

  // MD 文件同步（Vercel 文件系统不可写时静默失败）
  try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  try { await writeNoteMd(await toNoteData(updated)) } catch {}

  revalidateForEntity(note.entityType as EntityType, note.entityId)
}

// ── 切换完成（todo / 预约 通用）────────────────
export async function toggleDoneNote(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!id) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  const updated = await prisma.note.update({
    where: { id },
    data: { done: !note.done },
  })

  // MD 文件同步（Vercel 文件系统不可写时静默失败）
  try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  try { await writeNoteMd(await toNoteData(updated)) } catch {}

  revalidateForEntity(note.entityType as EntityType, note.entityId)
}

// ── 编辑笔记内容 ───────────────────────────────
export async function editNote(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!id) return

  const content = (formData.get('content') as string)?.trim()
  if (!content) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  // 预约字段（仅 appointment 类型才更新）
  const isAppointment = note.type === 'appointment'
  const appointmentTime = isAppointment ? (formData.get('appointmentTime') as string) || null : undefined
  const appointmentLocation = isAppointment ? (formData.get('appointmentLocation') as string)?.trim() || null : undefined
  const appointmentType = isAppointment ? (formData.get('appointmentType') as string) || null : undefined
  const appointmentPerson = isAppointment ? (formData.get('appointmentPerson') as string)?.trim() || null : undefined

  // 日记字段（仅 diary 类型才更新）
  const isDiary = note.type === 'diary'
  const articleType = isDiary ? (formData.get('articleType') as string) || null : undefined
  const articlePerson = isDiary ? (formData.get('articlePerson') as string)?.trim() || null : undefined

  const data: Record<string, unknown> = { content }
  if (appointmentTime !== undefined) data.appointmentTime = appointmentTime ? new Date(appointmentTime) : null
  if (appointmentLocation !== undefined) data.appointmentLocation = appointmentLocation
  if (appointmentType !== undefined) data.appointmentType = appointmentType
  if (appointmentPerson !== undefined) data.appointmentPerson = appointmentPerson
  if (articleType !== undefined) data.articleType = articleType
  if (articlePerson !== undefined) data.articlePerson = articlePerson

  const updated = await prisma.note.update({ where: { id }, data })

  // MD 文件同步（Vercel 文件系统不可写时静默失败）
  try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  try { await writeNoteMd(await toNoteData(updated)) } catch {}

  revalidateForEntity(note.entityType as EntityType, note.entityId)
}

// ── 带范围的编辑（重复待办专用）─────────────────
// scope: 'single' | 'future' | 'all'
export async function editNoteWithScope(formData: FormData) {
  const id = Number(formData.get('id'))
  const scope = (formData.get('scope') as string) || 'single'
  if (!id) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  const content = (formData.get('content') as string)?.trim()
  if (!content) return

  // 待办重复字段
  const isTodo = note.type === 'todo'
  const scheduledDateStr = isTodo ? (formData.get('scheduledDate') as string) || null : null

  const updateData: Record<string, unknown> = { content }
  if (isTodo && scheduledDateStr) {
    updateData.scheduledDate = new Date(scheduledDateStr)
  }

  if (scope === 'single' || !note.repeatGroupId) {
    // 仅修改当条
    const updated = await prisma.note.update({ where: { id }, data: updateData })
    try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
    try { await writeNoteMd(await toNoteData(updated)) } catch {}
  } else if (scope === 'future' && note.scheduledDate) {
    // 修改当前及以后重复
    await prisma.note.updateMany({
      where: {
        repeatGroupId: note.repeatGroupId,
        scheduledDate: { gte: note.scheduledDate },
      },
      data: updateData,
    })
    try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  } else if (scope === 'all') {
    // 修改全部重复
    await prisma.note.updateMany({
      where: { repeatGroupId: note.repeatGroupId },
      data: updateData,
    })
    try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  }

  revalidateForEntity(note.entityType as EntityType, note.entityId)
}

// ── 带范围的删除（重复待办专用）─────────────────
// scope: 'single' | 'future' | 'all'
export async function deleteNoteWithScope(formData: FormData) {
  const id = Number(formData.get('id'))
  const scope = (formData.get('scope') as string) || 'single'
  if (!id) return

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return

  if (scope === 'single' || !note.repeatGroupId) {
    // 仅删除当条
    await prisma.note.delete({ where: { id } })
    try { await deleteNoteMd(note.id) } catch {}
  } else if (scope === 'future' && note.scheduledDate) {
    // 删除当前及以后重复
    const toDelete = await prisma.note.findMany({
      where: {
        repeatGroupId: note.repeatGroupId,
        scheduledDate: { gte: note.scheduledDate },
      },
      select: { id: true },
    })
    const ids = toDelete.map((n) => n.id)
    if (ids.length > 0) {
      await prisma.note.deleteMany({ where: { id: { in: ids } } })
      for (const did of ids) {
        try { await deleteNoteMd(did) } catch {}
      }
    }
  } else if (scope === 'all') {
    // 删除全部重复
    const toDelete = await prisma.note.findMany({
      where: { repeatGroupId: note.repeatGroupId },
      select: { id: true },
    })
    const ids = toDelete.map((n) => n.id)
    if (ids.length > 0) {
      await prisma.note.deleteMany({ where: { id: { in: ids } } })
      for (const did of ids) {
        try { await deleteNoteMd(did) } catch {}
      }
    }
  }

  try { await syncMd(note.entityType as EntityType, note.entityId) } catch {}
  revalidateForEntity(note.entityType as EntityType, note.entityId)
}
export async function getAllNotes() {
  try {
    const notes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' } })

    // 收集各实体 ID，批量查询实体名称
    const candidateIds = [...new Set(notes.filter(n => n.entityType === 'candidate').map(n => n.entityId))]
    const jobIds = [...new Set(notes.filter(n => n.entityType === 'job').map(n => n.entityId))]
    const companyIds = [...new Set(notes.filter(n => n.entityType === 'company').map(n => n.entityId))]
    const knowledgeIds = [...new Set(notes.filter(n => n.entityType === 'knowledge').map(n => n.entityId))]
    const schoolIds = [...new Set(notes.filter(n => n.entityType === 'school').map(n => n.entityId))]
    const chartIds = [...new Set(notes.filter(n => n.entityType === 'chart').map(n => n.entityId))]
    const infoIds = [...new Set(notes.filter(n => n.entityType === 'info').map(n => n.entityId))]
    const contactIds = [...new Set(notes.filter(n => n.entityType === 'contact').map(n => n.entityId))]
    const projectIds = [...new Set(notes.filter(n => n.entityType === 'project').map(n => n.entityId))]

    const [candidates, jobs, companies, knowledges, schools, charts, infos, contacts, projects] = await Promise.all([
      candidateIds.length ? prisma.candidate.findMany({ where: { id: { in: candidateIds } }, select: { id: true, name: true } }) : [],
      jobIds.length ? prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true, companyName: true } }) : [],
      companyIds.length ? prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }) : [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      knowledgeIds.length ? (prisma as any).knowledge.findMany({ where: { id: { in: knowledgeIds } }, select: { id: true, title: true } }) : [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schoolIds.length ? (prisma as any).school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true } }) : [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartIds.length ? (prisma as any).chart.findMany({ where: { id: { in: chartIds } }, select: { id: true, title: true } }) : [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      infoIds.length ? (prisma as any).info.findMany({ where: { id: { in: infoIds } }, select: { id: true, title: true } }) : [],
      contactIds.length ? prisma.contact.findMany({ where: { id: { in: contactIds } }, select: { id: true, name: true } }) : [],
      projectIds.length ? prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }) : [],
    ])

    const candidateMap = new Map(candidates.map(c => [c.id, c.name]))
    const jobMap = new Map(jobs.map(j => [j.id, `${j.companyName ? j.companyName + ' · ' : ''}${j.title}`]))
    const companyMap = new Map(companies.map(c => [c.id, c.name]))
    const knowledgeMap = new Map(knowledges.map((k: { id: number; title: string }) => [k.id, k.title]))
    const schoolMap = new Map(schools.map((s: { id: number; name: string }) => [s.id, s.name]))
    const chartMap = new Map(charts.map((c: { id: number; title: string }) => [c.id, c.title]))
    const infoMap = new Map(infos.map((i: { id: number; title: string }) => [i.id, i.title]))
    const contactMap = new Map(contacts.map((c: { id: number; name: string }) => [c.id, c.name]))
    const projectMap = new Map(projects.map((p: { id: number; name: string }) => [p.id, p.name]))

    return notes.map(n => ({
      id: n.id,
      content: n.content,
      type: n.type,
      pinned: n.pinned,
      done: n.done,
      entityType: n.entityType,
      entityId: n.entityId,
      entityName: n.entityType === 'candidate'
        ? candidateMap.get(n.entityId) ?? null
        : n.entityType === 'job'
        ? jobMap.get(n.entityId) ?? null
        : n.entityType === 'company'
        ? companyMap.get(n.entityId) ?? null
        : n.entityType === 'knowledge'
        ? knowledgeMap.get(n.entityId) ?? null
        : n.entityType === 'school'
        ? schoolMap.get(n.entityId) ?? null
        : n.entityType === 'chart'
        ? chartMap.get(n.entityId) ?? null
        : n.entityType === 'info'
        ? infoMap.get(n.entityId) ?? null
        : n.entityType === 'contact'
        ? contactMap.get(n.entityId) ?? null
        : n.entityType === 'project'
        ? projectMap.get(n.entityId) ?? null
        : null,
      createdAt: n.createdAt.toISOString(),
      appointmentTime: n.appointmentTime?.toISOString() ?? null,
      appointmentLocation: n.appointmentLocation ?? null,
      appointmentType: n.appointmentType ?? null,
      appointmentPerson: n.appointmentPerson ?? null,
      articleType: n.articleType ?? null,
      articlePerson: n.articlePerson ?? null,
      scheduledDate: n.scheduledDate?.toISOString() ?? null,
      repeatType: n.repeatType ?? null,
      repeatFrequency: n.repeatFrequency ?? null,
      repeatEndDate: n.repeatEndDate?.toISOString() ?? null,
      repeatGroupId: n.repeatGroupId ?? null,
    }))
  } catch {
    return []
  }
}

// ── 生日提醒：自动生成待办 ──────────────────────
export async function generateBirthdayReminders() {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000)
    const todayStr = `${now.getMonth() + 1}-${now.getDate()}`
    const futureStr = `${sevenDaysLater.getMonth() + 1}-${sevenDaysLater.getDate()}`

    // 查找所有有生日的人脉
    const contacts = await prisma.contact.findMany({
      where: { birthday: { not: null } },
      select: { id: true, name: true, birthday: true },
    })

    let created = 0
    for (const c of contacts) {
      if (!c.birthday) continue
      const bMonth = c.birthday.getMonth() + 1
      const bDay = c.birthday.getDate()
      const birthdayKey = `${bMonth}-${bDay}`

      // 判断生日是否在接下来的7天内（考虑跨年）
      let isInRange = false
      if (now.getMonth() <= sevenDaysLater.getMonth()) {
        // 正常情况：生日月日在 now 到 7天后之间
        const nowKey = todayStr
        const futureKey = futureStr
        isInRange = birthdayKey >= nowKey && birthdayKey <= futureKey
      } else {
        // 跨年情况：生日在 now 到年底 或 年初到 7天后
        const yearEnd = '12-31'
        const yearStart = '01-01'
        isInRange = (birthdayKey >= todayStr && birthdayKey <= yearEnd) || (birthdayKey >= yearStart && birthdayKey <= futureStr)
      }

      if (!isInRange) continue

      // 检查是否已有该联系人的生日提醒（避免重复）
      const existing = await prisma.note.findFirst({
        where: {
          entityType: 'contact',
          entityId: c.id,
          type: 'todo',
          content: { contains: `${c.name} 生日` },
        },
      })

      if (existing) continue

      // 计算距离生日的天数
      const birthdayThisYear = new Date(now.getFullYear(), bMonth - 1, bDay)
      if (birthdayThisYear < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        birthdayThisYear.setFullYear(now.getFullYear() + 1)
      }
      const daysUntil = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / 86400000)

      await prisma.note.create({
        data: {
          content: `${c.name} 生日还有 ${daysUntil} 天，记得问候！`,
          type: 'todo',
          entityType: 'contact',
          entityId: c.id,
        },
      })
      created++
    }

    return { success: true, created }
  } catch (error: unknown) {
    console.error('[generateBirthdayReminders]', error)
    return { success: false, created: 0, error: String(error) }
  }
}

// ── 日历视图：按日期统计笔记数量 ──────────────────
export type CalendarDay = {
  date: string        // 'YYYY-MM-DD'
  todoCount: number   // 当天创建的待办数
  logCount: number    // 当天创建的沟通记录数
  noteCount: number   // 当天创建的随笔数
  apptCount: number   // 当天创建的预约数
  diaryCount: number  // 当天创建的日记数
  futureTodos: number // 当天到期/关联的未完成待办（未来）
}

export async function getNotesCalendarData(entityType?: EntityType, entityId?: number) {
  try {
    const where: Record<string, unknown> = {}
    if (entityType && entityType !== 'global') {
      where.entityType = entityType
      where.entityId = entityId ?? 0
    }

    const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } })

    // 按日期分组统计：预约用 appointmentTime，其余用 createdAt
    const dayMap = new Map<string, CalendarDay>()

    for (const n of notes) {
      const targetDate = n.type === 'appointment' && n.appointmentTime
        ? n.appointmentTime
        : n.createdAt
      const dateStr = targetDate.toISOString().slice(0, 10) // 'YYYY-MM-DD'
      let day = dayMap.get(dateStr)
      if (!day) {
        day = { date: dateStr, todoCount: 0, logCount: 0, noteCount: 0, apptCount: 0, diaryCount: 0, futureTodos: 0 }
        dayMap.set(dateStr, day)
      }
      if (n.type === 'todo') {
        if (n.done) {
          day.todoCount++
        } else {
          day.todoCount++
          // 未完成的 todo 也计入 futureTodos（如果日期在未来）
          const now = new Date()
          if (n.createdAt > now) day.futureTodos++
        }
      } else if (n.type === 'log') {
        day.logCount++
      } else if (n.type === 'appointment') {
        day.apptCount++
      } else if (n.type === 'diary') {
        day.diaryCount++
      } else {
        day.noteCount++
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

// ── 预约列表：按预约时间升序返回所有预约详情 ──────
export type AppointmentListItem = {
  id: number
  date: string           // YYYY-MM-DD
  time: string           // HH:mm
  fullTime: string       // ISO string
  type: string           // interview | business | todo_appointment | other
  person: string | null
  location: string | null
  content: string
  done: boolean
  entityName: string | null
  entityType: string
}

export async function getAppointmentList(entityType?: EntityType, entityId?: number): Promise<AppointmentListItem[]> {
  try {
    const where: Record<string, unknown> = { type: 'appointment' }
    if (entityType && entityType !== 'global') {
      where.entityType = entityType
      where.entityId = entityId ?? 0
    }

    const appointments = await prisma.note.findMany({
      where,
      orderBy: { appointmentTime: 'asc' },
      select: {
        id: true,
        content: true,
        done: true,
        entityType: true,
        entityId: true,
        appointmentTime: true,
        appointmentType: true,
        appointmentPerson: true,
        appointmentLocation: true,
      },
    })

    // 批量解析实体名称（去重）
    const entityKeys = new Set<string>()
    for (const a of appointments) {
      if (a.entityType !== 'global' && a.entityId !== 0) {
        entityKeys.add(`${a.entityType}:${a.entityId}`)
      }
    }
    const entityNameMap = new Map<string, string | null>()
    for (const key of entityKeys) {
      const [et, eidStr] = key.split(':')
      const name = await getEntityName(et, Number(eidStr))
      entityNameMap.set(key, name)
    }

    return appointments
      .filter((a) => a.appointmentTime !== null)
      .map((a) => {
        const t = a.appointmentTime!
        const entityKey = `${a.entityType}:${a.entityId ?? 0}`
        return {
          id: a.id,
          date: t.toISOString().slice(0, 10),
          time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
          fullTime: t.toISOString(),
          type: a.appointmentType ?? 'other',
          person: a.appointmentPerson ?? null,
          location: a.appointmentLocation ?? null,
          content: a.content,
          done: a.done,
          entityName: entityNameMap.get(entityKey) ?? null,
          entityType: a.entityType,
        }
      })
  } catch {
    return []
  }
}

// ── 将数据库中所有笔记同步生成 MD 文件 ───────────
export async function syncAllNotesMd() {
  try {
    const notes = await prisma.note.findMany()
    for (const note of notes) {
      await writeNoteMd(await toNoteData(note)).catch(() => {})
    }
    return { success: true, count: notes.length }
  } catch {
    return { success: false, count: 0 }
  }
}
