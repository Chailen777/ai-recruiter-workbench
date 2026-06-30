export type MatchCandidate = {
  id?: number
  name?: string | null
  currentTitle?: string | null
  currentCompany?: string | null
  education?: string | null
  age?: number | null
  city?: string | null
  yearsOfWork?: number | null
  expectedSalary?: string | null
  skillTags?: string | null
  industryBg?: string | null
  resumeRaw?: string | null
}

export type MatchJob = {
  id: number
  companyName: string
  title: string
  city?: string | null
  salaryRange?: string | null
  educationRequirement?: string | null
  ageRequirement?: string | null
  experienceRequirement?: string | null
  industryRequirement?: string | null
  skillKeywords?: string | null
  mustHave?: string | null
  niceToHave?: string | null
  exclusions?: string | null
  jdRaw?: string | null
  status: string
  tags?: string | null
}

export type MatchLevel = '高' | '中' | '低'

export type CandidateToJobMatch = {
  gaps: string[]
  job: MatchJob
  level: MatchLevel
  reasons: string[]
  score: number
  suggestion: string
}

export type JobToCandidateMatch = {
  candidate: MatchCandidate
  gaps: string[]
  level: MatchLevel
  reasons: string[]
  score: number
  suggestion: string
}

/* ═══════════════════════════════════════════════
   Dimension filter — shared between match page & QuickMatchModal
   ═══════════════════════════════════════════════ */

export type MatchDimensionKey = 'city' | 'education' | 'age' | 'skills' | 'experience' | 'industry' | 'salary'

export type MatchDimension = { key: MatchDimensionKey; enabled: boolean }

export type DimCfg = { key: MatchDimensionKey; icon: string; label: string }

/* C2J: 人找岗维度 */
export const DIMS_C2J: DimCfg[] = [
  { key: 'city',      icon: '📍', label: '城市' },
  { key: 'education', icon: '🎓', label: '学历' },
  { key: 'industry',  icon: '🏭', label: '行业' },
  { key: 'skills',    icon: '💡', label: '技能' },
  { key: 'salary',    icon: '💰', label: '薪资' },
]

/* J2C: 岗找人维度 */
export const DIMS_J2C: DimCfg[] = [
  { key: 'age',        icon: '🎂', label: '年龄' },
  { key: 'education',  icon: '🎓', label: '学历' },
  { key: 'city',       icon: '📍', label: '城市' },
  { key: 'skills',     icon: '💡', label: '技能' },
  { key: 'experience', icon: '💼', label: '经验' },
  { key: 'industry',   icon: '🏭', label: '行业' },
]

/** reason/gap 关键词映射，用于维度过滤 */
export const DIM_INDICATORS: Record<MatchDimensionKey, { reason: string; gap: string }> = {
  city:       { reason: '城市匹配',   gap: '城市不同' },
  education:  { reason: '学历符合',   gap: '学历可能不足' },
  age:        { reason: '年龄符合',   gap: '年龄不匹配' },
  skills:     { reason: '核心技能命中', gap: '岗位核心技能未命中' },
  experience: { reason: '工作年限符合', gap: '经验年限不匹配' },
  industry:   { reason: '行业背景',   gap: '行业背景不匹配' },
  salary:     { reason: '薪资区间匹配', gap: '候选人薪资期望' },
}

/** 检查一个匹配结果是否通过启用的维度筛选 */
export function passesDimensionFilter(
  reasons: string[], gaps: string[], enabled: MatchDimensionKey[],
): boolean {
  if (enabled.length === 0) return true
  return enabled.every((key) => {
    const ind = DIM_INDICATORS[key]
    return reasons.some((r) => r.includes(ind.reason))
      || !gaps.some((g) => g.includes(ind.gap))
  })
}

const educationRank: Record<string, number> = {
  初中: 1,
  高中: 2,
  中专: 2,
  大专: 3,
  本科: 4,
  硕士: 5,
  研究生: 5,
  博士: 6,
}

/**
 * 行业标准化映射：将各类表述归一到统一 key
 * 同一 key 下的词都视为"同一行业"，用于精准行业匹配
 */
