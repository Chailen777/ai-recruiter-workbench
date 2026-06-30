import type { StatusBadgeVariant } from '@/components/ui/StatusBadge'

/**
 * 通用状态 → BadgeVariant 映射
 * 覆盖候选人、岗位、匹配等各实体的状态值
 */
export function statusVariant(value: string): StatusBadgeVariant {
  if (['合作中', '成功', '已成交', '入职'].includes(value)) return 'success'
  if (['已推荐', '已沟通', '面试中', '推荐中', '已跟进', 'Offer'].includes(value)) return 'progress'
  if (['开放', '新建', '待沟通', '待跟进', '暂停中'].includes(value)) return 'pending'
  if (['关闭', '淘汰', '已拒绝', '风险'].includes(value)) return 'risk'
  return 'neutral'
}

/**
 * 候选人状态 → BadgeVariant
 */
export function candidateStatusVariant(status?: string | null): StatusBadgeVariant {
  if (status === '入职') return 'success'
  if (status === '已沟通' || status === '已推荐' || status === '面试中' || status === 'Offer') return 'progress'
  if (status === '淘汰') return 'risk'
  return 'pending'
}

/**
 * 公司合作状态 → BadgeVariant
 */
export function companyStatusVariant(status: string): StatusBadgeVariant {
  if (status.includes('合作中') || status.includes('已联系')) return 'success'
  if (status.includes('待沟通')) return 'pending'
  if (status.includes('暂停')) return 'progress'
  if (status.includes('结束')) return 'risk'
  return 'neutral'
}

/**
 * 岗位状态 → BadgeVariant
 */
export function jobStatusVariant(status?: string | null): StatusBadgeVariant {
  if (status === '已关闭' || status === '关闭') return 'neutral'
  if (status === 'Offer') return 'success'
  if (status === '进行中' || status === '推荐中' || status === '面试中') return 'progress'
  return 'pending'
}

/**
 * 匹配状态 → BadgeVariant
 */
export function matchStatusVariant(status: string): StatusBadgeVariant {
  if (status === '已推荐') return 'success'
  if (status === '已拒绝') return 'risk'
  if (status === '已淘汰') return 'pending'
  if (status === '已放弃') return 'neutral'
  if (status === '已跟进' || status === '已成交') return 'progress'
  return 'neutral'
}
