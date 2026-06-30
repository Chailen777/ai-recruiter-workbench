/**
 * POST /api/sync-md
 *
 * 将数据库中现有的所有历史数据全量导出为 Markdown 文件
 * 适合首次启用此功能时，一键补全历史记录
 *
 * 响应示例：
 * {
 *   "success": true,
 *   "synced": { "companies": 5, "jobs": 12, ... },
 *   "total": 45
 * }
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  syncCompanyMd,
  syncJobMd,
  syncCandidateMd,
  syncKnowledgeMd,
  syncSchoolMd,
  syncChartMd,
  syncInfoMd,
  syncMatchMd,
} from '@/lib/markdown'
import { syncAllNotesMd } from '@/app/actions/notes'

export async function POST() {
  try {
    const [companies, jobs, candidates, knowledge, schools, charts, infos, matches] =
      await Promise.all([
        prisma.company.findMany(),
        prisma.job.findMany(),
        prisma.candidate.findMany(),
        prisma.knowledge.findMany(),
        prisma.school.findMany(),
        prisma.chart.findMany(),
        prisma.info.findMany(),
        prisma.match.findMany({ include: { candidate: true, job: true } }),
      ])

    companies.forEach(syncCompanyMd)
    jobs.forEach(syncJobMd)
    candidates.forEach(syncCandidateMd)
    knowledge.forEach(syncKnowledgeMd)
    schools.forEach(syncSchoolMd)
    charts.forEach(syncChartMd)
    infos.forEach(syncInfoMd)
    matches.forEach(m =>
      syncMatchMd({
        id: m.id,
        candidateId: m.candidateId,
        jobId: m.jobId,
        candidateName: m.candidate.name,
        jobTitle: m.job.title,
        companyName: m.job.companyName,
        score: m.score,
        reasons: m.reasons,
        gaps: m.gaps,
        suggestion: m.suggestion,
        status: m.status,
        createdAt: m.createdAt,
        importedAt: m.importedAt ?? new Date(),
      })
    )

    const notesResult = await syncAllNotesMd()

    const synced = {
      companies: companies.length,
      jobs: jobs.length,
      candidates: candidates.length,
      knowledge: knowledge.length,
      schools: schools.length,
      charts: charts.length,
      info: infos.length,
      matches: matches.length,
      notes: notesResult.count,
    }

    return NextResponse.json({
      success: true,
      message: '全量同步完成',
      synced,
      total: Object.values(synced).reduce((a, b) => a + b, 0),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// GET 方法用于触发同步（方便浏览器直接访问）
export async function GET() {
  return POST()
}
