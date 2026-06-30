import type { StatusBadgeVariant } from '@/components/ui/StatusBadge'
import { Prisma } from '@prisma/client'

import { prisma } from './prisma'
import { formatDateLabel, startOfToday } from './date'

export interface TrendPoint {
  candidates: number
  companies: number
  jobs: number
  label: string
}

export interface KpiStats {
  candidates: number
  companies: number
  conversionRate: string
  followCandidates: number
  highMatches: number
  jobs: number
  pendingJobs: number
  todayCandidates: number
  todayCompanies: number
  todayJobs: number
}

export interface KanbanCandidateData {
  id: number
  name: string
  currentTitle: string | null
  status: string
  bestMatchScore: number | null
}

export interface DashboardStats {
  candidateStatusDistribution: Array<{ count: number; label: string }>
  jobStatusDistribution: Array<{ count: number; label: string }>
  kanbanCandidates: KanbanCandidateData[]
  kpi: KpiStats
  latestCandidates: Array<{
    href: string
    name: string
    status: string
    title: string | null
  }>
  tasks: Array<{
    action: string
    href: string
    owner: string
    priority: '高' | '中' | '低'
    target: string
    time: string
    type: string
  }>
  topJobs: Array<{ count: number; rank: number; title: string }>
  trend: TrendPoint[]
}

