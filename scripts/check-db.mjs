import { PrismaClient } from '@prisma/client'

const p = new PrismaClient({
  datasources: {
    db: {
      url: 'file:F:/workbuddy/2026-06-26-17-04-59/AI超级猎头工作台 V1/prisma/dev.db',
    },
  },
})

try {
  const columns = await p.$queryRawUnsafe('PRAGMA table_info(Job)')
  console.log('Job columns:', columns)
  const companyCount = await p.company.count()
  console.log('Companies:', companyCount)
} catch (e) {
  console.error(e)
} finally {
  await p.$disconnect()
}
