'use client'

import { useEffect } from 'react'

export default function MatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Match page error:', error)
  }, [error])

  return (
    <div
      style={{
        alignItems: 'center',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>匹配页面出错了</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '480px' }}>
        操作过程中发生了意外错误，请尝试刷新或重新选择匹配项。
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
            window.location.href = '/match'
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
          回到匹配页
        </button>
      </div>
    </div>
  )
}
