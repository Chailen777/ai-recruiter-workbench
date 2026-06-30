/**
 * markdown.ts
 * ──────────────────────────────────────────────────────────
 * 数据变更自动同步 Markdown 文件
 *
 * 数据流：
 *   SQLite (主数据源)  ──写入──▶  data/<library>/<id>-<slug>.md  ◀── AI Agent / RAG
 *
 * 目录结构：
 *   data/
 *   ├── companies/       001-腾讯.md
 *   ├── jobs/            001-高级前端工程师.md
 *   ├── candidates/      001-张三.md
 *   ├── knowledge/       001-招聘流程指南.md
 *   ├── schools/         001-清华大学.md
 *   ├── charts/          001-Q1销售数据.md
 *   ├── info/            001-行业资讯.md
 *   └── matches/         001-张三×高级前端工程师.md
 * ──────────────────────────────────────────────────────────
 */

import fs from 'fs'
import path from 'path'

// data 目录放在项目根目录（与 prisma/ 同级）
const DATA_ROOT = path.join(process.cwd(), 'data')

// ─── 工具函数 ───────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function slugify(text: string): string {
  return text
    .replace(/[\\/:*?"<>|]/g, '-')   // 非法文件名字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

function pad(id: number) {
  return String(id).padStart(4, '0')
}

function fmt(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

function optional(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `- **${label}**: ${value}\n`
}

function section(title: string, content: string | null | undefined): string {
  if (!content) return ''
  return `\n## ${title}\n\n${content}\n`
}

function frontmatter(obj: Record<string, unknown>): string {
  const lines = ['---']
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue
    if (typeof v === 'string' && v.includes('\n')) {
      lines.push(`${k}: |`)
      v.split('\n').forEach(line => lines.push(`  ${line}`))
    } else {
      const serialized = typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : String(v)
      lines.push(`${k}: ${serialized}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

// ─── 文件路径解析 ───────────────────────────────────────

type Library = 'companies' | 'jobs' | 'candidates' | 'knowledge' | 'schools' | 'charts' | 'info' | 'matches'

function filePath(library: Library, id: number, name: string): string {
  const dir = path.join(DATA_ROOT, library)
  ensureDir(dir)
  return path.join(dir, `${pad(id)}-${slugify(name)}.md`)
}

/** 找到并删除一个库中 id 开头的旧文件（名字可能已更改） */
function deleteOldFile(library: Library, id: number) {
  const dir = path.join(DATA_ROOT, library)
  if (!fs.existsSync(dir)) return
  const prefix = `${pad(id)}-`
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (file.startsWith(prefix)) {
      fs.unlinkSync(path.join(dir, file))
    }
  }
}

function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content, 'utf-8')
}

// ─── 企业库 ─────────────────────────────────────────────

export type CompanyData = {
  id: number
  name: string
  industry?: string | null
  city?: string | null
  source?: string | null
  cooperationStatus?: string | null
  address?: string | null
  companyContactName?: string | null
  companyContactPhone?: string | null
  projectContactName?: string | null
  projectContactPhone?: string | null
  projectContactWechat?: string | null
  link?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncCompanyMd(data: CompanyData) {
  deleteOldFile('companies', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'company',
    name: data.name,
    industry: data.industry,
    city: data.city,
    cooperationStatus: data.cooperationStatus,
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.name}

## 基本信息

${optional('行业', data.industry)}${optional('城市', data.city)}${optional('来源', data.source)}${optional('合作状态', data.cooperationStatus)}${optional('地址', data.address)}${optional('官网', data.link)}
## 联系方式

${optional('企业联系人', data.companyContactName)}${optional('企业联系电话', data.companyContactPhone)}${optional('项目联系人', data.projectContactName)}${optional('项目联系电话', data.projectContactPhone)}${optional('项目联系微信', data.projectContactWechat)}
${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('companies', data.id, data.name), content)
}

export function deleteCompanyMd(id: number) {
  deleteOldFile('companies', id)
}

// ─── 岗位库 ─────────────────────────────────────────────

export type JobData = {
  id: number
  companyName: string
  title: string
  city?: string | null
  salaryRange?: string | null
  guaranteePeriod?: string | null
  commission?: string | null
  educationRequirement?: string | null
  ageRequirement?: string | null
  experienceRequirement?: string | null
  jobCategory?: string | null
  skillKeywords?: string | null
  mustHave?: string | null
  niceToHave?: string | null
  exclusions?: string | null
  jdRaw?: string | null
  highlights?: string | null
  responsibilities?: string | null
  requirements?: string | null
  headcount?: number | null
  workLocation?: string | null
  orderNotes?: string | null
  commissionRules?: string | null
  deliveryMode?: string | null
  status: string
  tags?: string | null
  link?: string | null
  source?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncJobMd(data: JobData) {
  deleteOldFile('jobs', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'job',
    title: data.title,
    company: data.companyName,
    city: data.city,
    salaryRange: data.salaryRange,
    status: data.status,
    tags: data.tags,
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.title} · ${data.companyName}

## 岗位概览

${optional('企业', data.companyName)}${optional('城市', data.city)}${optional('薪资范围', data.salaryRange)}${optional('岗位类别', data.jobCategory)}${optional('招聘人数', data.headcount != null ? String(data.headcount) : null)}${optional('工作地点', data.workLocation)}${optional('投递方式', data.deliveryMode)}${optional('状态', data.status)}${optional('来源', data.source)}${optional('链接', data.link)}
## 任职要求

${optional('学历要求', data.educationRequirement)}${optional('年龄要求', data.ageRequirement)}${optional('经验要求', data.experienceRequirement)}${optional('必备技能', data.mustHave)}${optional('加分项', data.niceToHave)}${optional('排除条件', data.exclusions)}${optional('技能关键词', data.skillKeywords)}
## 商务信息

${optional('保证期', data.guaranteePeriod)}${optional('佣金', data.commission)}${optional('佣金规则', data.commissionRules)}${optional('需求备注', data.orderNotes)}
${section('岗位亮点', data.highlights)}${section('工作职责', data.responsibilities)}${section('任职资格', data.requirements)}${section('原始 JD', data.jdRaw)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('jobs', data.id, `${data.title}-${data.companyName}`), content)
}

export function deleteJobMd(id: number) {
  deleteOldFile('jobs', id)
}

// ─── 人才库 ─────────────────────────────────────────────

export type CandidateData = {
  id: number
  name: string
  gender?: string | null
  phone?: string | null
  currentTitle?: string | null
  currentCompany?: string | null
  city?: string | null
  schoolName?: string | null
  schoolType?: string | null
  major?: string | null
  education?: string | null
  age?: number | null
  yearsOfWork?: number | null
  jobSearchStatus?: string | null
  desiredPosition?: string | null
  expectedSalary?: string | null
  skillTags?: string | null
  industryBg?: string | null
  selfIntro?: string | null
  resumeRaw?: string | null
  strengths?: string | null
  workExperience?: string | null
  educationDetail?: string | null
  languages?: string | null
  certificates?: string | null
  projects?: string | null
  awards?: string | null
  otherAbilities?: string | null
  link?: string | null
  communication: string
  status: string
  tags?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncCandidateMd(data: CandidateData) {
  deleteOldFile('candidates', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'candidate',
    name: data.name,
    currentTitle: data.currentTitle,
    currentCompany: data.currentCompany,
    city: data.city,
    education: data.education,
    yearsOfWork: data.yearsOfWork,
    status: data.status,
    tags: data.tags,
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.name}${data.currentTitle ? ` · ${data.currentTitle}` : ''}

## 基本信息

${optional('性别', data.gender)}${optional('手机', data.phone)}${optional('城市', data.city)}${optional('年龄', data.age != null ? String(data.age) : null)}${optional('工作年限', data.yearsOfWork != null ? `${data.yearsOfWork}年` : null)}${optional('当前职位', data.currentTitle)}${optional('当前公司', data.currentCompany)}${optional('求职状态', data.jobSearchStatus)}${optional('期望职位', data.desiredPosition)}${optional('期望薪资', data.expectedSalary)}${optional('跟进状态', data.communication)}${optional('候选人状态', data.status)}${optional('链接/简历', data.link)}
## 教育背景

${optional('学校', data.schoolName)}${optional('学校类型', data.schoolType)}${optional('专业', data.major)}${optional('学历', data.education)}
## 技能与背景

${optional('技能标签', data.skillTags)}${optional('行业背景', data.industryBg)}${optional('语言能力', data.languages)}${optional('证书', data.certificates)}
${section('自我介绍', data.selfIntro)}${section('核心优势', data.strengths)}${section('工作经历', data.workExperience)}${section('教育经历', data.educationDetail)}${section('项目经历', data.projects)}${section('获奖荣誉', data.awards)}${section('其他能力', data.otherAbilities)}${section('完整简历', data.resumeRaw)}${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('candidates', data.id, data.name), content)
}

export function deleteCandidateMd(id: number) {
  deleteOldFile('candidates', id)
}

// ─── 知识库 ─────────────────────────────────────────────

export type KnowledgeData = {
  id: number
  title: string
  author?: string | null
  category?: string | null
  content?: string | null
  source?: string | null
  url?: string | null
  tags?: string | null
  publicStatus?: string | null
  reviewStatus?: string | null
  docFormat?: string | null
  targetAudience?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncKnowledgeMd(data: KnowledgeData) {
  deleteOldFile('knowledge', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'knowledge',
    title: data.title,
    author: data.author,
    category: data.category,
    tags: data.tags,
    publicStatus: data.publicStatus,
    reviewStatus: data.reviewStatus,
    url: data.url,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.title}

## 元信息

${optional('作者', data.author)}${optional('分类', data.category)}${optional('文档格式', data.docFormat)}${optional('目标受众', data.targetAudience)}${optional('公开状态', data.publicStatus)}${optional('审核状态', data.reviewStatus)}${optional('来源', data.source)}${optional('原始链接', data.url)}${optional('标签', data.tags)}
${section('正文内容', data.content)}${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('knowledge', data.id, data.title), content)
}

export function deleteKnowledgeMd(id: number) {
  deleteOldFile('knowledge', id)
}

// ─── 学校库 ─────────────────────────────────────────────

export type SchoolData = {
  id: number
  name: string
  schoolType?: string | null
  city?: string | null
  address?: string | null
  foundedYear?: string | null
  mainMajors?: string | null
  campusCount?: string | null
  studentCount?: string | null
  schoolNature?: string | null
  schoolCategory?: string | null
  educationLevel?: string | null
  doubleFirstClass?: string | null
  graduatePrograms?: string | null
  gradRecommendation?: string | null
  keyDisciplinesCount?: string | null
  academicianCount?: string | null
  link?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncSchoolMd(data: SchoolData) {
  deleteOldFile('schools', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'school',
    name: data.name,
    schoolType: data.schoolType,
    city: data.city,
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.name}

## 基本信息

${optional('类型', data.schoolType)}${optional('城市', data.city)}${optional('地址', data.address)}${optional('创办年份', data.foundedYear)}${optional('办学性质', data.schoolNature)}${optional('院校类别', data.schoolCategory)}${optional('办学层次', data.educationLevel)}${optional('校区数量', data.campusCount)}${optional('在校生数量', data.studentCount)}${optional('官网', data.link)}
## 学科与科研

${optional('主要专业', data.mainMajors)}${optional('双一流等级', data.doubleFirstClass)}${optional('研究生项目', data.graduatePrograms)}${optional('保研资格', data.gradRecommendation)}${optional('重点学科数', data.keyDisciplinesCount)}${optional('院士数量', data.academicianCount)}
${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('schools', data.id, data.name), content)
}

export function deleteSchoolMd(id: number) {
  deleteOldFile('schools', id)
}

// ─── 图表库 ─────────────────────────────────────────────

export type ChartData = {
  id: number
  title: string
  dataDeadline?: Date | null
  statPeriod?: string | null
  statDimension?: string | null
  comparePeriod?: string | null
  creator?: string | null
  dataSource?: string | null
  indicatorTotal?: string | null
  statUnit?: string | null
  dataSourceNote?: string | null
  link?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncChartMd(data: ChartData) {
  deleteOldFile('charts', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'chart',
    title: data.title,
    dataDeadline: fmt(data.dataDeadline),
    statPeriod: data.statPeriod,
    creator: data.creator,
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.title}

## 统计信息

${optional('数据截止', fmt(data.dataDeadline))}${optional('统计周期', data.statPeriod)}${optional('统计维度', data.statDimension)}${optional('对比周期', data.comparePeriod)}${optional('指标总数', data.indicatorTotal)}${optional('统计单位', data.statUnit)}${optional('数据来源', data.dataSource)}${optional('创建人', data.creator)}${optional('链接', data.link)}
${section('数据来源备注', data.dataSourceNote)}${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('charts', data.id, data.title), content)
}

export function deleteChartMd(id: number) {
  deleteOldFile('charts', id)
}

// ─── 信息库 ─────────────────────────────────────────────

export type InfoData = {
  id: number
  title: string
  infoTime?: Date | null
  category?: string | null
  content?: string | null
  creator?: string | null
  pinStatus?: string | null
  infoSource?: string | null
  urgency?: string | null
  relatedBusiness?: string | null
  amount?: string | null
  link?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
  importedAt: Date
}

export function syncInfoMd(data: InfoData) {
  deleteOldFile('info', data.id)
  const fm = frontmatter({
    id: data.id,
    type: 'info',
    title: data.title,
    category: data.category,
    urgency: data.urgency,
    pinStatus: data.pinStatus,
    infoTime: fmt(data.infoTime),
    link: data.link,
    createdAt: fmt(data.createdAt),
    updatedAt: fmt(data.updatedAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# ${data.title}

## 信息属性

${optional('发布时间', fmt(data.infoTime))}${optional('分类', data.category)}${optional('紧急程度', data.urgency)}${optional('置顶状态', data.pinStatus)}${optional('信息来源', data.infoSource)}${optional('相关业务', data.relatedBusiness)}${optional('金额', data.amount)}${optional('创建人', data.creator)}${optional('链接', data.link)}
${section('正文', data.content)}${section('备注', data.note)}
---
*导入于 ${fmt(data.importedAt)} · 更新于 ${fmt(data.updatedAt)}*
`
  writeFile(filePath('info', data.id, data.title), content)
}

export function deleteInfoMd(id: number) {
  deleteOldFile('info', id)
}

// ─── 匹配库 ─────────────────────────────────────────────

export type MatchData = {
  id: number
  candidateId: number
  jobId: number
  candidateName: string
  jobTitle: string
  companyName: string
  score: number
  reasons: string
  gaps: string
  suggestion: string
  status: string
  createdAt: Date
  importedAt: Date
}

export function syncMatchMd(data: MatchData) {
  deleteOldFile('matches', data.id)

  let reasonsList: string[] = []
  let gapsList: string[] = []
  try { reasonsList = JSON.parse(data.reasons) } catch { reasonsList = [data.reasons] }
  try { gapsList = JSON.parse(data.gaps) } catch { gapsList = [data.gaps] }

  const fm = frontmatter({
    id: data.id,
    type: 'match',
    candidate: data.candidateName,
    job: data.jobTitle,
    company: data.companyName,
    score: data.score,
    status: data.status,
    createdAt: fmt(data.createdAt),
    importedAt: fmt(data.importedAt),
  })

  const content = `${fm}

# 匹配报告：${data.candidateName} × ${data.jobTitle}

## 匹配概览

| 项目 | 内容 |
|------|------|
| 候选人 | ${data.candidateName} |
| 岗位 | ${data.jobTitle} |
| 企业 | ${data.companyName} |
| 匹配分数 | **${data.score}分** |
| 状态 | ${data.status} |

## 匹配优势

${reasonsList.map(r => `- ${r}`).join('\n')}

## 差距分析

${gapsList.map(g => `- ${g}`).join('\n')}

## 综合建议

${data.suggestion}

---
*导入于 ${fmt(data.importedAt)}*
`
  writeFile(filePath('matches', data.id, `${data.candidateName}-${data.jobTitle}`), content)
}

export function deleteMatchMd(id: number) {
  deleteOldFile('matches', id)
}
