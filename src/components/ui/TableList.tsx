import Link from 'next/link'
import { ReactNode } from 'react'

import { StatusBadge } from './StatusBadge'
import { statusVariant } from '@/lib/status-utils'

export type TableListColumn<Row> = {
  align?: 'left' | 'center' | 'right'
  key: keyof Row | string
  label: string
  render?: (row: Row) => ReactNode
}

type TableListProps<Row> = {
  columns: Array<TableListColumn<Row>>
  emptyText?: string
  getRowHref?: (row: Row, index: number) => string
  getRowKey: (row: Row, index: number) => string | number
  page?: number
  pageSize?: number
  rows: Row[]
  selectedKey?: string | number
}

function shouldRenderStatus(key: string, label: string) {
  return key.toLowerCase().includes('status') || label.includes('状态')
}

export function TableList<Row>({
  columns,
  emptyText = '暂无数据',
  getRowHref,
  getRowKey,
  page,
  pageSize,
  rows,
  selectedKey,
}: TableListProps<Row>) {
  const isPaginated = page != null && pageSize != null && pageSize > 0
  const totalPages = isPaginated ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const safePage = isPaginated ? Math.min(Math.max(1, page), totalPages) : 1
  const startIndex = isPaginated ? (safePage - 1) * pageSize : 0
  const visibleRows = isPaginated ? rows.slice(startIndex, startIndex + pageSize) : rows

  if (!visibleRows.length) {
    return <div className="ui-table-empty">{emptyText}</div>
  }

  return (
    <div className="ui-table-wrap">
      <table className="ui-table-list">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={column.align ? `is-${column.align}` : undefined}
                key={String(column.key)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, index) => {
            const rowKey = getRowKey(row, startIndex + index)
            const href = getRowHref?.(row, startIndex + index)

            return (
              <tr
                className={
                  selectedKey === rowKey ? 'is-selected' : href ? 'is-clickable' : undefined
                }
                key={rowKey}
              >
                {columns.map((column) => {
                  const raw = String(row[column.key as keyof Row] ?? '')
                  const content = column.render ? (
                    column.render(row)
                  ) : shouldRenderStatus(String(column.key), column.label) ? (
                    <StatusBadge variant={statusVariant(raw)}>{raw || '未设置'}</StatusBadge>
                  ) : (
                    raw
                  )

                  return (
                    <td
                      className={column.align ? `is-${column.align}` : undefined}
                      data-label={column.label}
                      key={String(column.key)}
                    >
                      {href ? (
                        <Link className="ui-table-row-link" href={href}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