const industryAliases: Record<string, string[]> = {
  ai:             ['人工智能', 'ai', '机器学习', '深度学习', 'llm', '大模型', '智能'],
  internet:       ['互联网', '电商', '在线', '网络科技', '移动互联网', 'saas', 'paas'],
  finance:        ['金融', '银行', '保险', '证券', '基金', '投资', '信托', '资产管理', '财富管理'],
  realestate:     ['房地产', '地产', '物业', '建筑', '建设', '工程', '房屋'],
  manufacturing:  ['制造', '生产', '工厂', '汽车', '机械', '电子', '半导体', '芯片', '硬件'],
  healthcare:     ['医疗', '医院', '健康', '药品', '生物', '制药', '医药'],
  education:      ['教育', '培训', '学校', '在线教育', '教育科技'],
  consulting:     ['咨询', '管理咨询', '战略咨询', '猎头', '人力资源'],
  retail:         ['零售', '消费', '快消', '品牌', '商超', '连锁'],
  logistics:      ['物流', '供应链', '快递', '仓储', '运输'],
  media:          ['媒体', '传媒', '广告', '公关', '出版', '内容'],
  energy:         ['能源', '电力', '石油', '化工', '新能源', '光伏', '储能'],
  government:     ['政府', '国企', '央企', '事业单位', '公共服务'],
}

/**
 * 将行业文本标准化为行业 key 集合
 */
function normalizeIndustry(text?: string | null): Set<string> {
  const t = normalize(text)
  if (!t) return new Set()
  const matched = new Set<string>()
  for (const [key, aliases] of Object.entries(industryAliases)) {
    if (aliases.some((alias) => t.includes(alias.toLowerCase()))) {
      matched.add(key)
    }
  }
  return matched
}

/**
 * 行业匹配评分（0-1）：
 * - 完全匹配：1.0
 * - 部分交叉：0.5
 * - 无法识别（一方或双方标准化后为空）：0.7（宽松处理，不做惩罚）
 * - 明确不同：0
 */
function industryMatchScore(candidateIndustry?: string | null, jobIndustry?: string | null): number {
  const cSet = normalizeIndustry(candidateIndustry)
  const jSet = normalizeIndustry(jobIndustry)

  // 岗位没有要求，或双方都无法识别 → 视为符合（保守处理）
  if (jSet.size === 0 || cSet.size === 0) return 0.7

  const intersection = [...jSet].filter((k) => cSet.has(k))
  if (intersection.length === 0) return 0  // 明确不匹配
  if (intersection.length >= jSet.size) return 1.0  // 完全覆盖
  return 0.5  // 部分交叉
}

const roleFamilies: Record<string, string[]> = {
  tech: [
    '软件工程师',
    '软件开发',
    '开发',
    '程序',
    '工程师',
    '前端',
    '后端',
    '全栈',
    'java',
    'python',
    'c++',
    'c#',
    'go',
    'golang',
    'php',
    'android',
    'ios',
    '算法',
    '测试',
    '运维',
    '架构',
    '数据库',
    '数据开发',
  ],
  clerical: ['文员', '助理', '行政', '前台', '内勤', '秘书', '资料员', '录入', '客服'],
  sales: ['销售', '客户经理', '商务', '渠道', '大客户', 'bd', '业务员'],
  hr: ['人事', '招聘', 'hr', '人力资源', '薪酬', '绩效'],
  finance: ['财务', '会计', '出纳', '审计', '税务'],
  product: ['产品经理', '产品', '需求', '项目经理', '项目管理'],
  design: ['设计', 'ui', 'ux', '视觉', '平面'],
  operation: ['运营', '新媒体', '内容', '用户运营', '电商运营'],
  quality: ['质量', '品质', 'qa', 'qe', '检验', '测试工程师'],
  manufacturing: ['生产', '制造', '工艺', '设备', '机械', '结构', '电气', '自动化'],
}

/* 岗位方向分类 → 中文显示名称 */
const familyLabels: Record<string, string> = {
  tech: '技术研发',
  data: '数据/算法',
  frontend: '前端开发',
  backend: '后端开发',
  mobile: '移动开发',
  ai: '人工智能',
  clerical: '行政文职',
  sales: '销售商务',
  hr: '人力资源',
  finance: '财务会计',
  product: '产品/项目',
  design: '设计',
  operation: '运营',
  quality: '质量管理',
  manufacturing: '生产制造',
}

function labelFamilies(keys: string[]): string[] {
  return keys.map((k) => familyLabels[k] || k)
}

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

