import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const companies = [
  {
    name: '深圳道通航空有限公司',
    industry: '无人机',
    city: '深圳、北京',
    source: '禾蛙网',
    cooperationStatus: '合作中',
    note: '无人机研发与智能硬件企业',
  },
  {
    name: '杭州云脉科技有限公司',
    industry: '人工智能',
    city: '杭州、上海',
    source: '人力聚合平台',
    cooperationStatus: '合作中',
    note: 'AI 数据平台与企业应用',
  },
  {
    name: '苏州精工智造有限公司',
    industry: '智能制造',
    city: '苏州、南京',
    source: '手工录入',
    cooperationStatus: '待沟通',
    note: '自动化设备与精密制造',
  },
  {
    name: '广州新零售科技有限公司',
    industry: '电商零售',
    city: '广州、深圳',
    source: '人力聚合平台',
    cooperationStatus: '合作中',
    note: '新零售运营与会员增长',
  },
  {
    name: '成都启航企业服务有限公司',
    industry: '企业服务',
    city: '成都、重庆',
    source: '手工录入',
    cooperationStatus: '初步接触',
    note: 'B2B 企业服务与销售团队',
  },
  {
    name: '上海智链金融科技有限公司',
    industry: '金融科技',
    city: '上海、杭州',
    source: '禾蛙网',
    cooperationStatus: '合作中',
    note: '支付、风控与数据产品',
  },
]