function statusVariant(status: string | null): StatusBadgeVariant {
  if (status === '已推荐' || status === '已沟通') return 'progress'
  if (status === '入职') return 'success'
  if (status === '淘汰') return 'risk'
  return 'pending'
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  return `${days} 天前`
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = startOfToday()

  const [
    companiesCount,
    jobsCount,
    candidatesCount,
    todayCompanies,
    todayJobs,
    todayCandidates,
    highMatches,
    followCandidates,
    pendingJobs,
    totalMatches,
    hiredMatches,
    jobStatusGroups,
    candidateStatusGroups,
    recentCandidates,
    topJobsByMatches,
    followUpCandidates,
    highScoreUnrecommendedMatches,
    draftJobs,
    kanbanCandidatesRaw,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.job.count(),
    prisma.candidate.count(),
    prisma.company.count({ where: { createdAt: { gte: today } } }),
    prisma.job.count({ where: { createdAt: { gte: today } } }),
    prisma.candidate.count({ where: { createdAt: { gte: today } } }),
    prisma.match.count({ where: { score: { gte: 80 } } }),
    prisma.candidate.count({
      where: { OR: [{ status: '待跟进' }, { communication: '待跟进' }] },
    }),
    prisma.job.count({ where: { status: { in: ['待发布', '招聘中'] } } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: '已入职' } }),
    prisma.job.groupBy({
      by: [Prisma.JobScalarFieldEnum.status],
      _count: { status: true },
    }),
    prisma.candidate.groupBy({
      by: [Prisma.CandidateScalarFieldEnum.status],
      _count: { status: true },
    }),
    prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, currentTitle: true },
      take: 5,
    }),
    prisma.match.groupBy({
      by: ['jobId'],
      _count: { jobId: true },
      orderBy: { _count: { jobId: 'desc' } },
      take: 5,
    }),
    prisma.candidate.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, currentTitle: true, name: true, status: true, updatedAt: true },
      take: 3,
      where: { OR: [{ status: '待跟进' }, { communication: '待跟进' }] },
    }),
    prisma.match.findMany({
      include: { candidate: true, job: true },
      orderBy: { score: 'desc' },
      take: 2,
      where: {
        AND: [{ score: { gte: 80 } }, { status: { notIn: ['已推荐', '已入职', '已拒绝'] } }],
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      select: { companyName: true, id: true, title: true },
      take: 2,
      where: { status: '待发布' },
    }),
    // Real candidates for the Kanban board (up to 30, with best match score)
    prisma.candidate.findMany({
      select: {
        id: true,
        name: true,
        currentTitle: true,
        status: true,
        matches: {
          select: { score: true },
          orderBy: { score: 'desc' },
          take: 1,
        },
      },
      where: {
        status: {
          in: [
            '待沟通', '初筛', '待联系', '新建',
            '面试中', '已沟通',
            '已推荐', 'Offer',
            '入职', '已入职',
            '淘汰', '不合适',
            '过期', '已过期',
          ],
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }),
  ])

  // 7-day trend — 用 Prisma ORM 替代 $queryRaw 避免 Vercel 兼容性问题
  const trendStartDate = new Date(today)
  trendStartDate.setDate(trendStartDate.getDate() - 6)

  const [companyTrendData, jobTrendData, candidateTrendData] = await Promise.all([
    prisma.company.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true },
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true },
    }),
    prisma.candidate.findMany({
      where: { createdAt: { gte: trendStartDate } },
      select: { createdAt: true },
    }),
  ])

  // Build lookup maps: { "2026-06-20": count }
  function groupByDate(rows: Array<{ createdAt: Date }>): Map<string, number> {
    const map = new Map<string, number>()
    for (const row of rows) {
      const dateStr = row.createdAt.toISOString().slice(0, 10)
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1)
    }
    return map
  }

  const companyMap = groupByDate(companyTrendData)
  const jobMap = groupByDate(jobTrendData)
  const candidateMap = groupByDate(candidateTrendData)

  const trend: TrendPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10) // "YYYY-MM-DD"
    trend.push({
      candidates: candidateMap.get(dateStr) ?? 0,
      companies: companyMap.get(dateStr) ?? 0,
      jobs: jobMap.get(dateStr) ?? 0,
      label: formatDateLabel(date),
    })
  }

  const conversionRate = totalMatches > 0 ? ((hiredMatches / totalMatches) * 100).toFixed(1) : '0.0'

  const tasks: DashboardStats['tasks'] = [
    ...followUpCandidates.map((candidate) => ({
      action: '跟进' as const,
      href: `/candidates`,
      owner: candidate.name,
      priority: '高' as const,
      target: candidate.currentTitle || '候选人',
      time: formatRelativeTime(candidate.updatedAt),
      type: '候选沟通',
    })),
    ...highScoreUnrecommendedMatches.map((match) => ({
      action: '匹配' as const,
      href: `/match`,
      owner: match.candidate.name,
      priority: '高' as const,
      target: match.job.title,
      time: `${match.score} 分`,
      type: '高优先 Match',
    })),
    ...draftJobs.map((job) => ({
      action: '补人' as const,
      href: `/jobs`,
      owner: job.companyName,
      priority: '中' as const,
      target: job.title,
      time: '待发布',
      type: '待匹配岗位',
    })),
  ]

  // Fill with generic tasks if DB is empty so the dashboard doesn't look broken
  if (tasks.length === 0) {
    tasks.push(
      {
        action: '新增',
        href: '/candidates',
        owner: '系统',
        priority: '中',
        target: '录入第一批候选人',
        time: '刚刚开始',
        type: '初始化',
      },
      {
        action: '新增',
        href: '/jobs',
        owner: '系统',
        priority: '中',
        target: '录入第一个岗位',
        time: '刚刚开始',
        type: '初始化',
      },
      {
        action: '匹配',
        href: '/match',
        owner: '系统',
        priority: '低',
        target: '体验 AI 匹配评分',
        time: '推荐',
        type: '初始化',
      }
    )
  }

  const jobStatusDistribution = jobStatusGroups
    .filter((group) => group._count.status > 0)
    .map((group) => ({ count: group._count.status, label: group.status || '未分类' }))

  if (jobStatusDistribution.length === 0) {
    jobStatusDistribution.push({ count: 0, label: '暂无数据' })
  }

  const candidateStatusDistribution = candidateStatusGroups
    .filter((group) => group._count.status > 0)
    .map((group) => ({ count: group._count.status, label: group.status || '未分类' }))

  if (candidateStatusDistribution.length === 0) {
    candidateStatusDistribution.push({ count: 0, label: '暂无数据' })
  }

  const topJobDetails = await prisma.job.findMany({
    select: { id: true, title: true },
    where: { id: { in: topJobsByMatches.map((item) => item.jobId) } },
  })

  const topJobs: DashboardStats['topJobs'] = topJobsByMatches
    .map((item, index) => {
      const job = topJobDetails.find((j) => j.id === item.jobId)
      return {
        count: item._count.jobId,
        rank: index + 1,
        title: job?.title || '未知岗位',
      }
    })
    .slice(0, 5)

  const latestCandidates = recentCandidates.map((candidate) => ({
    href: '/candidates',
    name: candidate.name,
    status: candidate.status,
    title: candidate.currentTitle,
  }))

  // Map kanban candidates with their best match score
  const kanbanCandidates: KanbanCandidateData[] = kanbanCandidatesRaw.map((c) => ({
    bestMatchScore: c.matches.length > 0 ? c.matches[0].score : null,
    currentTitle: c.currentTitle,
    id: c.id,
    name: c.name,
    status: c.status,
  }))

  return {
    candidateStatusDistribution,
    jobStatusDistribution,
    kanbanCandidates,
    kpi: {
      candidates: candidatesCount,
      companies: companiesCount,
      conversionRate: `${conversionRate}%`,
      followCandidates,
      highMatches,
      jobs: jobsCount,
      pendingJobs,
      todayCandidates,
      todayCompanies,
      todayJobs,
    },
    latestCandidates,
    tasks,
    topJobs,
    trend,
  }
}

export { statusVariant }
