# AI Agent 数据访问指南

## 架构说明

```
用户在网站操作
      │
      ▼
SQLite 数据库 (主数据源)
      │
      ▼ 自动触发
data/ 目录 (Markdown 镜像)
      │
      ├─── 直接文件访问  →  AI Agent / RAG 系统 / 本地工具
      └─── HTTP API 访问 →  远程 Agent / MCP / Dify / FastGPT
```

## Markdown 文件目录

```
data/
├── companies/     企业库  (0001-腾讯.md, 0002-字节跳动.md, ...)
├── jobs/          岗位库
├── candidates/    人才库
├── knowledge/     知识库
├── schools/       学校库
├── charts/        图表库
├── info/          信息库
└── matches/       匹配库
```

每个文件包含 YAML Frontmatter（便于程序解析）+ Markdown 正文（便于 LLM 阅读）

## HTTP API 访问

### 获取所有库的状态
```
GET /api/agent
```

### 列出某个库的所有记录
```
GET /api/agent/companies
GET /api/agent/jobs
GET /api/agent/candidates
GET /api/agent/knowledge
GET /api/agent/schools
GET /api/agent/charts
GET /api/agent/info
GET /api/agent/matches
```

### 获取单条记录（Markdown 格式，默认）
```
GET /api/agent/companies/1
```

### 获取单条记录（JSON 格式，适合程序解析）
```
GET /api/agent/companies/1?format=json
```

## 全量同步（历史数据）

首次启用时，将现有数据库全部导出为 Markdown：

```bash
curl -X POST http://localhost:3000/api/sync-md
# 或直接访问：
# GET http://localhost:3000/api/sync-md
```

## 对接 AI Agent 示例

### 使用 Fetch 读取企业库
```javascript
const res = await fetch('http://localhost:3000/api/agent/companies')
const { files } = await res.json()

// 逐个读取内容
for (const file of files) {
  const md = await fetch(`http://localhost:3000${file.path}`).then(r => r.text())
  // 将 md 内容喂给 LLM...
}
```

### 直接读文件（本地 Agent）
```python
import os

DATA_DIR = "./data"

def read_all_companies():
    files = os.listdir(f"{DATA_DIR}/companies")
    for f in sorted(files):
        with open(f"{DATA_DIR}/companies/{f}", encoding="utf-8") as fp:
            content = fp.read()
            # 喂给 RAG / embedding...
```

### 使用 MCP / Dify
在 Dify 知识库或 MCP 工具配置中，将 `data/` 目录配置为知识源，即可实现实时同步的 RAG 问答。

## 数据同步时机

| 操作 | 触发时机 |
|------|---------|
| 新建记录 | `create*` action 执行后立即写入 .md |
| 编辑记录 | `update*` action 执行后立即覆盖 .md |
| 删除记录 | `delete*` action 执行后立即删除 .md |
| 历史数据 | 手动调用 `POST /api/sync-md` 一次性导出 |

## 文件格式示例

### 企业（companies/0001-腾讯.md）
```markdown
---
id: 1
type: "company"
name: "腾讯"
industry: "互联网"
city: "深圳"
cooperationStatus: "合作中"
link: "https://www.tencent.com"
createdAt: "2026-06-27"
updatedAt: "2026-06-27"
---

# 腾讯

## 基本信息
- **行业**: 互联网
- **城市**: 深圳
...
```

### 匹配报告（matches/0001-张三-高级前端工程师.md）
```markdown
---
id: 1
type: "match"
candidate: "张三"
job: "高级前端工程师"
company: "腾讯"
score: 85
status: "已推荐"
---

# 匹配报告：张三 × 高级前端工程师

## 匹配概览
| 项目 | 内容 |
...
```
