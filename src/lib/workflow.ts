import { PrismaClient } from '@prisma/client'
import { startOfToday } from './date'

export const candidateFlow = [
  '新建',
  '已沟通',
  '已推荐',
  '面试中',
  'Offer',
  '入职',
  '淘汰',
] as const
export const jobFlow = ['进行中', '待发布', '已关闭'] as const
export const matchFlow = ['未推荐', '已推荐', '已拒绝', '已淘汰', '已放弃', '已跟进', '已成交'] as const
export const recruitingWorkflowSteps = ['找岗位', '找人才', '匹配', '推荐', '跟进', '成交'] as const

export type CandidateFlowStatus = (typeof candidateFlow)[number]
export type JobFlowStatus = (typeof jobFlow)[number]
export type MatchFlowStatus = (typeof matchFlow)[number]
export type WorkflowBadgeVariant = 'success' | 'progress' | 'pending' | 'risk' | 'neutral'

type WorkflowCandidate = {
  id: number
  name: string
  currentTitle?: string | null
  communication?: string | null
  status: string
  updatedAt?: Date
}

type WorkflowJob = {
  id: number
  companyName: string
  title: string
  status: string
  updatedAt?: Date
}

type WorkflowMatch = {
  id: number
  candidateId: number
  jobId: number
  score: number
  status: string
  suggestion: string
  createdAt: Date
  candidate?: { name: string } | null
  job?: { companyName: string; title: string } | null
}

type WorkflowDashboardInput = {
  candidates: WorkflowCandidate[]
  jobs: WorkflowJob[]
  matches: WorkflowMatch[]
  today: Date
}

function countByStatus<T extends { status: string }>(items: T[], statuses: readonly string[]) {
  return statuses.map((status) => ({
    count: items.filter((item) => item.status === status).length,
    status,
  }))
}

export function workflowBadgeVariant(status: string): WorkflowBadgeVariant {
  if (['入职', 'Offer', '已成交'].includes(status)) return 'success'
  if (['已推荐', '进行中', '推荐中', '面试中', '已跟进'].includes(status)) return 'progress'
  if (['淘汰', '已关闭', '关闭', '已拒绝'].includes(status)) return 'risk'
  return 'pending'
}

function isToday(date: Date, today: Date) {
  return date >= today
}

function stepState(hasCurrentWork: boolean, isDone: boolean) {
  if (hasCurrentWork) return 'active' as const
  if (isDone) return 'done' as const
  return 'todo' as const
}

export function normalizeMatchStatus(status?: string | null): MatchFlowStatus {
  if (status === '已忽略') return '已拒绝'
  if (matchFlow.includes(status as MatchFlowStatus)) return status as MatchFlowStatus
  return '未推荐'
}

export function candidateStatusEffects(status: string) {
  if (status === '已推荐') return { matchStatus: '已推荐' as MatchFlowStatus }
  if (status === '面试中' || status === 'Offer') return { matchStatus: '已跟进' as MatchFlowStatus }
  if (status === '入职') return { matchStatus: '已成交' as MatchFlowStatus }
  if (status === '淘汰') return { matchStatus: '已拒绝' as MatchFlowStatus }
  return {}
}

export function jobStatusEffects(status: string) {
  if (status === '进行中' || status === '推荐中')
    return { matchStatus: '已推荐' as MatchFlowStatus }
  if (status === '面试中' || status === 'Offer') return { matchStatus: '已跟进' as MatchFlowStatus }
  if (status === '已关闭' || status === '关闭') return { matchStatus: '已拒绝' as MatchFlowStatus }
  return {}
}

export function matchStatusEffects(status: MatchFlowStatus) {
  if (status === '已推荐')
    return {
      candidateStatus: '已推荐' as CandidateFlowStatus,
      jobStatus: '进行中' as JobFlowStatus,
    }
  if (status === '已跟进')
    return {
      candidateStatus: '面试中' as CandidateFlowStatus,
      jobStatus: '进行中' as JobFlowStatus,
    }
  if (status === '已成交')
    return { candidateStatus: '入职' as CandidateFlowStatus, jobStatus: '已关闭' as JobFlowStatus }
  return {}
}