function textOf(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

function tags(text?: string | null) {
  return normalize(text)
    .split(/[,，、;；\s]+/)
    .filter(Boolean)
}

function range(text?: string | null) {
  const nums =
    String(text || '')
      .match(/\d+/g)
      ?.map(Number) || []
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])] as const
  if (nums.length === 1 && String(text).includes('以上')) return [nums[0], Infinity] as const
  if (nums.length === 1 && String(text).includes('以下')) return [0, nums[0]] as const
  if (nums.length === 1) return [nums[0], nums[0]] as const
  return null
}

function loose(left?: string | null, right?: string | null) {
  const a = normalize(left)
  const b = normalize(right)
  return !b || Boolean(a && (a.includes(b) || b.includes(a)))
}

function eduRank(text?: string | null) {
  const value = text || ''
  const key = Object.keys(educationRank).find((item) => value.includes(item))
  return key ? educationRank[key] : 0
}

function roleFamily(text: string) {
  const normalized = normalize(text)
  return Object.entries(roleFamilies)
    .filter(([, words]) => words.some((word) => normalized.includes(word.toLowerCase())))
    .map(([family]) => family)
}

function overlap(left: string[], right: string[]) {
  return left.filter((item) => right.includes(item))
}

function tokenHits(candidateText: string, jobText?: string | null) {
  const candidateTokens = tags(candidateText).filter((token) => token.length >= 2)
  const jobTokens = tags(jobText).filter((token) => token.length >= 2)
  return [
    ...new Set(
      jobTokens.filter((token) =>
        candidateTokens.some((item) => item.includes(token) || token.includes(item))
      )
    ),
  ]
}

function applyCap(value: number, cap: number, gaps: string[], message: string) {
  if (value > cap) {
    gaps.push(message)
    return cap
  }
  return value
}

function levelOf(score: number): MatchLevel {
  if (score >= 80) return '高'
  if (score >= 60) return '中'
  return '低'
}

/**
 * 薪资匹配评分（0 or 5）：
 * 候选人期望薪资区间与岗位薪资区间有交集 → +5 加分
 * 候选人期望明确高于岗位上限 → 加入 gap 提示，不得分
 * 无法解析 → 不处理
 */
function salaryMatchBonus(
  candidateSalary?: string | null,
  jobSalary?: string | null
): { bonus: number; reason?: string; gap?: string } {
  const cRange = range(candidateSalary)
  const jRange = range(jobSalary)
  if (!cRange || !jRange) return { bonus: 0 }

  const [cMin, cMax] = cRange
  const [jMin, jMax] = jRange

  // 候选人期望明显超出岗位上限（差距超 30%）
  if (cMin > jMax * 1.3) {
    return { bonus: 0, gap: `候选人薪资期望（${candidateSalary}）高于岗位预算（${jobSalary}）` }
  }
  // 有交集
  if (cMin <= jMax && cMax >= jMin) {
    return { bonus: 5, reason: `薪资区间匹配（候选期望 ${candidateSalary}，岗位 ${jobSalary}）` }
  }
  return { bonus: 0 }
}

