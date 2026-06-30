import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SearchRow = {
  id: number
  name?: string
  title?: string
  subtitle1?: string | null
  subtitle2?: string | null
}

/* ── 分词：按空白字符拆分 ── */
function tokenize(q: string): string[] {
  return q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
}

/* ── 构建参数化搜索 SQL ──
   每个 token 在任意字段中出现 (OR)
   所有 token 都必须匹配 (AND)
   比简单的 LIKE '%wholeQuery%' 精确得多 */
function buildSearchSQL(
  table: string,
  fields: string[],
  tokens: string[],
  select: string,
  limit = 5,
): [string, string[]] {
  const params: string[] = []

  const tokenClauses = tokens.map((token) => {
    const fieldConds = fields.map((f) => {
      params.push(`%${token}%`)
      return `"${f}" LIKE ?`
    })
    return `(${fieldConds.join(' OR ')})`
  })

  const where = tokenClauses.join(' AND ')
  const sql = `SELECT ${select} FROM "${table}" WHERE ${where} LIMIT ${limit}`
  return [sql, params]
}

/* ── 辅助：执行搜索 ── */
async function searchTable<T>(
  table: string,
  fields: string[],
  tokens: string[],
  select: string,
  limit = 5,
): Promise<T[]> {
  const [sql, params] = buildSearchSQL(table, fields, tokens, select, limit)
  return prisma.$queryRawUnsafe<T[]>(sql, ...params)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (!q || q.length < 1) {
    return NextResponse.json(
      { results: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } },
    )
  }

  const tokens = tokenize(q)
  if (tokens.length === 0) {
    return NextResponse.json(
      { results: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } },
    )
  }

  /* ── 各表搜索字段定义 ── */
  const tableDefs: {
    fields: string[]
    kind: string
    select: string
    table: string
  }[] = [
    {
      fields: ['name', 'currentTitle', 'currentCompany', 'skillTags', 'city'],
      kind: 'candidate',
      select: 'id, name, "currentTitle" AS subtitle1, city AS subtitle2',
      table: 'candidate',
    },
    {
      fields: ['title', 'companyName', 'skillKeywords', 'city'],
      kind: 'job',
      select: 'id, title, "companyName" AS subtitle1, city AS subtitle2',
      table: 'job',
    },
    {
      fields: ['name', 'industry', 'city'],
      kind: 'company',
      select: 'id, name, industry AS subtitle1, city AS subtitle2',
      table: 'company',
    },
    {
      fields: ['title', 'content', 'tags', 'category'],
      kind: 'knowledge',
      select: 'id, title, category AS subtitle1, author AS subtitle2',
      table: 'knowledge',
    },
    {
      fields: ['name', 'city', 'mainMajors', 'schoolCategory'],
      kind: 'school',
      select: 'id, name, "schoolType" AS subtitle1, city AS subtitle2',
      table: 'school',
    },
    {
      fields: ['title', 'content', 'statDimension', 'creator'],
      kind: 'chart',
      select: 'id, title, "statDimension" AS subtitle1, creator AS subtitle2',
      table: 'chart',
    },
    {
      fields: ['title', 'content', 'category'],
      kind: 'info',
      select: 'id, title, category AS subtitle1, urgency AS subtitle2',
      table: 'info',
    },
    {
      fields: ['name', 'company', 'position', 'phone', 'tags'],
      kind: 'contact',
      select: 'id, name, company AS subtitle1, position AS subtitle2',
      table: 'contact',
    },
    {
      fields: ['name', 'clientCompany', 'tags', 'industry'],
      kind: 'project',
      select: 'id, name, "clientCompany" AS subtitle1, status AS subtitle2',
      table: 'project',
    },
    {
      fields: ['content'],
      kind: 'note',
      select: 'id, content, type',
      table: 'note',
    },
  ]

  /* ── 各表独立搜索（可并行），每个表独立容错 ── */
  const searchPromises = tableDefs
    .filter((d) => d.kind !== 'note')
    .map((d) =>
      searchTable<{ id: number; name?: string; title?: string; subtitle1?: string; subtitle2?: string }>(
        d.table,
        d.fields,
        tokens,
        d.select,
      ).then((rows) => ({ kind: d.kind, rows }))
        .catch((err) => {
          console.error(`[search] table "${d.table}" query failed:`, err)
          return { kind: d.kind, rows: [] as { id: number; name?: string; title?: string; subtitle1?: string; subtitle2?: string }[] }
        }),
    )

  const notesPromise = searchTable<{ id: number; content: string; type: string }>(
    'note',
    ['content'],
    tokens,
    'id, content, type',
  ).catch((err) => {
    console.error('[search] notes table query failed:', err)
    return [] as { id: number; content: string; type: string }[]
  })

  const [searchResults, notesRows] = await Promise.all([
    Promise.all(searchPromises),
    notesPromise,
  ])

  /* ── 映射为标准结果格式 ── */
  const results: {
    href: string
    id: number
    kind: string
    subtitle: string
    title: string
  }[] = []

  // 处理普通表搜索结果（已正确类型化）
  for (const { kind, rows } of searchResults) {
    switch (kind) {
      case 'candidate':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/candidates?candidateId=${r.id}`,
            id: r.id,
            kind: 'candidate',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '候选人',
            title: r.name || '',
          })
        }
        break
      case 'job':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/jobs?jobId=${r.id}`,
            id: r.id,
            kind: 'job',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '岗位',
            title: r.title || '',
          })
        }
        break
      case 'company':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/companies?companyId=${r.id}`,
            id: r.id,
            kind: 'company',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '企业',
            title: r.name || '',
          })
        }
        break
      case 'knowledge':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/knowledge?knowledgeId=${r.id}`,
            id: r.id,
            kind: 'knowledge',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '知识库',
            title: r.title || '',
          })
        }
        break
      case 'school':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/schools?schoolId=${r.id}`,
            id: r.id,
            kind: 'school',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '学校库',
            title: r.name || '',
          })
        }
        break
      case 'chart':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/charts?chartId=${r.id}`,
            id: r.id,
            kind: 'chart',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '图表库',
            title: r.title || '',
          })
        }
        break
      case 'info':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/info?infoId=${r.id}`,
            id: r.id,
            kind: 'info',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '信息库',
            title: r.title || '',
          })
        }
        break
      case 'contact':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/contacts?contactId=${r.id}`,
            id: r.id,
            kind: 'contact',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '人脉库',
            title: r.name || '',
          })
        }
        break
      case 'project':
        for (const r of rows as SearchRow[]) {
          results.push({
            href: `/projects?projectId=${r.id}`,
            id: r.id,
            kind: 'project',
            subtitle: [r.subtitle1, r.subtitle2].filter(Boolean).join(' · ') || '项目库',
            title: r.name || '',
          })
        }
        break
    }
  }

  // 单独处理笔记搜索结果（类型不同）
  for (const r of notesRows) {
    results.push({
      href: '#',
      id: r.id,
      kind: 'note',
      subtitle: r.type === 'todo' ? '待办' : r.type === 'log' ? '沟通记录' : '笔记库',
      title: r.content.length > 60 ? r.content.slice(0, 60) + '\u2026' : r.content,
    })
  }

  return NextResponse.json(
    { results: results.slice(0, 25) },
    {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    },
  )
}
