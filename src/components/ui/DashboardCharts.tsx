'use client'

import { memo } from 'react'
import { DetailPanel } from './DetailPanel'
import { PipelineBarChart, ScoreHistogram, StatusPieChart, TrendAreaChart, type StatusDistItem, type TrendPoint } from './Charts'
import { KanbanBoard, type KanbanColumn } from './KanbanBoard'
import { ChartErrorBoundary } from './ChartErrorBoundary'

interface DashboardChartsProps {
  trend: TrendPoint[]
  jobStatusDistribution: StatusDistItem[]
  candidateStatusDistribution: StatusDistItem[]
  pipelineData: StatusDistItem[]
  kanbanColumns: KanbanColumn[]
}

export const DashboardCharts = memo(function DashboardCharts({
  trend,
  jobStatusDistribution,
  candidateStatusDistribution,
  pipelineData,
  kanbanColumns,
}: DashboardChartsProps) {
  return (
    <>
      {/* ── Trend Chart ── */}
      <section className="dashboard-chart-grid">
        <DetailPanel
          description="近 7 天新增企业、岗位、候选人趋势"
          title="业务趋势"
        >
          <ChartErrorBoundary>
            <TrendAreaChart data={trend} height={260} />
          </ChartErrorBoundary>
        </DetailPanel>

        {/* ── Job Status Pie ── */}
        <DetailPanel
          description="岗位所处阶段分布"
          title="岗位状态分布"
        >
          <ChartErrorBoundary>
            <StatusPieChart data={jobStatusDistribution} height={220} title="岗位" />
          </ChartErrorBoundary>
        </DetailPanel>

        {/* ── Candidate Status Pie ── */}
        <DetailPanel
          description="候选人当前状态分布"
          title="候选人状态分布"
        >
          <ChartErrorBoundary>
            <StatusPieChart data={candidateStatusDistribution} height={220} title="候选人" />
          </ChartErrorBoundary>
        </DetailPanel>
      </section>

      {/* ── Pipeline Funnel ── */}
      <section className="dashboard-chart-grid">
        <DetailPanel
          description="招聘流程各阶段候选人数量"
          title="招聘 Pipeline"
        >
          <ChartErrorBoundary>
            <PipelineBarChart data={pipelineData} height={240} />
          </ChartErrorBoundary>
        </DetailPanel>

        {/* ── Score Distribution (placeholder when no match data) ── */}
        {candidateStatusDistribution.length > 0 && (
          <DetailPanel
            description="候选人匹配分数区间分布"
            title="匹配分数分布"
          >
            <ChartErrorBoundary>
              <ScoreHistogram
                data={[
                  { count: 0, label: '0-20' },
                  { count: 0, label: '21-40' },
                  { count: 0, label: '41-60' },
                  { count: 0, label: '61-80' },
                  { count: 0, label: '81-100' },
                ]}
                height={200}
              />
            </ChartErrorBoundary>
          </DetailPanel>
        )}
      </section>

      {/* ── Kanban Board ── */}
      <DetailPanel
        description="新增候选人自动进入待初筛列。拖拽卡片推进招聘阶段，拖动后候选人状态自动同步更新。双击卡片查看详情。"
        title="工作流看板"
      >
        <KanbanBoard
          columns={kanbanColumns}
          restrictedDropColumns={['hired', 'rejected', 'expired']}
          onCardMove={(cardId, from, to) => {
            const colLabel: Record<string, string> = {
              screening: '待初筛',
              interview: '面试中',
              offer: 'Offer',
              hired: '已入职',
              rejected: '淘汰',
              expired: '过期',
            }
            console.log(
              `🔄 候选人阶段变更: ${cardId} → ${colLabel[to] ?? to}（原阶段: ${colLabel[from] ?? from}）`
            )
            // TODO: 调用 Server Action 更新候选人状态
          }}
          onCardDelete={(cardId, columnId) => {
            console.log(`🗑️ 删除卡片: ${cardId} from ${columnId}`)
          }}
        />
      </DetailPanel>
    </>
  )
})
