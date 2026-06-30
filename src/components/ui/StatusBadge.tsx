import { ReactNode } from 'react'

export type StatusBadgeVariant = 'success' | 'progress' | 'pending' | 'risk' | 'neutral' | 'warning'

type StatusBadgeProps = {
  children: ReactNode
  variant?: StatusBadgeVariant
}

export function StatusBadge({ children, variant = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`ui-status-badge ui-status-badge-${variant}`} data-variant={variant}>
      {children}
    </span>
  )
}
