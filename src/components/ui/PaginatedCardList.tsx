'use client'

import { ReactNode, useMemo, useState } from 'react'

import { Pagination } from './Pagination'

type PaginatedCardListProps<T> = {
  emptyText?: string
  items: T[]
  pageSize?: number
  renderItem: (item: T) => ReactNode
  title: ReactNode
}

export function PaginatedCardList<T>({
  emptyText = '暂无结果',
  items,
  pageSize = 10,
  renderItem,
  title,
}: PaginatedCardListProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, pageSize, safePage])

  if (items.length === 0) {
    return (
      <div className="ui-search-section">
        <div className="ui-search-section-head">
          <h3>{title}</h3>
        </div>
        <p className="muted">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="ui-search-section">
      <div className="ui-search-section-head">
        <h3>{title}</h3>
        <span className="ui-search-section-count">共 {items.length} 条</span>
      </div>
      <div className="job-card-list">
        {visibleItems.map((item, idx) => (
          <div key={idx}>{renderItem(item)}</div>
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
    </div>
  )
}
