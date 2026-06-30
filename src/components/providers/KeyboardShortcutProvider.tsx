'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useKeyboardShortcut, type Shortcut } from '@/hooks/useKeyboardShortcut'

/* ── 重型弹窗懒加载：首屏不打包，打开才加载 ── */
const QuickNoteModal = dynamic(
  () => import('@/components/ui/QuickNoteModal').then((m) => m.QuickNoteModal),
  { ssr: false }
)
const QuickMatchModal = dynamic(
  () => import('@/components/ui/QuickMatchModal').then((m) => m.QuickMatchModal),
  { ssr: false }
)
const GlobalSearch = dynamic(
  () => import('@/components/ui/GlobalSearch').then((m) => m.GlobalSearch),
  { ssr: false }
)

/* ── Route map for Ctrl+1..4 navigation ── */
const QUICK_ROUTES = ['/home', '/jobs', '/candidates', '/match'] as const

/** 打开命令面板式全局搜索 */
function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent('global-search-open'))
}

function toggleBothPanels() {
  const appShell = document.querySelector<HTMLElement>('.app-shell')
  const rightPanel = document.querySelector<HTMLElement>('.app-right-panel')
  const sidebarHidden = appShell?.hasAttribute('data-sidebar-collapsed')
  const rightHidden = rightPanel?.classList.contains('is-collapsed')

  // 任意一侧可见 → 全部隐藏；全部已隐藏 → 全部展开
  const shouldHide = !sidebarHidden || !rightHidden

  // 左侧栏
  if (shouldHide !== !!sidebarHidden) {
    const sidebarBtn = document.querySelector<HTMLElement>('.app-sidebar-toggle')
    sidebarBtn?.click()
  }
  // 右侧面板
  if (shouldHide !== !!rightHidden) {
    const rightBtn = document.querySelector<HTMLElement>('.app-right-panel-toggle')
    rightBtn?.click()
  }
}

/** 打开笔记日历：先确保右侧面板展开，再触发日历弹窗 */
function openNotesCalendar() {
  const rightPanel = document.querySelector<HTMLElement>('.app-right-panel')
  // 如果面板折叠，先展开
  if (rightPanel?.classList.contains('is-collapsed')) {
    const toggleBtn = document.querySelector<HTMLElement>('.app-right-panel-toggle')
    toggleBtn?.click()
  }
  // 等待组件挂载后再触发（requestAnimationFrame 双缓冲足够 React 完成渲染）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('notes-calendar-open'))
    })
  })
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickTodoOpen, setQuickTodoOpen] = useState(false)
  const [quickMatchOpen, setQuickMatchOpen] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)

  const openQuickNote = useCallback(() => setQuickNoteOpen(true), [])
  const closeQuickNote = useCallback(() => setQuickNoteOpen(false), [])
  const openQuickTodo = useCallback(() => setQuickTodoOpen(true), [])
  const closeQuickTodo = useCallback(() => setQuickTodoOpen(false), [])
  const openQuickMatch = useCallback(() => setQuickMatchOpen(true), [])
  const closeQuickMatch = useCallback(() => setQuickMatchOpen(false), [])

  const shortcuts: Shortcut[] = [
    // ── / 或 Ctrl+K: 弹出命令面板式全局搜索 ──
    {
      key: '/',
      description: '打开全局搜索',
      handler: openGlobalSearch,
    },
    {
      key: 'k',
      ctrl: true,
      description: '打开全局搜索',
      handler: openGlobalSearch,
    },

    // ── Ctrl+Shift+Space: 屏幕中央弹出快速新建随笔 ──
    // 用 Shift+Space 替代 Space，避免 Windows 中文输入法 Ctrl+Space 被 OS 拦截
    {
      key: ' ',
      code: 'Space',
      ctrl: true,
      shift: true,
      ignoreInputs: false,
      description: '快速新建随笔',
      handler: openQuickNote,
    },

    // ── Ctrl+Shift+D: 屏幕中央弹出快速新建待办 ──
    {
      key: 'd',
      code: 'KeyD',
      ctrl: true,
      shift: true,
      ignoreInputs: false,
      description: '快速新建待办',
      handler: openQuickTodo,
    },

    // ── Ctrl+Shift+C: 打开笔记日历 ──
    {
      key: 'c',
      code: 'KeyC',
      ctrl: true,
      shift: true,
      description: '打开笔记日历',
      handler: openNotesCalendar,
    },

    // ── Escape: 关闭面板/弹窗/日历 ──
    {
      key: 'Escape',
      description: '关闭当前面板或弹窗',
      handler: () => {
        // 优先关闭日历弹窗（如果在最顶层）
        const calClose = document.querySelector<HTMLElement>('.notes-calendar-close-btn')
        if (calClose) {
          calClose.click()
          return
        }

        // 其次关闭 Sheet / Dialog / ConfirmDialog
        const closeBtn = document.querySelector<HTMLElement>(
          '.sheet-close, [data-close], .confirm-btn.cancel, .dialog-close'
        )
        if (closeBtn) {
          closeBtn.click()
          return
        }

        // 最后尝试 backdrop
        const backdrop = document.querySelector<HTMLElement>(
          '.sheet-backdrop, .confirm-backdrop'
        )
        if (backdrop) {
          backdrop.click()
        }
      },
    },

    // ── Ctrl+Shift+H: 一键隐藏/显示左右面板 ──
    {
      key: 'h',
      code: 'KeyH',
      ctrl: true,
      shift: true,
      description: '隐藏/显示左右侧栏',
      handler: toggleBothPanels,
    },

    // ── Ctrl+Shift+M: 快速匹配弹窗 ──
    {
      key: 'm',
      code: 'KeyM',
      ctrl: true,
      shift: true,
      description: '快速匹配弹窗',
      handler: openQuickMatch,
    },

    // ── Ctrl+1..4: 页面导航 ──
    {
      key: '1',
      ctrl: true,
      description: '跳转到看板',
      handler: () => router.push(QUICK_ROUTES[0]),
    },
    {
      key: '2',
      ctrl: true,
      description: '跳转到岗位',
      handler: () => router.push(QUICK_ROUTES[1]),
    },
    {
      key: '3',
      ctrl: true,
      description: '跳转到候选人',
      handler: () => router.push(QUICK_ROUTES[2]),
    },
    {
      key: '4',
      ctrl: true,
      description: '跳转到匹配',
      handler: () => router.push(QUICK_ROUTES[3]),
    },
  ]

  // Register each shortcut
  shortcuts.forEach((s) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKeyboardShortcut(s, [pathname, router])
  })

  // ── 监听 custom event 打开全局搜索 ──
  useEffect(() => {
    function onOpen() {
      setGlobalSearchOpen(true)
    }
    window.addEventListener('global-search-open', onOpen)
    return () => window.removeEventListener('global-search-open', onOpen)
  }, [])

  return (
    <>
      {children}

      {/* 懒加载弹窗：只有 state 为 true 时才挂载（首次打开触发 chunk 下载，后续瞬间响应） */}
      {quickNoteOpen && <QuickNoteModal open={quickNoteOpen} onClose={closeQuickNote} />}
      {quickTodoOpen && <QuickNoteModal open={quickTodoOpen} onClose={closeQuickTodo} noteType="todo" />}
      {quickMatchOpen && <QuickMatchModal open={quickMatchOpen} onClose={closeQuickMatch} />}
      {globalSearchOpen && <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />}
    </>
  )
}
