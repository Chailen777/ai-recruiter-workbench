'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Error Boundary for recharts components.
 * Catches Tooltip hover crashes (recharts 3.x + React 19 bug)
 * and shows a friendly fallback instead of a full-page error overlay.
 */
export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('Chart render error (suppressed):', error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              alignItems: 'center',
              color: '#6b7280',
              display: 'flex',
              fontSize: 13,
              height: 200,
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            图表暂时无法显示
          </div>
        )
      )
    }

    return this.props.children
  }
}
