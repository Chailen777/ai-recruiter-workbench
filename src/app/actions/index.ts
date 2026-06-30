/**
 * 统一导出入口 — 供全项目 import '@/app/actions' 使用
 * 内部按职责拆分为 company / job / candidate / match / resource 子模块
 */
export * from './company'
export * from './job'
export * from './candidate'
export * from './match'
export * from './resource'
export * from './contacts'
export * from './projects'
export * from './notes'

// dashboard action (保持原位)
export { getDashboardStats } from './dashboard'
