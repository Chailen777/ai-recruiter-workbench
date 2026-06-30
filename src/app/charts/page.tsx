export const revalidate = 60

import { deleteChart } from '@/app/actions'
import { ChartCreateSheet, ChartEditSheet } from '@/components/forms'
import {
  AttachmentList,
  ChartNotePanel,
  CoverImage,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  Pagination,
  ResourceCard,
  StatCard,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type ChartRow = {
  id: number
  title: string
  dataDeadline: Date | null
  statPeriod: string | null
  statDimension: string | null
  comparePeriod: string | null
  creator: string | null
  dataSource: string | null
  indicatorTotal: string | null
  statUnit: string | null
  dataSourceNote: string | null
  content: string | null
  link: string | null
  cover: string | null
  attachments: string | null
  note: string | null
  createdAt: Date
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim())
}

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ chartId?: string; page?: string }>
}) {
  const { chartId, page: pageParam } = await searchParams
  const today = startOfToday()
  const page = Math.max(1, pageParam ? Number(pageParam) : 1)

  const [items, total, todayCount, hasDataCount, selectedRaw] = await Promise.all([
    prisma.chart.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.chart.count(),
    prisma.chart.count({ where: { createdAt: { gte: today } } }),
    prisma.chart.count({ where: { NOT: { indicatorTotal: null } } }),
    chartId ? prisma.chart.findUnique({ where: { id: Number(chartId) } }) : null,
  ])

  const rows: ChartRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    dataDeadline: item.dataDeadline,
    statPeriod: item.statPeriod,
    statDimension: item.statDimension,
    comparePeriod: item.comparePeriod,
    creator: item.creator,
    dataSource: item.dataSource,
    indicatorTotal: item.indicatorTotal,
    statUnit: item.statUnit,
    dataSourceNote: item.dataSourceNote,
    content: item.content,
    link: item.link,
    cover: item.cover,
    attachments: item.attachments,
    note: item.note,
    createdAt: item.createdAt,
  }))

  const selectedItem: ChartRow | null =
    (selectedRaw as unknown as ChartRow | null) ?? rows[0] ?? null

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard
          description="数据可视化驱动决策——市场趋势、人才分布一目了然"
          title="图表总数"
          tone="blue"
          value={total}
        />
        <StatCard description="今日新建的数据图表" title="今日新增" tone="green" value={todayCount} />
        <StatCard description="含完整指标数据，可直接引用" title="有数据" tone="orange" value={hasDataCount} />
        <StatCard description="多维度覆盖，洞察更立体" title="统计维度" tone="blue" value={new Set(items.map(i => i.statDimension).filter(Boolean)).size} />
      </section>

      <div className="company-workspace">
        <DetailPanel
          actions={<ChartCreateSheet />}
          title="图表列表"
        >
          {rows.length > 0 ? (
            <div className="resource-card-list">
              {rows.map((item) => (
              <ResourceCard
                key={item.id}
                title={item.title}
                  href={`/charts?chartId=${item.id}`}
                  cover={item.cover}
                  metaItems={[
                    ...(item.statPeriod ? [{ label: '统计周期', value: item.statPeriod }] : []),
                    ...(item.statDimension ? [{ label: '统计维度', value: item.statDimension }] : []),
                    ...(item.creator ? [{ label: '创建人', value: item.creator }] : []),
                    ...(item.statUnit ? [{ label: '统计单位', value: item.statUnit }] : []),
                  ]}
                  statusBadges={
                    item.indicatorTotal
                      ? [{ label: `指标 ${item.indicatorTotal}`, variant: 'success' as const }]
                      : []
                  }
                  footerLeft={item.dataSource ? `来源: ${item.dataSource}` : undefined}
                  footerRight={item.dataDeadline ? `截止: ${new Date(item.dataDeadline).toLocaleDateString('zh-CN')}` : undefined}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="charts"
              action={<ChartCreateSheet />}
            />
          )}
          <Pagination
            baseHref="/charts"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <ChartEditSheet chart={selectedItem} />
                <DeleteButton action={deleteChart} id={selectedItem.id} label={selectedItem.title || '该图表'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedItem
              ? `${selectedItem.statPeriod || '周期未填写'} · ${selectedItem.statDimension || '维度未填写'}`
              : '点击左侧图表卡片后，在这里集中处理图表操作。'
          }
          title={selectedItem?.title ?? '图表详情'}
        >
          {selectedItem ? (
            <DetailWithNotesBadge
              detailContent={(
            <div className="record-detail">
              <div className="detail-cover-row">
                <CoverImage size="lg" src={selectedItem.cover} />
              </div>
          <dl className="detail-list compact">
            {hasText(selectedItem.content) ? (
              <div className="detail-content-block">
                <dt>内容</dt>
                <dd>{selectedItem.content}</dd>
              </div>
            ) : null}
            {selectedItem.dataDeadline ? (
              <div>
                <dt>数据截止时间</dt>
                <dd>{new Date(selectedItem.dataDeadline).toLocaleDateString('zh-CN')}</dd>
              </div>
            ) : null}
            {hasText(selectedItem.statPeriod) ? (
                  <div>
                    <dt>统计周期</dt>
                    <dd>{selectedItem.statPeriod}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.statDimension) ? (
                  <div>
                    <dt>统计维度</dt>
                    <dd>{selectedItem.statDimension}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.comparePeriod) ? (
                  <div>
                    <dt>对比周期</dt>
                    <dd>{selectedItem.comparePeriod}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.creator) ? (
                  <div>
                    <dt>创建人/制表人</dt>
                    <dd>{selectedItem.creator}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.dataSource) ? (
                  <div>
                    <dt>数据来源</dt>
                    <dd>{selectedItem.dataSource}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.indicatorTotal) ? (
                  <div className="is-highlight">
                    <dt>数据指标总数</dt>
                    <dd>{selectedItem.indicatorTotal}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.statUnit) ? (
                  <div className="is-highlight">
                    <dt>统计单位</dt>
                    <dd>{selectedItem.statUnit}</dd>
                  </div>
                ) : null}
                {selectedItem.dataDeadline ? (
                  <div>
                    <dt>数据截止时间</dt>
                    <dd>{new Date(selectedItem.dataDeadline).toLocaleDateString('zh-CN')}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.link) ? (
                  <div>
                    <dt>链接</dt>
                    <dd>
                      <a
                        href={selectedItem.link ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button theme-primary size-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        打开链接
                      </a>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedItem.dataSourceNote) ? (
                  <div className="detail-span-all">
                    <dt>数据来源标注</dt>
                    <dd>{selectedItem.dataSourceNote}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.note) ? (
                  <div className="detail-span-all">
                    <dt>备注</dt>
                    <dd>{selectedItem.note}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.attachments) ? (
                  <div className="detail-span-all">
                    <dt>附件资料</dt>
                    <dd>
                      <AttachmentList attachments={selectedItem.attachments} />
                    </dd>
                  </div>
                ) : null}
                <div className="detail-span-all" style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <dt style={{ color: 'var(--ds-color-text-muted)' }}>添加时间</dt>
                  <dd style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>{new Date(selectedItem.createdAt).toLocaleString('zh-CN')}</dd>
                </div>
              </dl>
            </div>
              )}
              notesContent={<ChartNotePanel chartId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧图表卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
