'use client'

import { memo } from 'react'

/* ─── Skeleton Primitives ─── */

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton-pulse ${className}`}
    />
  )
}

/* ─── Text Line ─── */

interface SkeletonTextProps {
  lines?: number
  /** last line shorter to avoid full-width stretching */
  lastShorter?: boolean
}

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  lastShorter = true,
}: SkeletonTextProps) {
  return (
    <div className="skeleton-text-group" role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={i === lines - 1 && lastShorter ? 'skeleton-text-last' : ''}
        />
      ))}
    </div>
  )
})

/* ─── Stat Card ─── */

export const SkeletonStatCard = memo(function SkeletonStatCard() {
  return (
    <div className="ui-stat-card skeleton-stat-card" role="status" aria-label="Loading statistics">
      <div className="ui-stat-card-content">
        <SkeletonPulse className="skeleton-stat-title" />
        <SkeletonPulse className="skeleton-stat-value" />
        <SkeletonPulse className="skeleton-stat-footer" />
      </div>
    </div>
  )
})

/* ─── Stat Grid ─── */

export const SkeletonStatGrid = memo(function SkeletonStatGrid({
  count = 4,
}: {
  count?: number
}) {
  return (
    <section className="grid stats" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </section>
  )
})

/* ─── Table Row ─── */

interface SkeletonTableProps {
  rows?: number
  columns?: number
}

export const SkeletonTable = memo(function SkeletonTable({
  rows = 5,
  columns = 4,
}: SkeletonTableProps) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading table data">
      <div className="skeleton-table-head">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse key={i} className="skeleton-th" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div className="skeleton-table-row" key={row}>
          {Array.from({ length: columns }).map((_, col) => (
            <SkeletonPulse key={col} className="skeleton-td" />
          ))}
        </div>
      ))}
    </div>
  )
})

/* ─── Card Skeleton ─── */

interface SkeletonCardProps {
  bodyLines?: number
}

export const SkeletonCard = memo(function SkeletonCard({
  bodyLines = 4,
}: SkeletonCardProps) {
  return (
    <div className="ui-detail-panel skeleton-card" role="status" aria-label="Loading panel">
      <div className="ui-detail-panel-head skeleton-card-head">
        <div className="ui-detail-panel-title-group">
          <SkeletonPulse className="skeleton-title" />
          <SkeletonPulse className="skeleton-subtitle" />
        </div>
        <SkeletonPulse className="skeleton-action-btn" />
      </div>
      <SkeletonText lines={bodyLines} />
    </div>
  )
})

/* ─── Full Page Skeleton (for server component boundaries) ─── */

interface SkeletonPageProps {
  type?: 'list' | 'detail'
}

export const SkeletonPage = memo(function SkeletonPage({
  type = 'list',
}: SkeletonPageProps) {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading page">
      <SkeletonStatGrid count={4} />
      {type === 'list' ? (
        <>
          <SkeletonCard bodyLines={2} />
          <SkeletonCard bodyLines={6} />
        </>
      ) : (
        <SkeletonCard bodyLines={10} />
      )}
    </div>
  )
})
