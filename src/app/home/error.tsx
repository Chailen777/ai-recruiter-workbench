'use client'

import { useEffect } from 'react'

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Home page error:', error)
  }, [error])

  return (
    <div style={{
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: '480px',
        padding: '2.5rem',
        textAlign: 'center',
        width: '100%',
      }}>
        <h2 style={{
          color: 'var(--text-primary, #1e293b)',
          fontSize: '1.4rem',
          marginBottom: '0.75rem',
        }}>
          首页数据加载失败
        </h2>
        <p style={{
          color: 'var(--text-secondary, #64748b)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}>
          数据库查询暂时出现问题，请刷新页面重试。
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.65rem 1.4rem',
            }}
            type="button"
          >
            重新加载
          </button>
          <button
            onClick={() => window.location.href = '/home'}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              color: '#334155',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.65rem 1.4rem',
            }}
            type="button"
          >
            回到首页
          </button>
        </div>
      </div>
    </div>
  )
}
