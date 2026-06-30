/**
 * sync-all-md.js
 * 将数据库中所有历史数据一次性导出为 Markdown 文件
 * 运行: node scripts/sync-all-md.js
 */

const { PrismaClient } = require('../node_modules/.prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()
const DATA_ROOT = path.join(__dirname, '..', 'data')

// ─── 工具函数 ─────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function slugify(text) {
  return text
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

function pad(id) {
  return String(id).padStart(4, '0')
}

function fmt(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

function optional(label, value) {
  if (!value) return ''
  return `- **${label}**: ${value}\n`
}

function section(title, content) {
  if (!content) return ''
  return `\n## ${title}\n\n${content}\n`
}

function frontmatter(obj) {
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

function writeFile(library, id, name, content) {
  const dir = path.join(DATA_ROOT, library)
  ensureDir(dir)
  const filepath = path.join(dir, `${pad(id)}-${slugify(name)}.md`)
  fs.writeFileSync(filepath, content, 'utf-8')
  return filepath
}

// ─── 各库同步函数 ──────────────────────────────────────────

async function syncCompanies() {
  const items = await prisma.company.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'company', name: d.name,
      industry: d.industry, city: d.city,
      cooperationStatus: d.cooperationStatus, link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.name}

## 基本信息

${optional('行业', d.industry)}${optional('城市', d.city)}${optional('来源', d.source)}${optional('合作状态', d.cooperationStatus)}${optional('地址', d.address)}${optional('官网', d.link)}
## 联系方式

${optional('企业联系人', d.companyContactName)}${optional('企业联系电话', d.companyContactPhone)}${optional('项目联系人', d.projectContactName)}${optional('项目联系电话', d.projectContactPhone)}${optional('项目联系微信', d.projectContactWechat)}
${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('companies', d.id, d.name, content)
    count++
  }
  return count
}

async function syncJobs() {
  const items = await prisma.job.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'job', title: d.title,
      company: d.companyName, city: d.city,
      salaryRange: d.salaryRange, status: d.status,
      tags: d.tags, link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.title} · ${d.companyName}

## 岗位概览

${optional('企业', d.companyName)}${optional('城市', d.city)}${optional('薪资范围', d.salaryRange)}${optional('岗位类别', d.jobCategory)}${optional('招聘人数', d.headcount != null ? String(d.headcount) : null)}${optional('工作地点', d.workLocation)}${optional('投递方式', d.deliveryMode)}${optional('状态', d.status)}${optional('来源', d.source)}${optional('链接', d.link)}
## 任职要求

${optional('学历要求', d.educationRequirement)}${optional('年龄要求', d.ageRequirement)}${optional('经验要求', d.experienceRequirement)}${optional('必备技能', d.mustHave)}${optional('加分项', d.niceToHave)}${optional('排除条件', d.exclusions)}${optional('技能关键词', d.skillKeywords)}
## 商务信息

${optional('保证期', d.guaranteePeriod)}${optional('佣金', d.commission)}${optional('佣金规则', d.commissionRules)}${optional('需求备注', d.orderNotes)}
${section('岗位亮点', d.highlights)}${section('工作职责', d.responsibilities)}${section('任职资格', d.requirements)}${section('原始 JD', d.jdRaw)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('jobs', d.id, `${d.title}-${d.companyName}`, content)
    count++
  }
  return count
}

async function syncCandidates() {
  const items = await prisma.candidate.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'candidate', name: d.name,
      currentTitle: d.currentTitle, currentCompany: d.currentCompany,
      city: d.city, education: d.education,
      yearsOfWork: d.yearsOfWork, status: d.status,
      tags: d.tags, link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.name}${d.currentTitle ? ` · ${d.currentTitle}` : ''}

## 基本信息

${optional('性别', d.gender)}${optional('手机', d.phone)}${optional('城市', d.city)}${optional('年龄', d.age != null ? String(d.age) : null)}${optional('工作年限', d.yearsOfWork != null ? `${d.yearsOfWork}年` : null)}${optional('当前职位', d.currentTitle)}${optional('当前公司', d.currentCompany)}${optional('求职状态', d.jobSearchStatus)}${optional('期望职位', d.desiredPosition)}${optional('期望薪资', d.expectedSalary)}${optional('跟进状态', d.communication)}${optional('候选人状态', d.status)}${optional('链接/简历', d.link)}
## 教育背景

${optional('学校', d.schoolName)}${optional('学校类型', d.schoolType)}${optional('专业', d.major)}${optional('学历', d.education)}
## 技能与背景

${optional('技能标签', d.skillTags)}${optional('行业背景', d.industryBg)}${optional('语言能力', d.languages)}${optional('证书', d.certificates)}
${section('自我介绍', d.selfIntro)}${section('核心优势', d.strengths)}${section('工作经历', d.workExperience)}${section('教育经历', d.educationDetail)}${section('项目经历', d.projects)}${section('获奖荣誉', d.awards)}${section('其他能力', d.otherAbilities)}${section('完整简历', d.resumeRaw)}${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('candidates', d.id, d.name, content)
    count++
  }
  return count
}

async function syncKnowledge() {
  const items = await prisma.knowledge.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'knowledge', title: d.title,
      author: d.author, category: d.category,
      tags: d.tags, publicStatus: d.publicStatus,
      reviewStatus: d.reviewStatus, url: d.url,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.title}

## 元信息

${optional('作者', d.author)}${optional('分类', d.category)}${optional('文档格式', d.docFormat)}${optional('目标受众', d.targetAudience)}${optional('公开状态', d.publicStatus)}${optional('审核状态', d.reviewStatus)}${optional('来源', d.source)}${optional('原始链接', d.url)}${optional('标签', d.tags)}
${section('正文内容', d.content)}${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('knowledge', d.id, d.title, content)
    count++
  }
  return count
}

