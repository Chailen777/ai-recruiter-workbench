'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncMatchMd } from '@/lib/markdown'
import { applyMatchStatusEffects, normalizeMatchStatus } from '@/lib/workflow'
import { requiredValue, jsonListValue } from './shared'
import { scoreCandidateForJobs, scoreJobForCandidates, passesDimensionFilter } from '@/lib/matching'
import type { MatchCandidate, MatchJob, MatchDimensionKey, MatchDimension } from '@/lib/matching'

/* ─── Quick Match Types ─── */

export type QuickMatchMode = 'candidate-to-job' | 'job-to-candidate'

export type QuickMatchItem = {
  score: number
  level: string
  reasons: string[]
  gaps: string[]
  suggestion: string
  status: string
  jobId?: number
  jobTitle?: string
  companyName?: string
  jobCity?: string
  salaryRange?: string
  candidateId?: number
  candidateName?: string
  candidateTitle?: string
  candidateCompany?: string
  candidateCity?: string
}

export type QuickMatchResult = {
  sourceId: number
  sourceName: string
  matchCount: number
  matches: QuickMatchItem[]
}

export type QuickSourceItem = {
  id: number
  name: string
  subtitle: string
}

/** 选中后展示的关键信息预览 */
export type QuickPreviewData = {
  id: number
  mode: QuickMatchMode
  // 候选人字段（mode=candidate-to-job）
  name?: string
  currentTitle?: string
  currentCompany?: string
  city?: string
  age?: number | null
  education?: string | null
  yearsOfWork?: number | null
  expectedSalary?: string | null
  jobSearchStatus?: string | null
  skillTags?: string | null
  desiredPosition?: string | null
  // 岗位字段（mode=job-to-candidate）
  jobTitle?: string
  companyName?: string
  jobCity?: string
  salaryRange?: string | null
  educationRequirement?: string | null
  ageRequirement?: string | null
  experienceRequirement?: string | null
  skillKeywords?: string | null
  jobCategory?: string | null
  headcount?: number | null
}

/* re-export for API consumers that import from actions */
export type { MatchDimensionKey, MatchDimension }

/* ─── Server Actions ─── */

async function saveMatchWithStatus(formData: FormData, status: string) {
  const candidateId = Number(formData.get('candidateId'))
  const jobId = Number(formData.get('jobId'))
  const score = Number(formData.get('score'))
  const workflowStatus = normalizeMatchStatus(status)

  const matchRecord = await prisma.match.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    create: {
      candidateId,
      jobId,
      score: Number.isFinite(score) ? score : 0,
      reasons: jsonListValue(formData, 'reasons'),
      gaps: jsonListValue(formData, 'gaps'),
      suggestion: requiredValue(formData, 'suggestion') || '待确认',
      status: workflowStatus,
    },
    update: {
      score: Number.isFinite(score) ? score : 0,
      reasons: jsonListValue(formData, 'reasons'),
      gaps: jsonListValue(formData, 'gaps'),
      suggestion: requiredValue(formData, 'suggestion') || '待确认',
      status: workflowStatus,
    },
    include: { candidate: true, job: true },
  })
  try {
    syncMatchMd({
      id: matchRecord.id,
      candidateId,
      jobId,
      candidateName: matchRecord.candidate.name,
      jobTitle: matchRecord.job.title,
      companyName: matchRecord.job.companyName,
      score: matchRecord.score,
      reasons: matchRecord.reasons,
      gaps: matchRecord.gaps,
      suggestion: matchRecord.suggestion,
      status: matchRecord.status,
      createdAt: matchRecord.createdAt,
      importedAt: matchRecord.importedAt,
    })
  } catch {
    // Markdown 同步失败不影响核心流程（Vercel 只读文件系统）
  }

  try {
    await applyMatchStatusEffects(prisma, candidateId, jobId, workflowStatus)
  } catch {
    // 状态联动失败不影响核心流程
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')
}

export async function recommendMatch(formData: FormData) {
  await saveMatchWithStatus(formData, '已推荐')
}

export async function ignoreMatch(formData: FormData) {
  await saveMatchWithStatus(formData, '已拒绝')
}

export async function eliminateMatch(formData: FormData) {
  await saveMatchWithStatus(formData, '已淘汰')
}

export async function abandonMatch(formData: FormData) {
  await saveMatchWithStatus(formData, '已放弃')
}

