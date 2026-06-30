/**
 * GET /api/agent
 *
 * AI Agent 入口：列出所有库及各库的文件数量
 *
 * 响应示例：
 * {
 *   "libraries": [
 *     { "name": "companies", "label": "企业库", "count": 12, "path": "/api/agent/companies" },
 *     ...
 *   ]
 * }
 */

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_ROOT = path.join(process.cwd(), 'data')

const LIBRARY_LABELS: Record<string, string> = {
  companies: '企业库',
  jobs: '岗位库',
  candidates: '人才库',
  knowledge: '知识库',
  schools: '学校库',
  charts: '图表库',
  info: '信息库',
  matches: '匹配库',
}

export async function GET() {
  const libraries = Object.entries(LIBRARY_LABELS).map(([name, label]) => {
    const dir = path.join(DATA_ROOT, name)
    let count = 0
    if (fs.existsSync(dir)) {
      count = fs.readdirSync(dir).filter(f => f.endsWith('.md')).length
    }
    return {
      name,
      label,
      count,
      path: `/api/agent/${name}`,
    }
  })

  return NextResponse.json({
    description: 'AI超级猎头工作台 — Agent 数据访问接口',
    usage: 'GET /api/agent/<library> 列出所有文件; GET /api/agent/<library>/<id> 获取单条记录',
    libraries,
    totalRecords: libraries.reduce((sum, l) => sum + l.count, 0),
  })
}
