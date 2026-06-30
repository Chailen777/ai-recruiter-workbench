import { ReactNode } from 'react'

type StatCardTone = 'default' | 'blue' | 'green' | 'orange' | 'red'

type StatCardProps = {
  description: string
  title: string
  tone?: StatCardTone
  trend?: ReactNode
  value: ReactNode
}

export function StatCard({ description, title, tone = 'default', trend, value }: StatCardProps) {
  return (
    <article className={`ui-stat-card ui-stat-card-${tone}`} data-tone={tone}>
      <div className="ui-stat-card-content">
        <div className="ui-stat-card-title">{title}</div>
        <div className="ui-stat-card-value">{value}</div>
        <div className="ui-stat-card-footer">
          <span>{description}</span>
          {trend ? <strong>{trend}</strong> : null}
        </div>
      </div>
    </article>
  )
}
