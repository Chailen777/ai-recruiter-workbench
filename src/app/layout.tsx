import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { AppShell } from '@/components/layout/AppShell'
import { KeyboardShortcutProvider, ThemeProvider, ToastProvider } from '@/components/providers'
import { ensureWAL } from '@/lib/prisma'

import './globals.css'

/* 启动时确保 SQLite WAL 模式已启用 */
ensureWAL()

export const metadata: Metadata = {
  description: '一人猎头工作流操作系统',
  title: 'AI超级猎头工作台 V0.2',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'AI超级猎头工作台',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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

const swCleanupScript = `
(function() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  
  function unregisterAll() {
    return navigator.serviceWorker.getRegistrations().then(function(regs) {
      return Promise.all(regs.map(function(reg) {
        return reg.unregister().then(function(ok) {
          console.log('[SW Cleanup] unregister:', ok, reg.scope);
        }).catch(function(err) {
          console.error('[SW Cleanup] unregister failed:', err);
        });
      }));
    });
  }
  
  function clearAllCaches() {
    if (!('caches' in window)) return Promise.resolve();
    return caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return caches.delete(name).then(function(ok) {
          console.log('[SW Cleanup] cache deleted:', ok, name);
        }).catch(function(err) {
          console.error('[SW Cleanup] cache delete failed:', err);
        });
      }));
    });
  }
  
  // 检查是否有旧的 service worker（缓存规则不正确的版本）
  // 新版本的 service worker 会在 scope 中设置正确的缓存名
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    var hasOld = regs.some(function(reg) {
      return reg.scope && reg.scope.includes(window.location.origin);
    });
    if (hasOld) {
      console.log('[SW Cleanup] Found old service worker, clearing caches and unregistering...');
      unregisterAll().then(function() {
        return clearAllCaches();
      }).then(function() {
        console.log('[SW Cleanup] Done. Reloading to activate new service worker...');
        // 只清理一次，避免无限循环
        if (!sessionStorage.getItem('sw-cleared')) {
          sessionStorage.setItem('sw-cleared', '1');
          window.location.reload();
        }
      });
    }
  });
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
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI超级猎头工作台" />
        <meta name="application-name" content="AI超级猎头工作台" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <Script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          id="theme-script"
          strategy="beforeInteractive"
        />
        <Script
          dangerouslySetInnerHTML={{ __html: swCleanupScript }}
          id="sw-cleanup-script"
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
