import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/* ── PostgreSQL 无需 WAL 模式优化 ──
   PostgreSQL 原生支持并发读写，无需额外配置 */
export async function ensureWAL() {
  // PostgreSQL 无需 WAL 配置，保留函数签名以保持调用兼容
}
