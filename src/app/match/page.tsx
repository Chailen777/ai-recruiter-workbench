import { abandonMatch, eliminateMatch, ignoreMatch, recommendMatch, resetMatch } from '@/app/actions'
import { MatchActionForm } from './MatchActionForm'
import Link from 'next/link'
import {
  ActionButton,
  DetailPanel,
  EmptyState,
  MatchToolbar,
  Pagination,
  StatCard,
  StatusBadge,
  TableList,
  type TableListColumn,
} from '@/components/ui'
import { MatchKanbanBoard } from '@/components/ui/MatchKanbanBoard'
import { prisma } from '@/lib/prisma'
import { scoreCandidateForJobs, scoreJobForCandidates, passesDimensionFilter, type MatchLevel } from '@/lib/matching'
import type { MatchDimensionKey } from '@/lib/matching'
import { startOfToday } from '@/lib/date'
import { matchStatusVariant } from '@/lib/status-utils'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

type MatchMode = 'candidate-to-job' | 'job-to-candidate'

type MatchRow = {
  candidateId: number
  candidateName: string
  gaps: string[]
  importedAt?: Date
  jobId: number
  jobName: string
  key: string
  level: MatchLevel
  reasons: string[]
  score: number
  status: string
  suggestion: string
}

function modeFromParams(mode?: string, candidateId?: string, jobId?: string): MatchMode {
  if (mode === 'job-to-candidate') return 'job-to-candidate'
  if (mode === 'candidate-to-job') return 'candidate-to-job'
  return jobId && !candidateId ? 'job-to-candidate' : 'candidate-to-job'
}

function pairKey(candidateId: number, jobId: number) {
  return `${candidateId}-${jobId}`
}

