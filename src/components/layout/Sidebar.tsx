'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, memo } from 'react'

import { useMounted } from '@/hooks/useMounted'
import { ThemeToggle } from '@/components/ui'
import { logout } from '@/lib/auth'

type NavItem = {
  href: string
  label: string
  icon: string
}

type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    id: 'insight',
    label: 'Insight',
    items: [
      { href: '/home', label: '首页看板', icon: 'M3 12l2-2m0 0l7-7 7 7m-14-2v5a2 2 0 002 2h10a2 2 0 002-2v-5' },
      { href: '/match', label: '匹配中心', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { href: '/resources', label: '资源中心', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    ],
  },
  {
    id: 'core',
    label: 'Core',
    items: [
      { href: '/jobs', label: '岗位库', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { href: '/candidates', label: '人才库', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { href: '/companies', label: '企业库', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    ],
  },
  {
    id: 'resource',
    label: 'Resource',
    items: [
      { href: '/knowledge', label: '知识库', icon: 'M12 6.253v13m0-13C10.07 5.586 8.933 4.5 7.5 4.5S4.93 5.586 3 6.253v13C4.93 19.14 6.067 21 7.5 21s2.57-1.086 3-1.747v-13' },
      { href: '/schools', label: '学校库', icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
      { href: '/charts', label: '图表库', icon: 'M3 13h4v8H3v-8zm5-4h4v12H8V9zm5-6v18h4V3h-4z' },
      { href: '/info', label: '信息库', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18' },
      { href: '/contacts', label: '人脉库', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { href: '/projects', label: '项目库', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    ],
  },
]

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

type SidebarProps = {
  collapsed: boolean
  onToggleCollapse: () => void
  open: boolean
  onClose: () => void
}

/** A single nav link, memoized to avoid re-rendering on collapse toggle */
const NavLink = memo(function NavLink({
  item,
  active,
  collapsed,
  onClose,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClose: () => void
}) {
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={active ? 'app-nav-link active' : 'app-nav-link'}
      href={item.href}
      onClick={() => onClose()}
      title={collapsed ? item.label : undefined}
    >
      <svg
        aria-hidden="true"
        className="app-nav-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d={item.icon} />
      </svg>
      <span>{item.label}</span>
    </Link>
  )
})

/** A collapsible nav group */
function NavGroupSection({
  group,
  activeHref,
  collapsed,
  defaultExpanded,
  onClose,
}: {
  group: NavGroup
  activeHref: string | null
  collapsed: boolean
  defaultExpanded: boolean
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const contentRef = useRef<HTMLDivElement>(null)
  const userToggled = useRef(false)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(defaultExpanded ? undefined : 0)

  useEffect(() => {
    if (!contentRef.current) return
    setMaxHeight(expanded ? contentRef.current.scrollHeight : 0)
  }, [expanded, group.items.length])

  // Auto-expand if a child is active, but only when user hasn't manually toggled
  const hasActiveChild = activeHref && group.items.some((item) => isActive(activeHref, item.href))
  useEffect(() => {
    if (hasActiveChild && !expanded && !userToggled.current) {
      setExpanded(true)
    }
  }, [hasActiveChild, expanded])

  const handleToggle = useCallback(() => {
    userToggled.current = true
    setExpanded((v) => !v)
  }, [])

  // When collapsed, hide group labels and always show items flat
  if (collapsed) {
    return (
      <div className="app-nav-group" data-group={group.id}>
        {group.items.map((item) => {
          const active = isActive(activeHref, item.href)
          return <NavLink active={active} collapsed key={item.href} item={item} onClose={onClose} />
        })}
      </div>
    )
  }

  return (
    <div className="app-nav-group" data-group={group.id} data-expanded={expanded ? 'true' : 'false'}>
      <button
        aria-expanded={expanded}
        className="app-nav-group-header"
        onClick={handleToggle}
        type="button"
      >
        <span className="app-nav-group-label">{group.label}</span>
        <svg
          aria-hidden="true"
          className="app-nav-group-chevron"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 20 20"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
        >
          <path d="M7 5l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className="app-nav-group-content"
        ref={contentRef}
        style={{
          maxHeight: maxHeight !== undefined ? `${maxHeight}px` : 'none',
          overflow: 'hidden',
          transition: 'max-height 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {group.items.map((item) => {
          const active = isActive(activeHref, item.href)
          return <NavLink active={active} collapsed={false} key={item.href} item={item} onClose={onClose} />
        })}
      </div>
    </div>
  )
}

export function Sidebar({ collapsed, onToggleCollapse, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const mounted = useMounted()
  const panelRef = useRef<HTMLElement>(null)

  const activeHref = mounted ? pathname : null

  const handleLogout = useCallback(() => {
    logout()
    router.push('/login')
  }, [router])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    function handleResize() {
      if (window.innerWidth >= 900) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const firstLink = panel?.querySelector<HTMLElement>('a, button')
    firstLink?.focus()
  }, [open])

  return (
    <>
      <aside
        ref={panelRef}
        className="app-sidebar"
        id="main-sidebar"
        data-open={open ? 'true' : undefined}
      >
        <div className="app-brand">
          <Link className="app-brand-inner" href="/home">
            <img
              alt="Chailen 柴伦世家"
              className="app-brand-logo"
              src="/chailen-logo.png"
            />
            <div className="app-brand-logo-collapsed" aria-hidden="true">AI</div>
            <span className="app-brand-text">
              <strong>AI超级猎头工作台</strong>
              <small>V0.2 OS</small>
            </span>
          </Link>
          <button
            aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
            className="app-sidebar-toggle"
            onClick={onToggleCollapse}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 20 20"
            >
              <path d={collapsed ? 'M7 5l6 6-6 6' : 'M13 5l-6 6 6 6'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav className="app-nav" aria-label="主导航">
          {navGroups.map((group) => (
            <NavGroupSection
              activeHref={activeHref}
              collapsed={collapsed}
              defaultExpanded={group.id === 'core'}
              group={group}
              key={group.id}
              onClose={onClose}
            />
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <ThemeToggle />
          <button
            className="app-sidebar-logout"
            onClick={handleLogout}
            title="退出登录"
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              className="app-sidebar-logout-icon"
            >
              <path
                d="M15 12H3m0 0l4-4m-4 4l4 4m6-12H7a2 2 0 00-2 2v2m10-4a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2v-2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{collapsed ? '' : '退出登录'}</span>
          </button>
        </div>
      </aside>

      {open ? (
        <button
          aria-hidden="true"
          className="app-sidebar-backdrop"
          onClick={onClose}
          tabIndex={-1}
          type="button"
        />
      ) : null}
    </>
  )
}
