'use client'

import { usePathname } from 'next/navigation'
// useState and useCallback reserved for future interactive header features

import { useMounted } from '@/hooks/useMounted'

const pageMeta: Record<
  string,
  { description: string; title: string }
> = {
  '/home': {
    description: '从这里进入一人猎头工作流，查看今日任务和关键资源池。',
    title: '首页看板',
  },
  '/companies': {
    description: '维护企业资源，并查看企业关联岗位。',
    title: '企业库',
  },
  '/jobs': {
    description: '管理岗位需求，后续进入岗位找人和匹配流程。',
    title: '岗位库',
  },
  '/candidates': {
    description: '管理候选人资源，后续进入人找岗和推荐流程。',
    title: '人才库',
  },
  '/match': {
    description: '基于规则引擎查看候选人与岗位的匹配结果。',
    title: '匹配评分',
  },
  '/knowledge': {
    description: '沉淀行业洞察与实战经验，让每一次猎头决策有据可循。',
    title: '知识库',
  },
  '/schools': {
    description: '积累院校资源，精准锁定优质人才源头。',
    title: '学校库',
  },
  '/charts': {
    description: '数据可视化驱动决策——市场趋势、人才分布一目了然。',
    title: '图表库',
  },
  '/info': {
    description: '汇聚行业动态与关键提醒，确保每条线索不遗漏。',
    title: '信息库',
  },
  '/contacts': {
    description: '梳理关键人脉网络，让每一次沟通和关系维护都有迹可循。',
    title: '人脉库',
  },
  '/projects': {
    description: '全流程跟踪猎头项目，从签约、交付到回款一目了然。',
    title: '项目库',
  },
  '/search': {
    description: '跨模块检索岗位、人才、企业、知识等全库资源。',
    title: '全局搜索',
  },
  '/desk-note': {
    description: '轻量桌面笔记面板，随时记录灵感、待办与沟通要点。',
    title: '桌面笔记',
  },
  '/resources': {
    description: '汇聚猎头全场景资源——知识、院校、图表、信息、人脉、项目一站式管理。',
    title: '资源中心',
  },
}

function resolveMeta(pathname: string | null) {
  if (!pathname) return pageMeta['/home']
  const key = Object.keys(pageMeta)
    .filter((item) => pathname === item || pathname.startsWith(`${item}/`))
    .sort((a, b) => b.length - a.length)[0]
  return pageMeta[key ?? '/home']
}

export function PageHeader({
  onMenuClick,
  sidebarOpen,
}: {
  onMenuClick: () => void
  sidebarOpen: boolean
}) {
  const pathname = usePathname()
  const mounted = useMounted()
  const meta = mounted ? resolveMeta(pathname) : pageMeta['/home']

  return (
    <header className="app-page-header">
      <button
        aria-controls="main-sidebar"
        aria-expanded={sidebarOpen}
        aria-label="切换导航"
        className="app-menu-button"
        onClick={onMenuClick}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="app-page-header-title">
        <p className="app-eyebrow">AI Headhunter OS</p>
        <h1>{meta.title}</h1>
        <p className="muted">{meta.description}</p>
      </div>

      <div className="app-header-search-center">
        <button
          className="app-search-trigger"
          onClick={() => window.dispatchEvent(new CustomEvent('global-search-open'))}
          type="button"
          aria-label="打开全局搜索"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5L21 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="app-search-trigger-label">搜索岗位、人才、企业…</span>
          <kbd className="app-search-trigger-kbd">/</kbd>
        </button>
      </div>

      <div className="app-header-actions"></div>
    </header>
  )
}