const jobs = [
  {
    company: '深圳道通航空有限公司',
    title: '嵌入式软件工程师',
    city: '深圳',
    salaryRange: '25-40K',
    educationRequirement: '本科以上',
    ageRequirement: '25-38',
    experienceRequirement: '3年以上',
    jobCategory: '无人机',
    skillKeywords: 'C++, 嵌入式, RTOS, Linux, 无人机',
    mustHave: '嵌入式 C++ Linux',
    niceToHave: '飞控经验',
    exclusions: '文员, 行政',
    jdRaw: '负责无人机嵌入式软件开发、调试和性能优化。',
    status: '开放',
    tags: '高薪、急招',
    source: '禾蛙网',
  },
  {
    company: '深圳道通航空有限公司',
    title: '无人机测试工程师',
    city: '深圳',
    salaryRange: '18-28K',
    educationRequirement: '本科以上',
    ageRequirement: '24-35',
    experienceRequirement: '2年以上',
    jobCategory: '无人机',
    skillKeywords: '测试, QA, 自动化测试, 无人机',
    mustHave: '测试 自动化',
    niceToHave: '飞行测试',
    exclusions: '纯文员',
    jdRaw: '负责无人机系统测试、问题定位和测试报告。',
    status: '开放',
    tags: '研发测试',
    source: '禾蛙网',
  },
  {
    company: '杭州云脉科技有限公司',
    title: 'Java后端开发工程师',
    city: '杭州',
    salaryRange: '22-35K',
    educationRequirement: '本科以上',
    ageRequirement: '24-38',
    experienceRequirement: '3年以上',
    jobCategory: '人工智能',
    skillKeywords: 'Java, Spring, MySQL, Redis, 微服务',
    mustHave: 'Java Spring MySQL',
    niceToHave: 'AI平台经验',
    exclusions: '行政, 文员',
    jdRaw: '负责 AI 平台后端服务、接口和数据链路开发。',
    status: '开放',
    tags: '后端、平台',
    source: '人力聚合平台',
  },
  {
    company: '杭州云脉科技有限公司',
    title: 'AI产品经理',
    city: '上海',
    salaryRange: '25-45K',
    educationRequirement: '本科以上',
    ageRequirement: '26-40',
    experienceRequirement: '4年以上',
    jobCategory: '人工智能',
    skillKeywords: '产品经理, AI, 数据产品, 需求',
    mustHave: '产品经理 AI',
    niceToHave: 'B端产品',
    exclusions: '销售助理',
    jdRaw: '负责 AI 产品规划、需求设计和跨团队推进。',
    status: '推荐中',
    tags: '产品',
    source: '人力聚合平台',
  },
  {
    company: '苏州精工智造有限公司',
    title: '机械结构工程师',
    city: '苏州',
    salaryRange: '18-30K',
    educationRequirement: '本科以上',
    ageRequirement: '25-40',
    experienceRequirement: '3年以上',
    jobCategory: '智能制造',
    skillKeywords: '机械, 结构, SolidWorks, 设备',
    mustHave: '机械 结构 SolidWorks',
    niceToHave: '自动化设备',
    exclusions: '纯销售',
    jdRaw: '负责自动化设备结构设计、出图和改进。',
    status: '开放',
    tags: '制造',
    source: '手工录入',
  },
  {
    company: '苏州精工智造有限公司',
    title: '电气自动化工程师',
    city: '南京',
    salaryRange: '20-32K',
    educationRequirement: '大专以上',
    ageRequirement: '24-38',
    experienceRequirement: '3年以上',
    jobCategory: '智能制造',
    skillKeywords: 'PLC, 电气, 自动化, 西门子',
    mustHave: 'PLC 电气 自动化',
    niceToHave: '西门子',
    exclusions: '文员',
    jdRaw: '负责自动化设备电气设计、调试和现场支持。',
    status: '开放',
    tags: '自动化',
    source: '手工录入',
  },
  {
    company: '广州新零售科技有限公司',
    title: '电商运营经理',
    city: '广州',
    salaryRange: '18-30K',
    educationRequirement: '大专以上',
    ageRequirement: '25-38',
    experienceRequirement: '3年以上',
    jobCategory: '电商零售',
    skillKeywords: '电商运营, 用户运营, 数据分析, 活动策划',
    mustHave: '电商运营 数据分析',
    niceToHave: '会员增长',
    exclusions: '开发工程师',
    jdRaw: '负责电商平台运营、活动策划和数据增长。',
    status: '开放',
    tags: '运营',
    source: '人力聚合平台',
  },
  {
    company: '广州新零售科技有限公司',
    title: 'UI视觉设计师',
    city: '深圳',
    salaryRange: '15-25K',
    educationRequirement: '大专以上',
    ageRequirement: '23-35',
    experienceRequirement: '2年以上',
    jobCategory: '电商零售',
    skillKeywords: 'UI, 视觉, 平面, Figma',
    mustHave: 'UI 视觉',
    niceToHave: '电商设计',
    exclusions: '纯行政',
    jdRaw: '负责产品界面、活动视觉和品牌素材设计。',
    status: '开放',
    tags: '设计',
    source: '人力聚合平台',
  },
  {
    company: '成都启航企业服务有限公司',
    title: '大客户销售经理',
    city: '成都',
    salaryRange: '15-35K',
    educationRequirement: '大专以上',
    ageRequirement: '24-40',
    experienceRequirement: '3年以上',
    jobCategory: '企业服务',
    skillKeywords: '销售, 大客户, BD, 商务, 客户经理',
    mustHave: '销售 大客户',
    niceToHave: '企业服务',
    exclusions: '研发',
    jdRaw: '负责企业客户开发、商务谈判和签约回款。',
    status: '开放',
    tags: '销售',
    source: '手工录入',
  },
  {
    company: '上海智链金融科技有限公司',
    title: '风控数据分析师',
    city: '上海',
    salaryRange: '20-35K',
    educationRequirement: '本科以上',
    ageRequirement: '24-38',
    experienceRequirement: '3年以上',
    jobCategory: '金融科技',
    skillKeywords: '数据分析, SQL, Python, 风控, 模型',
    mustHave: 'SQL Python 风控',
    niceToHave: '金融科技',
    exclusions: '前台, 文员',
    jdRaw: '负责风控策略分析、数据建模和业务监控。',
    status: '开放',
    tags: '数据',
    source: '禾蛙网',
  },
]