export async function resetMatch(formData: FormData) {
  const candidateId = Number(formData.get('candidateId'))
  const jobId = Number(formData.get('jobId'))

  try {
    await prisma.match.delete({
      where: { candidateId_jobId: { candidateId, jobId } },
    })
  } catch {
    // 记录不存在则忽略
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')
}

export async function quickMatch(
  mode: QuickMatchMode,
  sourceId: number,
  dimensions?: MatchDimension[],
): Promise<QuickMatchResult> {
  const enabledDims = (dimensions ?? []).filter((d) => d.enabled).map((d) => d.key)
  if (mode === 'candidate-to-job') {
    const candidate = await prisma.candidate.findUnique({ where: { id: sourceId } })
    if (!candidate) throw new Error('候选人不存在')

    const jobs = await prisma.job.findMany({ orderBy: { updatedAt: 'desc' }, take: 500 })
    const savedMatches = await prisma.match.findMany({
      where: { candidateId: sourceId },
      select: { jobId: true, status: true },
    })
    const statusMap = new Map(savedMatches.map((m) => [m.jobId, m.status]))

    const mc: MatchCandidate = {
      id: candidate.id,
      name: candidate.name,
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      education: candidate.education,
      age: candidate.age,
      city: candidate.city,
      yearsOfWork: candidate.yearsOfWork,
      expectedSalary: candidate.expectedSalary,
      skillTags: candidate.skillTags,
      industryBg: candidate.industryBg,
      resumeRaw: candidate.resumeRaw,
    }

    const mj: MatchJob[] = jobs.map((j) => ({
      id: j.id,
      companyName: j.companyName,
      title: j.title,
      city: j.city,
      salaryRange: j.salaryRange,
      educationRequirement: j.educationRequirement,
      ageRequirement: j.ageRequirement,
      experienceRequirement: j.experienceRequirement,
      industryRequirement: j.industry,
      skillKeywords: j.skillKeywords,
      mustHave: j.mustHave,
      niceToHave: j.niceToHave,
      exclusions: j.exclusions,
      jdRaw: j.jdRaw,
      status: j.status,
      tags: j.tags,
    }))

    const results = scoreCandidateForJobs(mc, mj).slice(0, 15)
    const filtered = enabledDims.length > 0
      ? results.filter((r) => passesDimensionFilter(r.reasons, r.gaps, enabledDims))
      : results

    return {
      sourceId,
      sourceName: candidate.name,
      matchCount: filtered.length,
      matches: filtered.map((r) => ({
        score: r.score,
        level: r.level,
        reasons: r.reasons,
        gaps: r.gaps,
        suggestion: r.suggestion,
        status: statusMap.get(r.job.id) ?? '未推荐',
        jobId: r.job.id,
        jobTitle: r.job.title,
        companyName: r.job.companyName,
        jobCity: r.job.city ?? undefined,
        salaryRange: r.job.salaryRange ?? undefined,
      })),
    }
  } else {
    const job = await prisma.job.findUnique({ where: { id: sourceId } })
    if (!job) throw new Error('岗位不存在')

    const candidates = await prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' }, take: 500 })
    const savedMatches = await prisma.match.findMany({
      where: { jobId: sourceId },
      select: { candidateId: true, status: true },
    })
    const statusMap = new Map(savedMatches.map((m) => [m.candidateId, m.status]))

    const mj: MatchJob = {
      id: job.id,
      companyName: job.companyName,
      title: job.title,
      city: job.city,
      salaryRange: job.salaryRange,
      educationRequirement: job.educationRequirement,
      ageRequirement: job.ageRequirement,
      experienceRequirement: job.experienceRequirement,
      industryRequirement: job.industry,
      skillKeywords: job.skillKeywords,
      mustHave: job.mustHave,
      niceToHave: job.niceToHave,
      exclusions: job.exclusions,
      jdRaw: job.jdRaw,
      status: job.status,
      tags: job.tags,
    }

    const mc: MatchCandidate[] = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      currentTitle: c.currentTitle,
      currentCompany: c.currentCompany,
      education: c.education,
      age: c.age,
      city: c.city,
      yearsOfWork: c.yearsOfWork,
      expectedSalary: c.expectedSalary,
      skillTags: c.skillTags,
      industryBg: c.industryBg,
      resumeRaw: c.resumeRaw,
    }))

    const results = scoreJobForCandidates(mj, mc).slice(0, 15)
    const filtered = enabledDims.length > 0
      ? results.filter((r) => passesDimensionFilter(r.reasons, r.gaps, enabledDims))
      : results

    return {
      sourceId,
      sourceName: `${job.companyName} - ${job.title}`,
      matchCount: filtered.length,
      matches: filtered.map((r) => ({
        score: r.score,
        level: r.level,
        reasons: r.reasons,
        gaps: r.gaps,
        suggestion: r.suggestion,
        status: statusMap.get(r.candidate.id ?? 0) ?? '未推荐',
        candidateId: r.candidate.id,
        candidateName: r.candidate.name ?? undefined,
        candidateTitle: r.candidate.currentTitle ?? undefined,
        candidateCompany: r.candidate.currentCompany ?? undefined,
        candidateCity: r.candidate.city ?? undefined,
      })),
    }
  }
}

