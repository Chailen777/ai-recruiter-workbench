'use client'

import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          alignItems: 'center',
          background: 'var(--card-bg, #fff)',
          borderRadius: '12px',
          color: 'var(--text-primary, #1e293b)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem' }}>
            组件加载失败，请刷新页面重试。
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.5rem 1.25rem',
            }}
            type="button"
          >
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
