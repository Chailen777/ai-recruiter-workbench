/**
 * 全量数据分析脚本
 * 输出：行业分布、地域分布、人才画像、岗位需求、知识覆盖等
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'data')

function parseFrontmatter(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const match = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return null
    const fm = {}
    const lines = match[1].split('\n')
    for (const line of lines) {
      const kv = line.match(/^(\w+):\s*(.*)/)
      if (!kv) continue
      let val = kv[2].trim()
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      fm[kv[1]] = val
    }
    return fm
  } catch { return null }
}

function parseFull(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const body = raw.replace(/^---[\s\S]*?---\n/, '')
    return body
  } catch { return '' }
}

// ─── 企业分析 ───
function analyzeCompanies() {
  const dir = path.join(DATA, 'companies')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const industries = {}
  const cities = {}
  const cooperation = {}
  const sources = {}

  for (const f of files) {
    const fm = parseFrontmatter(path.join(dir, f))
    if (!fm) continue
    if (fm.industry) industries[fm.industry] = (industries[fm.industry] || 0) + 1
    if (fm.city) cities[fm.city] = (cities[fm.city] || 0) + 1
    if (fm.cooperationStatus) cooperation[fm.cooperationStatus] = (cooperation[fm.cooperationStatus] || 0) + 1
  }

  // 从正文中提取来源
  for (const f of files) {
    const body = parseFull(path.join(dir, f))
    const srcMatch = body.match(/- \*\*来源\*\*: (.+)/)
    if (srcMatch) sources[srcMatch[1]] = (sources[srcMatch[1]] || 0) + 1
  }

  return { total: files.length, industries, cities, cooperation, sources }
}

// ─── 岗位分析 ───
function analyzeJobs() {
  const dir = path.join(DATA, 'jobs')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const categories = {}
  const cities = {}
  const salaries = []
  const statuses = {}

  for (const f of files) {
    const fm = parseFrontmatter(path.join(dir, f))
    if (!fm) continue
    if (fm.city) cities[fm.city] = (cities[fm.city] || 0) + 1
    if (fm.salaryRange) salaries.push(fm.salaryRange)
    if (fm.status) statuses[fm.status] = (statuses[fm.status] || 0) + 1

    const body = parseFull(path.join(dir, f))
    const catMatch = body.match(/- \*\*岗位类别\*\*: (.+)/)
    if (catMatch) categories[catMatch[1]] = (categories[catMatch[1]] || 0) + 1
  }

  return { total: files.length, categories, cities, salaries, statuses }
}

// ─── 人才分析 ───
function analyzeCandidates() {
  const dir = path.join(DATA, 'candidates')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const cities = {}
  const educations = {}
  const positions = {}
  const statuses = {}
  const jobSearchStatuses = {}
  const ages = []
  const yearsOfWork = []

  for (const f of files) {
    const fm = parseFrontmatter(path.join(dir, f))
    if (!fm) continue
    if (fm.city) cities[fm.city] = (cities[fm.city] || 0) + 1
    if (fm.education) educations[fm.education] = (educations[fm.education] || 0) + 1
    if (fm.currentTitle) positions[fm.currentTitle] = (positions[fm.currentTitle] || 0) + 1
    if (fm.status) statuses[fm.status] = (statuses[fm.status] || 0) + 1
    if (fm.yearsOfWork) yearsOfWork.push(Number(fm.yearsOfWork))

    const body = parseFull(path.join(dir, f))
    const jsMatch = body.match(/- \*\*求职状态\*\*: (.+)/)
    if (jsMatch) jobSearchStatuses[jsMatch[1]] = (jobSearchStatuses[jsMatch[1]] || 0) + 1
    const ageMatch = body.match(/- \*\*年龄\*\*: (\d+)/)
    if (ageMatch) ages.push(Number(ageMatch[1]))
  }

  const avgAge = ages.length ? (ages.reduce((a,b)=>a+b,0) / ages.length).toFixed(1) : 'N/A'
  const avgYow = yearsOfWork.length ? (yearsOfWork.reduce((a,b)=>a+b,0) / yearsOfWork.length).toFixed(1) : 'N/A'

  return { total: files.length, cities, educations, positions, statuses, jobSearchStatuses, avgAge, avgYow, ages }
}

// ─── 主程序 ───
console.log('╔══════════════════════════════════════════════════╗')
console.log('║     AI超级猎头工作台 — 全量数据分析报告          ║')
console.log('║     分析时间：', new Date().toLocaleString('zh-CN'), '        ║')
console.log('╚══════════════════════════════════════════════════╝')
console.log()

const companies = analyzeCompanies()
const jobs = analyzeJobs()
const candidates = analyzeCandidates()

// 知识库
const knDir = path.join(DATA, 'knowledge')
const knFiles = fs.readdirSync(knDir).filter(f => f.endsWith('.md'))
// 学校库
const schDir = path.join(DATA, 'schools')
const schFiles = fs.readdirSync(schDir).filter(f => f.endsWith('.md'))

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊  一、数据总览')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()
console.log(`  🏢 企业库　　${companies.total} 条`)
console.log(`  💼 岗位库　　${jobs.total} 条`)
console.log(`  👤 人才库　　${candidates.total} 条`)
console.log(`  📚 知识库　　${knFiles.length} 条`)
console.log(`  🎓 学校库　　${schFiles.length} 条`)
console.log(`  📊 图表库　　0 条`)
console.log(`  📰 信息库　　0 条`)
console.log(`  🔗 匹配库　　0 条`)
console.log(`  ─────────────────`)
console.log(`  📦 合计　　　${companies.total + jobs.total + candidates.total + knFiles.length + schFiles.length} 条`)

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🏢  二、企业库深度分析（107家）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

console.log('【行业分布 TOP 15】')
const sortedInd = Object.entries(companies.industries).sort((a,b) => b[1]-a[1])
for (let i = 0; i < Math.min(15, sortedInd.length); i++) {
  const bar = '█'.repeat(Math.round(sortedInd[i][1] / 1.5))
  console.log(`  ${(i+1).toString().padStart(2)}. ${sortedInd[i][0].padEnd(24)} ${sortedInd[i][1]}家  ${bar}`)
}

console.log()
console.log('【城市分布 TOP 10】')
const sortedCity = Object.entries(companies.cities).sort((a,b) => b[1]-a[1])
for (const [city, count] of sortedCity.slice(0, 10)) {
  const bar = '█'.repeat(count)
  console.log(`  ${city.padEnd(12)} ${count}家  ${bar}`)
}

console.log()
console.log('【合作状态分布】')
for (const [k, v] of Object.entries(companies.cooperation).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${k.padEnd(12)} ${v}家`)
}

console.log()
console.log('【来源渠道分布】')
const sortedSrc = Object.entries(companies.sources).sort((a,b) => b[1]-a[1])
for (const [src, count] of sortedSrc.slice(0, 10)) {
  console.log(`  ${src.padEnd(24)} ${count}家`)
}

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('💼  三、岗位库深度分析（8个）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

console.log('【岗位类别】')
for (const [cat, count] of Object.entries(jobs.categories)) {
  console.log(`  ${cat.padEnd(24)} ${count}个`)
}

console.log()
console.log('【薪资范围分布】')
const salaryGroups = {}
for (const s of jobs.salaries) {
  salaryGroups[s] = (salaryGroups[s] || 0) + 1
}
for (const [k, v] of Object.entries(salaryGroups).sort()) {
  console.log(`  ${k.padEnd(16)} ${v}个`)
}

console.log()
console.log('【岗位城市】')
for (const [city, count] of Object.entries(jobs.cities)) {
  console.log(`  ${city.padEnd(12)} ${count}个`)
}

console.log()
console.log('【岗位状态】')
for (const [k, v] of Object.entries(jobs.statuses)) {
  console.log(`  ${k.padEnd(12)} ${v}个`)
}

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('👤  四、人才库深度分析（12位候选人）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

console.log(`  平均年龄：${candidates.avgAge} 岁`)
console.log(`  平均工作年限：${candidates.avgYow} 年`)
console.log(`  年龄范围：${Math.min(...candidates.ages)} ~ ${Math.max(...candidates.ages)} 岁`)
console.log()

console.log('【学历分布】')
for (const [edu, count] of Object.entries(candidates.educations)) {
  console.log(`  ${edu.padEnd(12)} ${count}人`)
}

console.log()
console.log('【当前职位 TOP 12】')
const sortedPos = Object.entries(candidates.positions).sort((a,b) => b[1]-a[1])
for (const [pos, count] of sortedPos) {
  console.log(`  ${pos.padEnd(30)} ${count}人`)
}

console.log()
console.log('【人才城市分布】')
for (const [city, count] of Object.entries(candidates.cities)) {
  console.log(`  ${city.padEnd(12)} ${count}人`)
}

console.log()
console.log('【求职状态】')
for (const [k, v] of Object.entries(candidates.jobSearchStatuses)) {
  console.log(`  ${k.padEnd(12)} ${v}人`)
}

console.log()
console.log('【人才状态】')
for (const [k, v] of Object.entries(candidates.statuses)) {
  console.log(`  ${k.padEnd(12)} ${v}人`)
}

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📚  五、知识库分析')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()
for (const f of knFiles) {
  const fm = parseFrontmatter(path.join(knDir, f))
  if (!fm) continue
  console.log(`  📄 ${fm.title}`)
  console.log(`     分类: ${fm.category || '未分类'} | 作者: ${fm.author || '未知'} | 状态: ${fm.publicStatus || '-'}`)
}

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🎓  六、学校库分析')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()
for (const f of schFiles) {
  const fm = parseFrontmatter(path.join(schDir, f))
  if (!fm) continue
  const body = parseFull(path.join(schDir, f))
  const typeMatch = body.match(/- \*\*类型\*\*: (.+)/)
  console.log(`  🏫 ${fm.name}`)
  console.log(`     类型: ${typeMatch ? typeMatch[1] : '-'} | 城市: ${fm.city || '-'}`)
}

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍  七、关键洞察与结论')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

const totalInd = Object.values(companies.industries).reduce((a,b) => a+b, 0)
const techInd = companies.industries['计算机/互联网/通信/电子'] || 0
const coopRate = ((companies.cooperation['合作中'] || 0) / companies.total * 100).toFixed(0)

console.log(`  1. 行业集中度：IT/互联网/通信行业 ${techInd}/${totalInd} 家，占比 ${(techInd/totalInd*100).toFixed(0)}%，是核心赛道`)
console.log()
console.log(`  2. 合作活跃度：${coopRate}% 的企业处于"合作中"状态，客户关系健康`)
console.log()
console.log(`  3. 地域分布：北京/上海/深圳一线城市是企业主阵地，覆盖全国${Object.keys(companies.cities).length}+城市`)
console.log()
console.log(`  4. 人才供给：${candidates.total} 位候选人集中在${Object.keys(candidates.cities).length}个城市，${candidates.avgYow}年平均经验，${candidates.avgAge}岁黄金年龄`)
console.log()
console.log(`  5. 岗位热度：${jobs.total} 个在招岗位，${Object.entries(jobs.statuses).find(([k]) => k.includes('招聘') || k.includes('开放'))?.[1] || 0}个活跃中`)
console.log()

if (candidates.total > jobs.total) {
  console.log(`  6. ⚠️  人才库(${candidates.total}人) > 岗位库(${jobs.total}个)，岗位供给不足，建议加大BD力度拓展企业需求`)
} else {
  console.log(`  6. ✅ 岗位库(${jobs.total}个) > 人才库(${candidates.total}人)，人才储备需跟进`)
}

console.log()
console.log(`  7. 📌 数据短板：知识库仅${knFiles.length}条，学校库仅${schFiles.length}条，匹配库/图表库/信息库为零，是后续建设重点`)

console.log()
console.log('═══════════════════════════════════════════════════')
console.log('  报告生成完毕')
console.log('═══════════════════════════════════════════════════')
