'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo } from 'react'

/* ═══════════════════════════════════════════════════════
   底部导航栏 — 移动端风格，5个Tab
   笔记 / 岗位 / 匹配 / 人才 / 资源
   ═══════════════════════════════════════════════════════ */

type Tab = {
  id: string
  href?: string
  label: string
  icon: string   // SVG path d
}

const tabs: Tab[] = [
  {
    id: 'notes',
    label: '笔记',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    id: 'jobs',
    href: '/jobs',
    label: '岗位',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    id: 'match',
    href: '/match',
    label: '匹配',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'talents',
    href: '/candidates',
    label: '人才',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    id: 'resources',
    href: '/resources',
    label: '资源',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
]

function isActive(pathname: string | null, href?: string) {
  if (!pathname || !href) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

const TabButton = memo(function TabButton({
  tab,
  active,
}: {
  tab: Tab
  active: boolean
}) {
  const content = (
    <>
      <svg
        aria-hidden="true"
        className="btb-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d={tab.icon} />
      </svg>
      <span className="btb-label">{tab.label}</span>
    </>
  )

  if (!tab.href) {
    return (
      <button
        aria-controls="global-note-panel"
        aria-label="打开卡片笔记"
        className="btb-tab"
        onClick={() => window.dispatchEvent(new CustomEvent('open-desk-note'))}
        type="button"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={tab.href}
      className={`btb-tab${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  )
})

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="bottom-tab-bar" aria-label="底部导航">
      {tabs.map((tab) => (
        <TabButton
          active={isActive(pathname, tab.href)}
          key={tab.id}
          tab={tab}
        />
      ))}
    </nav>
  )
}
