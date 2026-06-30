import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (!q || q.length < 1) {
    return NextResponse.json(
      { results: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' } },
    )
  }

  /* ── 各表并行搜索（Prisma ORM，无原生SQL） ── */
  const [
    candidates,
    jobs,
    companies,
    knowledges,
    schools,
    charts,
    infos,
    contacts,
    projects,
    notes,
  ] = await Promise.all([
    // candidates
    prisma.candidate.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { currentTitle: { contains: q } },
          { currentCompany: { contains: q } },
          { skillTags: { contains: q } },
          { city: { contains: q } },
        ],
      },
      select: { id: true, name: true, currentTitle: true, city: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] candidate query failed:', err)
      return []
    }),
    // jobs
    prisma.job.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { companyName: { contains: q } },
          { skillKeywords: { contains: q } },
          { city: { contains: q } },
        ],
      },
      select: { id: true, title: true, companyName: true, city: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] job query failed:', err)
      return []
    }),
    // companies
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { industry: { contains: q } },
          { city: { contains: q } },
        ],
      },
      select: { id: true, name: true, industry: true, city: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] company query failed:', err)
      return []
    }),
    // knowledges
    prisma.knowledge.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { tags: { contains: q } },
          { category: { contains: q } },
        ],
      },
      select: { id: true, title: true, category: true, author: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] knowledge query failed:', err)
      return []
    }),
    // schools
    prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { city: { contains: q } },
          { mainMajors: { contains: q } },
        ],
      },
      select: { id: true, name: true, schoolType: true, city: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] school query failed:', err)
      return []
    }),
    // charts
    prisma.chart.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { statDimension: { contains: q } },
        ],
      },
      select: { id: true, title: true, statDimension: true, creator: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] chart query failed:', err)
      return []
    }),
    // infos
    prisma.info.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { category: { contains: q } },
        ],
      },
      select: { id: true, title: true, category: true, urgency: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] info query failed:', err)
      return []
    }),
    // contacts
    prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { company: { contains: q } },
          { position: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      select: { id: true, name: true, company: true, position: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] contact query failed:', err)
      return []
    }),
    // projects
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { clientCompany: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      select: { id: true, name: true, clientCompany: true, status: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] project query failed:', err)
      return []
    }),
    // notes
    prisma.note.findMany({
      where: { content: { contains: q } },
      select: { id: true, content: true, type: true },
      take: 5,
    }).catch((err) => {
      console.error('[search] note query failed:', err)
      return []
    }),
  ])

  /* ── 映射为标准结果格式 ── */
  const results: {
    href: string
    id: number
    kind: string
    subtitle: string
    title: string
  }[] = []

  for (const c of candidates) {
    results.push({
      href: `/candidates?candidateId=${c.id}`,
      id: c.id,
      kind: 'candidate',
      subtitle: [c.currentTitle, c.city].filter(Boolean).join(' · ') || '候选人',
      title: c.name,
    })
  }
  for (const j of jobs) {
    results.push({
      href: `/jobs?jobId=${j.id}`,
      id: j.id,
      kind: 'job',
      subtitle: [j.companyName, j.city].filter(Boolean).join(' · ') || '岗位',
      title: j.title,
    })
  }
  for (const c of companies) {
    results.push({
      href: `/companies?companyId=${c.id}`,
      id: c.id,
      kind: 'company',
      subtitle: [c.industry, c.city].filter(Boolean).join(' · ') || '企业',
      title: c.name,
    })
  }
  for (const k of knowledges) {
    results.push({
      href: `/knowledge?knowledgeId=${k.id}`,
      id: k.id,
      kind: 'knowledge',
      subtitle: [k.category, k.author].filter(Boolean).join(' · ') || '知识库',
      title: k.title,
    })
  }
  for (const s of schools) {
    results.push({
      href: `/schools?schoolId=${s.id}`,
      id: s.id,
      kind: 'school',
      subtitle: [s.schoolType, s.city].filter(Boolean).join(' · ') || '学校库',
      title: s.name,
    })
  }
  for (const c of charts) {
    results.push({
      href: `/charts?chartId=${c.id}`,
      id: c.id,
      kind: 'chart',
      subtitle: [c.statDimension, c.creator].filter(Boolean).join(' · ') || '图表库',
      title: c.title,
    })
  }
  for (const i of infos) {
    results.push({
      href: `/info?infoId=${i.id}`,
      id: i.id,
      kind: 'info',
      subtitle: [i.category, i.urgency].filter(Boolean).join(' · ') || '信息库',
      title: i.title,
    })
  }
  for (const c of contacts) {
    results.push({
      href: `/contacts?contactId=${c.id}`,
      id: c.id,
      kind: 'contact',
      subtitle: [c.company, c.position].filter(Boolean).join(' · ') || '人脉库',
      title: c.name,
    })
  }
  for (const p of projects) {
    results.push({
      href: `/projects?projectId=${p.id}`,
      id: p.id,
      kind: 'project',
      subtitle: [p.clientCompany, p.status].filter(Boolean).join(' · ') || '项目库',
      title: p.name,
    })
  }
  for (const n of notes) {
    results.push({
      href: '#',
      id: n.id,
      kind: 'note',
      subtitle: n.type === 'todo' ? '待办' : n.type === 'log' ? '沟通记录' : '笔记库',
      title: n.content.length > 60 ? n.content.slice(0, 60) + '\u2026' : n.content,
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
