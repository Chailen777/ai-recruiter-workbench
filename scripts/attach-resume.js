/**
 * 将陈成PDF简历添加为人才库 ID#18 的附件
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const CANDIDATE_ID = 18;
const PDF_SOURCE = 'F:\\00 陈成\\陈成简历2026年.pdf';
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

async function main() {
  // 1. 复制 PDF 到 uploads 目录
  const timestamp = Date.now();
  const safeName = '陈成简历2026年.pdf';
  const filename = `${timestamp}-${safeName}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  const pdfBuffer = fs.readFileSync(PDF_SOURCE);
  fs.writeFileSync(destPath, pdfBuffer);
  
  const stats = fs.statSync(destPath);
  const publicPath = `/uploads/${filename}`;
  
  console.log(`📄 PDF 已复制: ${publicPath} (${(stats.size / 1024).toFixed(1)} KB)`);

  // 2. 构建附件信息
  const attachment = {
    name: '陈成简历2026年.pdf',
    path: publicPath,
    size: stats.size,
    type: 'application/pdf',
  };

  // 3. 查询当前附件
  const existing = await prisma.candidate.findUnique({
    where: { id: CANDIDATE_ID },
    select: { attachments: true }
  });

  let currentAttachments = [];
  if (existing?.attachments) {
    try {
      currentAttachments = JSON.parse(existing.attachments);
    } catch {}
  }

  // 检查是否已存在同名附件，有则替换
  currentAttachments = currentAttachments.filter(
    att => !att.name.includes('陈成简历')
  );
  currentAttachments.push(attachment);

  const newAttachmentsJson = JSON.stringify(currentAttachments);

  // 4. 更新数据库
  await prisma.candidate.update({
    where: { id: CANDIDATE_ID },
    data: { attachments: newAttachmentsJson }
  });

  console.log(`✅ 附件已关联到人才 ID#18`);
  console.log(`   附件数: ${currentAttachments.length}`);
  currentAttachments.forEach((att, i) => {
    console.log(`   [${i+1}] ${att.name} (${(att.size / 1024).toFixed(1)} KB) → ${att.path}`);
  });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ 失败:', e);
  process.exit(1);
});