export async function quickRecommend(
  candidateId: number,
  jobId: number,
  score: number,
  reasons: string,
  gaps: string,
  suggestion: string,
): Promise<{ success: boolean }> {
  const matchRecord = await prisma.match.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    create: {
      candidateId,
      jobId,
      score,
      reasons,
      gaps,
      suggestion,
      status: '已推荐',
    },
    update: {
      score,
      reasons,
      gaps,
      suggestion,
      status: '已推荐',
    },
    include: { candidate: true, job: true },
  })

  try {
    syncMatchMd({
      id: matchRecord.id,
      candidateId,
      jobId,
      candidateName: matchRecord.candidate.name,
      jobTitle: matchRecord.job.title,
      companyName: matchRecord.job.companyName,
      score: matchRecord.score,
      reasons: matchRecord.reasons,
      gaps: matchRecord.gaps,
      suggestion: matchRecord.suggestion,
      status: matchRecord.status,
      createdAt: matchRecord.createdAt,
      importedAt: matchRecord.importedAt,
    })
  } catch {
    // Markdown 同步失败不影响核心流程
  }

  try {
    await applyMatchStatusEffects(prisma, candidateId, jobId, '已推荐')
  } catch {
    // 状态联动失败不影响核心流程
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')

  return { success: true }
}

export async function quickIgnore(
  candidateId: number,
  jobId: number,
  score: number,
  reasons: string,
  gaps: string,
  suggestion: string,
): Promise<{ success: boolean }> {
  const matchRecord = await prisma.match.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    create: {
      candidateId,
      jobId,
      score,
      reasons,
      gaps,
      suggestion,
      status: '已拒绝',
    },
    update: {
      score,
      reasons,
      gaps,
      suggestion,
      status: '已拒绝',
    },
    include: { candidate: true, job: true },
  })

  try {
    syncMatchMd({
      id: matchRecord.id,
      candidateId,
      jobId,
      candidateName: matchRecord.candidate.name,
      jobTitle: matchRecord.job.title,
      companyName: matchRecord.job.companyName,
      score: matchRecord.score,
      reasons: matchRecord.reasons,
      gaps: matchRecord.gaps,
      suggestion: matchRecord.suggestion,
      status: matchRecord.status,
      createdAt: matchRecord.createdAt,
      importedAt: matchRecord.importedAt,
    })
  } catch {
    // Markdown 同步失败不影响核心流程
  }

  try {
    await applyMatchStatusEffects(prisma, candidateId, jobId, '已拒绝')
  } catch {
    // 状态联动失败不影响核心流程
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')

  return { success: true }
}

export async function quickEliminate(
  candidateId: number,
  jobId: number,
  score: number,
  reasons: string,
  gaps: string,
  suggestion: string,
): Promise<{ success: boolean }> {
  const matchRecord = await prisma.match.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    create: {
      candidateId,
      jobId,
      score,
      reasons,
      gaps,
      suggestion,
      status: '已淘汰',
    },
    update: {
      score,
      reasons,
      gaps,
      suggestion,
      status: '已淘汰',
    },
    include: { candidate: true, job: true },
  })

  try {
    syncMatchMd({
      id: matchRecord.id,
      candidateId,
      jobId,
      candidateName: matchRecord.candidate.name,
      jobTitle: matchRecord.job.title,
      companyName: matchRecord.job.companyName,
      score: matchRecord.score,
      reasons: matchRecord.reasons,
      gaps: matchRecord.gaps,
      suggestion: matchRecord.suggestion,
      status: matchRecord.status,
      createdAt: matchRecord.createdAt,
      importedAt: matchRecord.importedAt,
    })
  } catch {
    // Markdown 同步失败不影响核心流程
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')

  return { success: true }
}

