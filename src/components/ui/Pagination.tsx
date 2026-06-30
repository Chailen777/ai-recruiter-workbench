'use client'

import Link from 'next/link'
import { useMemo } from 'react'

export type PaginationProps = {
  baseHref?: string
  onChange?: (page: number) => void
  page: number
  pageSize: number
  total: number
}

function hrefForPage(baseHref: string, targetPage: number) {
  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}page=${targetPage}`
}

function useVisiblePages(page: number, totalPages: number) {
  return useMemo(() => {
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }, [page, totalPages])
}

export function Pagination({ baseHref, onChange, page, pageSize, total }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const visiblePages = useVisiblePages(page, totalPages)

  if (totalPages <= 1) return null

  const canLink = baseHref != null

  return (
    <div className="ui-pagination">
      {canLink ? (
        page > 1 ? (
          <Link className="ui-pagination-prev" href={hrefForPage(baseHref, page - 1)}>
            上一页
          </Link>
        ) : (
          <button className="ui-pagination-prev" disabled type="button">
            上一页
          </button>
        )
      ) : (
        <button
          className="ui-pagination-prev"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
          type="button"
        >
          上一页
        </button>
      )}

      <div className="ui-pagination-pages" role="group">
        {visiblePages.map((p) =>
          canLink ? (
            <Link
              className={p === page ? 'is-active' : ''}
              href={hrefForPage(baseHref, p)}
              key={p}
            >
              {p}
            </Link>
          ) : (
            <button
              className={p === page ? 'is-active' : ''}
              key={p}
              onClick={() => onChange?.(p)}
              type="button"
            >
              {p}
            </button>
          )
        )}
      </div>

      {canLink ? (
        page < totalPages ? (
          <Link className="ui-pagination-next" href={hrefForPage(baseHref, page + 1)}>
            下一页
          </Link>
        ) : (
          <button className="ui-pagination-next" disabled type="button">
            下一页
          </button>
        )
      ) : (
        <button
          className="ui-pagination-next"
          disabled={page >= totalPages}
          onClick={() => onChange?.(page + 1)}
          type="button"
        >
          下一页
        </button>
      )}

      <span className="ui-pagination-info">
        第 {page} / {totalPages} 页，共 {total} 条
      </span>
    </div>
  )
}
