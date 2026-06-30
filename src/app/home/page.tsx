/* ── 动态渲染：每次请求都从数据库获取最新数据 ── */
export const dynamic = 'force-dynamic'

import { getDashboardStats } from '@/app/actions'
import {
  ActionButton,
  DetailPanel,
  StatCard,
  StatusBadge,
  TableList,
  type KanbanColumn,
  type TableListColumn,
} from '@/components/ui'
import { DashboardCharts } from '@/components/ui/DashboardCharts'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { formatLongDate } from '@/lib/date'
import { statusVariant } from '@/lib/dashboard'
import Link from 'next/link'

type TaskRow = {
  action: string
  href: string
  owner: string
  priority: '高' | '中' | '低'
  target: string
  time: string
  type: string
}

const taskColumns: Array<TableListColumn<TaskRow>> = [
  { key: 'type', label: '任务类型' },
  { key: 'owner', label: '对象' },
  { key: 'target', label: '目标岗位' },
  { key: 'time', label: '时间' },
  {
    key: 'priority',
    label: '优先级',
    render: (row) => (
      <StatusBadge
        variant={row.priority === '高' ? 'risk' : row.priority === '中' ? 'pending' : 'neutral'}
      >
        {row.priority}
      </StatusBadge>
    ),
  },
  {
    key: 'action',
    label: '操作',
    render: (row) => (
      <ActionButton href={row.href} size="sm" variant="secondary">
        {row.action}
      </ActionButton>
    ),
  },
]

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const dateText = formatLongDate()

  const kpiItems = [
    {
      description: '企业库当前沉淀总量',
      title: '企业总数',
      tone: 'blue' as const,
      trend: `今日 +${stats.kpi.todayCompanies}`,
      value: stats.kpi.companies,
    },
    {
      description: '岗位池可运营总量',
      title: '在招岗位',
      tone: 'blue' as const,
      trend: `今日 +${stats.kpi.todayJobs}`,
      value: stats.kpi.jobs,
    },
    {
      description: '人才池当前候选人',
      title: '候选人才',
      tone: 'green' as const,
      trend: `今日 +${stats.kpi.todayCandidates}`,
      value: stats.kpi.candidates,
    },
    {
      description: '今日新进入企业库',
      title: '今日新增企业',
      tone: 'blue' as const,
      trend: '今日',
      value: stats.kpi.todayCompanies,
    },
    {
      description: '今日新进入岗位库',
      title: '今日新增岗位',
      tone: 'orange' as const,
      trend: '今日',
      value: stats.kpi.todayJobs,
    },
    {
      description: '需要沟通推进',
      title: '待跟进候选人',
      tone: 'red' as const,
      trend: '优先处理',
      value: stats.kpi.followCandidates,
    },
  ]

  // ── Kanban columns with REAL candidate data ──
  const STAGE_STATUS_MAP: Record<string, string[]> = {
    expired: ['过期', '已过期'],
    hired: ['入职', '已入职'],
    interview: ['面试中', '已沟通'],
    offer: ['已推荐', 'Offer'],
    rejected: ['淘汰', '不合适'],
    screening: ['待沟通', '初筛', '待联系', '新建'],
  }

  const kanbanColumns: KanbanColumn[] = [
    { color: '#2563eb', id: 'screening', items: [], label: '待初筛' },
    { color: '#f59e0b', id: 'interview', items: [], label: '面试中' },
    { color: '#16a34a', id: 'offer', items: [], label: 'Offer' },
    { color: '#8b5cf6', id: 'hired', items: [], label: '已入职' },
    { color: '#ef4444', id: 'rejected', items: [], label: '淘汰' },
    { color: '#78716c', id: 'expired', items: [], label: '过期' },
  ].map((col) => {
    const validStatuses = STAGE_STATUS_MAP[col.id] ?? []
    const candidates = stats.kanbanCandidates.filter((c) => validStatuses.includes(c.status))
    return {
      ...col,
      items: candidates.map((c) => ({
        candidateId: c.id,
        id: `kanban-c-${c.id}`,
        score: c.bestMatchScore ?? undefined,
        subtitle: c.currentTitle ?? undefined,
        tag: c.status,
        title: c.name,
      })),
    }
  })

  // Pipeline data derived from candidate status distribution
  const pipelineData = [
    { label: '待初筛', count: stats.candidateStatusDistribution.filter((d) => ['待沟通', '初筛', '待联系'].includes(d.label)).reduce((s, d) => s + d.count, 0) },
    { label: '面试中', count: stats.candidateStatusDistribution.filter((d) => ['面试中', '已沟通'].includes(d.label)).reduce((s, d) => s + d.count, 0) },
    { label: 'Offer', count: stats.candidateStatusDistribution.filter((d) => ['已推荐', 'Offer'].includes(d.label)).reduce((s, d) => s + d.count, 0) },
    { label: '已入职', count: stats.candidateStatusDistribution.filter((d) => d.label === '入职').reduce((s, d) => s + d.count, 0) },
    { label: '淘汰', count: stats.candidateStatusDistribution.filter((d) => ['淘汰', '不合适'].includes(d.label)).reduce((s, d) => s + d.count, 0) },
    { label: '过期', count: stats.candidateStatusDistribution.filter((d) => d.label === '过期').reduce((s, d) => s + d.count, 0) },
  ]

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="app-eyebrow">AI Headhunter Operations</p>
          <h1>欢迎回来，猎头顾问</h1>
          <p className="muted">{dateText}，优先处理高匹配机会、待跟进候选人和待补人的岗位。</p>
        </div>
        <div className="dashboard-user">
          <span className="notification-dot">{stats.kpi.followCandidates}</span>
          <span className="avatar">顾</span>
          <div>
            <strong>猎头顾问</strong>
            <p className="muted">专业版</p>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="dashboard-kpi-grid dashboard-kpi-grid-v2">
        {kpiItems.map((item) => (
          <StatCard
            description={item.description}
            key={item.title}
            title={item.title}
            tone={item.tone}
            trend={item.trend}
            value={item.value}
          />
        ))}
      </section>

      <DashboardCharts
        candidateStatusDistribution={stats.candidateStatusDistribution}
        jobStatusDistribution={stats.jobStatusDistribution}
        kanbanColumns={kanbanColumns}
        pipelineData={pipelineData}
        trend={stats.trend}
      />

      <section className="dashboard-work-grid">
        <DetailPanel
          actions={
            <ActionButton href="/match" size="sm" variant="secondary">
              查看全部
            </ActionButton>
          }
          title="待处理任务"
        >
          <TableList
            columns={taskColumns}
            getRowKey={(row) => `${row.type}-${row.owner}-${row.target}`}
            rows={stats.tasks}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            <ActionButton href="/jobs" size="sm" variant="secondary">
              全部岗位
            </ActionButton>
          }
          title="Top Jobs"
        >
          <div className="rank-list">
            {stats.topJobs.length > 0 ? (
              stats.topJobs.map((job) => (
                <Link className="rank-item" href="/jobs" key={job.rank}>
                  <span>{job.rank}</span>
                  <strong>{job.title}</strong>
                  <em>{job.count}</em>
                </Link>
              ))
            ) : (
              <p className="dashboard-empty-hint">暂无岗位匹配数据</p>
            )}
          </div>
        </DetailPanel>

        <DetailPanel
          actions={
            <ActionButton href="/candidates" size="sm" variant="secondary">
              人才库
            </ActionButton>
          }
          title="最新 Candidates"
        >
          <div className="candidate-mini-list">
            {stats.latestCandidates.length > 0 ? (
              stats.latestCandidates.map((candidate) => (
                <Link className="candidate-mini-item" href={candidate.href} key={candidate.name}>
                  <span className="avatar small">{candidate.name.slice(0, 1)}</span>
                  <div>
                    <strong>{candidate.name}</strong>
                    <p className="muted">{candidate.title}</p>
                  </div>
                  <StatusBadge variant={statusVariant(candidate.status)}>
                    {candidate.status}
                  </StatusBadge>
                </Link>
              ))
            ) : (
              <p className="dashboard-empty-hint">暂无候选人数据</p>
            )}
          </div>
        </DetailPanel>
      </section>

      <DetailPanel title="快捷操作">
        <div className="dashboard-quick-actions dashboard-quick-actions-v2">
          <ActionButton href="/candidates" variant="secondary">新增候选人</ActionButton>
          <ActionButton href="/jobs" variant="secondary">新增岗位</ActionButton>
          <ActionButton href="/match" variant="secondary">进入匹配</ActionButton>
          <ActionButton href="/home" variant="secondary">
            查看分析
          </ActionButton>
        </div>
      </DetailPanel>
    </div>
  )
}
