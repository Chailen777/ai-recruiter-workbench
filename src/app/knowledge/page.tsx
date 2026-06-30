export const revalidate = 60

import { deleteKnowledge } from '@/app/actions'
import { KnowledgeCreateSheet, KnowledgeEditSheet } from '@/components/forms'
import {
  AttachmentList,
  CoverImage,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  KnowledgeNotePanel,
  Pagination,
  ResourceCard,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type KnowledgeRow = {
  id: number
  title: string
  author: string | null
  category: string | null
  content: string | null
  source: string | null
  url: string | null
  tags: string | null
  publicStatus: string | null
  reviewStatus: string | null
  docFormat: string | null
  targetAudience: string | null
  cover: string | null
  attachments: string | null
  note: string | null
  createdAt: Date
}

function publicVariant(status: string | null) {
  if (!status) return 'neutral'
  if (status === '公开') return 'success'
  if (status === '私密') return 'risk'
  return 'pending'
}

function reviewVariant(status: string | null) {
  if (!status) return 'neutral'
  if (status === '已通过') return 'success'
  if (status === '待审核') return 'pending'
  if (status === '驳回') return 'risk'
  return 'neutral'
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim())
}

function pageForSelected(rows: KnowledgeRow[], selectedId?: string) {
  if (!selectedId) return 1
  const index = rows.findIndex((row) => String(row.id) === selectedId)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ knowledgeId?: string; page?: string }>
}) {
  const { knowledgeId, page: pageParam } = await searchParams
  const items = await prisma.knowledge.findMany({
    orderBy: { updatedAt: 'desc' },
  })

  const rows: KnowledgeRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    author: item.author,
    category: item.category,
    content: item.content,
    source: item.source,
    url: item.url,
    tags: item.tags,
    cover: item.cover,
    attachments: item.attachments,
    publicStatus: item.publicStatus,
    reviewStatus: item.reviewStatus,
    docFormat: item.docFormat,
    targetAudience: item.targetAudience,
    note: item.note,
    createdAt: item.createdAt,
  }))

  const today = startOfToday()
  const todayCount = items.filter((item) => item.createdAt >= today).length
  const publicCount = items.filter((item) => (item.publicStatus ?? '') === '公开').length
  const approvedCount = items.filter((item) => (item.reviewStatus ?? '') === '已通过').length

  const selectedItem =
    rows.find((row) => String(row.id) === knowledgeId) ?? rows[0] ?? null

  const pageFromSelected = pageForSelected(rows, knowledgeId)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = knowledgeId ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  // Pagination
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard
          description="沉淀行业洞察与实战经验，支撑猎头决策"
          title="知识总数"
          tone="blue"
          value={items.length}
        />
        <StatCard description="今日新沉淀的知识条目" title="今日新增" tone="green" value={todayCount} />
        <StatCard description="已发布为公开，可团队共享" title="公开知识" tone="orange" value={publicCount} />
        <StatCard description="审核通过，质量已验证" title="已通过" tone="blue" value={approvedCount} />
      </section>

      <div className="company-workspace">
        <DetailPanel
          actions={<KnowledgeCreateSheet />}
          title="知识列表"
        >
          {pageRows.length > 0 ? (
            <div className="resource-card-list">
              {pageRows.map((item) => (
              <ResourceCard
                key={item.id}
                title={item.title}
                  href={`/knowledge?knowledgeId=${item.id}`}
                  cover={item.cover}
                  tags={item.tags ? item.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []}
                  metaItems={[
                    ...(item.category ? [{ label: '分类', value: item.category }] : []),
                    ...(item.author ? [{ label: '作者', value: item.author }] : []),
                    ...(item.source ? [{ label: '来源', value: item.source }] : []),
                  ]}
                  statusBadges={[
                    ...(item.publicStatus ? [{ label: item.publicStatus, variant: publicVariant(item.publicStatus) as 'success' | 'progress' | 'pending' | 'risk' | 'neutral' }] : []),
                    ...(item.reviewStatus ? [{ label: item.reviewStatus, variant: reviewVariant(item.reviewStatus) as 'success' | 'progress' | 'pending' | 'risk' | 'neutral' }] : []),
                  ]}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="knowledge"
              action={<KnowledgeCreateSheet />}
            />
          )}
          <Pagination
            baseHref="/knowledge"
            page={clampedPage}
            pageSize={PAGE_SIZE}
            total={rows.length}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <KnowledgeEditSheet knowledge={selectedItem} />
                <DeleteButton action={deleteKnowledge} id={selectedItem.id} label={selectedItem.title || '该知识'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedItem
              ? `${selectedItem.category || '分类未填写'} · ${selectedItem.author || '作者未填写'}`
              : '点击左侧知识卡片后，在这里集中处理知识操作。'
          }
          title={selectedItem?.title ?? '知识详情'}
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
                {hasText(selectedItem.author) ? (
                  <div>
                    <dt>作者</dt>
                    <dd>{selectedItem.author}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.source) ? (
                  <div>
                    <dt>来源</dt>
                    <dd>{selectedItem.source}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.publicStatus) ? (
                  <div className="is-highlight">
                    <dt>公开状态</dt>
                    <dd>
                      <StatusBadge variant={publicVariant(selectedItem.publicStatus)}>
                        {selectedItem.publicStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedItem.reviewStatus) ? (
                  <div className="is-highlight">
                    <dt>审核状态</dt>
                    <dd>
                      <StatusBadge variant={reviewVariant(selectedItem.reviewStatus)}>
                        {selectedItem.reviewStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedItem.docFormat) ? (
                  <div>
                    <dt>文档格式</dt>
                    <dd>{selectedItem.docFormat}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.targetAudience) ? (
                  <div>
                    <dt>适用人群</dt>
                    <dd>{selectedItem.targetAudience}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.tags) ? (
                  <div>
                    <dt>标签</dt>
                    <dd>{selectedItem.tags}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.url) ? (
                  <div>
                    <dt>链接</dt>
                    <dd>
                      <a
                        href={selectedItem.url ?? '#'}
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
              notesContent={<KnowledgeNotePanel knowledgeId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧知识卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
