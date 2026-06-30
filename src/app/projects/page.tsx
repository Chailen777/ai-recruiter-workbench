export const revalidate = 60

import { deleteProject } from '@/app/actions'
import { ProjectCreateSheet, ProjectEditSheet } from '@/components/forms'
import {
  AttachmentList,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  ProjectNotePanel,
  EmptyState,
  ResourceCard,
  Pagination,
  StatusBadge,
  StatCard,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type ProjectRow = {
  id: number
  name: string
  code: string | null
  clientCompany: string | null
  clientContact: string | null
  projectType: string | null
  industry: string | null
  priority: string | null
  status: string
  startDate: Date | null
  expectedEndDate: Date | null
  actualEndDate: Date | null
  contractAmount: string | null
  chargingModel: string | null
  paymentStatus: string | null
  paidAmount: string | null
  relatedJobs: string | null
  totalHeadcount: number | null
  recommendedCount: number | null
  interviewedCount: number | null
  hiredCount: number | null
  completionRate: string | null
  lastReportDate: Date | null
  nextReportDate: Date | null
  painPoints: string | null
  competitorInfo: string | null
  tags: string | null
  attachments: string | null
  note: string | null
  createdAt: Date
}

function hasText(value?: string | null) { return Boolean(value && value.trim()) }

function fmtDate(d: Date | null) {
  if (!d) return '未填写'
  return new Date(d).toLocaleDateString('zh-CN')
}

function statusColor(s: string) {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'progress'
  if (s === '洽谈中') return 'pending'
  if (s === '已签约') return 'progress'
  if (s === '暂停') return 'warning'
  if (s === '已终止') return 'risk'
  return 'neutral'
}

function priorityColor(p: string | null) {
  if (!p) return 'neutral'
  if (p.startsWith('P0')) return 'risk'
  if (p.startsWith('P1')) return 'warning'
  if (p.startsWith('P2')) return 'progress'
  return 'neutral'
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; page?: string }>
}) {
  const { projectId, page: pageParam } = await searchParams
  const today = startOfToday()
  const page = Math.max(1, pageParam ? Number(pageParam) : 1)

  const [items, total, todayCount, activeCount, completedCount, selectedRaw] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.project.count(),
    prisma.project.count({ where: { createdAt: { gte: today } } }),
    prisma.project.count({ where: { status: '进行中' } }),
    prisma.project.count({ where: { status: '已完成' } }),
    projectId ? prisma.project.findUnique({ where: { id: Number(projectId) } }) : null,
  ])

  const rows: ProjectRow[] = items.map(item => ({ ...item }))

  const selectedItem: ProjectRow | null =
    (selectedRaw as unknown as ProjectRow | null) ?? rows[0] ?? null

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard title="项目总数" value={total} tone="blue" description="所有猎头项目的总览" />
        <StatCard title="今日新增" value={todayCount} tone="green" description="今日创建的新项目" />
        <StatCard title="进行中" value={activeCount} tone="orange" description="当前正在推进的项目" />
        <StatCard title="已完成" value={completedCount} tone="blue" description="成功交付的项目数量" />
      </section>

      <div className="company-workspace">
        <DetailPanel actions={<ProjectCreateSheet />} title="项目列表">
          {rows.length > 0 ? (
            <div className="resource-card-list">
              {rows.map(item => (
                <ResourceCard
                  key={item.id}
                  title={item.name}
                  href={`/projects?projectId=${item.id}`}
                  tags={item.tags ? item.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []}
                  metaItems={[
                    ...(item.clientCompany ? [{ label: '客户', value: item.clientCompany }] : []),
                    ...(item.projectType ? [{ label: '类型', value: item.projectType }] : []),
                    ...(item.industry ? [{ label: '行业', value: item.industry }] : []),
                    ...(item.contractAmount ? [{ label: '金额', value: item.contractAmount }] : []),
                  ]}
                  statusBadges={[
                    { label: item.status, variant: statusColor(item.status) as 'success' | 'progress' | 'pending' | 'risk' | 'warning' | 'neutral' },
                    ...(item.priority ? [{ label: item.priority, variant: priorityColor(item.priority) as 'success' | 'progress' | 'pending' | 'risk' | 'warning' | 'neutral' }] : []),
                  ]}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState variant="knowledge" action={<ProjectCreateSheet />} />
          )}
          <Pagination baseHref="/projects" page={page} pageSize={PAGE_SIZE} total={total} />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <ProjectEditSheet project={selectedItem} />
                <DeleteButton action={deleteProject} id={selectedItem.id} label={selectedItem.name || '该项目'} variant="secondary" />
              </div>
            ) : null
          }
          description={selectedItem
            ? `${selectedItem.clientCompany || '客户未填写'} · ${selectedItem.projectType || '类型未填写'}`
            : '点击左侧项目卡片查看详情。'}
          title={selectedItem?.name ?? '项目详情'}
        >
          {selectedItem ? (
            <DetailWithNotesBadge
              detailContent={(
                <div className="record-detail">
                  <dl className="detail-list compact">
                    {/* 基础 */}
                    {hasText(selectedItem.code) && (<div><dt>项目编号</dt><dd>{selectedItem.code}</dd></div>)}
                    {hasText(selectedItem.clientCompany) && (<div><dt>客户公司</dt><dd>{selectedItem.clientCompany}</dd></div>)}
                    {hasText(selectedItem.clientContact) && (<div><dt>对接人</dt><dd>{selectedItem.clientContact}</dd></div>)}
                    {hasText(selectedItem.projectType) && (<div><dt>项目类型</dt><dd>{selectedItem.projectType}</dd></div>)}
                    {hasText(selectedItem.industry) && (<div><dt>行业</dt><dd>{selectedItem.industry}</dd></div>)}
                    {hasText(selectedItem.priority) && (
                      <div className="is-highlight"><dt>优先级</dt><dd><StatusBadge variant={priorityColor(selectedItem.priority)}>{selectedItem.priority}</StatusBadge></dd></div>
                    )}
                    <div className="is-highlight"><dt>状态</dt><dd><StatusBadge variant={statusColor(selectedItem.status)}>{selectedItem.status}</StatusBadge></dd></div>

                    {/* 时间 */}
                    {selectedItem.startDate && (<div><dt>启动日期</dt><dd>{fmtDate(selectedItem.startDate)}</dd></div>)}
                    {selectedItem.expectedEndDate && (<div><dt>预计完成</dt><dd>{fmtDate(selectedItem.expectedEndDate)}</dd></div>)}
                    {selectedItem.actualEndDate && (<div><dt>实际完成</dt><dd>{fmtDate(selectedItem.actualEndDate)}</dd></div>)}

                    {/* 财务 */}
                    {hasText(selectedItem.contractAmount) && (<div><dt>合同金额</dt><dd>{selectedItem.contractAmount}</dd></div>)}
                    {hasText(selectedItem.chargingModel) && (<div><dt>收费模式</dt><dd>{selectedItem.chargingModel}</dd></div>)}
                    {hasText(selectedItem.paymentStatus) && (<div className="is-highlight"><dt>回款状态</dt><dd><StatusBadge variant={selectedItem.paymentStatus === '已结清' ? 'success' : selectedItem.paymentStatus === '已开票待回款' ? 'warning' : 'pending'}>{selectedItem.paymentStatus}</StatusBadge></dd></div>)}
                    {hasText(selectedItem.paidAmount) && (<div><dt>已回款</dt><dd>{selectedItem.paidAmount}</dd></div>)}

                    {/* 岗位进展 */}
                    {selectedItem.totalHeadcount != null && (<div><dt>总需求人数</dt><dd>{selectedItem.totalHeadcount}</dd></div>)}
                    {selectedItem.recommendedCount != null && (<div><dt>已推荐</dt><dd>{selectedItem.recommendedCount}</dd></div>)}
                    {selectedItem.interviewedCount != null && (<div><dt>已面试</dt><dd>{selectedItem.interviewedCount}</dd></div>)}
                    {selectedItem.hiredCount != null && (<div><dt>已入职</dt><dd>{selectedItem.hiredCount}</dd></div>)}
                    {hasText(selectedItem.completionRate) && (<div><dt>完成度</dt><dd>{selectedItem.completionRate}</dd></div>)}

                    {/* 沟通 */}
                    {selectedItem.lastReportDate && (<div><dt>上次汇报</dt><dd>{fmtDate(selectedItem.lastReportDate)}</dd></div>)}
                    {selectedItem.nextReportDate && (<div><dt>下次汇报</dt><dd>{fmtDate(selectedItem.nextReportDate)}</dd></div>)}
                    {hasText(selectedItem.painPoints) && (<div className="detail-span-all"><dt>项目痛点</dt><dd>{selectedItem.painPoints}</dd></div>)}
                    {hasText(selectedItem.competitorInfo) && (<div className="detail-span-all"><dt>竞品信息</dt><dd>{selectedItem.competitorInfo}</dd></div>)}

                    {/* 其他 */}
                    {hasText(selectedItem.tags) && (<div className="detail-span-all"><dt>标签</dt><dd>{selectedItem.tags}</dd></div>)}
                    {hasText(selectedItem.note) && (<div className="detail-span-all"><dt>备注</dt><dd>{selectedItem.note}</dd></div>)}
                    {hasText(selectedItem.attachments) && (<div className="detail-span-all"><dt>附件</dt><dd><AttachmentList attachments={selectedItem.attachments} /></dd></div>)}

                    <div className="detail-span-all" style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px', marginTop: '4px' }}>
                      <dt style={{ color: 'var(--ds-color-text-muted)' }}>添加时间</dt>
                      <dd style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>{new Date(selectedItem.createdAt).toLocaleString('zh-CN')}</dd>
                    </div>
                  </dl>
                </div>
              )}
              notesContent={<ProjectNotePanel projectId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧项目卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
