'use client'

import Link from 'next/link'
import { ReactNode, useMemo, useState } from 'react'

import { Pagination } from './Pagination'
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge'

export type SearchItem = {
  badge: string
  badgeVariant: StatusBadgeVariant
  href: string
  id: number | string
  meta: ReactNode
  title: string
}

type PaginatedSearchListProps = {
  emptyText?: string
  items: SearchItem[]
  pageSize?: number
  title: ReactNode
}

export function PaginatedSearchList({
  emptyText = '暂无结果',
  items,
  pageSize = 10,
  title,
}: PaginatedSearchListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, pageSize, safePage])

  return (
    <div className="ui-search-section">
      <div className="ui-search-section-head">
        <h3>{title}</h3>
        <span className="ui-search-section-count">共 {items.length} 条</span>
      </div>
      {items.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <>
          <div className="ui-search-list">
            {visibleItems.map((item) => (
              <Link className="ui-search-card" href={item.href} key={item.id}>
                <div className="ui-search-card-main">
                  <strong>{item.title}</strong>
                  <span className="muted">{item.meta}</span>
                </div>
                <StatusBadge variant={item.badgeVariant}>{item.badge}</StatusBadge>
              </Link>
            ))}
          </div>
          {items.length > pageSize ? (
            <Pagination
              onChange={setCurrentPage}
              page={safePage}
              pageSize={pageSize}
              total={items.length}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
