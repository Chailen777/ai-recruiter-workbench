import { cache } from 'react'
import { prisma } from './prisma'

/**
 * React.cache() 包装的 Prisma 查询，在同一请求内自动去重
 * 防止同一请求中多次查询相同数据（如 Server Components 和 Server Actions 同时调用）
 */

export const getCachedCandidates = cache(
  () => prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' } })
)

export const getCachedJobs = cache(
  () => prisma.job.findMany({ orderBy: { updatedAt: 'desc' } })
)

export const getCachedCompanies = cache(
  () => prisma.company.findMany({ orderBy: { name: 'asc' } })
)

export const getCachedMatches = cache(
  () => prisma.match.findMany({
    include: { candidate: true, job: true },
    orderBy: { createdAt: 'desc' },
  })
)

export const getCachedMatchStatuses = cache(
  () => prisma.match.findMany({
    select: { candidateId: true, jobId: true, status: true },
  })
)

/**
 * 获取候选人匹配的所有岗位状态
 */
export const getCachedMatchStatusMap = cache(
  async () => {
    const matches = await getCachedMatchStatuses()
    const map = new Map<string, string>()
    for (const m of matches) {
      map.set(`${m.candidateId}-${m.jobId}`, m.status)
    }
    return map
  }
)
