'use client'

import { ReactNode, useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { PageHeader } from './PageHeader'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { DeskNoteFab } from './DeskNoteFab'
import { ToastContainer } from '@/components/ui'
import { MiniMusicPlayer } from '@/components/ui/MiniMusicPlayer'
import { NotesRefreshProvider } from '@/components/providers'
import { isAuthenticated, login, isLocked, lockScreen, unlockScreen } from '@/lib/auth'

/* ── RightPanel 懒加载：默认折叠，首屏不打包 NotePanel + NotesCalendar JS ── */
const RightPanel = dynamic(
  () => import('./RightPanel').then((m) => m.RightPanel),
  { ssr: false }
)

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  /* ── 锁屏状态 ── */
  // 初始化时从 sessionStorage 读取，防止刷新绕过锁屏
  const [locked, setLocked] = useState(false)
  const [lockPassword, setLockPassword] = useState('')
  const [lockError, setLockError] = useState('')
  const [lockLoading, setLockLoading] = useState(false)
  const [, startTransition] = useTransition()
  const lockInputRef = useRef<HTMLInputElement>(null)

  /* ── 认证守卫：非 /login 路径检查登录状态 ── */
  useEffect(() => {
    // 登录页不需要认证
    if (pathname === '/login') {
      setAuthChecked(true)
      return
    }

    // 检查认证状态
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    // 认证通过后，检查是否有锁屏标记（防止刷新绕过）
    if (isLocked()) {
      setLocked(true)
      setTimeout(() => lockInputRef.current?.focus(), 50)
    }

    setAuthChecked(true)
  }, [pathname, router])

  /* ── 快捷键锁屏：Ctrl+L ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+L 或 Cmd+L（Mac）触发锁屏
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        lockScreen()          // 持久化锁屏标记
        setLocked(true)
        setLockPassword('')
        setLockError('')
        // 延迟聚焦，等 DOM 渲染
        setTimeout(() => lockInputRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  /* ── 空闲超时自动锁屏：5 分钟无操作自动锁定 ── */
  const IDLE_TIMEOUT = 5 * 60 * 1000 // 5分钟
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 登录页、未认证、已锁屏时不启用空闲检测
    if (pathname === '/login' || !authChecked || locked) return

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        lockScreen()
        setLocked(true)
        setLockPassword('')
        setLockError('')
        setTimeout(() => lockInputRef.current?.focus(), 50)
      }, IDLE_TIMEOUT)
    }

    // 用户活动事件：鼠标移动、点击、键盘、滚动、触摸
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    let throttled = false
    const handleActivity = () => {
      // 节流：500ms 内只重置一次，避免频繁 clearTimeout/setTimeout
      if (throttled) return
      throttled = true
      setTimeout(() => { throttled = false }, 500)
      resetIdleTimer()
    }

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }))
    resetIdleTimer() // 初始化计时器

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [pathname, authChecked, locked])

  /* ── 锁屏解锁（使用 startTransition 避免 INP 阻塞） ── */
  const handleUnlock = useCallback(() => {
    if (lockLoading || !lockPassword) return
    setLockLoading(true)
    setLockError('')
    startTransition(async () => {
      try {
        const result = await login(lockPassword)
        if (result.success) {
          startTransition(() => {
            unlockScreen()
            setLocked(false)
            setLockPassword('')
          })
        } else {
          startTransition(() => {
            setLockError(result.error || '密码错误')
            setLockPassword('')
          })
        }
      } catch {
        startTransition(() => {
          setLockError('网络异常，请重试')
          setLockPassword('')
        })
      } finally {
        setLockLoading(false)
        lockInputRef.current?.focus()
      }
    })
  }, [lockPassword, lockLoading])

  // 登录页面：直接渲染 children，不包裹 AppShell
  if (pathname === '/login') {
    return <>{children}</>
  }

  // 未完成认证检查：显示加载状态
  if (!authChecked) {
    return (
      <div className="app-shell-loading">
        <div className="app-shell-spinner" />
      </div>
    )
  }

  return (
    <>
      <div className="app-shell" data-sidebar-collapsed={sidebarCollapsed ? '' : undefined}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="app-workspace">
          <PageHeader onMenuClick={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />
          <NotesRefreshProvider>
            <div className="app-content-grid">
              <main className="app-main" id="main-content">
                {children}
              </main>
              <RightPanel />
            </div>
          </NotesRefreshProvider>
          <ToastContainer />
          <BottomTabBar />
          <DeskNoteFab />
          <MiniMusicPlayer />
        </div>
      </div>

      {/* 锁屏遮罩 */}
      {locked && (
        <div className="lock-screen">
          <div className="lock-bg-blob blob1" />
          <div className="lock-bg-blob blob2" />
          <div className="lock-bg-blob blob3" />
          <div className="lock-card">
            <img
              alt="Chailen 柴伦世家"
              className="lock-logo"
              src="/chailen-logo.png"
            />
            <div className="lock-icon">🔒</div>
            <h2 className="lock-title">屏幕已锁定</h2>
            <p className="lock-desc">输入密码解锁继续工作</p>
            <div className="lock-form">
              <div className="lock-input-wrap">
                <input
                  ref={lockInputRef}
                  type="password"
                  className="lock-input"
                  placeholder="请输入密码"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock() }}
                  disabled={lockLoading}
                />
                <button
                  className="lock-eye"
                  onClick={() => {
                    const inp = lockInputRef.current
                    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password'
                  }}
                  type="button"
                >
                  👁️
                </button>
              </div>
              {lockError && <div className="lock-error">{lockError}</div>}
              <button className="lock-btn" onClick={handleUnlock} disabled={lockLoading || !lockPassword}>
                {lockLoading ? <span className="lock-spinner" /> : '🔓 解锁'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
