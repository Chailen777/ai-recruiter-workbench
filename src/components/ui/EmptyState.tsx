'use client'

import { type ReactNode } from 'react'

type EmptyStateVariant = 'jobs' | 'candidates' | 'companies' | 'match' | 'search' | 'knowledge' | 'schools' | 'charts' | 'info' | 'generic'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  action?: ReactNode
}

const ILLUSTRATIONS: Record<EmptyStateVariant, (className: string) => ReactNode> = {
  jobs: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="20" width="60" height="44" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="36" y="26" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <rect x="60" y="26" width="22" height="4" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="60" y="33" width="14" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="110" y="20" width="60" height="44" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="116" y="26" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <rect x="140" y="26" width="22" height="4" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="140" y="33" width="14" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <circle cx="100" cy="90" r="24" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <path d="M90 82L100 92L112 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  candidates: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="48" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M35 78C35 63 42 56 60 56C78 56 85 63 85 78" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
      <circle cx="140" cy="48" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M115 78C115 63 122 56 140 56C158 56 165 63 165 78" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
      <circle cx="100" cy="105" r="16" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35"/>
      <path d="M75 128C75 116 84 112 100 112C116 112 125 116 125 128" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <path d="M93 97L100 104L109 93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
    </svg>
  ),
  companies: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="24" width="46" height="64" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="104" y="38" width="46" height="50" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="30" y="100" width="140" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
      <rect x="60" y="34" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="76" y="34" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="60" y="50" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="76" y="50" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="60" y="66" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="76" y="66" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="114" y="46" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="130" y="46" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="114" y="62" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="130" y="62" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
    </svg>
  ),
  match: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="55" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="42" y="48" width="10" height="14" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="58" y="48" width="10" height="14" rx="2" fill="currentColor" opacity="0.2"/>
      <circle cx="145" cy="55" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="132" y="48" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <rect x="148" y="48" width="10" height="10" rx="2" fill="currentColor" opacity="0.2"/>
      <path d="M77 55H123" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"/>
      <circle cx="100" cy="55" r="5" fill="currentColor" opacity="0.3"/>
      <circle cx="100" cy="55" r="3" fill="currentColor" opacity="0.5"/>
      <path d="M88 95L100 78L112 95" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
      <rect x="85" y="96" width="30" height="6" rx="3" fill="currentColor" opacity="0.15"/>
    </svg>
  ),
  search: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="65" r="28" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <line x1="100" y1="85" x2="128" y2="113" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M68 65L72 69M76 65L80 69M72 57L76 53" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
    </svg>
  ),
  generic: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="24" width="152" height="92" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <rect x="48" y="48" width="104" height="8" rx="4" fill="currentColor" opacity="0.15"/>
      <rect x="48" y="64" width="76" height="8" rx="4" fill="currentColor" opacity="0.1"/>
      <rect x="78" y="100" width="44" height="8" rx="4" fill="currentColor" opacity="0.2"/>
    </svg>
  ),
  knowledge: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="56" y="18" width="88" height="70" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <path d="M56 24L100 18L144 24" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.2"/>
      <rect x="66" y="32" width="58" height="4" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="66" y="42" width="42" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="66" y="52" width="50" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="66" y="62" width="30" height="4" rx="2" fill="currentColor" opacity="0.08"/>
      <circle cx="100" cy="104" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <path d="M94 104L100 110L108 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
    </svg>
  ),
  schools: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="40" width="120" height="60" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <path d="M40 40L100 20L160 40" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
      <rect x="90" y="50" width="20" height="28" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.35"/>
      <path d="M95 50L100 42L105 50" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.3"/>
      <rect x="52" y="50" width="14" height="14" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="52" y="70" width="14" height="14" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="134" y="50" width="14" height="14" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="134" y="70" width="14" height="14" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="30" y="100" width="140" height="12" rx="3" fill="currentColor" opacity="0.08"/>
    </svg>
  ),
  charts: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="100" width="22" height="24" rx="3" fill="currentColor" opacity="0.2"/>
      <rect x="60" y="70" width="22" height="54" rx="3" fill="currentColor" opacity="0.3"/>
      <rect x="90" y="44" width="22" height="80" rx="3" fill="currentColor" opacity="0.4"/>
      <rect x="120" y="56" width="22" height="68" rx="3" fill="currentColor" opacity="0.25"/>
      <rect x="150" y="80" width="22" height="44" rx="3" fill="currentColor" opacity="0.15"/>
      <line x1="24" y1="102" x2="178" y2="102" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
      <path d="M36 82L72 50L102 28L132 40L162 64" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" strokeDasharray="4 3"/>
      <circle cx="102" cy="28" r="3" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  info: (cls) => (
    <svg className={cls} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="44" y="22" width="112" height="88" rx="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <rect x="52" y="32" width="8" height="8" rx="4" fill="currentColor" opacity="0.3"/>
      <rect x="68" y="32" width="72" height="4" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="68" y="42" width="54" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="52" y="54" width="8" height="8" rx="4" fill="currentColor" opacity="0.2"/>
      <rect x="68" y="54" width="60" height="4" rx="2" fill="currentColor" opacity="0.12"/>
      <rect x="68" y="64" width="40" height="4" rx="2" fill="currentColor" opacity="0.08"/>
      <rect x="52" y="76" width="8" height="8" rx="4" fill="currentColor" opacity="0.25"/>
      <rect x="68" y="76" width="48" height="4" rx="2" fill="currentColor" opacity="0.1"/>
      <rect x="120" y="76" width="20" height="4" rx="2" fill="currentColor" opacity="0.15"/>
      <path d="M52 94L68 94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <rect x="74" y="92" width="66" height="6" rx="3" fill="currentColor" opacity="0.08"/>
    </svg>
  ),
}

const LABELS: Record<EmptyStateVariant, { title: string; description: string }> = {
  jobs: {
    title: '还没有岗位数据',
    description: '管理岗位需求，后续进入岗位找人和匹配流程。',
  },
  candidates: {
    title: '候选人池是空的',
    description: '管理候选人资源，后续进入人找岗和推荐流程。',
  },
  companies: {
    title: '企业库等待填充',
    description: '维护企业资源，并查看企业关联岗位。',
  },
  match: {
    title: '暂无匹配数据',
    description: '请先确保岗位库和候选人池中有数据，然后选择匹配模式开始。',
  },
  search: {
    title: '没有找到匹配结果',
    description: '试试调整搜索条件，或使用不同的关键词重新搜索。',
  },
  generic: {
    title: '暂无数据',
    description: '这里目前还是空的，从添加第一条记录开始吧。',
  },
  knowledge: {
    title: '知识库待建设',
    description: '沉淀行业洞察、方法论和实战经验，让每一次猎头决策都有据可循。',
  },
  schools: {
    title: '学校库待建设',
    description: '积累院校资源与专业分布数据，精准锁定优质人才源头。',
  },
  charts: {
    title: '图表库待建设',
    description: '用数据可视化驱动决策——从市场趋势到人才分布，图表让洞察一目了然。',
  },
  info: {
    title: '信息库待建设',
    description: '汇聚行业动态、沟通记录与关键提醒，确保每一条线索不遗漏。',
  },
}

export function EmptyState({
  variant = 'generic',
  title,
  description,
  action,
}: EmptyStateProps) {
  const labels = LABELS[variant]

  return (
    <div className="empty-state" role="status">
      <div className="empty-state-illustration">
        {ILLUSTRATIONS[variant]('empty-state-svg')}
      </div>
      <p className="empty-state-title">{title ?? labels.title}</p>
      <p className="empty-state-desc">{description ?? labels.description}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  )
}
