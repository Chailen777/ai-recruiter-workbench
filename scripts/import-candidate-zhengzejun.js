/**
 * 导入候选人：郑泽俊
 * 来源：科锐道通智能销售运营总监深圳郑泽俊.pdf
 */
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

const prisma = new PrismaClient();

// MD 同步函数（与 src/lib/markdown.ts 保持一致）
function toMdVal(val) {
  if (val == null || val === '') return '';
  return String(val).replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function optionalField(key, val) {
  if (val == null || val === '') return '';
  return `${key}: "${toMdVal(val)}"\n`;
}

function optionalList(key, val) {
  if (!val) return '';
  const items = typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : val;
  if (!items.length) return '';
  return `${key}:\n${items.map(v => `  - "${toMdVal(v)}"`).join('\n')}\n`;
}

function sectionLines(key, val) {
  if (!val) return [];
  const lines = typeof val === 'string' ? val.split('\n').filter(Boolean) : [val];
  return [`\n## ${key}\n`, ...lines.map(l => `${l}\n`)];
}

function writeCandidateMd(candidate) {
  const id = String(candidate.id).padStart(4, '0');
  const safeName = candidate.name.replace(/[\\/:*?"<>|]/g, '-');
  const filePath = path.join(__dirname, '..', 'data', 'candidates', `${id}-${safeName}.md`);

  const lines = [
    '---\n',
    `id: "${candidate.id}"\n`,
    `type: "candidate"\n`,
    `name: "${toMdVal(candidate.name)}"\n`,
    optionalField('gender', candidate.gender),
    optionalField('phone', candidate.phone),
    optionalField('age', candidate.age),
    optionalField('currentTitle', candidate.currentTitle),
    optionalField('currentCompany', candidate.currentCompany),
    optionalField('city', candidate.city),
    optionalField('education', candidate.education),
    optionalField('schoolName', candidate.schoolName),
    optionalField('major', candidate.major),
    optionalField('yearsOfWork', candidate.yearsOfWork),
    optionalField('desiredPosition', candidate.desiredPosition),
    optionalField('expectedSalary', candidate.expectedSalary),
    optionalField('jobSearchStatus', candidate.jobSearchStatus),
    optionalList('skillTags', candidate.skillTags),
    optionalField('industryBg', candidate.industryBg),
    optionalField('languages', candidate.languages),
    optionalField('status', candidate.status),
    optionalField('communication', candidate.communication),
    optionalList('tags', candidate.tags),
    optionalField('link', candidate.link),
    '---\n',
    '\n',
    `# ${candidate.name}\n`,
    '\n',
    `**${candidate.currentTitle || '未知职位'}** | ${candidate.currentCompany || '未知公司'} | ${candidate.city || '未知城市'}\n`,
    '\n',
  ];

  if (candidate.skillTags) {
    const tags = typeof candidate.skillTags === 'string'
      ? candidate.skillTags.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (tags.length) {
      lines.push(`## 技能标签\n\n${tags.map(t => `- ${t}`).join('\n')}\n\n`);
    }
  }

  if (candidate.selfIntro) lines.push(...sectionLines('自我介绍', candidate.selfIntro));
  if (candidate.strengths) lines.push(...sectionLines('核心优势', candidate.strengths));
  if (candidate.workExperience) lines.push(...sectionLines('工作经历', candidate.workExperience));
  if (candidate.educationDetail) lines.push(...sectionLines('教育经历', candidate.educationDetail));
  if (candidate.projects) lines.push(...sectionLines('项目经验', candidate.projects));
  if (candidate.awards) lines.push(...sectionLines('获奖荣誉', candidate.awards));
  if (candidate.certificates) lines.push(...sectionLines('证书资质', candidate.certificates));
  if (candidate.languages) lines.push(...sectionLines('语言能力', candidate.languages));
  if (candidate.resumeRaw) lines.push(...sectionLines('简历原文', candidate.resumeRaw));
  if (candidate.note) lines.push(...sectionLines('备注', candidate.note));

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, lines.join(''), 'utf-8');
  console.log(`  MD已生成: ${filePath}`);
}

async function main() {
  // 复制PDF附件
  const srcPdf = 'D:/简历/科锐道通智能销售运营总监深圳郑泽俊.pdf';
  const pdfFilename = `郑泽俊-科锐道通智能销售运营总监.pdf`;
  const destPdf = path.join(UPLOADS_DIR, pdfFilename);
  
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.copyFileSync(srcPdf, destPdf);
  console.log(`PDF已复制: ${destPdf}`);

  const pdfStat = fs.statSync(destPdf);
  const attachments = [{
    name: '科锐道通智能销售运营总监深圳郑泽俊.pdf',
    path: `/uploads/${pdfFilename}`,
    size: pdfStat.size,
    type: 'application/pdf',
  }];

  const candidate = await prisma.candidate.create({
    data: {
      name: '郑泽俊',
      gender: '男',
      phone: '15814080097',
      currentTitle: '区域经理 & 大西雅图地区亚洲市场负责人',
      currentCompany: 'The Odom Corporation',
      city: '深圳',
      schoolName: '华盛顿州立大学卡森商学院',
      schoolType: '',
      major: '市场营销与国际商务方向',
      education: '硕士',
      age: null,
      yearsOfWork: 8,
      jobSearchStatus: '积极看机会',
      desiredPosition: '管理管培生',
      expectedSalary: '',
      skillTags: '中英粤三语流利,项目统筹,供应链整合与海外落地,客户开发与大客户关系维护,跨文化团队协作,区域销售管理,数据分析与SAS,销售预测建模,商务谈判与演讲,KA客户开发运营,从0到1业务搭建,流程优化,终端动销管理,团队管理与培训',
      industryBg: '快消品/酒水饮品分销,建材出口/国际贸易',
      selfIntro: '郑泽俊，男，美国国籍，中英粤三语流利。华盛顿州立大学MBA硕士（市场营销与国际商务方向），8年工作经验。具备美国多年工作经验，熟悉西方商业逻辑，擅长区域销售管理、大客户开发、跨文化团队协作及供应链整合。目标导向、结果驱动型业务能力，具备管理潜质。意向岗位：管理管培生，期望城市：广州/深圳/长沙。',
      resumeRaw: '',
      strengths: '- 中英粤三语流利，无障碍跨国沟通，美国多年工作经验，熟悉西方商业逻辑\n- 项目统筹、进度管控、风险把控，目标导向、结果驱动型业务能力\n- 供应链整合与海外落地执行，客户开发与大客户关系维护\n- 跨文化团队协作、国际业务对接，跨部门协同与资源协调\n- 具备管理潜质，适配管培生培养\n- 从0到1业务搭建，流程优化与效率提升\n- 终端动销与业绩增长操盘，KA客户开发运营\n- 数据分析与业务汇报，商务谈判与演讲能力',
      workExperience: `2019.09-2025.10 The Odom Corporation
区域经理 & 大西雅图地区亚洲市场负责人 | 快消品/酒水饮品分销
汇报销售总监，全面负责美国大西雅图区域的销售运营与团队管理，年度区域营业额超2000万美元
- 负责美国大西雅图区域整体销售运营与团队管理，统筹渠道开发、终端运营及客户维护，带领团队管理近1000家合作客户，实现月度营业额140-180万美元，区域业绩持续稳定增长，业绩同比上年增长10%-20%
- 具备极强市场前瞻性，主动向公司高层提出市场扩张策略并提前布局，成功切入大型连锁渠道，成为首批核心供应商
- 依托三语优势与商务演讲能力，拓展餐饮渠道资源，现场推介产品并促成数十家商户长期稳定合作
- 主导区域市场战略规划与细分市场运营，根据不同地域、文化、消费场景制定差异化产品选品与渠道策略
- 为公司超100人销售团队开展专业培训与实战分享，讲授销售技巧、市场布局、客户开发及战略思维
- 负责多家国际头部饮品品牌的区域运营、产品组合优化、终端动销提升与数据化管理

2019.05-2025.09 广州美居科技有限公司
联合创始人 | 建材出口/国际贸易
- 从0到1搭建海外销售体系，成功对接美国地产开发商及建筑商，推动首个海外预制房屋项目落地
- 整合国内外供应链资源，与国内核心生产商及美国本地合作伙伴建立战略合作，优化生产成本15%
- 统筹国际物流、报关及项目交付流程，确保项目按时交付率100%，奠定公司海外业务基础`,
      educationDetail: `华盛顿州立大学卡森商学院 MBA硕士（市场营销与国际商务方向） 2025.10 毕业
- 获市场营销研究生商业证书、国际商务研究生商业证书
- 熟练掌握：Excel高级应用、SAS数据分析、销售预测建模
- 持有证书：LinkedIn Learning 销售预测认证

华盛顿大学商学院 工商管理学士 2022.03 毕业
- 获2021年冬季入选院长荣誉名单（Dean's List）
- 持有证书：Bloomberg Market Concepts（BMC）认证`,
      languages: '中文（母语）,英语（流利）,粤语（流利）',
      certificates: 'LinkedIn Learning 销售预测认证,Bloomberg Market Concepts（BMC）认证,市场营销研究生商业证书,国际商务研究生商业证书',
      projects: '',
      awards: "2021年冬季入选院长荣誉名单（Dean's List）",
      otherAbilities: '',
      resumeFile: pdfFilename,
      link: '',
      attachments: JSON.stringify(attachments),
      avatar: null,
      communication: '待跟进',
      status: '新建',
      tags: '高管,海归,MBA,双语人才,管理管培生',
      note: '来源：科锐道通智能销售运营总监推荐。美国国籍，华盛顿州立大学MBA，8年工作经验，中英粤三语，熟悉西方商业逻辑。',
    },
  });

  console.log(`\n✅ 候选人已创建: ID=${candidate.id}, 姓名=${candidate.name}`);

  // 生成MD文件
  writeCandidateMd(candidate);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ 导入失败:', e.message || e);
  process.exit(1);
});
