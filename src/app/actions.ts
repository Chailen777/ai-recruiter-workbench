/**
 * @deprecated 请直接从 '@/app/actions' 目录模块导入
 * 此文件保留为向后兼容的 re-export barrel，不应再直接编辑
 *
 * 源码已拆分为：
 *   src/app/actions/company.ts    — 企业 CRUD
 *   src/app/actions/job.ts        — 岗位 CRUD
 *   src/app/actions/candidate.ts  — 候选人 CRUD
 *   src/app/actions/match.ts      — 匹配推荐/忽略
 *   src/app/actions/resource.ts   — 知识/学校/图表/信息 CRUD
 *   src/app/actions/dashboard.ts  — 仪表盘统计
 */
export * from './actions/index'
