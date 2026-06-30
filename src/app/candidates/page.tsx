export const revalidate = 30

import { abandonMatch, deleteCandidate, eliminateMatch, ignoreMatch, recommendMatch, resetMatch } from '@/app/actions'
import {
  ActionButton,
  AttachmentList,
  CandidateCard,
  CandidateNotePanel,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  GenderBadge,
  MatchResultList,
  Pagination,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import type { JobMatch } from '@/components/ui'
import { CandidateCreateSheet, CandidateEditSheet } from '@/components/forms'
import { prisma } from '@/lib/prisma'
import { scoreCandidateForJobs } from '@/lib/matching'
import type { MatchJob } from '@/lib/matching'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

function statusVariant(status?: string | null) {
  if (status === '入职') return 'success'
  if (status === '已沟通' || status === '已推荐' || status === '面试中' || status === 'Offer')
    return 'progress'
  if (status === '淘汰') return 'risk'
  return 'pending'
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim())
}

function pageForSelected<T extends { id: number }>(rows: T[], selectedId?: string) {
  if (!selectedId) return 1
  const index = rows.findIndex((row) => String(row.id) === selectedId)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ candidateId?: string; page?: string }>
}) {
  const { candidateId, page: pageParam } = await searchParams

  // Fetch all data in parallel
  const [candidates, jobs, savedMatches] = await Promise.all([
    prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.job.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.match.findMany({ select: { candidateId: true, jobId: true, status: true } }),
  ])

  const today = startOfToday()
  const selectedCandidate =
    candidates.find((candidate) => String(candidate.id) === candidateId) ?? candidates[0] ?? null

  // 构建匹配状态查找表
  const statusMap = new Map<string, string>()
  for (const m of savedMatches) {
    statusMap.set(`${m.candidateId}-${m.jobId}`, m.status)
  }

  // 计算候选人匹配的岗位
  const jobMatches: JobMatch[] = selectedCandidate
    ? scoreCandidateForJobs(
        {
          id: selectedCandidate.id,
          name: selectedCandidate.name,
          currentTitle: selectedCandidate.currentTitle,
          currentCompany: selectedCandidate.currentCompany,
          education: selectedCandidate.education,
          age: selectedCandidate.age,
          city: selectedCandidate.city,
          yearsOfWork: selectedCandidate.yearsOfWork,
          expectedSalary: selectedCandidate.expectedSalary,
          skillTags: selectedCandidate.skillTags,
          industryBg: selectedCandidate.industryBg,
          resumeRaw: selectedCandidate.resumeRaw,
        },
        jobs.map(
          (j): MatchJob => ({
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
          })
        )
      ).map((result) => ({
        ...result,
        status: statusMap.get(`${selectedCandidate!.id}-${result.job.id}`) ?? '未推荐',
        candidateId: selectedCandidate!.id,
        jobId: result.job.id,
      }))
    : []
  const activeCount = candidates.filter(
    (candidate) => !['入职', '淘汰'].includes(candidate.status)
  ).length
  const recommendedCount = candidates.filter((candidate) =>
    ['已推荐', '面试中', 'Offer', '入职'].includes(candidate.status)
  ).length
  const todayCount = candidates.filter((candidate) => candidate.createdAt >= today).length

  const pageFromSelected = pageForSelected(candidates, candidateId)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = candidateId ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  // Paginated slice for card display
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pagedCandidates = candidates.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="candidate-page">
      <section className="grid stats">
        <StatCard
          description="管理候选人资源，后续进入人找岗和推荐流程"
          title="候选人总数"
          tone="blue"
          value={candidates.length}
        />
        <StatCard description="今日新进入人才池" title="今日新增" tone="green" value={todayCount} />
        <StatCard
          description="未入职或淘汰，可继续推进"
          title="可推进候选人"
          tone="orange"
          value={activeCount}
        />
        <StatCard
          description="已进入推荐链路"
          title="已推荐相关"
          tone="blue"
          value={recommendedCount}
        />
      </section>

      {/* ════════════ Three-Column Layout ════════════ */}
      <div className="candidate-workspace">
        {/* ── Column 1: Candidate Card List (narrower) ── */}
        <DetailPanel
          actions={<CandidateCreateSheet />}
          title="候选人列表"
        >
          {pagedCandidates.length > 0 ? (
            <div className="candidate-card-list">
              {pagedCandidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  gender={c.gender}
                  avatar={c.avatar}
                  city={c.city}
                  age={c.age}
                  education={c.education}
                  yearsOfWork={c.yearsOfWork}
                  expectedSalary={c.expectedSalary}
                  currentCompany={c.currentCompany}
                  currentTitle={c.currentTitle}
                  schoolName={c.schoolName}
                  major={c.major}
                  selfIntro={c.selfIntro}
                  skillTags={c.skillTags}
                  tags={c.tags}
                  status={c.status}
                  createdAt={c.createdAt.toISOString()}
                  updatedAt={c.updatedAt.toISOString()}
                  selected={String(c.id) === candidateId}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="candidates"
              action={<CandidateCreateSheet />}
              description="管理候选人资源，后续进入人找岗和推荐流程。"
            />
          )}
          <Pagination
            baseHref="/candidates"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={candidates.length}
          />
        </DetailPanel>

        {/* ── Column 2: Candidate Detail (largest) ── */}
        <DetailPanel
          actions={
            selectedCandidate ? (
              <div className="actions">
                <CandidateEditSheet candidate={selectedCandidate} />
                <ActionButton href={`/match?candidateId=${selectedCandidate.id}`} size="sm" variant="secondary">
                  进入匹配
                </ActionButton>
                <DeleteButton action={deleteCandidate} id={selectedCandidate.id} label={selectedCandidate.name || '该候选人'} variant="secondary" />
              </div>
            ) : null
          }
          avatar={selectedCandidate?.avatar ?? null}
          description={
            selectedCandidate?.currentTitle ||
            '查看候选人的关键资料，用于决定下一步是否沟通、推荐或进入匹配。'
          }
          title={selectedCandidate?.name ?? '候选人详情'}
          titleExtra={
            selectedCandidate ? (
              <>
                {' '}
                <GenderBadge gender={selectedCandidate.gender ?? null} />
              </>
            ) : undefined
          }
        >
          {selectedCandidate ? (
            <DetailWithNotesBadge
              detailContent={(
            <div className="record-detail">
              <dl className="detail-list compact">
                {hasText(selectedCandidate.phone) ? (
                  <div className="is-highlight">
                    <dt>电话</dt>
                    <dd>{selectedCandidate.phone}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.city) ? (
                  <div className="is-highlight">
                    <dt>城市</dt>
                    <dd>{selectedCandidate.city}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.expectedSalary) ? (
                  <div className="is-highlight">
                    <dt>期望薪资</dt>
                    <dd>{selectedCandidate.expectedSalary}</dd>
                  </div>
                ) : null}
                <div className="is-highlight">
                  <dt>状态</dt>
                  <dd>
                    <StatusBadge variant={statusVariant(selectedCandidate.status)}>
                      {selectedCandidate.status}
                    </StatusBadge>
                  </dd>
                </div>
                {hasText(selectedCandidate.gender) ? (
                  <div>
                    <dt>性别</dt>
                    <dd>{selectedCandidate.gender}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.currentTitle) ? (
                  <div>
                    <dt>当前职位</dt>
                    <dd>{selectedCandidate.currentTitle}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.currentCompany) ? (
                  <div>
                    <dt>当前公司</dt>
                    <dd>{selectedCandidate.currentCompany}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.schoolName) ? (
                  <div>
                    <dt>学校名称</dt>
                    <dd>{selectedCandidate.schoolName}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.schoolType) ? (
                  <div>
                    <dt>学校类型</dt>
                    <dd>{selectedCandidate.schoolType}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.major) ? (
                  <div>
                    <dt>专业</dt>
                    <dd>{selectedCandidate.major}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.education) ? (
                  <div>
                    <dt>学历</dt>
                    <dd>{selectedCandidate.education}</dd>
                  </div>
                ) : null}
                {selectedCandidate.age != null ? (
                  <div>
                    <dt>年龄</dt>
                    <dd>{selectedCandidate.age}岁</dd>
                  </div>
                ) : null}
                {selectedCandidate.yearsOfWork != null ? (
                  <div>
                    <dt>经验</dt>
                    <dd>{selectedCandidate.yearsOfWork}年</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.jobSearchStatus) ? (
                  <div>
                    <dt>求职情况</dt>
                    <dd>{selectedCandidate.jobSearchStatus}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.desiredPosition) ? (
                  <div>
                    <dt>求职意向职位</dt>
                    <dd>{selectedCandidate.desiredPosition}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.expectedSalary) ? (
                  <div>
                    <dt>期望薪资</dt>
                    <dd>{selectedCandidate.expectedSalary}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.skillTags) ? (
                  <div>
                    <dt>技能</dt>
                    <dd>{selectedCandidate.skillTags}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.industryBg) ? (
                  <div>
                    <dt>行业背景</dt>
                    <dd>{selectedCandidate.industryBg}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.communication) ? (
                  <div>
                    <dt>沟通状态</dt>
                    <dd>{selectedCandidate.communication}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.tags) ? (
                  <div>
                    <dt>标签</dt>
                    <dd>{selectedCandidate.tags}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.selfIntro) ? (
                  <div className="detail-span-all">
                    <dt>自我介绍</dt>
                    <dd>{selectedCandidate.selfIntro}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.resumeRaw) ? (
                  <div className="detail-span-all">
                    <dt>简历原文</dt>
                    <dd>{selectedCandidate.resumeRaw}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.link) ? (
                  <div>
                    <dt>链接</dt>
                    <dd>
                      <a
                        href={selectedCandidate.link ?? '#'}
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
                {hasText(selectedCandidate.note) ? (
                  <div className="detail-span-all">
                    <dt>备注</dt>
                    <dd>{selectedCandidate.note}</dd>
                  </div>
                ) : null}
                {hasText(selectedCandidate.attachments) ? (
                  <div className="detail-span-all">
                    <dt>附件资料</dt>
                    <dd>
                      <AttachmentList attachments={selectedCandidate.attachments} />
                    </dd>
                  </div>
                ) : null}
                <div className="detail-span-all" style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <dt style={{ color: 'var(--ds-color-text-muted)' }}>添加时间</dt>
                  <dd style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>{new Date(selectedCandidate.createdAt).toLocaleString('zh-CN')}</dd>
                </div>
              </dl>
            </div>
              )}
              notesContent={<CandidateNotePanel candidateId={selectedCandidate.id} />}
            />
          ) : (
            <EmptyState
              variant="candidates"
              action={<CandidateCreateSheet />}
            />
          )}
        </DetailPanel>

        {/* ── Column 3: 匹配结果面板 ── */}
        <section className="ui-detail-panel match-side-panel">
          {selectedCandidate ? (
            <MatchResultList mode="jobs" matches={jobMatches} matchActions={{ recommend: recommendMatch, reject: ignoreMatch, eliminate: eliminateMatch, abandon: abandonMatch, reset: resetMatch }} />
          ) : (
            <div className="match-empty">
              <div className="match-empty-icon">🎯</div>
              <p>匹配结果预览</p>
              <span>点击左侧候选人查看岗位匹配度</span>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
