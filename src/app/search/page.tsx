import { DetailPanel, PaginatedSearchList } from '@/components/ui'
import type { SearchItem } from '@/components/ui'
import { SearchCards } from './SearchCards'
import { prisma } from '@/lib/prisma'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  if (!query)
    return (
      <DetailPanel title="搜索结果">
        <p className="muted">请输入搜索关键词。</p>
      </DetailPanel>
    )

  const [candidates, jobs, companies, knowledges, schools, charts, infos, contacts, projects, notes] =
    await Promise.all([
      prisma.candidate.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { currentTitle: { contains: query } },
            { skillTags: { contains: query } },
            { currentCompany: { contains: query } },
            { city: { contains: query } },
          ],
        },
      }),
      prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { companyName: { contains: query } },
            { skillKeywords: { contains: query } },
            { city: { contains: query } },
          ],
        },
      }),
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { industry: { contains: query } },
            { city: { contains: query } },
          ],
        },
        include: { _count: { select: { jobs: true } } },
      }),
      prisma.knowledge.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { tags: { contains: query } },
            { category: { contains: query } },
          ],
        },
      }),
      prisma.school.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { city: { contains: query } },
            { mainMajors: { contains: query } },
          ],
        },
      }),
      prisma.chart.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { statDimension: { contains: query } },
          ],
        },
      }),
      prisma.info.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { category: { contains: query } },
          ],
        },
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { company: { contains: query } },
            { position: { contains: query } },
            { tags: { contains: query } },
          ],
        },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { clientCompany: { contains: query } },
            { tags: { contains: query } },
          ],
        },
      }),
      prisma.note.findMany({
        where: { content: { contains: query } },
      }),
    ])

  const total =
    candidates.length +
    jobs.length +
    companies.length +
    knowledges.length +
    schools.length +
    charts.length +
    infos.length +
    contacts.length +
    projects.length +
    notes.length

  const serializedCandidates = candidates.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const knowledgeItems: SearchItem[] = knowledges.map((k) => ({
    badge: '知识库',
    badgeVariant: 'pending',
    href: `/knowledge?knowledgeId=${k.id}`,
    id: `kn-${k.id}`,
    meta: `${k.category || '未分类'} · ${k.author || '未知作者'}`,
    title: k.title,
  }))

  const schoolItems: SearchItem[] = schools.map((s) => ({
    badge: '学校库',
    badgeVariant: 'pending',
    href: `/schools?schoolId=${s.id}`,
    id: `sc-${s.id}`,
    meta: `${s.schoolType || '类型未知'} · ${s.city || '城市未填写'}`,
    title: s.name,
  }))

  const chartItems: SearchItem[] = charts.map((c) => ({
    badge: '图表库',
    badgeVariant: 'pending',
    href: `/charts?chartId=${c.id}`,
    id: `ch-${c.id}`,
    meta: `${c.statDimension || ''} · ${c.creator || ''}`,
    title: c.title,
  }))

  const infoItems: SearchItem[] = infos.map((i) => ({
    badge: '信息库',
    badgeVariant: 'pending',
    href: `/info?infoId=${i.id}`,
    id: `in-${i.id}`,
    meta: `${i.category || ''}${i.urgency ? ' · ' + i.urgency : ''}`,
    title: i.title,
  }))

  const contactItems: SearchItem[] = contacts.map((c) => ({
    badge: '人脉库',
    badgeVariant: 'progress',
    href: `/contacts?contactId=${c.id}`,
    id: `ct-${c.id}`,
    meta: `${c.company || ''}${c.position ? ' · ' + c.position : ''}`,
    title: c.name,
  }))

  const projectItems: SearchItem[] = projects.map((p) => ({
    badge: '项目库',
    badgeVariant: 'progress',
    href: `/projects?projectId=${p.id}`,
    id: `pj-${p.id}`,
    meta: `${p.clientCompany || ''} · ${p.status || '状态未知'}`,
    title: p.name,
  }))

  const noteItems: SearchItem[] = notes.map((n) => ({
    badge: '备忘录',
    badgeVariant: 'progress',
    href: '#',
    id: `nt-${n.id}`,
    meta: n.type === 'todo' ? '待办' : n.type === 'log' ? '沟通记录' : '笔记',
    title: n.content.length > 60 ? n.content.slice(0, 60) + '…' : n.content,
  }))

  return (
    <div className="search-page">
      <DetailPanel description={`找到 ${total} 条结果`} title={`搜索：${query}`}>
        {total === 0 && <p className="muted">没有找到匹配结果，换个关键词试试。</p>}
      </DetailPanel>

      <SearchCards
        companies={companies.map((c) => ({ ...c, jobsCount: c._count.jobs }))}
        jobs={jobs}
        candidates={serializedCandidates}
      />

      {knowledgeItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配知识。"
          items={knowledgeItems}
          pageSize={10}
          title={`知识库 (${knowledgeItems.length})`}
        />
      )}
      {schoolItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配学校。"
          items={schoolItems}
          pageSize={10}
          title={`学校库 (${schoolItems.length})`}
        />
      )}
      {chartItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配图表。"
          items={chartItems}
          pageSize={10}
          title={`图表库 (${chartItems.length})`}
        />
      )}
      {infoItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配信息。"
          items={infoItems}
          pageSize={10}
          title={`信息库 (${infoItems.length})`}
        />
      )}
      {contactItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配人脉。"
          items={contactItems}
          pageSize={10}
          title={`人脉库 (${contactItems.length})`}
        />
      )}
      {projectItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配项目。"
          items={projectItems}
          pageSize={10}
          title={`项目库 (${projectItems.length})`}
        />
      )}
      {noteItems.length > 0 && (
        <PaginatedSearchList
          emptyText="没有找到匹配备忘录。"
          items={noteItems}
          pageSize={10}
          title={`备忘录 (${noteItems.length})`}
        />
      )}
    </div>
  )
}
