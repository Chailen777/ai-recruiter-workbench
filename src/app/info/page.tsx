export const revalidate = 60

import { deleteInfo } from '@/app/actions'
import { InfoCreateSheet, InfoEditSheet } from '@/components/forms'
import {
  AttachmentList,
  CoverImage,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  InfoNotePanel,
  Pagination,
  ResourceCard,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type InfoRow = {
  id: number
  infoTime: Date | null
  title: string
  category: string | null
  content: string | null
  creator: string | null
  pinStatus: string | null
  infoSource: string | null
  urgency: string | null
  relatedBusiness: string | null
  viewCount: number
  likeCount: number
  shareCount: number
  purchaseCount: number
  amount: string | null
  link: string | null
  cover: string | null
  attachments: string | null
  note: string | null
  createdAt: Date
}

function urgencyVariant(status: string | null): 'success' | 'progress' | 'pending' | 'risk' | 'neutral' | 'warning' {
  if (!status) return 'neutral'
  if (status === '紧急') return 'risk'
  if (status === '重要') return 'pending'
  return 'neutral'
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim())
}

function pageForSelected(rows: InfoRow[], selectedId?: string) {
  if (!selectedId) return 1
  const index = rows.findIndex((row) => String(row.id) === selectedId)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

export default async function InfoPage({
  searchParams,
}: {
  searchParams: Promise<{ infoId?: string; page?: string }>
}) {
  const { infoId, page: pageParam } = await searchParams
  const items = await prisma.info.findMany({
    orderBy: [
      { pinStatus: 'desc' },
      { updatedAt: 'desc' },
    ],
  })

  const rows: InfoRow[] = items.map((item) => ({
    id: item.id,
    infoTime: item.infoTime,
    title: item.title,
    category: item.category,
    content: item.content,
    creator: item.creator,
    pinStatus: item.pinStatus,
    infoSource: item.infoSource,
    urgency: item.urgency,
    relatedBusiness: item.relatedBusiness,
    viewCount: item.viewCount,
    likeCount: item.likeCount,
    shareCount: item.shareCount,
    purchaseCount: item.purchaseCount,
    amount: item.amount,
    link: item.link,
    cover: item.cover,
    attachments: item.attachments,
    note: item.note,
    createdAt: item.createdAt,
  }))

  const today = startOfToday()
  const todayCount = items.filter((item) => item.createdAt >= today).length
  const pinnedCount = items.filter((item) => (item.pinStatus ?? '') === '置顶').length
  const urgentCount = items.filter((item) => (item.urgency ?? '') === '紧急').length

  const selectedItem =
    rows.find((row) => String(row.id) === infoId) ?? rows[0] ?? null

  const pageFromSelected = pageForSelected(rows, infoId)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = infoId ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  // Pagination
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard
          description="汇聚行业动态与关键提醒，确保每条线索不遗漏"
          title="信息总数"
          tone="blue"
          value={items.length}
        />
        <StatCard description="今日新增的动态信息" title="今日新增" tone="green" value={todayCount} />
        <StatCard description="置顶高亮，优先关注" title="置顶信息" tone="orange" value={pinnedCount} />
        <StatCard description="紧急等级标记，需立即处理" title="紧急信息" tone="blue" value={urgentCount} />
      </section>

      <div className="company-workspace">
        <DetailPanel
          actions={<InfoCreateSheet />}
          title="信息列表"
        >
          {pageRows.length > 0 ? (
            <div className="resource-card-list">
              {pageRows.map((item) => (
              <ResourceCard
                key={item.id}
                title={item.title}
                  href={`/info?infoId=${item.id}`}
                  cover={item.cover}
                  metaItems={[
                    ...(item.category ? [{ label: '分类', value: item.category }] : []),
                    ...(item.creator ? [{ label: '创建人', value: item.creator }] : []),
                    ...(item.infoSource ? [{ label: '来源', value: item.infoSource }] : []),
                    ...(item.relatedBusiness ? [{ label: '关联业务', value: item.relatedBusiness }] : []),
                  ]}
                  statusBadges={[
                    ...(item.urgency ? [{ label: item.urgency, variant: urgencyVariant(item.urgency) }] : []),
                    ...(item.pinStatus === '置顶' ? [{ label: '📌 置顶', variant: 'warning' as const }] : []),
                  ]}
                  footerLeft={`👁 ${item.viewCount}  👍 ${item.likeCount}  🔗 ${item.shareCount}`}
                  footerRight={item.infoTime ? new Date(item.infoTime).toLocaleDateString('zh-CN') : undefined}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="info"
              action={<InfoCreateSheet />}
            />
          )}
          <Pagination
            baseHref="/info"
            page={clampedPage}
            pageSize={PAGE_SIZE}
            total={rows.length}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <InfoEditSheet info={selectedItem} />
                <DeleteButton action={deleteInfo} id={selectedItem.id} label={selectedItem.title || '该信息'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedItem
              ? `${selectedItem.category || '分类未填写'} · ${selectedItem.creator || '创建人未填写'}`
              : '点击左侧信息卡片后，在这里集中处理信息操作。'
          }
          title={selectedItem?.title ?? '信息详情'}
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
                {hasText(selectedItem.category) ? (
                  <div>
                    <dt>分类</dt>
                    <dd>{selectedItem.category}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.creator) ? (
                  <div>
                    <dt>创建人</dt>
                    <dd>{selectedItem.creator}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.infoSource) ? (
                  <div>
                    <dt>信息来源</dt>
                    <dd>{selectedItem.infoSource}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.urgency) ? (
                  <div className="is-highlight">
                    <dt>紧急等级</dt>
                    <dd>
                      <StatusBadge variant={urgencyVariant(selectedItem.urgency)}>
                        {selectedItem.urgency}
                      </StatusBadge>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedItem.relatedBusiness) ? (
                  <div className="is-highlight">
                    <dt>关联业务板块</dt>
                    <dd>{selectedItem.relatedBusiness}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.pinStatus) ? (
                  <div>
                    <dt>置顶标识</dt>
                    <dd>{selectedItem.pinStatus}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>浏览量</dt>
                  <dd>{selectedItem.viewCount}</dd>
                </div>
                <div>
                  <dt>点赞数</dt>
                  <dd>{selectedItem.likeCount}</dd>
                </div>
                <div>
                  <dt>转发数</dt>
                  <dd>{selectedItem.shareCount}</dd>
                </div>
                <div>
                  <dt>购买数</dt>
                  <dd>{selectedItem.purchaseCount}</dd>
                </div>
                {selectedItem.infoTime ? (
                  <div>
                    <dt>信息时间</dt>
                    <dd>{new Date(selectedItem.infoTime!).toLocaleDateString('zh-CN')}</dd>
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
                {hasText(selectedItem.amount) ? (
                  <div>
                    <dt>金额</dt>
                    <dd>{selectedItem.amount}</dd>
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
              notesContent={<InfoNotePanel infoId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧信息卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
