/**
 * 导入陈成简历到人才库
 * 
 * 执行: node scripts/import-candidate.js
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// MD 文件基础目录
const DATA_DIR = path.join(__dirname, '..', 'data', 'candidates');

// 确保目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getCandidateMdPath(id) {
  const paddedId = String(id).padStart(4, '0');
  return path.join(DATA_DIR, `${paddedId}-陈成.md`);
}

function generateCandidateMd(candidate) {
  const lines = [];
  lines.push('---');
  lines.push(`id: ${candidate.id}`);
  lines.push(`name: "${candidate.name}"`);
  lines.push(`gender: "${candidate.gender || ''}"`);
  lines.push(`phone: "${candidate.phone || ''}"`);
  lines.push(`city: "${candidate.city || ''}"`);
  lines.push(`currentTitle: "${candidate.currentTitle || ''}"`);
  lines.push(`currentCompany: "${candidate.currentCompany || ''}"`);
  lines.push(`education: "${candidate.education || ''}"`);
  lines.push(`age: ${candidate.age || 0}`);
  lines.push(`yearsOfWork: ${candidate.yearsOfWork || 0}`);
  lines.push(`desiredPosition: "${candidate.desiredPosition || ''}"`);
  lines.push(`jobSearchStatus: "${candidate.jobSearchStatus || ''}"`);
  lines.push(`status: "${candidate.status || ''}"`);
  lines.push(`type: candidate`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${candidate.name}`);
  lines.push('');
  lines.push('## 基本信息');
  lines.push('');
  lines.push(`- **性别**：${candidate.gender || '-'}`);
  lines.push(`- **年龄**：${candidate.age || '-'} 岁`);
  lines.push(`- **手机**：${candidate.phone || '-'}`);
  lines.push(`- **所在城市**：${candidate.city || '-'}`);
  lines.push(`- **工作经验**：${candidate.yearsOfWork || '-'} 年`);
  lines.push(`- **当前职位**：${candidate.currentTitle || '-'}`);
  lines.push(`- **当前公司**：${candidate.currentCompany || '-'}`);
  lines.push('');
  lines.push('## 求职意向');
  lines.push('');
  lines.push(`- **期望职位**：${candidate.desiredPosition || '-'}`);
  lines.push(`- **期望薪资**：${candidate.expectedSalary || '面议'}`);
  lines.push(`- **求职状态**：${candidate.jobSearchStatus || '待确认'}`);
  lines.push('');
  if (candidate.skillTags) {
    lines.push('## 技能标签');
    lines.push('');
    lines.push(candidate.skillTags.split(',').map(s => `- ${s.trim()}`).join('\n'));
    lines.push('');
  }
  if (candidate.education) {
    lines.push('## 教育背景');
    lines.push('');
    lines.push(`- **学校**：${candidate.schoolName || '-'}`);
    lines.push(`- **学历**：${candidate.education || '-'}`);
    lines.push(`- **专业**：${candidate.major || '-'}`);
    if (candidate.educationDetail) {
      lines.push('');
      lines.push(candidate.educationDetail);
    }
    lines.push('');
  }
  if (candidate.selfIntro) {
    lines.push('## 个人优势');
    lines.push('');
    lines.push(candidate.selfIntro);
    lines.push('');
  }
  if (candidate.workExperience) {
    lines.push('## 工作经历');
    lines.push('');
    lines.push(candidate.workExperience);
    lines.push('');
  }
  if (candidate.strengths) {
    lines.push('## 核心能力');
    lines.push('');
    lines.push(candidate.strengths);
    lines.push('');
  }
  if (candidate.otherAbilities) {
    lines.push('## 其他能力');
    lines.push('');
    lines.push(candidate.otherAbilities);
    lines.push('');
  }
  if (candidate.note) {
    lines.push('## 备注');
    lines.push('');
    lines.push(candidate.note);
  }
  return lines.join('\n');
}

async function main() {
  // 检查是否已存在
  const existing = await prisma.candidate.findFirst({
    where: { name: '陈成', phone: '13265478879' }
  });

  if (existing) {
    console.log(`⚠️ 陈成已存在 (ID: ${existing.id})，将更新记录...`);
    
    const candidate = await prisma.candidate.update({
      where: { id: existing.id },
      data: {
        name: '陈成',
        gender: '男',
        phone: '13265478879',
        currentTitle: '门店资深经理管理',
        currentCompany: '深圳华辉升人力资源有限公司',
        city: '深圳',
        schoolName: '湖北咸宁高级技工学校',
        schoolType: '中专/中技',
        major: '机械设计制造及其自动化',
        education: '中专',
        age: 39,
        yearsOfWork: 19,
        jobSearchStatus: '积极看机会',
        desiredPosition: '人力资源部经理',
        expectedSalary: '面议',
        skillTags: '销售运营,公众演讲,RPA机器人自动化,新媒体全链路运营,PS,AI,CorelDRAW,团队管理,社群运营,流程搭建,跨部门协调',
        industryBg: '人力资源,互联网/智能科技,珠宝,零售,广告',
        selfIntro: '热爱销售运营工作，具备公众演讲、创新思维能力，心理素质沉稳抗压，拥有极强的客户服务意识与共情能力。工作主动性强、执行力高，擅长团队协作、跨部门沟通协调、活动组织统筹及市场渠道开拓，能快速打开业务局面。目标导向清晰，敢于承接高难度挑战，以高业绩、高产出为核心追求。',
        resumeRaw: '19年工作经验，从设计基层到合伙人/CEO，经历人力资源、互联网科技、珠宝、零售、广告等多行业。最近担任深圳华辉升人力资源有限公司门店资深经理，带领12人新媒体团队及10人RPA项目团队，落地40台运营机器人，超90%平台账号进入行业TOP100，客资成本从5元/个降至2元/个。',
        strengths: '公众演讲与创新思维 | 团队管理与跨部门协调 | 目标导向与结果驱动 | 精通RPA机器人自动化运营 | 新媒体全链路运营(账号搭建→拉新→促活→转化→裂变) | 设计能力(PS/AI/CorelDRAW)',
        workExperience: '【深圳华辉升人力资源有限公司 | 门店资深经理】(2025.07-2026.03)\n数字运营部负责人，管理12人新媒体团队及10人RPA项目团队，落地40台运营机器人，搭建自动化招聘运营体系。核心业绩：超90%平台账号进入行业TOP100；客资成本从5元/个降至2元/个。\n\n【深圳福恋智能信息科技有限公司 | CEO及合伙人】(2019.07-2022.02)\n从零搭建社群运营体系，主导社群APP项目立项研发上线，协助完成6项社群领域发明专利申报，从社群主管晋升至公司CEO。\n\n【上海花满亭珠宝有限公司 | 设计管理】(2015.05-2017.07)\n珠宝行业市场调研与产品运营。\n\n【上海毅旺实业有限公司 | 招商主管】(2010.10-2013.07)\n招商区域市场调研，带领团队完成招商指标。\n\n【上海标冠广告有限公司 | 设计主管】(2006.03-2007.07)\n平面设计、广告喷绘等设计与制作。',
        educationDetail: '湖北咸宁高级技工学校 | 中专/中技 | 机械设计制造及其自动化 (2003-2006)\n系统学习力学、机械学、电工与电子技术、机械工程材料、机械设计、机械制造基础、自动化基础、市场经济及企业管理等专业知识。',
        otherAbilities: 'RPA软件机器人自动化全流程实战 | 新媒体从账号搭建到商业变现全链路 | PS/AI/CorelDRAW设计软件 | 社群运营体系搭建 | 技术专利撰写(6项)',
        tags: '高管,CEO经历,RPA自动化,新媒体运营,人力资源,管理经验丰富',
        note: '邮箱:709772502@qq.com | 期望城市:深圳 | 有CEO/合伙人经历，管理经验丰富，适合高管或管理层岗位',
        status: '新建',
        communication: '待跟进',
      }
    });

    // 同步 MD 文件
    const mdContent = generateCandidateMd(candidate);
    const mdPath = getCandidateMdPath(candidate.id);
    fs.writeFileSync(mdPath, mdContent, 'utf-8');
    
    console.log(`✅ 已更新陈成记录 (ID: ${candidate.id})`);
    console.log(`📄 MD 文件: ${mdPath}`);
  } else {
    const candidate = await prisma.candidate.create({
      data: {
        name: '陈成',
        gender: '男',
        phone: '13265478879',
        currentTitle: '门店资深经理管理',
        currentCompany: '深圳华辉升人力资源有限公司',
        city: '深圳',
        schoolName: '湖北咸宁高级技工学校',
        schoolType: '中专/中技',
        major: '机械设计制造及其自动化',
        education: '中专',
        age: 39,
        yearsOfWork: 19,
        jobSearchStatus: '积极看机会',
        desiredPosition: '人力资源部经理',
        expectedSalary: '面议',
        skillTags: '销售运营,公众演讲,RPA机器人自动化,新媒体全链路运营,PS,AI,CorelDRAW,团队管理,社群运营,流程搭建,跨部门协调',
        industryBg: '人力资源,互联网/智能科技,珠宝,零售,广告',
        selfIntro: '热爱销售运营工作，具备公众演讲、创新思维能力，心理素质沉稳抗压，拥有极强的客户服务意识与共情能力。工作主动性强、执行力高，擅长团队协作、跨部门沟通协调、活动组织统筹及市场渠道开拓，能快速打开业务局面。目标导向清晰，敢于承接高难度挑战，以高业绩、高产出为核心追求。',
        resumeRaw: '19年工作经验，从设计基层到合伙人/CEO，经历人力资源、互联网科技、珠宝、零售、广告等多行业。最近担任深圳华辉升人力资源有限公司门店资深经理，带领12人新媒体团队及10人RPA项目团队，落地40台运营机器人，超90%平台账号进入行业TOP100，客资成本从5元/个降至2元/个。',
        strengths: '公众演讲与创新思维 | 团队管理与跨部门协调 | 目标导向与结果驱动 | 精通RPA机器人自动化运营 | 新媒体全链路运营(账号搭建→拉新→促活→转化→裂变) | 设计能力(PS/AI/CorelDRAW)',
        workExperience: '【深圳华辉升人力资源有限公司 | 门店资深经理】(2025.07-2026.03)\n数字运营部负责人，管理12人新媒体团队及10人RPA项目团队，落地40台运营机器人，搭建自动化招聘运营体系。核心业绩：超90%平台账号进入行业TOP100；客资成本从5元/个降至2元/个。\n\n【深圳福恋智能信息科技有限公司 | CEO及合伙人】(2019.07-2022.02)\n从零搭建社群运营体系，主导社群APP项目立项研发上线，协助完成6项社群领域发明专利申报，从社群主管晋升至公司CEO。\n\n【上海花满亭珠宝有限公司 | 设计管理】(2015.05-2017.07)\n珠宝行业市场调研与产品运营。\n\n【上海毅旺实业有限公司 | 招商主管】(2010.10-2013.07)\n招商区域市场调研，带领团队完成招商指标。\n\n【上海标冠广告有限公司 | 设计主管】(2006.03-2007.07)\n平面设计、广告喷绘等设计与制作。',
        educationDetail: '湖北咸宁高级技工学校 | 中专/中技 | 机械设计制造及其自动化 (2003-2006)\n系统学习力学、机械学、电工与电子技术、机械工程材料、机械设计、机械制造基础、自动化基础、市场经济及企业管理等专业知识。',
        otherAbilities: 'RPA软件机器人自动化全流程实战 | 新媒体从账号搭建到商业变现全链路 | PS/AI/CorelDRAW设计软件 | 社群运营体系搭建 | 技术专利撰写(6项)',
        tags: '高管,CEO经历,RPA自动化,新媒体运营,人力资源,管理经验丰富',
        note: '邮箱:709772502@qq.com | 期望城市:深圳 | 有CEO/合伙人经历，管理经验丰富，适合高管或管理层岗位',
        status: '新建',
        communication: '待跟进',
      }
    });

    // 同步 MD 文件
    const mdContent = generateCandidateMd(candidate);
    const mdPath = getCandidateMdPath(candidate.id);
    fs.writeFileSync(mdPath, mdContent, 'utf-8');
    
    console.log(`✅ 已新增陈成记录 (ID: ${candidate.id})`);
    console.log(`📄 MD 文件: ${mdPath}`);
  }

  // 验证
  const saved = await prisma.candidate.findFirst({
    where: { name: '陈成', phone: '13265478879' }
  });
  console.log(`\n📊 验证结果:`);
  console.log(`   ID: ${saved.id}`);
  console.log(`   姓名: ${saved.name}`);
  console.log(`   性别: ${saved.gender}`);
  console.log(`   年龄: ${saved.age}`);
  console.log(`   工作经验: ${saved.yearsOfWork}年`);
  console.log(`   当前职位: ${saved.currentTitle}`);
  console.log(`   当前公司: ${saved.currentCompany}`);
  console.log(`   期望职位: ${saved.desiredPosition}`);
  console.log(`   城市: ${saved.city}`);
  console.log(`   标签: ${saved.tags}`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ 导入失败:', e);
  process.exit(1);
});
