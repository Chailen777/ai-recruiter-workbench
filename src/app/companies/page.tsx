export const dynamic = 'force-dynamic'

import { deleteCompany } from '@/app/actions'
import { CompanyCreateSheet, CompanyEditSheet } from '@/components/forms'
import {
  ActionButton,
  AttachmentList,
  CompanyCard,
  CompanyNotePanel,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  Pagination,
  StatCard,
  StatusBadge,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'
import Link from 'next/link'

const PAGE_SIZE = 10

type CompanyRow = {
  address: string
  attachments: string | null
  avatar: string | null
  city: string
  companyContactName: string
  companyContactPhone: string
  cooperationStatus: string
  id: number
  industry: string
  jobs: Array<{
    city: string | null
    id: number
    salaryRange: string | null
    status: string
    title: string
  }>
  jobsCount: number
  name: string
  note: string
  projectContactName: string
  projectContactPhone: string
  projectContactWechat: string
  source: string
  link: string | null
  createdAt: Date
}

function statusVariant(status: string) {
  if (status.includes('合作中') || status.includes('已联系')) return 'success'
  if (status.includes('待沟通')) return 'pending'
  if (status.includes('暂停')) return 'progress'
  if (status.includes('结束')) return 'risk'
  return 'neutral'
}

function jobStatusVariant(status: string) {
  if (status === '进行中' || status === '推荐中') return 'progress'
  if (status === '待发布' || status === '开放') return 'pending'
  if (status === '已关闭' || status === '关闭') return 'neutral'
  return 'neutral'
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim())
}

