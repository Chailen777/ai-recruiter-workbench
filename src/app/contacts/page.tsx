export const revalidate = 60

import { deleteContact } from '@/app/actions'
import { ContactCreateSheet, ContactEditSheet } from '@/components/forms'
import {
  AttachmentList,
  DeleteButton,
  DetailPanel,
  DetailWithNotesBadge,
  ContactNotePanel,
  EmptyState,
  ResourceCard,
  Pagination,
  StatusBadge,
  StatCard,
} from '@/components/ui'
import { prisma } from '@/lib/prisma'
import { startOfToday } from '@/lib/date'

const PAGE_SIZE = 10

export type ContactRow = {
  id: number
  name: string
  gender: string | null
  phone: string | null
  wechat: string | null
  email: string | null
  age: number | null
  birthday: Date | null
  birthdayType: string | null
  maritalStatus: string | null
  childrenInfo: string | null
  religion: string | null
  company: string | null
  position: string | null
  industry: string | null
  workAddress: string | null
  homeAddress: string | null
  city: string | null
  school: string | null
  major: string | null
  education: string | null
  firstMetEvent: string | null
  firstMetDate: Date | null
  introducedBy: string | null
  source: string | null
  relationshipStrength: string | null
  lastContactDate: Date | null
  contactFrequency: string | null
  nextAction: string | null
  coreResources: string | null
  influenceRating: string | null
  cooperationRecord: string | null
  tags: string | null
  avatar: string | null
  attachments: string | null
  note: string | null
  createdAt: Date
}

function hasText(value?: string | null) { return Boolean(value && value.trim()) }

function fmtDate(d: Date | null) {
  if (!d) return '未填写'
  return new Date(d).toLocaleDateString('zh-CN')
}

function strengthColor(s: string | null) {
  if (!s) return 'neutral'
  if (s.includes('深度') || s.includes('老朋友')) return 'success'
  if (s.includes('经常')) return 'progress'
  return 'pending'
}