const candidates = [
  {
    name: '李明',
    phone: '13800010001',
    currentTitle: '嵌入式软件工程师',
    currentCompany: '航芯科技',
    city: '深圳',
    education: '本科',
    age: 30,
    yearsOfWork: 6,
    expectedSalary: '28-38K',
    skillTags: 'C++, 嵌入式, Linux, RTOS, 无人机',
    industryBg: '无人机',
    resumeRaw: '6年嵌入式开发经验，熟悉无人机飞控和 Linux 驱动。',
    communication: '待跟进',
    status: '已沟通',
    tags: '高匹配',
    note: '适合无人机研发岗位',
  },
  {
    name: '王芳',
    phone: '13800010002',
    currentTitle: 'Java后端开发工程师',
    currentCompany: '云栈科技',
    city: '杭州',
    education: '本科',
    age: 29,
    yearsOfWork: 5,
    expectedSalary: '24-34K',
    skillTags: 'Java, Spring, MySQL, Redis, 微服务',
    industryBg: '人工智能',
    resumeRaw: '负责 B 端平台后端服务和数据接口。',
    communication: '待跟进',
    status: '新建',
    tags: '后端',
    note: '后端岗位优先',
  },
  {
    name: '陈杰',
    phone: '13800010003',
    currentTitle: 'AI产品经理',
    currentCompany: '数智未来',
    city: '上海',
    education: '本科',
    age: 32,
    yearsOfWork: 7,
    expectedSalary: '30-42K',
    skillTags: '产品经理, AI, 数据产品, 需求, B端',
    industryBg: '人工智能',
    resumeRaw: '负责 AI 数据产品规划和客户需求落地。',
    communication: '已沟通',
    status: '已推荐',
    tags: '产品',
    note: '已推荐 AI 产品岗位',
  },
  {
    name: '赵强',
    phone: '13800010004',
    currentTitle: '机械结构工程师',
    currentCompany: '精密装备',
    city: '苏州',
    education: '本科',
    age: 34,
    yearsOfWork: 8,
    expectedSalary: '20-30K',
    skillTags: '机械, 结构, SolidWorks, 自动化设备',
    industryBg: '智能制造',
    resumeRaw: '长期负责自动化设备结构设计和导入量产。',
    communication: '待跟进',
    status: '新建',
    tags: '制造',
    note: '适合结构工程师',
  },
  {
    name: '刘洋',
    phone: '13800010005',
    currentTitle: '电气自动化工程师',
    currentCompany: '智造设备',
    city: '南京',
    education: '大专',
    age: 31,
    yearsOfWork: 6,
    expectedSalary: '22-30K',
    skillTags: 'PLC, 电气, 自动化, 西门子',
    industryBg: '智能制造',
    resumeRaw: '熟悉 PLC 编程和自动化产线现场调试。',
    communication: '待跟进',
    status: '已沟通',
    tags: '自动化',
    note: '可推南京自动化岗位',
  },
  {
    name: '周倩',
    phone: '13800010006',
    currentTitle: '电商运营经理',
    currentCompany: '鲸选电商',
    city: '广州',
    education: '大专',
    age: 28,
    yearsOfWork: 5,
    expectedSalary: '20-28K',
    skillTags: '电商运营, 用户运营, 数据分析, 活动策划',
    industryBg: '电商零售',
    resumeRaw: '负责会员增长、活动运营和销售转化。',
    communication: '待跟进',
    status: '新建',
    tags: '运营',
    note: '运营岗位优先',
  },
  {
    name: '吴晨',
    phone: '13800010007',
    currentTitle: 'UI视觉设计师',
    currentCompany: '小橙设计',
    city: '深圳',
    education: '本科',
    age: 27,
    yearsOfWork: 4,
    expectedSalary: '16-24K',
    skillTags: 'UI, 视觉, Figma, 平面, 电商设计',
    industryBg: '电商零售',
    resumeRaw: '负责移动端 UI、活动页和品牌视觉。',
    communication: '待跟进',
    status: '新建',
    tags: '设计',
    note: '设计岗位可推',
  },
  {
    name: '郑涛',
    phone: '13800010008',
    currentTitle: '大客户销售经理',
    currentCompany: '企服互联',
    city: '成都',
    education: '大专',
    age: 33,
    yearsOfWork: 8,
    expectedSalary: '18-35K',
    skillTags: '销售, 大客户, BD, 商务, 客户经理',
    industryBg: '企业服务',
    resumeRaw: '负责大客户拓展、方案报价和签约回款。',
    communication: '已沟通',
    status: '面试中',
    tags: '销售',
    note: '正在推进企服销售岗位',
  },
  {
    name: '孙悦',
    phone: '13800010009',
    currentTitle: '风控数据分析师',
    currentCompany: '融数科技',
    city: '上海',
    education: '硕士',
    age: 29,
    yearsOfWork: 4,
    expectedSalary: '24-34K',
    skillTags: '数据分析, SQL, Python, 风控, 模型',
    industryBg: '金融科技',
    resumeRaw: '熟悉风控策略、SQL 分析和 Python 建模。',
    communication: '待跟进',
    status: '新建',
    tags: '数据',
    note: '适合风控数据岗位',
  },
  {
    name: '何敏',
    phone: '13800010010',
    currentTitle: '行政文员',
    currentCompany: '本地服务公司',
    city: '深圳',
    education: '大专',
    age: 26,
    yearsOfWork: 3,
    expectedSalary: '6-8K',
    skillTags: '文员, 行政, 资料录入, 客服',
    industryBg: '企业服务',
    resumeRaw: '主要负责行政、资料整理、合同归档。',
    communication: '待跟进',
    status: '新建',
    tags: '低匹配测试',
    note: '用于验证文员不会高分匹配研发岗位',
  },
]

