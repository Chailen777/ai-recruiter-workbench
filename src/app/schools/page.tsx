export const revalidate = 60

import { deleteSchool } from '@/app/actions'
import { SchoolCreateSheet, SchoolEditSheet } from '@/components/forms'
import {
  AttachmentList,
  CoverImage,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  EmptyState,
  SchoolNotePanel,
  Pagination,
  ResourceCard,
  StatCard,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type SchoolRow = {
  id: number
  name: string
  schoolType: string | null
  city: string | null
  address: string | null
  foundedYear: string | null
  mainMajors: string | null
  campusCount: string | null
  studentCount: string | null
  schoolNature: string | null
  schoolCategory: string | null
  educationLevel: string | null
  doubleFirstClass: string | null
  graduatePrograms: string | null
  gradRecommendation: string | null
  keyDisciplinesCount: string | null
  academicianCount: string | null
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

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string; page?: string }>
}) {
  const { schoolId, page: pageParam } = await searchParams
  const today = startOfToday()
  const page = Math.max(1, pageParam ? Number(pageParam) : 1)

  const [items, total, todayCount, doubleFirstClassCount, hasGradProgramCount, selectedRaw] = await Promise.all([
    prisma.school.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.school.count(),
    prisma.school.count({ where: { createdAt: { gte: today } } }),
    prisma.school.count({ where: { NOT: { doubleFirstClass: null } } }),
    prisma.school.count({ where: { NOT: { graduatePrograms: null } } }),
    schoolId ? prisma.school.findUnique({ where: { id: Number(schoolId) } }) : null,
  ])

  const rows: SchoolRow[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    schoolType: item.schoolType,
    city: item.city,
    address: item.address,
    foundedYear: item.foundedYear,
    mainMajors: item.mainMajors,
    campusCount: item.campusCount,
    studentCount: item.studentCount,
    schoolNature: item.schoolNature,
    schoolCategory: item.schoolCategory,
    educationLevel: item.educationLevel,
    doubleFirstClass: item.doubleFirstClass,
    graduatePrograms: item.graduatePrograms,
    gradRecommendation: item.gradRecommendation,
    keyDisciplinesCount: item.keyDisciplinesCount,
    academicianCount: item.academicianCount,
    content: item.content,
    link: item.link,
    cover: item.cover,
    attachments: item.attachments,
    note: item.note,
    createdAt: item.createdAt,
  }))

  const selectedItem: SchoolRow | null =
    (selectedRaw as unknown as SchoolRow | null) ?? rows[0] ?? null

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard
          description="积累院校资源，精准锁定优质人才源头"
          title="学校总数"
          tone="blue"
          value={items.length}
        />
        <StatCard description="今日新收录的院校" title="今日新增" tone="green" value={todayCount} />
        <StatCard description="双一流高校，人才密度更高" title="双一流学校" tone="orange" value={doubleFirstClassCount} />
        <StatCard description="硕士博士点覆盖，研究生人才丰富" title="有研究生点" tone="blue" value={hasGradProgramCount} />
      </section>

      <div className="company-workspace">
        <DetailPanel
          actions={<SchoolCreateSheet />}
          title="学校列表"
        >
          {rows.length > 0 ? (
            <div className="resource-card-list">
              {rows.map((item) => (
                <ResourceCard
                  key={item.id}
                  title={item.name}
                  href={`/schools?schoolId=${item.id}`}
                  cover={item.cover}
                  tags={item.mainMajors ? item.mainMajors.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []}
                  metaItems={[
                    ...(item.schoolType ? [{ label: '类型', value: item.schoolType }] : []),
                    ...(item.city ? [{ label: '城市', value: item.city }] : []),
                    ...(item.schoolNature ? [{ label: '办学性质', value: item.schoolNature }] : []),
                    ...(item.educationLevel ? [{ label: '学历层次', value: item.educationLevel }] : []),
                  ]}
                  statusBadges={
                    item.doubleFirstClass
                      ? [{ label: '双一流', variant: 'success' as const }]
                      : []
                  }
                  footerLeft={item.studentCount ? `在校 ${item.studentCount} 人` : undefined}
                  footerRight={item.campusCount ? `${item.campusCount} 个校区` : undefined}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="schools"
              action={<SchoolCreateSheet />}
            />
          )}
          <Pagination
            baseHref="/schools"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <SchoolEditSheet school={selectedItem} />
                <DeleteButton action={deleteSchool} id={selectedItem.id} label={selectedItem.name || '该院校'} variant="secondary" />
              </div>
            ) : null
          }
          description={
            selectedItem
              ? `${selectedItem.schoolType || '类型未填写'} · ${selectedItem.city || '城市未填写'}`
              : '点击左侧学校卡片后，在这里集中处理学校操作。'
          }
          title={selectedItem?.name ?? '学校详情'}
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
                {hasText(selectedItem.schoolType) ? (
                  <div>
                    <dt>类型</dt>
                    <dd>{selectedItem.schoolType}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.city) ? (
                  <div>
                    <dt>城市</dt>
                    <dd>{selectedItem.city}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.address) ? (
                  <div className="detail-span-all">
                    <dt>地址</dt>
                    <dd>{selectedItem.address}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.schoolNature) ? (
                  <div>
                    <dt>办学性质</dt>
                    <dd>{selectedItem.schoolNature}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.schoolCategory) ? (
                  <div>
                    <dt>院校类型</dt>
                    <dd>{selectedItem.schoolCategory}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.educationLevel) ? (
                  <div>
                    <dt>学历层次</dt>
                    <dd>{selectedItem.educationLevel}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.doubleFirstClass) ? (
                  <div className="is-highlight">
                    <dt>双一流</dt>
                    <dd>{selectedItem.doubleFirstClass}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.graduatePrograms) ? (
                  <div className="is-highlight">
                    <dt>硕士点/博士点</dt>
                    <dd>{selectedItem.graduatePrograms}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.gradRecommendation) ? (
                  <div>
                    <dt>保研资格</dt>
                    <dd>{selectedItem.gradRecommendation}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.keyDisciplinesCount) ? (
                  <div>
                    <dt>国家级重点学科数量</dt>
                    <dd>{selectedItem.keyDisciplinesCount}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.academicianCount) ? (
                  <div>
                    <dt>院士数量</dt>
                    <dd>{selectedItem.academicianCount}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.foundedYear) ? (
                  <div>
                    <dt>创办年份</dt>
                    <dd>{selectedItem.foundedYear}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.campusCount) ? (
                  <div>
                    <dt>校区数量</dt>
                    <dd>{selectedItem.campusCount}</dd>
                  </div>
                ) : null}
                {hasText(selectedItem.studentCount) ? (
                  <div>
                    <dt>学生数量</dt>
                    <dd>{selectedItem.studentCount}</dd>
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
                {hasText(selectedItem.mainMajors) ? (
                  <div className="detail-span-all">
                    <dt>主打专业</dt>
                    <dd>{selectedItem.mainMajors}</dd>
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
              notesContent={<SchoolNotePanel schoolId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧学校卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
