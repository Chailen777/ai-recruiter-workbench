import { ReactNode } from 'react'

type SkeletonProps = {
  className?: string
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

/** 通用骨架块 */
export function Skeleton({ className, width, height, style }: SkeletonProps) {
  return (
    <span
      className={`ui-skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height, display: 'block', ...style }}
      aria-hidden="true"
    />
  )
}

/** 用于列表页的骨架屏 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ui-list-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="ui-list-skeleton-row" key={i}>
          <Skeleton width="30%" height={16} />
          <Skeleton width="45%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="20%" height={12} style={{ marginTop: 6, opacity: 0.5 }} />
        </div>
      ))}
    </div>
  )
}

/** 用于卡片列表页的骨架屏 */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        opacity: 0.5,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--ds-color-surface)',
            borderRadius: 12,
            border: '1px solid var(--ds-color-border)',
            padding: 20,
            minHeight: 140,
          }}
        >
          <Skeleton width="60%" height={18} />
          <Skeleton width="85%" height={14} style={{ marginTop: 12 }} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Skeleton width={60} height={22} style={{ borderRadius: 6 }} />
            <Skeleton width={48} height={22} style={{ borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 看板加载状态 */
export function DetailPanelSkeleton() {
  return (
    <div style={{ padding: 24, opacity: 0.4 }}>
      <Skeleton width="40%" height={20} />
      <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
      <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
    </div>
  )
}

type PageSkeletonShellProps = {
  children: ReactNode
}

/** 页面壳：显示标题 + 内容 */
export function PageSkeletonShell({ children }: PageSkeletonShellProps) {
  return (
    <div className="company-page" style={{ opacity: 0.7 }}>
      <SkeletonStatGrid />
      <div className="company-workspace">
        <div className="detail-panel">{children}</div>
        <div className="detail-panel">
          <DetailPanelSkeleton />
        </div>
      </div>
    </div>
  )
}

/** 向后兼容别名 */
export function SkeletonCard({ count = 4 }: { count?: number }) {
  return <CardListSkeleton count={count} />
}

export function SkeletonPage({ type = 'cards' }: { type?: 'cards' | 'table' }) {
  return <PageSkeletonShell>{type === 'table' ? <ListSkeleton rows={8} /> : <CardListSkeleton count={4} />}</PageSkeletonShell>
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card" style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, minHeight: 80 }}>
      <Skeleton width={40} height={24} />
      <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
    </div>
  )
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <section className="grid stats" style={{ opacity: 0.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </section>
  )
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return <ListSkeleton rows={rows} />
}

export function SkeletonText({ lines = 3, width }: { lines?: number; width?: string | number }) {
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={width ?? (i === lines - 1 ? '60%' : '100%')} height={12} style={{ marginTop: i > 0 ? 6 : 0 }} />
      ))}
    </div>
  )
}