function pageForSelected(rows: MatchRow[], selectedKey?: string) {
  if (!selectedKey) return 1
  const index = rows.findIndex((row) => row.key === selectedKey)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

function jsonPayload(items: string[]) {
  return JSON.stringify(items)
}

const MATCH_ACTION_STATUSES = new Set(['已推荐', '已拒绝', '已淘汰', '已放弃'])

function hasAnyStatus(status: string) {
  return MATCH_ACTION_STATUSES.has(status)
}

function actionFields(row: MatchRow) {
  return (
    <>
      <input type="hidden" name="candidateId" value={row.candidateId} />
      <input type="hidden" name="jobId" value={row.jobId} />
      <input type="hidden" name="score" value={row.score} />
      <input type="hidden" name="reasons" value={jsonPayload(row.reasons)} />
      <input type="hidden" name="gaps" value={jsonPayload(row.gaps)} />
      <input type="hidden" name="suggestion" value={row.suggestion} />
    </>
  )
}

/** reset 只需要 candidateId / jobId */
function resetFields(row: MatchRow) {
  return (
    <>
      <input type="hidden" name="candidateId" value={row.candidateId} />
      <input type="hidden" name="jobId" value={row.jobId} />
    </>
  )
}

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ candidateId?: string; jobId?: string; mode?: string; pair?: string; page?: string; dims?: string }>
}) {
  const { candidateId, jobId, mode: modeParam, pair, page: pageParam, dims: dimsParam } = await searchParams
  const mode = modeFromParams(modeParam, candidateId, jobId)

  // 解析维度筛选
  const activeDims: MatchDimensionKey[] = dimsParam
    ? dimsParam.split(',').filter((k): k is MatchDimensionKey => {
        const valid: MatchDimensionKey[] = ['city', 'education', 'age', 'skills', 'experience', 'industry', 'salary']
        return valid.includes(k as MatchDimensionKey)
      })
    : []
  const [candidates, jobs, savedMatches] = await Promise.all([
    prisma.candidate.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.job.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.match.findMany({
      include: { candidate: true, job: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const selectedCandidate =
    candidates.find((candidate) => String(candidate.id) === candidateId) ?? candidates[0] ?? null
  const selectedJob = jobs.find((job) => String(job.id) === jobId) ?? jobs[0] ?? null
  const statusByPair = new Map(
    savedMatches.map((match) => [pairKey(match.candidateId, match.jobId), match.status])
  )

  const rows: MatchRow[] =
    mode === 'candidate-to-job' && selectedCandidate
      ? scoreCandidateForJobs(selectedCandidate, jobs).map((result) => ({
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.name,
          gaps: result.gaps,
          jobId: result.job.id,
          jobName: `${result.job.companyName} - ${result.job.title}`,
          key: pairKey(selectedCandidate.id, result.job.id),
          level: result.level,
          reasons: result.reasons,
          score: result.score,
          status: statusByPair.get(pairKey(selectedCandidate.id, result.job.id)) ?? '未推荐',
          suggestion: result.suggestion,
        }))
      : selectedJob
        ? scoreJobForCandidates(selectedJob, candidates).map((result) => ({
            candidateId: result.candidate.id ?? 0,
            candidateName: result.candidate.name ?? '未命名候选人',
            gaps: result.gaps,
            jobId: selectedJob.id,
            jobName: `${selectedJob.companyName} - ${selectedJob.title}`,
            key: pairKey(result.candidate.id ?? 0, selectedJob.id),
            level: result.level,
            reasons: result.reasons,
            score: result.score,
            status: statusByPair.get(pairKey(result.candidate.id ?? 0, selectedJob.id)) ?? '未推荐',
            suggestion: result.suggestion,
          }))
        : []

  // 应用维度筛选
  const filteredRows = activeDims.length > 0
    ? rows.filter((row) => passesDimensionFilter(row.reasons, row.gaps, activeDims))
    : rows

  const selectedPair =
    pair ?? (candidateId && jobId ? pairKey(Number(candidateId), Number(jobId)) : undefined)
  const selectedRow = filteredRows.find((row) => row.key === selectedPair) ?? filteredRows[0] ?? null
  const today = startOfToday()
  const todayMatchCount = savedMatches.filter((match) => match.createdAt >= today).length
  const successMatchCount = savedMatches.filter((match) => match.status === '已推荐').length
  const highMatchCount = filteredRows.filter((row) => row.score >= 80).length

  const pageFromSelected = pageForSelected(filteredRows, selectedPair)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = selectedPair ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  const columns: Array<TableListColumn<MatchRow>> = [
    { key: 'candidateName', label: '候选人' },
    { key: 'jobName', label: '岗位' },
    {
      key: 'score',
      label: '匹配分',
      render: (row) => <strong className="score">{row.score} 分</strong>,
    },
    {
      key: 'level',
      label: '推荐等级',
      render: (row) => <span className={`match-level-badge level-${row.level}`}>{row.level}推荐</span>,
    },
    {
      key: 'status',
      label: '状态',
      render: (row) =>
        row.status === '未推荐' ? (
          <span className="ui-status-badge" style={{ borderColor: '#d1d5db', background: 'transparent', color: '#9ca3af' }}>未推荐</span>
        ) : (
          <StatusBadge variant={matchStatusVariant(row.status)}>{row.status}</StatusBadge>
        ),
    },
    { key: 'reasons', label: '匹配理由', render: (row) => row.reasons.slice(0, 3).join('；') },
  ]

  return (
    <div className="match-page">
      <section className="grid stats">
        <StatCard
          description="今日已写入推荐或忽略的匹配记录"
          title="今日匹配数"
          tone="blue"
          value={todayMatchCount}
        />
        <StatCard
          description="状态为已推荐的匹配记录"
          title="成功匹配数"
          tone="green"
          value={successMatchCount}
        />
        <StatCard
          description="当前结果中 80 分及以上"
          title="高匹配率数量"
          tone="orange"
          value={highMatchCount}
        />
      </section>

      <DetailPanel
        description="支持人找岗与岗找人双向智能匹配，可开启维度关键词进行精准筛选。"
        title="匹配模式"
      >
        <MatchToolbar
          activeDims={activeDims}
          dimsParam={dimsParam}
          mode={mode}
          selectedId={mode === 'candidate-to-job' ? selectedCandidate?.id : selectedJob?.id}
          formAction="/match"
          formIdName={mode === 'candidate-to-job' ? 'candidateId' : 'jobId'}
          formSelectedValue={String(mode === 'candidate-to-job' ? (selectedCandidate?.id ?? '') : (selectedJob?.id ?? ''))}
          modeSwitch={
            <div className="quick-match-tabs">
              <Link
                href={`/match?mode=candidate-to-job${selectedCandidate ? `&candidateId=${selectedCandidate.id}` : ''}${dimsParam ? `&dims=${dimsParam}` : ''}`}
                className={`quick-match-tab${mode === 'candidate-to-job' ? ' is-active' : ''}`}
              >
                👤 人找岗
              </Link>
              <Link
                href={`/match?mode=job-to-candidate${selectedJob ? `&jobId=${selectedJob.id}` : ''}${dimsParam ? `&dims=${dimsParam}` : ''}`}
                className={`quick-match-tab${mode === 'job-to-candidate' ? ' is-active' : ''}`}
              >
                💼 岗找人
              </Link>
            </div>
          }
          selectPicker={
            mode === 'candidate-to-job' ? (
              <label>
                👤 选择候选人：
                <select name="candidateId" defaultValue={selectedCandidate?.id ?? ''}>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} {candidate.currentTitle ? `- ${candidate.currentTitle}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                💼 选择岗位：
                <select name="jobId" defaultValue={selectedJob?.id ?? ''}>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.companyName} - {job.title}
                    </option>
                  ))}
                </select>
              </label>
            )
          }
        />
      </DetailPanel>

      <div className="match-workspace">
        <DetailPanel
          description="分数按技能 40%、经验 20%、城市 20%、薪资 20% 计算，并按分数降序展示。"
          title={mode === 'candidate-to-job' ? '人找岗匹配结果' : '岗找人匹配结果'}
        >
          {!candidates.length ? (
            <EmptyState
              variant="match"
              title="请先录入候选人"
              description="匹配需要候选人和岗位数据，请先到人才库添加候选人。"
              action={
                <ActionButton href="/candidates" size="sm" variant="secondary">
                  前往人才库
                </ActionButton>
              }
            />
          ) : !jobs.length ? (
            <EmptyState
              variant="match"
              title="请先录入岗位"
              description="匹配需要候选人和岗位数据，请先到岗位库添加岗位。"
              action={
                <ActionButton href="/jobs" size="sm" variant="secondary">
                  前往岗位库
                </ActionButton>
              }
            />
          ) : (
            <>
              <TableList
                columns={columns}
                emptyText={activeDims.length > 0 ? '维度筛选后无匹配结果，请取消部分筛选条件。' : '暂无匹配结果。'}
                getRowHref={(row) =>
                  `/match?mode=${mode}&candidateId=${row.candidateId}&jobId=${row.jobId}&pair=${row.key}${dimsParam ? `&dims=${dimsParam}` : ''}`
                }
                getRowKey={(row) => row.key}
                page={currentPage}
                pageSize={PAGE_SIZE}
                rows={filteredRows}
                selectedKey={selectedRow?.key}
              />
              <Pagination
                baseHref={`/match?mode=${mode}${mode === 'candidate-to-job' && selectedCandidate ? `&candidateId=${selectedCandidate.id}` : ''}${mode === 'job-to-candidate' && selectedJob ? `&jobId=${selectedJob.id}` : ''}${dimsParam ? `&dims=${dimsParam}` : ''}`}
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredRows.length}
              />
            </>
          )}
        </DetailPanel>

        <DetailPanel
          description={selectedRow ? `${selectedRow.jobName}` : '查看匹配原因、不匹配点和下一步推荐建议。'}
          title={selectedRow ? selectedRow.candidateName : '匹配详情'}
          titleExtra={
            selectedRow ? (
              <span
                className={`match-detail-corner-badge${
                  selectedRow.status === '已推荐' ? ' is-recommended'
                  : selectedRow.status === '已拒绝' ? ' is-rejected'
                  : selectedRow.status === '已淘汰' ? ' is-eliminated'
                  : selectedRow.status === '已放弃' ? ' is-abandoned'
                  : ' is-default'
                }`}
              >
                {selectedRow.status}
              </span>
            ) : null
          }
        >
          {selectedRow ? (
            <div className="match-detail">
              <div className="match-detail-nav">
                <Link
                  className="match-detail-nav-link"
                  href={`/candidates?candidateId=${selectedRow.candidateId}`}
                >
                  📋 候选人详情
                </Link>
                <span className="match-detail-nav-sep" />
                <Link
                  className="match-detail-nav-link"
                  href={`/jobs?jobId=${selectedRow.jobId}`}
                >
                  💼 岗位详情
                </Link>
              </div>
              <div className={`match-detail-actions${!hasAnyStatus(selectedRow.status) ? ' is-default' : ''}`}>
                {/* 推荐 */}
                {selectedRow.status === '已推荐' ? (
                  <MatchActionForm
                    action={resetMatch}
                    className="match-detail-btn match-detail-btn--recommend is-active"
                    fields={resetFields(selectedRow)}
                    label="✓ 已推荐"
                  />
                ) : (
                  <MatchActionForm
                    action={recommendMatch}
                    className="match-detail-btn match-detail-btn--recommend"
                    disabled={hasAnyStatus(selectedRow.status)}
                    fields={actionFields(selectedRow)}
                    label="👍 推荐"
                  />
                )}
                {/* 拒绝 */}
                {selectedRow.status === '已拒绝' ? (
                  <MatchActionForm
                    action={resetMatch}
                    className="match-detail-btn match-detail-btn--reject is-active"
                    fields={resetFields(selectedRow)}
                    label="✗ 已拒绝"
                  />
                ) : (
                  <MatchActionForm
                    action={ignoreMatch}
                    className="match-detail-btn match-detail-btn--reject"
                    disabled={hasAnyStatus(selectedRow.status)}
                    fields={actionFields(selectedRow)}
                    label="👎 拒绝"
                  />
                )}
                {/* 淘汰 */}
                {selectedRow.status === '已淘汰' ? (
                  <MatchActionForm
                    action={resetMatch}
                    className="match-detail-btn match-detail-btn--eliminate is-active"
                    fields={resetFields(selectedRow)}
                    label="✗ 已淘汰"
                  />
                ) : (
                  <MatchActionForm
                    action={eliminateMatch}
                    className="match-detail-btn match-detail-btn--eliminate"
                    disabled={hasAnyStatus(selectedRow.status)}
                    fields={actionFields(selectedRow)}
                    label="🚫 淘汰"
                  />
                )}
                {/* 放弃 */}
                {selectedRow.status === '已放弃' ? (
                  <MatchActionForm
                    action={resetMatch}
                    className="match-detail-btn match-detail-btn--abandon is-active"
                    fields={resetFields(selectedRow)}
                    label="✗ 已放弃"
                  />
                ) : (
                  <MatchActionForm
                    action={abandonMatch}
                    className="match-detail-btn match-detail-btn--abandon"
                    disabled={hasAnyStatus(selectedRow.status)}
                    fields={actionFields(selectedRow)}
                    label="🏳 放弃"
                  />
                )}
              </div>
              <div className={`match-score-card`} data-level={selectedRow.level}>
                <strong>{selectedRow.score} 分</strong>
                <span className={`match-level-badge level-${selectedRow.level}`}>
                  {selectedRow.level}推荐
                </span>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>岗位</dt>
                  <dd>{selectedRow.jobName}</dd>
                </div>
                <div>
                  <dt>优化建议</dt>
                  <dd>{selectedRow.suggestion}</dd>
                </div>
              </dl>
              <div className="match-explain">
                <div className="match-explain-block">
                  <h3>匹配原因</h3>
                  <ul>
                    {selectedRow.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="match-explain-block">
                  <h3>不匹配点</h3>
                  {selectedRow.gaps.length ? (
                    <ul>
                      {selectedRow.gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">暂无明显不匹配点。</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState variant="generic" title="点击左侧匹配项" description="选择一个匹配对查看详细分析、匹配原因和推荐建议。" />
          )}
        </DetailPanel>
      </div>

      {/* ── Match Pipeline Kanban ── */}
      <MatchKanbanBoard rows={filteredRows} />
    </div>
  )
}