export async function applyCandidateStatusEffects(
  prisma: Pick<PrismaClient, 'match'>,
  candidateId: number,
  status: string
) {
  const effects = candidateStatusEffects(status)
  if (!effects.matchStatus) return
  await prisma.match.updateMany({
    where: { candidateId, status: { notIn: ['已成交'] } },
    data: { status: effects.matchStatus },
  })
}

export async function applyJobStatusEffects(
  prisma: Pick<PrismaClient, 'match'>,
  jobId: number,
  status: string
) {
  const effects = jobStatusEffects(status)
  if (!effects.matchStatus) return
  await prisma.match.updateMany({
    where: { jobId, status: { notIn: ['已成交'] } },
    data: { status: effects.matchStatus },
  })
}

export async function applyMatchStatusEffects(
  prisma: Pick<PrismaClient, 'candidate' | 'job'>,
  candidateId: number,
  jobId: number,
  status: MatchFlowStatus
) {
  const effects = matchStatusEffects(status)
  if (effects.candidateStatus) {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: effects.candidateStatus },
    })
  }
  if (effects.jobStatus) {
    await prisma.job.update({ where: { id: jobId }, data: { status: effects.jobStatus } })
  }
}

export function buildWorkflowDashboard({
  candidates,
  jobs,
  matches,
  today,
}: WorkflowDashboardInput) {
  const normalizedMatches = matches.map((match) => ({
    ...match,
    status: normalizeMatchStatus(match.status),
  }))
  const openJobs = jobs.filter((job) => ['进行中', '开放'].includes(job.status))
  const followableCandidates = candidates.filter(
    (candidate) =>
      String(candidate.communication || '').includes('待') &&
      !['入职', '淘汰'].includes(candidate.status)
  )
  const generatedMatches = normalizedMatches.filter((match) => match.status === '未推荐')
  const followUpMatches = normalizedMatches.filter((match) =>
    ['已推荐', '已跟进'].includes(match.status)
  )
  const closedMatches = normalizedMatches.filter((match) => match.status === '已成交')

  return {
    statusCards: {
      candidates: countByStatus(candidates, candidateFlow),
      jobs: countByStatus(jobs, jobFlow),
      matches: countByStatus(normalizedMatches, matchFlow),
    },
    stats: {
      todayCandidates: candidates.filter(
        (candidate) => candidate.updatedAt && isToday(candidate.updatedAt, today)
      ).length,
      todayJobs: jobs.filter((job) => job.updatedAt && isToday(job.updatedAt, today)).length,
      todayMatches: normalizedMatches.filter((match) => isToday(match.createdAt, today)).length,
      highMatches: normalizedMatches.filter(
        (match) => match.score >= 80 && match.status !== '已拒绝'
      ).length,
    },
    steps: recruitingWorkflowSteps.map((title, index) => {
      const state =
        index === 0
          ? stepState(openJobs.length > 0, jobs.length > 0)
          : index === 1
            ? stepState(followableCandidates.length > 0, candidates.length > 0)
            : index === 2
              ? stepState(generatedMatches.length > 0, normalizedMatches.length > 0)
              : index === 3
                ? stepState(
                    generatedMatches.some((match) => match.score >= 60),
                    followUpMatches.length > 0
                  )
                : index === 4
                  ? stepState(followUpMatches.length > 0, closedMatches.length > 0)
                  : stepState(false, closedMatches.length > 0)
      return { index: index + 1, state, title }
    }),
    tasks: {
      pendingCandidates: followableCandidates.slice(0, 5),
      pendingJobs: openJobs.slice(0, 5),
      pendingMatches: generatedMatches.filter((match) => match.score >= 80).slice(0, 5),
      followUps: followUpMatches.slice(0, 5),
    },
  }
}
