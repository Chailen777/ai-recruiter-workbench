import Link from 'next/link'

/* ═══════════════════════════════════════════════════════
   资源中心 — 聚合知识库、学校库、图表库、信息库、人脉库、项目库
   ═══════════════════════════════════════════════════════ */

const resourceItems = [
  {
    color: '#2563eb',
    description: '沉淀行业洞察与实战经验，让每一次猎头决策有据可循',
    href: '/knowledge',
    icon: (
      <path d="M12 6.253v13m0-13C10.07 5.586 8.933 4.5 7.5 4.5S4.93 5.586 3 6.253v13C4.93 19.14 6.067 21 7.5 21s2.57-1.086 3-1.747v-13" />
    ),
    label: '知识库',
  },
  {
    color: '#16a34a',
    description: '积累院校资源，精准锁定优质人才源头',
    href: '/schools',
    icon: (
      <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    ),
    label: '学校库',
  },
  {
    color: '#8b5cf6',
    description: '数据可视化驱动决策——市场趋势、人才分布一目了然',
    href: '/charts',
    icon: (
      <path d="M3 13h4v8H3v-8zm5-4h4v12H8V9zm5-6v18h4V3h-4z" />
    ),
    label: '图表库',
  },
  {
    color: '#f59e0b',
    description: '汇聚行业动态与关键提醒，确保每条线索不遗漏',
    href: '/info',
    icon: (
      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18" />
    ),
    label: '信息库',
  },
  {
    color: '#ec4899',
    description: '梳理关键人脉网络，让每一次沟通和关系维护都有迹可循',
    href: '/contacts',
    icon: (
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    label: '人脉库',
  },
  {
    color: '#06b6d4',
    description: '全流程跟踪猎头项目，从签约、交付到回款一目了然',
    href: '/projects',
    icon: (
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
    label: '项目库',
  },
]

export default function ResourcesPage() {
  return (
    <div className="resources-page">
      <section className="resources-hero">
        <div>
          <p className="app-eyebrow">Resource Center</p>
          <h1>资源中心</h1>
          <p className="muted">汇聚猎头全场景资源，知识、院校、图表、信息、人脉、项目一站式管理。</p>
        </div>
      </section>

      <div className="resources-grid">
        {resourceItems.map((item) => (
          <Link
            className="resources-card"
            href={item.href}
            key={item.href}
            style={{ '--res-accent': item.color } as React.CSSProperties}
          >
            <div className="resources-card-icon-wrap">
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{ width: 28, height: 28 }}
              >
                {item.icon}
              </svg>
            </div>
            <div className="resources-card-body">
              <strong className="resources-card-title">{item.label}</strong>
              <p className="resources-card-desc">{item.description}</p>
            </div>
            <svg
              aria-hidden="true"
              className="resources-card-arrow"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 20 20"
            >
              <path d="M7 5l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