function tags(text = '') {
  return String(text)
    .toLowerCase()
    .split(/[,，、;；\s]+/)
    .filter(Boolean)
}

function textOf(...values) {
  return values.filter(Boolean).join(' ').toLowerCase()
}

const roleFamilies = {
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

const educationRank = { 初中: 1, 高中: 2, 中专: 2, 大专: 3, 本科: 4, 硕士: 5, 研究生: 5, 博士: 6 }

function roleFamily(text) {
  const value = String(text || '').toLowerCase()
  return Object.entries(roleFamilies)
    .filter(([, words]) => words.some((word) => value.includes(word.toLowerCase())))
    .map(([family]) => family)
}

function overlap(left, right) {
  return left.filter((item) => right.includes(item))
}

function tokenHits(candidateText, jobText) {
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

function loose(left, right) {
  const a = String(left || '')
    .trim()
    .toLowerCase()
  const b = String(right || '')
    .trim()
    .toLowerCase()
  return !b || Boolean(a && (a.includes(b) || b.includes(a)))
}

function range(text) {
  const nums =
    String(text || '')
      .match(/\d+/g)
      ?.map(Number) || []
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])]
  if (nums.length === 1 && String(text).includes('以上')) return [nums[0], Infinity]
  if (nums.length === 1 && String(text).includes('以下')) return [0, nums[0]]
  if (nums.length === 1) return [nums[0], nums[0]]
  return null
}

function eduRank(text) {
  const key = Object.keys(educationRank).find((item) => String(text || '').includes(item))
  return key ? educationRank[key] : 0
}

