import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncNotesToMd } from '@/lib/notes-md'
import { writeNoteMd, deleteNoteMd } from '@/lib/notes-data-md'

/* ═══════════════════════════════════════════════════════
   Notes REST API — 供桌面笔记插件 (WebView2) 调用
   GET  /api/notes?search=&type=&limit=50        — 列表
   POST /api/notes                                — 新增
   PATCH /api/notes                              — 切换 pin/done
   DELETE /api/notes?id=123                       — 删除
   ═══════════════════════════════════════════════════════ */

// ── CORS 支持（桌面笔记通过 file:// 协议加载，需要 CORS）──
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// OPTIONS 预检请求处理
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers as Record<string, string> || {}) },
  })
}

function err(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: CORS_HEADERS }
  )
}

async function syncMd(note: { entityType: string; entityId: number }) {
  try {
    const notes = await prisma.note.findMany({
      where: { entityType: note.entityType, entityId: note.entityId },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    })
    await syncNotesToMd(note.entityType, note.entityId, notes)
  } catch { /* best effort */ }
}

// ── GET: 列表查询 ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || ''
    const entityType = searchParams.get('entityType') || 'global'
    const entityId = parseInt(searchParams.get('entityId') || '0', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const pinned = searchParams.get('pinned')
    const done = searchParams.get('done') // 'true' = only done, 'false' = only undone

    const where: Record<string, unknown> = {}

    if (entityType) where.entityType = entityType
    if (entityId || entityId === 0) where.entityId = entityId

    if (q) {
      where.content = { contains: q }
    }
    if (type) where.type = type
    if (pinned === 'true') where.pinned = true
    if (pinned === 'false') where.pinned = false
    if (done === 'true') where.done = true
    if (done === 'false') where.done = false

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    return ok(
      { success: true, data: notes, count: notes.length },
      { headers: { 'Cache-Control': 'private, max-age=5, stale-while-revalidate=30' } }
    )
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : '查询失败')
  }
}

// ── POST: 新增笔记 ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, type = 'note', entityType = 'global', entityId = 0, pinned = false, appointmentTime, appointmentPerson, appointmentLocation, appointmentType: apptType } = body

    if (!content || !content.trim()) {
      return err('内容不能为空', 400)
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        type,
        entityType,
        entityId: entityId || 0,
        pinned: !!pinned,
        ...(appointmentTime ? { appointmentTime: new Date(appointmentTime) } : {}),
        ...(appointmentPerson ? { appointmentPerson: appointmentPerson.trim() } : {}),
        ...(appointmentLocation ? { appointmentLocation: appointmentLocation.trim() } : {}),
        ...(apptType ? { appointmentType: apptType } : {}),
      },
    })

    // 同步到 Markdown
    await syncMd({ entityType, entityId: entityId || 0 })
    try {
      await writeNoteMd({
        id: note.id,
        type: note.type,
        content: note.content,
        entityType: note.entityType,
        entityId: note.entityId,
        pinned: note.pinned,
        bookmarked: note.bookmarked,
        done: note.done,
        person: note.person ?? null,
        createdAt: note.createdAt,
        author: '陈成',
      })
    } catch { /* best effort */ }

    return ok({ success: true, data: note }, { status: 201 })
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : '创建失败')
  }
}

// ── PATCH: 切换置顶 / 完成状态 ──
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action } = body

    if (!id) {
      return err('缺少笔记 ID', 400)
    }

    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing) {
      return err('笔记不存在', 404)
    }

    let updated: Awaited<ReturnType<typeof prisma.note.update>> | undefined

    if (action === 'togglePin') {
      updated = await prisma.note.update({
        where: { id },
        data: { pinned: !existing.pinned },
      })
    } else if (action === 'toggleDone') {
      updated = await prisma.note.update({
        where: { id },
        data: { done: !existing.done },
      })
    } else if (action === 'update') {
      const { content, type } = body
      updated = await prisma.note.update({
        where: { id },
        data: {
          ...(content !== undefined ? { content } : {}),
          ...(type !== undefined ? { type } : {}),
        },
      })
    } else {
      return err('不支持的操作', 400)
    }

    if (!updated) return err('更新失败', 500)

    await syncMd({ entityType: updated.entityType, entityId: updated.entityId })
    try {
      await writeNoteMd({
        id: updated.id,
        type: updated.type,
        content: updated.content,
        entityType: updated.entityType,
        entityId: updated.entityId,
        pinned: updated.pinned,
        bookmarked: updated.bookmarked,
        done: updated.done,
        person: updated.person ?? null,
        createdAt: updated.createdAt,
        author: '陈成',
      })
    } catch { /* best effort */ }

    return ok({ success: true, data: updated })
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : '更新失败')
  }
}

// ── DELETE: 删除笔记 ──
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const idStr = searchParams.get('id')
    if (!idStr) {
      return err('缺少笔记 ID', 400)
    }

    const id = parseInt(idStr, 10)
    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing) {
      return err('笔记不存在', 404)
    }

    await prisma.note.delete({ where: { id } })

    await syncMd({ entityType: existing.entityType, entityId: existing.entityId })
    try { await deleteNoteMd(id) } catch { /* best effort */ }

    return ok({ success: true, message: '已删除' })
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : '删除失败')
  }
}
