import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const connectionString = `${process.env.DATABASE_URL}`

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient
}

export const prisma = globalForPrisma.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma
}