async function syncSchools() {
  const items = await prisma.school.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'school', name: d.name,
      schoolType: d.schoolType, city: d.city,
      link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.name}

## 基本信息

${optional('类型', d.schoolType)}${optional('城市', d.city)}${optional('地址', d.address)}${optional('创办年份', d.foundedYear)}${optional('办学性质', d.schoolNature)}${optional('院校类别', d.schoolCategory)}${optional('办学层次', d.educationLevel)}${optional('校区数量', d.campusCount)}${optional('在校生数量', d.studentCount)}${optional('官网', d.link)}
## 学科与科研

${optional('主要专业', d.mainMajors)}${optional('双一流等级', d.doubleFirstClass)}${optional('研究生项目', d.graduatePrograms)}${optional('保研资格', d.gradRecommendation)}${optional('重点学科数', d.keyDisciplinesCount)}${optional('院士数量', d.academicianCount)}
${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('schools', d.id, d.name, content)
    count++
  }
  return count
}

async function syncCharts() {
  const items = await prisma.chart.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'chart', title: d.title,
      dataDeadline: fmt(d.dataDeadline), statPeriod: d.statPeriod,
      creator: d.creator, link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.title}

## 统计信息

${optional('数据截止', fmt(d.dataDeadline))}${optional('统计周期', d.statPeriod)}${optional('统计维度', d.statDimension)}${optional('对比周期', d.comparePeriod)}${optional('指标总数', d.indicatorTotal)}${optional('统计单位', d.statUnit)}${optional('数据来源', d.dataSource)}${optional('创建人', d.creator)}${optional('链接', d.link)}
${section('数据来源备注', d.dataSourceNote)}${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('charts', d.id, d.title, content)
    count++
  }
  return count
}

async function syncInfo() {
  const items = await prisma.info.findMany({ orderBy: { id: 'asc' } })
  let count = 0
  for (const d of items) {
    const fm = frontmatter({
      id: d.id, type: 'info', title: d.title,
      category: d.category, urgency: d.urgency,
      pinStatus: d.pinStatus, infoTime: fmt(d.infoTime),
      link: d.link,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })
    const content = `${fm}

# ${d.title}

## 信息属性

${optional('发布时间', fmt(d.infoTime))}${optional('分类', d.category)}${optional('紧急程度', d.urgency)}${optional('置顶状态', d.pinStatus)}${optional('信息来源', d.infoSource)}${optional('相关业务', d.relatedBusiness)}${optional('金额', d.amount)}${optional('创建人', d.creator)}${optional('链接', d.link)}
${section('正文', d.content)}${section('备注', d.note)}
---
*更新于 ${fmt(d.updatedAt)}*
`
    writeFile('info', d.id, d.title, content)
    count++
  }
  return count
}

async function syncMatches() {
  const items = await prisma.match.findMany({
    orderBy: { id: 'asc' },
    include: {
      candidate: { select: { name: true } },
      job: { select: { title: true, companyName: true } },
    },
  })
  let count = 0
  for (const d of items) {
    const candidateName = d.candidate?.name || `候选人${d.candidateId}`
    const jobTitle = d.job?.title || `岗位${d.jobId}`
    const companyName = d.job?.companyName || ''

    let reasonsList = []
    let gapsList = []
    try { reasonsList = JSON.parse(d.reasons) } catch { reasonsList = d.reasons ? [d.reasons] : [] }
    try { gapsList = JSON.parse(d.gaps) } catch { gapsList = d.gaps ? [d.gaps] : [] }

    const fm = frontmatter({
      id: d.id, type: 'match',
      candidate: candidateName, job: jobTitle,
      company: companyName, score: d.score,
      status: d.status, createdAt: fmt(d.createdAt),
    })
    const content = `${fm}

# 匹配报告：${candidateName} × ${jobTitle}

## 匹配概览

| 项目 | 内容 |
|------|------|
| 候选人 | ${candidateName} |
| 岗位 | ${jobTitle} |
| 企业 | ${companyName} |
| 匹配分数 | **${d.score}分** |
| 状态 | ${d.status} |

## 匹配优势

${reasonsList.map(r => `- ${r}`).join('\n') || '暂无'}

## 差距分析

${gapsList.map(g => `- ${g}`).join('\n') || '暂无'}

## 综合建议

${d.suggestion || '暂无'}

---
*生成于 ${fmt(d.createdAt)}*
`
    writeFile('matches', d.id, `${candidateName}-${jobTitle}`, content)
    count++
  }
  return count
}

// ─── 主程序 ───────────────────────────────────────────────

async function main() {
  console.log('🚀 开始全量同步 Markdown 文件...\n')

  const results = await Promise.all([
    syncCompanies().then(n => ({ lib: '企业库', count: n })),
    syncJobs().then(n => ({ lib: '岗位库', count: n })),
    syncCandidates().then(n => ({ lib: '人才库', count: n })),
    syncKnowledge().then(n => ({ lib: '知识库', count: n })),
    syncSchools().then(n => ({ lib: '学校库', count: n })),
    syncCharts().then(n => ({ lib: '图表库', count: n })),
    syncInfo().then(n => ({ lib: '信息库', count: n })),
    syncMatches().then(n => ({ lib: '匹配库', count: n })),
  ])

  console.log('✅ 同步完成！\n')
  let total = 0
  for (const r of results) {
    console.log(`  ${r.lib.padEnd(6)} → ${r.count} 个文件`)
    total += r.count
  }
  console.log(`\n📦 合计：${total} 个 Markdown 文件`)
  console.log(`📁 输出目录：${DATA_ROOT}`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('❌ 同步失败:', e)
  prisma.$disconnect()
  process.exit(1)
})
