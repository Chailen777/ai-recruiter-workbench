# Vercel 部署指南 - AI超级猎头工作台 V1

## 部署步骤

### 1. 推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
cd "F:\workbuddy\2026-06-26-17-04-59\AI超级猎头工作台 V1"
git init
git add .
git commit -m "准备 Vercel 部署"

# 创建 GitHub 仓库并推送
# 1. 访问 https://github.com/new 创建新仓库（不要初始化 README）
# 2. 推送代码
git remote add origin https://github.com/你的用户名/ai-recruiter-workbench.git
git push -u origin main
```

### 2. 在 Vercel 上部署

1. 访问 https://vercel.com 并登录（用 GitHub 账号登录）
2. 点击 "New Project"
3. 选择刚才推送的 GitHub 仓库
4. 配置项目：
   - Framework Preset: Next.js
   - Root Directory: `.` (默认)
   - Build Command: `npm run build` (默认)
   - Output Directory: `.next` (默认)

### 3. 配置环境变量

在 Vercel 的项目设置中，添加以下环境变量：

```
DATABASE_URL=postgresql://neondb_owner:npg_feFZxVQq0Jz3@ep-blue-breeze-ao164a27-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

⚠️ **重要**：
- 确保 Neon 数据库已激活（访问 Neon 控制台唤醒数据库）
- 如果数据库暂停了，Vercel 部署时会失败

### 4. 部署

点击 "Deploy" 按钮，等待部署完成（通常 2-3 分钟）

## 常见问题

### Q: 部署失败，提示数据库连接错误？
A: 确保 Neon 数据库已激活。访问 Neon 控制台，手动唤醒数据库。

### Q: 部署成功后无法访问？
A: 检查 Vercel 部署日志，查看是否有运行时错误。

### Q: 数据丢失？
A: Neon 数据库是独立的，只要 DATABASE_URL 正确，数据就不会丢失。

## 项目信息

- 项目名称: AI超级猎头工作台 V1
- 技术栈: Next.js 15 + TypeScript + Prisma + PostgreSQL (Neon)
- 构建状态: ✅ 成功
- 所有页面: 动态渲染（避免构建时数据库访问）

## 下一步

部署成功后：
1. 访问 Vercel 提供的网址（通常是 https://项目名.vercel.app）
2. 测试所有功能
3. 配置自定义域名（可选）
