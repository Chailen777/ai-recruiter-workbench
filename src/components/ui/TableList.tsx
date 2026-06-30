import Link from 'next/link'
import { ReactNode } from 'react'

import { StatusBadge } from './StatusBadge'

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

type BadgeVariant = 'success' | 'progress' | 'pending' | 'risk' | 'neutral'

function statusVariant(value: string): BadgeVariant {
  if (['合作中', '成功', '已成交', '入职'].includes(value)) return 'success'
  if (['已推荐', '已沟通', '面试中', '推荐中', '已跟进', 'Offer'].includes(value)) return 'progress'
  if (['开放', '新建', '待沟通', '待跟进', '暂停中'].includes(value)) return 'pending'
  if (['关闭', '淘汰', '已拒绝', '风险'].includes(value)) return 'risk'
  return 'neutral'
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
