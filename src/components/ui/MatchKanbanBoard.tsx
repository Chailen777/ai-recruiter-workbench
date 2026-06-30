'use client'

import { memo, useMemo } from 'react'
import { KanbanBoard, type KanbanColumn } from './KanbanBoard'
import { DetailPanel } from './DetailPanel'

interface MatchKanbanBoardProps {
  rows: Array<{
    candidateId: number
    candidateName: string
    jobId: number
    jobName: string
    score: number
    status: string
    level: string
  }>
}

type StageId = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'expired'

function mapStatusToStage(status: string): StageId {
  if (status === '未推荐' || status === '待初筛') return 'screening'
  if (status === '已推荐' || status === '已跟进' || status === '面试中') return 'interview'
  if (status === '已成交' || status === 'Offer') return 'offer'
  if (status === '入职' || status === '已入职') return 'hired'
  if (status === '淘汰' || status === '不合适') return 'rejected'
  if (status === '过期' || status === '已过期') return 'expired'
  return 'screening'
}

const STAGE_LABELS: Record<StageId, string> = {
  screening: '待初筛',
  interview: '面试中',
  offer: 'Offer',
  hired: '已入职',
  rejected: '淘汰',
  expired: '过期',
}

const STAGE_COLORS: Record<StageId, string> = {
  screening: '#2563eb',
  interview: '#f59e0b',
  offer: '#16a34a',
  hired: '#8b5cf6',
  rejected: '#ef4444',
  expired: '#78716c',
}

const STAGE_ORDER: readonly StageId[] = ['screening', 'interview', 'offer', 'hired', 'rejected', 'expired'] as const

export const MatchKanbanBoard = memo(function MatchKanbanBoard({
  rows,
}: MatchKanbanBoardProps) {
  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    const grouped: Record<StageId, KanbanColumn['items']> = {
      screening: [],
      interview: [],
      offer: [],
      hired: [],
      rejected: [],
      expired: [],
    }

    rows.forEach((row) => {
      const stage = mapStatusToStage(row.status)
      grouped[stage].push({
        id: `match-${row.candidateId}-${row.jobId}`,
        title: row.candidateName,
        subtitle: row.jobName,
        tag: row.level + '匹配',
        score: row.score,
        candidateId: row.candidateId,
      })
    })

    return STAGE_ORDER.map((id) => ({
      id,
      label: STAGE_LABELS[id],
      color: STAGE_COLORS[id],
      items: grouped[id],
    }))
  }, [rows])

  const hasAnyCards = kanbanColumns.some((col) => col.items.length > 0)

  if (!hasAnyCards) {
    return (
      <DetailPanel
        description="当匹配结果产生后，候选人将按状态显示在这里，支持拖拽改变阶段"
        title="匹配工作流看板"
      >
        <p style={{ color: 'var(--ds-color-text-secondary)', padding: '24px 0', textAlign: 'center' }}>
          暂无匹配候选人，请先生成匹配结果
        </p>
      </DetailPanel>
    )
  }

  return (
    <DetailPanel
      description="拖拽候选人卡片到对应阶段，快速推进招聘流程。双击卡片查看详情。"
      title="匹配工作流看板"
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
            `🔄 匹配候选人阶段变更: ${cardId} → ${colLabel[to] ?? to}（原阶段: ${colLabel[from] ?? from}）`
          )
        }}
        onCardDelete={(cardId, columnId) => {
          console.log(`🗑️ 匹配看板删除: ${cardId} from ${columnId}`)
        }}
      />
    </DetailPanel>
  )
})
