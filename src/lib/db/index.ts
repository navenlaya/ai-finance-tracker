import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=20',
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})

process.on('SIGINT', async () => {
  await db.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await db.$disconnect()
  process.exit(0)
})