function pageForSelected(rows: CompanyRow[], selectedId?: string) {
  if (!selectedId) return 1
  const index = rows.findIndex((row) => String(row.id) === selectedId)
  if (index === -1) return 1
  return Math.floor(index / PAGE_SIZE) + 1
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; page?: string }>
}) {
  const { companyId, page: pageParam } = await searchParams
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { jobs: true } },
      jobs: {
        orderBy: { updatedAt: 'desc' },
        select: {
          city: true,
          id: true,
          salaryRange: true,
          status: true,
          title: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const rows: CompanyRow[] = companies.map((company) => ({
    address: company.address ?? '',
    attachments: company.attachments,
    avatar: company.avatar,
    city: company.city ?? '',
    companyContactName: company.companyContactName ?? '',
    companyContactPhone: company.companyContactPhone ?? '',
    cooperationStatus: company.cooperationStatus ?? '',
    id: company.id,
    industry: company.industry ?? '',
    jobs: company.jobs,
    jobsCount: company._count.jobs,
    name: company.name,
    note: company.note ?? '',
    projectContactName: company.projectContactName ?? '',
    projectContactPhone: company.projectContactPhone ?? '',
    projectContactWechat: company.projectContactWechat ?? '',
    source: company.source ?? '',
    link: company.link,
    createdAt: company.createdAt,
  }))

  const today = startOfToday()
  const todayCount = companies.filter((company) => company.createdAt >= today).length
  const activeCount = companies.filter((company) =>
    (company.cooperationStatus ?? '').includes('合作中')
  ).length
  const relatedJobCount = companies.reduce((sum, company) => sum + company._count.jobs, 0)
  const selectedCompany =
    rows.find((company) => String(company.id) === companyId) ?? rows[0] ?? null

  const pageFromSelected = pageForSelected(rows, companyId)
  const pageFromParam = pageParam ? Number(pageParam) : 1
  const currentPage = companyId ? pageFromSelected : Math.max(1, Number.isFinite(pageFromParam) ? pageFromParam : 1)

  // Pagination
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const clampedPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard
          description="维护企业资源，并查看企业关联岗位"
          title="企业总数"
          tone="blue"
          value={companies.length}
        />
        <StatCard description="今日新进入企业库" title="今日新增" tone="green" value={todayCount} />
        <StatCard
          description="合作状态包含合作中"
          title="合作中企业"
          tone="orange"
          value={activeCount}
        />
        <StatCard
          description="企业已关联岗位总量"
          title="关联岗位数"
          tone="blue"
          value={relatedJobCount}
        />
      </section>

      <div className="company-workspace">
        <DetailPanel
          actions={<CompanyCreateSheet />}
          title="企业列表"
        >
          {pageRows.length > 0 ? (
            <div className="company-card-list">
              {pageRows.map((company) => (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  industry={company.industry}
                  city={company.city}
                  cooperationStatus={company.cooperationStatus}
                  companyContactName={company.companyContactName}
                  jobsCount={company.jobsCount}
                  isSelected={selectedCompany?.id === company.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="companies"
              action={<CompanyCreateSheet />}
            />
          )}
          <Pagination
            baseHref="/companies"
            page={clampedPage}
            pageSize={PAGE_SIZE}
            total={rows.length}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedCompany ? (
              <div className="actions">
                <CompanyEditSheet company={selectedCompany} />
                <ActionButton href={`/match?companyId=${selectedCompany.id}`} size="sm" variant="secondary">
                  匹配候选人
                </ActionButton>
                <ActionButton href={`/jobs?companyId=${selectedCompany.id}`} size="sm" variant="secondary">
                  查看岗位
                </ActionButton>
                <DeleteButton action={deleteCompany} id={selectedCompany.id} label={selectedCompany.name || '该企业'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedCompany
              ? `${selectedCompany.industry || '行业未填写'} · ${selectedCompany.city || '城市未填写'}`
              : '点击左侧企业行后，在这里集中处理企业操作。'
          }
          title={selectedCompany?.name ?? '企业详情'}
        >
          {selectedCompany ? (
            <DetailWithNotesBadge
              detailContent={(
            <div className="record-detail">
              <dl className="detail-list compact">
                <div className="is-highlight">
                  <dt>关联岗位</dt>
                  <dd>{selectedCompany.jobsCount}</dd>
                </div>
                {hasText(selectedCompany.source) ? (
                  <div className="is-highlight">
                    <dt>来源</dt>
                    <dd>{selectedCompany.source}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.cooperationStatus) ? (
                  <div className="is-highlight">
                    <dt>合作状态</dt>
                    <dd>
                      <StatusBadge variant={statusVariant(selectedCompany.cooperationStatus)}>
                        {selectedCompany.cooperationStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.industry) ? (
                  <div>
                    <dt>行业</dt>
                    <dd>{selectedCompany.industry}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.city) ? (
                  <div>
                    <dt>城市</dt>
                    <dd>{selectedCompany.city}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.address) ? (
                  <div className="detail-span-all">
                    <dt>公司地址</dt>
                    <dd>{selectedCompany.address}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.companyContactName) ? (
                  <div>
                    <dt>公司联系人名称</dt>
                    <dd>{selectedCompany.companyContactName}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.companyContactPhone) ? (
                  <div>
                    <dt>公司联系人电话</dt>
                    <dd>{selectedCompany.companyContactPhone}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.projectContactName) ? (
                  <div>
                    <dt>项目人名称</dt>
                    <dd>{selectedCompany.projectContactName}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.projectContactPhone) ? (
                  <div>
                    <dt>项目联系人电话</dt>
                    <dd>{selectedCompany.projectContactPhone}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.projectContactWechat) ? (
                  <div>
                    <dt>项目联系人微信</dt>
                    <dd>{selectedCompany.projectContactWechat}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.link) ? (
                  <div>
                    <dt>链接</dt>
                    <dd>
                      <a
                        href={selectedCompany.link ?? '#'}
                        className="action-button theme-primary size-sm"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        target="_blank"
                      >
                        打开链接
                      </a>
                    </dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.note) ? (
                  <div className="detail-span-all">
                    <dt>公司简介</dt>
                    <dd>{selectedCompany.note}</dd>
                  </div>
                ) : null}
                {hasText(selectedCompany.attachments) ? (
                  <div className="detail-span-all">
                    <dt>附件资料</dt>
                    <dd>
                      <AttachmentList attachments={selectedCompany.attachments} />
                    </dd>
                  </div>
                ) : null}
                <div className="detail-span-all" style={{ borderTop: '1px solid var(--ds-color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <dt style={{ color: 'var(--ds-color-text-muted)' }}>添加时间</dt>
                  <dd style={{ color: 'var(--ds-color-text-muted)', fontSize: '0.8125rem' }}>{new Date(selectedCompany.createdAt).toLocaleString('zh-CN')}</dd>
                </div>
              </dl>
            </div>
              )}
              notesContent={<CompanyNotePanel companyId={selectedCompany.id} />}
            />
          ) : (
            <EmptyState
              variant="companies"
              action={<CompanyCreateSheet />}
            />
          )}
        </DetailPanel>

        <DetailPanel
          actions={
            selectedCompany ? (
              <ActionButton
                href={`/jobs?companyId=${selectedCompany.id}`}
                size="sm"
                variant="secondary"
              >
                查看全部
              </ActionButton>
            ) : null
          }
          description={
            selectedCompany
              ? `${selectedCompany.jobsCount} 个岗位已关联到当前企业`
              : '选择企业后查看关联岗位。'
          }
          title="关联岗位"
        >
          {selectedCompany?.jobs.length ? (
            <div className="related-jobs-list">
              {selectedCompany.jobs.map((job) => (
                <Link className="related-job-card" href={`/jobs?jobId=${job.id}`} key={job.id}>
                  <div>
                    <strong>{job.title}</strong>
                    <p>{[job.city, job.salaryRange].filter(Boolean).join(' · ')}</p>
                  </div>
                  <StatusBadge variant={jobStatusVariant(job.status)}>{job.status}</StatusBadge>
                </Link>
              ))}
            </div>
          ) : selectedCompany ? (
            <div className="related-jobs-empty">
              <p>当前企业还没有关联岗位。</p>
              <ActionButton href={`/jobs?companyId=${selectedCompany.id}`} size="sm" variant="secondary">
                新增岗位
              </ActionButton>
            </div>
          ) : (
            <p className="muted">暂无企业。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
