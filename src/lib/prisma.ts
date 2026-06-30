import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

/** 构建带连接池参数的 datasource URL */
function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is not set')
  // 如果已含 connection_limit 则跳过
  if (base.includes('connection_limit')) return base
  const sep = base.includes('?') ? '&' : '?'
  // Neon serverless 连接池限制，防止 22+ 并行查询击穿连接池
  return `${base}${sep}connection_limit=5&pool_timeout=30`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn'],
    datasourceUrl: buildDatasourceUrl(),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/* ── PostgreSQL 无需 WAL 模式优化 ── */
export async function ensureWAL() {
  // PostgreSQL 无需 WAL 配置，保留函数签名以保持调用兼容
}
