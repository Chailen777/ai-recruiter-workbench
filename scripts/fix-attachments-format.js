/**
 * 修复候选人附件格式：将旧格式 string[] 转换为 AttachmentInfo[]
 */
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function fixAttachments(json) {
  if (!json) return '[]';
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return '[]';
    const fixed = raw.map(item => {
      if (typeof item === 'string') {
        // Old format: plain filename string
        const fullPath = path.join(UPLOAD_DIR, item);
        let size = 0, type = '';
        try {
          const stat = fs.statSync(fullPath);
          size = stat.size;
          if (item.endsWith('.pdf')) type = 'application/pdf';
          else if (item.endsWith('.doc') || item.endsWith('.docx')) type = 'application/msword';
        } catch {}
        return {
          name: item,
          path: `/uploads/${item}`,
          size,
          type,
        };
      }
      return item; // Already AttachmentInfo format
    });
    return JSON.stringify(fixed);
  } catch { return '[]'; }
}

async function main() {
  // Fix 郑泽俊 (ID 19)
  const zheng = await prisma.candidate.findUnique({ where: { id: 19 }, select: { attachments: true, name: true } });
  if (zheng?.attachments) {
    const newJson = fixAttachments(zheng.attachments);
    await prisma.candidate.update({
      where: { id: 19 },
      data: { attachments: newJson },
    });
    console.log(`✅ 郑泽俊(ID:19) 附件格式已修复`);
    console.log(`   ${newJson}`);
  } else {
    console.log(`⚠️ 郑泽俊(ID:19) 无附件，跳过`);
  }

  // Fix 陈成 (ID 18) — check if already correct format
  const chen = await prisma.candidate.findUnique({ where: { id: 18 }, select: { attachments: true, name: true } });
  if (chen?.attachments) {
    const fixed = fixAttachments(chen.attachments);
    await prisma.candidate.update({
      where: { id: 18 },
      data: { attachments: fixed },
    });
    console.log(`✅ 陈成(ID:18) 附件格式已校验`);
    console.log(`   ${fixed}`);
  }

  // Also scan ALL candidates for potential string[] format
  const all = await prisma.candidate.findMany({ select: { id: true, attachments: true, name: true } });
  for (const c of all) {
    if (!c.attachments) continue;
    try {
      const raw = JSON.parse(c.attachments);
      if (!Array.isArray(raw)) continue;
      const hasLegacy = raw.some(item => typeof item === 'string');
      if (hasLegacy) {
        const fixed = fixAttachments(c.attachments);
        await prisma.candidate.update({
          where: { id: c.id },
          data: { attachments: fixed },
        });
        console.log(`✅ ${c.name}(ID:${c.id}) 附件格式已修复`);
      }
    } catch {}
  }

  console.log('\n🎉 所有附件格式校验完成');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ 失败:', e.message || e);
  process.exit(1);
});