function scorePair(candidate: MatchCandidate, job: MatchJob) {
  let total = 0
  const reasons: string[] = []
  const gaps: string[] = []
  const hardCaps: number[] = []

  const candidateText = textOf(
    candidate.currentTitle,
    candidate.skillTags,
    candidate.industryBg,
    candidate.resumeRaw
  )
  const jobText = textOf(
    job.title,
    job.skillKeywords,
    job.mustHave,
    job.jdRaw,
    job.industryRequirement
  )
  const candidateFamilies = roleFamily(candidateText)
  const jobFamilies = roleFamily(jobText)
  const familyHits = overlap(candidateFamilies, jobFamilies)
  const skillHits = tokenHits(
    textOf(candidate.skillTags, candidate.resumeRaw, candidate.currentTitle),
    textOf(job.skillKeywords, job.mustHave, job.title)
  )
  const mustHits = tokenHits(
    textOf(candidate.skillTags, candidate.resumeRaw, candidate.currentTitle),
    job.mustHave
  )

  if (familyHits.length) {
    total += 25
    reasons.push(`岗位方向一致：${labelFamilies(familyHits).join('、')}`)
  } else if (jobFamilies.length && candidateFamilies.length) {
    gaps.push(
      `岗位方向不一致：候选人偏${labelFamilies(candidateFamilies).join('、')}，岗位偏${labelFamilies(jobFamilies).join('、')}`
    )
    hardCaps.push(45)
  } else if (skillHits.length) {
    total += 12
    reasons.push(`岗位方向未完全识别，但有相关技能：${skillHits.slice(0, 4).join('、')}`)
  } else {
    gaps.push('缺少岗位方向或核心技能命中')
    hardCaps.push(60)
  }

  if (skillHits.length) {
    const skillScore = Math.min(25, 10 + skillHits.length * 5)
    total += skillScore
    reasons.push(`核心技能命中：${skillHits.slice(0, 6).join('、')}`)
  } else if (job.skillKeywords || job.mustHave) {
    gaps.push('岗位核心技能未命中')
    hardCaps.push(55)
  }

  if (job.mustHave && mustHits.length === 0) {
    gaps.push('硬性要求未看到明确命中')
    hardCaps.push(65)
  }

  const exclusionHits = tags(job.exclusions).filter(
    (item) => item.length >= 2 && candidateText.includes(item)
  )
  if (exclusionHits.length) {
    gaps.push(`命中排除项：${exclusionHits.join('、')}`)
    hardCaps.push(35)
  }

  const industryScore = industryMatchScore(candidate.industryBg, job.industryRequirement)
  if (industryScore >= 0.9) {
    total += 15
    reasons.push('行业背景匹配')
  } else if (industryScore >= 0.4) {
    total += 8
    reasons.push('行业背景部分相关')
  } else {
    gaps.push('行业背景不匹配')
  }

  const ageRange = range(job.ageRequirement)
  const expRange = range(job.experienceRequirement)
  if (
    !expRange ||
    (Number(candidate.yearsOfWork) >= expRange[0] && Number(candidate.yearsOfWork) <= expRange[1])
  ) {
    total += 15
    reasons.push('工作年限符合')
  } else {
    gaps.push('经验年限不匹配')
  }

  if (loose(candidate.city, job.city)) {
    total += 8
    reasons.push('城市匹配')
  } else {
    gaps.push('城市不同')
  }

  if (
    !job.educationRequirement ||
    eduRank(candidate.education) >= eduRank(job.educationRequirement)
  ) {
    total += 7
    reasons.push('学历符合')
  } else {
    gaps.push('学历可能不足')
  }

  if (!ageRange || (Number(candidate.age) >= ageRange[0] && Number(candidate.age) <= ageRange[1])) {
    total += 5
    reasons.push('年龄符合')
  } else {
    gaps.push('年龄不匹配')
  }

  // 薪资维度（加分项，不参与 hardCap）
  const salaryResult = salaryMatchBonus(candidate.expectedSalary, job.salaryRange)
  if (salaryResult.bonus > 0 && salaryResult.reason) {
    total += salaryResult.bonus
    reasons.push(salaryResult.reason)
  } else if (salaryResult.gap) {
    gaps.push(salaryResult.gap)
  }

  total = Math.min(100, total)
  hardCaps.forEach((cap) => {
    total = applyCap(total, cap, gaps, `因核心匹配不足，最高分限制为 ${cap} 分`)
  })
  const score = Math.round(total)
  let suggestion: string
  if (score >= 80) {
    suggestion = '优先推荐'
  } else if (score >= 60) {
    suggestion = '可进一步沟通确认'
  } else {
    // 暂不优先推荐 → 追加具体理由
    const gapSummary = gaps.length
      ? gaps.slice(0, 2).join('；')
      : '整体匹配度较低'
    suggestion = `暂不优先推荐（${gapSummary}）`
  }

  return { gaps, level: levelOf(score), reasons, score, suggestion }
}

export function scoreCandidateForJobs(
  candidate: MatchCandidate,
  jobs: MatchJob[]
): CandidateToJobMatch[] {
  return jobs
    .map((job) => ({ job, ...scorePair(candidate, job) }))
    .sort((a, b) => b.score - a.score)
}

export function scoreJobForCandidates(
  job: MatchJob,
  candidates: MatchCandidate[]
): JobToCandidateMatch[] {
  return candidates
    .map((candidate) => ({ candidate, ...scorePair(candidate, job) }))
    .sort((a, b) => b.score - a.score)
}
