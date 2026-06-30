/**
 * GET /api/agent/[library]/[id]
 *
 * 获取指定记录的完整 Markdown 内容
 *
 * 响应示例（?format=json 时）：
 * {
 *   "library": "companies",
 *   "id": 1,
 *   "filename": "0001-腾讯.md",
 *   "content": "---\nid: 1\n..."
 * }
 *
 * 响应示例（默认 text/markdown）：
 *   直接返回 .md 文件内容，便于 Agent 直接阅读
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_ROOT = path.join(process.cwd(), 'data')

const VALID_LIBRARIES = ['companies', 'jobs', 'candidates', 'knowledge', 'schools', 'charts', 'info', 'matches']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ library: string; id: string }> }
) {
  const { library, id } = await params

  if (!VALID_LIBRARIES.includes(library)) {
    return NextResponse.json(
      { error: `库 "${library}" 不存在` },
      { status: 404 }
    )
  }

  const numId = parseInt(id, 10)
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ error: 'ID 必须是正整数' }, { status: 400 })
  }

  const dir = path.join(DATA_ROOT, library)
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: '该库暂无数据' }, { status: 404 })
  }

  // 查找以 padded id 开头的文件
  const prefix = String(numId).padStart(4, '0') + '-'
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.md'))

  if (files.length === 0) {
    return NextResponse.json({ error: `ID ${numId} 的记录不存在` }, { status: 404 })
  }

  const filename = files[0]
  const content = fs.readFileSync(path.join(dir, filename), 'utf-8')

  // 支持 ?format=json 返回 JSON，默认返回纯 Markdown
  const format = request.nextUrl.searchParams.get('format')
  if (format === 'json') {
    return NextResponse.json({
      library,
      id: numId,
      filename,
      content,
    })
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
