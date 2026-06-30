'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            alignItems: 'center',
            background: '#fafafa',
            color: '#333',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>页面出错了</h1>
          <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '480px' }}>
            应用遇到了意外错误，请尝试刷新页面。如果问题持续存在，请联系管理员。
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={reset}
              style={{
                background: '#0070f3',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.75rem 1.5rem',
              }}
              type="button"
            >
              重新加载
            </button>
            <button
              onClick={() => {
                window.location.href = '/home'
              }}
              style={{
                background: '#e5e5e5',
                border: 'none',
                borderRadius: '8px',
                color: '#333',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.75rem 1.5rem',
              }}
              type="button"
            >
              回到首页
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