export async function quickAbandon(
  candidateId: number,
  jobId: number,
  score: number,
  reasons: string,
  gaps: string,
  suggestion: string,
): Promise<{ success: boolean }> {
  const matchRecord = await prisma.match.upsert({
    where: { candidateId_jobId: { candidateId, jobId } },
    create: {
      candidateId,
      jobId,
      score,
      reasons,
      gaps,
      suggestion,
      status: '已放弃',
    },
    update: {
      score,
      reasons,
      gaps,
      suggestion,
      status: '已放弃',
    },
    include: { candidate: true, job: true },
  })

  try {
    syncMatchMd({
      id: matchRecord.id,
      candidateId,
      jobId,
      candidateName: matchRecord.candidate.name,
      jobTitle: matchRecord.job.title,
      companyName: matchRecord.job.companyName,
      score: matchRecord.score,
      reasons: matchRecord.reasons,
      gaps: matchRecord.gaps,
      suggestion: matchRecord.suggestion,
      status: matchRecord.status,
      createdAt: matchRecord.createdAt,
      importedAt: matchRecord.importedAt,
    })
  } catch {
    // Markdown 同步失败不影响核心流程
  }

  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')

  return { success: true }
}

export async function quickReset(
  candidateId: number,
  jobId: number,
): Promise<{ success: boolean }> {
  try {
    await prisma.match.delete({
      where: { candidateId_jobId: { candidateId, jobId } },
    })
  } catch {
    // 记录不存在则忽略
  }
  revalidatePath('/match')
  revalidatePath('/candidates')
  revalidatePath('/jobs')
  revalidatePath('/home')

  return { success: true }
}

export async function fetchQuickSources(
  mode: QuickMatchMode,
): Promise<QuickSourceItem[]> {
  if (mode === 'candidate-to-job') {
    const candidates = await prisma.candidate.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, currentTitle: true, currentCompany: true },
    })
    return candidates.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: [c.currentTitle, c.currentCompany].filter(Boolean).join(' · ') || '—',
    }))
  } else {
    const jobs = await prisma.job.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, companyName: true },
    })
    return jobs.map((j) => ({
      id: j.id,
      name: `${j.companyName} - ${j.title}`,
      subtitle: j.title,
    }))
  }
}

export async function fetchQuickPreview(
  mode: QuickMatchMode,
  id: number,
): Promise<QuickPreviewData | null> {
  if (mode === 'candidate-to-job') {
    const c = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currentTitle: true,
        currentCompany: true,
        city: true,
        age: true,
        education: true,
        yearsOfWork: true,
        expectedSalary: true,
        jobSearchStatus: true,
        skillTags: true,
        desiredPosition: true,
      },
    })
    if (!c) return null
    return {
      id: c.id,
      mode,
      name: c.name,
      currentTitle: c.currentTitle ?? undefined,
      currentCompany: c.currentCompany ?? undefined,
      city: c.city ?? undefined,
      age: c.age,
      education: c.education,
      yearsOfWork: c.yearsOfWork,
      expectedSalary: c.expectedSalary,
      jobSearchStatus: c.jobSearchStatus,
      skillTags: c.skillTags,
      desiredPosition: c.desiredPosition,
    }
  } else {
    const j = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        companyName: true,
        city: true,
        salaryRange: true,
        educationRequirement: true,
        ageRequirement: true,
        experienceRequirement: true,
        skillKeywords: true,
        jobCategory: true,
        headcount: true,
      },
    })
    if (!j) return null
    return {
      id: j.id,
      mode,
      jobTitle: j.title,
      companyName: j.companyName,
      jobCity: j.city ?? undefined,
      salaryRange: j.salaryRange,
      educationRequirement: j.educationRequirement,
      ageRequirement: j.ageRequirement,
      experienceRequirement: j.experienceRequirement,
      skillKeywords: j.skillKeywords,
      jobCategory: j.jobCategory,
      headcount: j.headcount,
    }
  }
}
