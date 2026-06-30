export const dynamic = 'force-dynamic'

import { abandonMatch, deleteJob, eliminateMatch, ignoreMatch, recommendMatch, resetMatch } from '@/app/actions'
import Link from 'next/link'
import {
  ActionButton,
  AttachmentList,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  JobCard,
  JobNotePanel,
  MatchResultList,
  Pagination,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import type { CandidateMatch } from '@/components/ui'
import { JobCreateSheet, JobEditSheet } from '@/components/forms'
import { salaryMax } from '@/lib/salary'
import { scoreJobForCandidates } from '@/lib/matching'
import type { MatchCandidate } from '@/lib/matching'
import { prisma } from '@/lib/prisma'
import { jobStatusVariant } from '@/lib/status-utils'

const PAGE_SIZE = 10

function pageForSelected<T extends { id: number }>(rows: T[], selectedId?: string) {
  if (!selectedId) return 1
  const index = rows.findIndex((row) => String(row.id) === selectedId)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; jobId?: string; page?: string }>
}) {
  const { companyId, jobId, page: pageParam } = await searchParams
  const [jobs, companies, candidates, savedMatches] = await Promise.all([
    prisma.job.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.match.findMany({ select: { candidateId: true, jobId: true, status: true } }),
  ])

  const selectedJob = jobs.find((job) => String(job.id) === jobId) ?? jobs[0] ?? null

  // 构建匹配状态查找表
  const statusMap = new Map<string, string>()
  for (const m of savedMatches) {
    statusMap.set(`${m.candidateId}-${m.jobId}`, m.status)
  }

  // 计算岗位匹配的候选人
  const candidateMatches: CandidateMatch[] = selectedJob
    ? scoreJobForCandidates(
        {
          id: selectedJob.id,
          companyName: selectedJob.companyName,
          title: selectedJob.title,
          city: selectedJob.city,
          salaryRange: selectedJob.salaryRange,
          educationRequirement: selectedJob.educationRequirement,
          ageRequirement: selectedJob.ageRequirement,
          experienceRequirement: selectedJob.experienceRequirement,
          industryRequirement: selectedJob.industry,
          skillKeywords: selectedJob.skillKeywords,
          mustHave: selectedJob.mustHave,
          niceToHave: selectedJob.niceToHave,
          exclusions: selectedJob.exclusions,
          jdRaw: selectedJob.jdRaw,
          status: selectedJob.status,
          tags: selectedJob.tags,
        },
        candidates.map(
          (c): MatchCandidate => ({
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
          })
        )
      ).map((result) => ({
        ...result,
        status: statusMap.get(`${result.candidate.id}-${selectedJob!.id}`) ?? '未推荐',
        candidateId: result.candidate.id ?? 0,
        jobId: selectedJob!.id,
      }))
    : []
  const activeJobs = jobs.filter((job) => !['已关闭', '关闭'].includes(job.status))
  const highSalaryJobs = jobs.filter((job) => salaryMax(job.salaryRange) >= 30)
  const pendingMatchJobs = jobs.filter((job) => ['进行中', '开放'].includes(job.status))

  const preselectedCompanyName = companyId
    ? companies.find((c) => String(c.id) === companyId)?.name
    : undefined

  const pageFromSelected = pageForSelected(jobs, jobId)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = jobId ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  // Pagination
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE)
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const pageJobs = jobs.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="job-page">
      <section className="grid stats">
        <StatCard
          description="管理岗位需求，后续进入岗位找人和匹配流程"
          title="岗位总数"
          tone="blue"
          value={jobs.length}
        />
        <StatCard
          description="进行中，可继续推荐候选人"
          title="活跃岗位"
          tone="green"
          value={activeJobs.length}
        />
        <StatCard
          description="薪资上限达到 30K 及以上"
          title="高薪岗位"
          tone="orange"
          value={highSalaryJobs.length}
        />
        <StatCard
          description="进行中状态，等待进入匹配流程"
          title="待匹配岗位"
          tone="blue"
          value={pendingMatchJobs.length}
        />
      </section>

      <div className="job-workspace">
        <DetailPanel
          actions={
            <JobCreateSheet
              preselectedCompanyName={preselectedCompanyName}
            />
          }
          title="岗位列表"
        >
          {pageJobs.length > 0 ? (
            <div className="job-card-list">
              {pageJobs.map((job) => {
                const params = new URLSearchParams()
                params.set('jobId', String(job.id))
                if (companyId) params.set('companyId', companyId)
                return (
                  <Link
                    key={job.id}
                    href={`/jobs?${params.toString()}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <JobCard
                      id={job.id}
                      title={job.title}
                      salaryRange={job.salaryRange}
                      commission={job.commission}
                      city={job.city}
                      educationRequirement={job.educationRequirement}
                      experienceRequirement={job.experienceRequirement}
                      headcount={job.headcount}
                      companyName={job.companyName}
                      status={job.status}
                      skillKeywords={job.skillKeywords}
                      jobCategory={job.jobCategory}
                      link={job.link}
                      isSelected={String(job.id) === jobId}
                    />
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState variant="jobs" action={<JobCreateSheet preselectedCompanyName={preselectedCompanyName} />} />
          )}
          <Pagination
            baseHref="/jobs"
            page={clampedPage}
            pageSize={PAGE_SIZE}
            total={jobs.length}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedJob ? (
              <div className="actions">
                <JobEditSheet
                  job={selectedJob}
                />
                <ActionButton href={`/match?jobId=${selectedJob.id}`} size="sm" variant="secondary">
                  匹配候选人
                </ActionButton>
                <ActionButton href={`/match?jobId=${selectedJob.id}`} size="sm" variant="secondary">
                  推荐候选人
                </ActionButton>
                <DeleteButton action={deleteJob} id={selectedJob.id} label={selectedJob.title || '该岗位'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedJob
              ? [selectedJob.companyName, selectedJob.city].filter(Boolean).join(' · ')
              : '查看岗位描述、技能要求、薪资结构、公司信息和状态流转。'
          }
          title={selectedJob?.title ?? '岗位详情'}
        >
          {selectedJob ? (
            <DetailWithNotesBadge
              detailContent={(
            <div className="record-detail">
              <dl className="detail-list compact">
                {selectedJob.salaryRange ? (
                  <div className="is-highlight">
                    <dt>薪资结构</dt>
                    <dd className="job-salary-value">{selectedJob.salaryRange}</dd>
                  </div>
                ) : null}
                {selectedJob.commission ? (
                  <div className="is-highlight">
                    <dt>佣金</dt>
                    <dd className="job-commission-value">{selectedJob.commission}</dd>
                  </div>
                ) : null}
                {selectedJob.deliveryMode ? (
                  <div>
                    <dt>交付模式</dt>
                    <dd>{selectedJob.deliveryMode}</dd>
                  </div>
                ) : null}
                {selectedJob.source ? (
                  <div>
                    <dt>来源</dt>
                    <dd>{selectedJob.source}</dd>
                  </div>
                ) : null}
                {selectedJob.industry ? (
                  <div>
                    <dt>所属行业</dt>
                    <dd>{selectedJob.industry}</dd>
                  </div>
                ) : null}
                {selectedJob.headcount ? (
                  <div>
                    <dt>招聘人数</dt>
                    <dd>{selectedJob.headcount} 人</dd>
                  </div>
                ) : null}
                {selectedJob.workLocation ? (
                  <div>
                    <dt>工作地点</dt>
                    <dd>{selectedJob.workLocation}</dd>
                  </div>
                ) : null}
                {selectedJob.jobCategory ? (
                  <div>
                    <dt>职位类别</dt>
                    <dd>{selectedJob.jobCategory}</dd>
                  </div>
                ) : null}
                {selectedJob.experienceRequirement ? (
                  <div>
                    <dt>经验要求</dt>
                    <dd>{selectedJob.experienceRequirement}</dd>
                  </div>
                ) : null}
                {selectedJob.educationRequirement ? (
                  <div>
                    <dt>学历要求</dt>
                    <dd>{selectedJob.educationRequirement}</dd>
                  </div>
                ) : null}
                {selectedJob.ageRequirement ? (
                  <div>
                    <dt>年龄要求</dt>
                    <dd>{selectedJob.ageRequirement}</dd>
                  </div>
                ) : null}
                {selectedJob.skillKeywords || selectedJob.mustHave ? (
                  <div className="is-highlight">
                    <dt>技能要求</dt>
                    <dd>{selectedJob.skillKeywords || selectedJob.mustHave}</dd>
                  </div>
                ) : null}
                <div className="is-highlight">
                  <dt>状态</dt>
                  <dd>
                    <StatusBadge variant={jobStatusVariant(selectedJob.status)}>
                      {selectedJob.status}
                    </StatusBadge>
                  </dd>
                </div>
                {selectedJob.guaranteePeriod ? (
                  <div>
                    <dt>保证期</dt>
                    <dd>{selectedJob.guaranteePeriod}</dd>
                  </div>
                ) : null}
                {selectedJob.tags ? (
                  <div>
                    <dt>标签</dt>
                    <dd>{selectedJob.tags}</dd>
                  </div>
                ) : null}
                {selectedJob.highlights ? (
                  <div className="detail-span-all">
                    <dt>职位亮点</dt>
                    <dd>{selectedJob.highlights}</dd>
                  </div>
                ) : null}
                {selectedJob.responsibilities ? (
                  <div className="detail-span-all">
                    <dt>工作职责</dt>
                    <dd>{selectedJob.responsibilities}</dd>
                  </div>
                ) : null}
                {selectedJob.requirements ? (
                  <div className="detail-span-all">
                    <dt>任职要求</dt>
                    <dd>{selectedJob.requirements}</dd>
                  </div>
                ) : null}
                {selectedJob.mustHave ? (
                  <div className="detail-span-all">
                    <dt>硬性要求</dt>
                    <dd>{selectedJob.mustHave}</dd>
                  </div>
                ) : null}
                {selectedJob.niceToHave ? (
                  <div className="detail-span-all">
                    <dt>加分项</dt>
                    <dd>{selectedJob.niceToHave}</dd>
                  </div>
                ) : null}
                {selectedJob.exclusions ? (
                  <div className="detail-span-all">
                    <dt>排除项</dt>
                    <dd>{selectedJob.exclusions}</dd>
                  </div>
                ) : null}
                {selectedJob.orderNotes ? (
                  <div className="detail-span-all">
                    <dt>做单须知</dt>
                    <dd>{selectedJob.orderNotes}</dd>
                  </div>
                ) : null}
                {selectedJob.commissionRules ? (
                  <div className="detail-span-all">
                    <dt>佣金规则</dt>
                    <dd>{selectedJob.commissionRules}</dd>
                  </div>
                ) : null}
                {selectedJob.jdRaw ? (
                  <div className="detail-span-all">
                    <dt>岗位描述</dt>
                    <dd>{selectedJob.jdRaw}</dd>
                  </div>
                ) : null}
                {selectedJob.link ? (
                  <div>
                    <dt>岗位链接</dt>
                    <dd>
                      <a
                        href={selectedJob.link}
                        className="action-button theme-primary size-sm"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        target="_blank"
                      >
                        打开链接
                      </a>
                    </dd>
                  </div>
                ) : null}
                {selectedJob.website ? (
                  <div>
                    <dt>官网</dt>
                    <dd>
                      <a
                        href={selectedJob.website}
                        className="action-button theme-secondary size-sm"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        target="_blank"
                      >
                        访问官网
                      </a>
                    </dd>
                  </div>
                ) : null}
                {selectedJob.attachments ? (
                  <div className="detail-span-all">
                    <dt>附件资料</dt>
                    <dd>
                      <AttachmentList attachments={selectedJob.attachments} />
                    </dd>
                  </div>
                ) : null}
                <div className="detail-span-all" style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <dt style={{ color: 'var(--ds-color-text-muted)' }}>添加时间</dt>
                  <dd style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>{new Date(selectedJob.createdAt).toLocaleString('zh-CN')}</dd>
                </div>
              </dl>
            </div>
              )}
              notesContent={<JobNotePanel jobId={selectedJob.id} />}
            />
          ) : (
            <EmptyState variant="jobs" action={<JobCreateSheet preselectedCompanyName={preselectedCompanyName} />} />
          )}
        </DetailPanel>

        {/* ── Column 3: 匹配结果面板 ── */}
        <section className="ui-detail-panel match-side-panel">
          {selectedJob ? (
            <MatchResultList mode="candidates" matches={candidateMatches} matchActions={{ recommend: recommendMatch, reject: ignoreMatch, eliminate: eliminateMatch, abandon: abandonMatch, reset: resetMatch }} />
          ) : (
            <div className="match-empty">
              <div className="match-empty-icon">🎯</div>
              <p>匹配结果预览</p>
              <span>点击左侧岗位查看候选人匹配度</span>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
