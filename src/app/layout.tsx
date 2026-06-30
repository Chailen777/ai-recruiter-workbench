import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { AppShell } from '@/components/layout/AppShell'
import { KeyboardShortcutProvider, ThemeProvider, ToastProvider } from '@/components/providers'
import { ensureWAL } from '@/lib/prisma'

import './globals.css'

/* 强制所有页面动态渲染（避免构建时访问数据库） */
export const dynamic = 'force-dynamic'

/* 启动时确保 SQLite WAL 模式已启用 */
ensureWAL()

export const metadata: Metadata = {
  description: '一人猎头工作流操作系统',
  title: 'AI超级猎头工作台 V0.2',
}

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: [
    { color: '#f8fafc', media: '(prefers-color-scheme: light)' },
    { color: '#0f172a', media: '(prefers-color-scheme: dark)' },
  ],
  viewportFit: 'cover',
  width: 'device-width',
}

const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('ai-recruiter-theme') || 'system';
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {}
})();
`

function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      跳转到主内容
    </a>
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="light" lang="zh-CN" suppressHydrationWarning>
      <head>
        <Script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          id="theme-script"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <SkipLink />
        <ThemeProvider>
          <ToastProvider>
            <KeyboardShortcutProvider>
              <AppShell>{children}</AppShell>
            </KeyboardShortcutProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
