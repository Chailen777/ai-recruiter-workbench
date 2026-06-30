/**
 * GET /api/agent/[library]
 *
 * 列出指定库的所有 Markdown 文件（摘要索引）
 *
 * 参数：
 *   library = companies | jobs | candidates | knowledge | schools | charts | info | matches
 *
 * 响应示例：
 * {
 *   "library": "companies",
 *   "count": 3,
 *   "files": [
 *     { "id": "0001", "filename": "0001-腾讯.md", "path": "/api/agent/companies/1", "size": 1024 }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_ROOT = path.join(process.cwd(), 'data')

const VALID_LIBRARIES = ['companies', 'jobs', 'candidates', 'knowledge', 'schools', 'charts', 'info', 'matches']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ library: string }> }
) {
  const { library } = await params

  if (!VALID_LIBRARIES.includes(library)) {
    return NextResponse.json(
      { error: `库 "${library}" 不存在，可用库：${VALID_LIBRARIES.join(', ')}` },
      { status: 404 }
    )
  }

  const dir = path.join(DATA_ROOT, library)

  if (!fs.existsSync(dir)) {
    return NextResponse.json({
      library,
      count: 0,
      files: [],
      message: '该库暂无数据',
    })
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(filename => {
      const fullPath = path.join(dir, filename)
      const stat = fs.statSync(fullPath)
      // 从文件名提取 id（前4位数字）
      const idMatch = filename.match(/^(\d+)-/)
      const id = idMatch ? parseInt(idMatch[1], 10) : null
      // 提取名称（去掉前缀数字和后缀.md）
      const name = filename.replace(/^\d+-/, '').replace(/\.md$/, '')

      return {
        id,
        name,
        filename,
        path: id ? `/api/agent/${library}/${id}` : null,
        size: stat.size,
        updatedAt: stat.mtime.toISOString().slice(0, 10),
      }
    })

  return NextResponse.json({
    library,
    count: files.length,
    files,
  })
}