function score(candidate, job) {
  let total = 0
  const reasons = []
  const gaps = []
  const hardCaps = []
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
    job.jobCategory
  )
  const familyHits = overlap(roleFamily(candidateText), roleFamily(jobText))
  const candidateFamilies = roleFamily(candidateText)
  const jobFamilies = roleFamily(jobText)
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
    reasons.push(`岗位方向一致：${familyHits.join('、')}`)
  } else if (jobFamilies.length && candidateFamilies.length) {
    gaps.push(
      `岗位方向不一致：候选人偏${candidateFamilies.join('、')}，岗位偏${jobFamilies.join('、')}`
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
    total += Math.min(25, 10 + skillHits.length * 5)
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

  if (!job.jobCategory || loose(candidate.industryBg, job.jobCategory)) {
    total += 15
    reasons.push('行业背景匹配')
  } else {
    gaps.push('行业背景不匹配')
  }

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

  const ageRange = range(job.ageRequirement)
  if (!ageRange || (Number(candidate.age) >= ageRange[0] && Number(candidate.age) <= ageRange[1])) {
    total += 5
    reasons.push('年龄符合')
  } else {
    gaps.push('年龄不匹配')
  }

  total = Math.min(100, total)
  hardCaps.forEach((cap) => {
    if (total > cap) {
      total = cap
      gaps.push(`因核心匹配不足，最高分限制为 ${cap} 分`)
    }
  })
  total = Math.round(total)
  return {
    gaps,
    reasons,
    score: total,
    suggestion: total >= 80 ? '优先推荐' : total >= 60 ? '可进一步沟通确认' : '暂不优先推荐',
  }
}

async function upsertCompany(item) {
  const existing = await prisma.company.findFirst({ where: { name: item.name } })
  if (existing) return prisma.company.update({ where: { id: existing.id }, data: item })
  return prisma.company.create({ data: item })
}

async function upsertJob(item, companyMap) {
  const company = companyMap.get(item.company)
  const data = {
    companyId: company?.id,
    companyName: company?.name || item.company,
    title: item.title,
    city: item.city,
    salaryRange: item.salaryRange,
    educationRequirement: item.educationRequirement,
    ageRequirement: item.ageRequirement,
    experienceRequirement: item.experienceRequirement,
    jobCategory: item.jobCategory,
    skillKeywords: item.skillKeywords,
    mustHave: item.mustHave,
    niceToHave: item.niceToHave,
    exclusions: item.exclusions,
    jdRaw: item.jdRaw,
    status: item.status,
    tags: item.tags,
    source: item.source,
  }
  const existing = await prisma.job.findFirst({
    where: { companyName: data.companyName, title: data.title },
  })
  if (existing) return prisma.job.update({ where: { id: existing.id }, data })
  return prisma.job.create({ data })
}

async function upsertCandidate(item) {
  const existing = await prisma.candidate.findFirst({ where: { phone: item.phone } })
  if (existing) return prisma.candidate.update({ where: { id: existing.id }, data: item })
  return prisma.candidate.create({ data: item })
}

async function main() {
  const companyRows = await Promise.all(companies.map(upsertCompany))
  const companyMap = new Map(companyRows.map((company) => [company.name, company]))
  const jobRows = []
  for (const item of jobs) jobRows.push(await upsertJob(item, companyMap))
  const candidateRows = []
  for (const item of candidates) candidateRows.push(await upsertCandidate(item))

  const matchCandidates = candidateRows.filter((candidate) => candidate.name !== '何敏')
  for (const candidate of matchCandidates) {
    const ranked = jobRows
      .map((job) => ({ job, result: score(candidate, job) }))
      .sort((a, b) => b.result.score - a.result.score)
      .slice(0, 2)
    for (const { job, result } of ranked) {
      await prisma.match.upsert({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
        create: {
          candidateId: candidate.id,
          jobId: job.id,
          score: result.score,
          reasons: JSON.stringify(result.reasons),
          gaps: JSON.stringify(result.gaps),
          suggestion: result.suggestion,
          status: result.score >= 80 ? '已生成' : '已拒绝',
        },
        update: {
          score: result.score,
          reasons: JSON.stringify(result.reasons),
          gaps: JSON.stringify(result.gaps),
          suggestion: result.suggestion,
          status: result.score >= 80 ? '已生成' : '已拒绝',
        },
      })
    }
  }

  console.log(
    `Seed complete: ${companyRows.length} companies, ${jobRows.length} jobs, ${candidateRows.length} candidates.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