function influenceColor(r: string | null) {
  if (!r) return 'neutral'
  if (r.startsWith('A')) return 'success'
  if (r.startsWith('B')) return 'progress'
  if (r.startsWith('C')) return 'pending'
  return 'risk'
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; page?: string }>
}) {
  const { contactId, page: pageParam } = await searchParams
  const today = startOfToday()
  const page = Math.max(1, pageParam ? Number(pageParam) : 1)

  const [items, total, todayCount, aLevelCount, selectedRaw] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contact.count(),
    prisma.contact.count({ where: { createdAt: { gte: today } } }),
    prisma.contact.count({ where: { influenceRating: { startsWith: 'A' } } }),
    contactId ? prisma.contact.findUnique({ where: { id: Number(contactId) } }) : null,
  ])

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const recentCount = await prisma.contact.count({ where: { lastContactDate: { gte: thirtyDaysAgo } } })

  const rows: ContactRow[] = items.map(item => ({
    ...item,
  }))
  const selectedItem: ContactRow | null =
    (selectedRaw as unknown as ContactRow | null) ?? rows[0] ?? null

  return (
    <div className="company-page">
      <section className="grid stats">
        <StatCard title="人脉总数" value={items.length} tone="blue" description="关系网络的广度与深度" />
        <StatCard title="今日新增" value={todayCount} tone="green" description="今日新建立的连接" />
        <StatCard title="A级人脉" value={aLevelCount} tone="orange" description="核心关键人脉资源" />
        <StatCard title="近30天活跃" value={recentCount} tone="blue" description="最近一个月有沟通" />
      </section>

      <div className="company-workspace">
        <DetailPanel actions={<ContactCreateSheet />} title="人脉列表">
          {rows.length > 0 ? (
            <div className="resource-card-list">
              {rows.map(item => (
                <ResourceCard
                  key={item.id}
                  title={item.name}
                  href={`/contacts?contactId=${item.id}`}
                  cover={item.avatar}
                  tags={item.tags ? item.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []}
                  metaItems={[
                    ...(item.company ? [{ label: '公司', value: item.company }] : []),
                    ...(item.position ? [{ label: '职位', value: item.position }] : []),
                    ...(item.industry ? [{ label: '行业', value: item.industry }] : []),
                    ...(item.city ? [{ label: '城市', value: item.city }] : []),
                  ]}
                  statusBadges={[
                    ...(item.influenceRating ? [{ label: item.influenceRating, variant: influenceColor(item.influenceRating) as 'success' | 'progress' | 'pending' | 'risk' | 'neutral' }] : []),
                    ...(item.relationshipStrength ? [{ label: item.relationshipStrength, variant: strengthColor(item.relationshipStrength) as 'success' | 'progress' | 'pending' | 'risk' | 'neutral' }] : []),
                  ]}
                  isSelected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState variant="knowledge" action={<ContactCreateSheet />} />
          )}
          <Pagination baseHref="/contacts" page={page} pageSize={PAGE_SIZE} total={total} />
        </DetailPanel>

        <DetailPanel
          actions={
            selectedItem ? (
              <div className="actions">
                <ContactEditSheet contact={selectedItem} />
                <DeleteButton action={deleteContact} id={selectedItem.id} label={selectedItem.name || '该人脉'} variant="secondary" />
              </div>
            ) : null
          }
          description={selectedItem
            ? `${selectedItem.company || '公司未填写'} · ${selectedItem.position || '职位未填写'} · ${selectedItem.city || '城市未填写'}`
            : '点击左侧人脉卡片查看详情。'}
          title={selectedItem?.name ?? '人脉详情'}
        >
          {selectedItem ? (
            <DetailWithNotesBadge
              detailContent={(
                <div className="record-detail">
                  <dl className="detail-list compact">
                    {/* 基础信息 */}
                    {hasText(selectedItem.gender) && (<div><dt>性别</dt><dd>{selectedItem.gender}</dd></div>)}
                    {hasText(selectedItem.phone) && (<div><dt>手机</dt><dd>{selectedItem.phone}</dd></div>)}
                    {hasText(selectedItem.wechat) && (<div><dt>微信</dt><dd>{selectedItem.wechat}</dd></div>)}
                    {hasText(selectedItem.email) && (<div><dt>邮箱</dt><dd>{selectedItem.email}</dd></div>)}
                    {selectedItem.age != null && (<div><dt>年龄</dt><dd>{selectedItem.age}</dd></div>)}
                    {selectedItem.birthday && (<div><dt>生日</dt><dd>{fmtDate(selectedItem.birthday)}{selectedItem.birthdayType ? ` (${selectedItem.birthdayType})` : ''}</dd></div>)}
                    {hasText(selectedItem.maritalStatus) && (<div><dt>婚姻</dt><dd>{selectedItem.maritalStatus}</dd></div>)}
                    {hasText(selectedItem.childrenInfo) && (<div><dt>孩子</dt><dd>{selectedItem.childrenInfo}</dd></div>)}
                    {hasText(selectedItem.religion) && (<div><dt>宗教</dt><dd>{selectedItem.religion}</dd></div>)}

                    {/* 工作 */}
                    {hasText(selectedItem.company) && (<div><dt>工作单位</dt><dd>{selectedItem.company}</dd></div>)}
                    {hasText(selectedItem.position) && (<div><dt>职位</dt><dd>{selectedItem.position}</dd></div>)}
                    {hasText(selectedItem.industry) && (<div><dt>行业</dt><dd>{selectedItem.industry}</dd></div>)}
                    {hasText(selectedItem.workAddress) && (<div><dt>工作地址</dt><dd>{selectedItem.workAddress}</dd></div>)}
                    {hasText(selectedItem.homeAddress) && (<div><dt>家庭地址</dt><dd>{selectedItem.homeAddress}</dd></div>)}
                    {hasText(selectedItem.city) && (<div><dt>城市</dt><dd>{selectedItem.city}</dd></div>)}

                    {/* 教育 */}
                    {hasText(selectedItem.school) && (<div><dt>毕业学校</dt><dd>{selectedItem.school}</dd></div>)}
                    {hasText(selectedItem.major) && (<div><dt>专业</dt><dd>{selectedItem.major}</dd></div>)}
                    {hasText(selectedItem.education) && (<div><dt>学历</dt><dd>{selectedItem.education}</dd></div>)}

                    {/* 关系 */}
                    {hasText(selectedItem.firstMetEvent) && (<div><dt>初识事件</dt><dd>{selectedItem.firstMetEvent}</dd></div>)}
                    {selectedItem.firstMetDate && (<div><dt>初识时间</dt><dd>{fmtDate(selectedItem.firstMetDate)}</dd></div>)}
                    {hasText(selectedItem.introducedBy) && (<div><dt>介绍人</dt><dd>{selectedItem.introducedBy}</dd></div>)}
                    {hasText(selectedItem.source) && (<div><dt>认识渠道</dt><dd>{selectedItem.source}</dd></div>)}
                    {hasText(selectedItem.relationshipStrength) && (
                      <div className="is-highlight"><dt>关系强度</dt><dd><StatusBadge variant={strengthColor(selectedItem.relationshipStrength)}>{selectedItem.relationshipStrength}</StatusBadge></dd></div>
                    )}
                    {selectedItem.lastContactDate && (<div><dt>最近沟通</dt><dd>{fmtDate(selectedItem.lastContactDate)}</dd></div>)}
                    {hasText(selectedItem.contactFrequency) && (<div><dt>沟通频率</dt><dd>{selectedItem.contactFrequency}</dd></div>)}
                    {hasText(selectedItem.nextAction) && (<div><dt>下一步</dt><dd>{selectedItem.nextAction}</dd></div>)}

                    {/* 价值 */}
                    {hasText(selectedItem.coreResources) && (<div className="detail-span-all"><dt>核心资源</dt><dd>{selectedItem.coreResources}</dd></div>)}
                    {hasText(selectedItem.influenceRating) && (
                      <div className="is-highlight"><dt>影响力</dt><dd><StatusBadge variant={influenceColor(selectedItem.influenceRating)}>{selectedItem.influenceRating}</StatusBadge></dd></div>
                    )}
                    {hasText(selectedItem.cooperationRecord) && (<div className="detail-span-all"><dt>合作记录</dt><dd>{selectedItem.cooperationRecord}</dd></div>)}

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
              notesContent={<ContactNotePanel contactId={selectedItem.id} />}
            />
          ) : (
            <p className="muted">点击左侧人脉卡片查看详情。</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}
