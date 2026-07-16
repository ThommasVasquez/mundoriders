import { PrismaClient } from "@prisma/client"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"

// Enable WebSocket connection fallback for Node.js (only in non-edge environments)
if (process.env.NEXT_RUNTIME !== "edge") {
  const ws = require("ws")
  neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaClient: PrismaClient
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. PrismaClient initialized with fallback (will throw on queries).")
  prismaClient = new PrismaClient()
} else {
  if (process.env.NODE_ENV === "production") {
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaNeon(pool)
    prismaClient = new PrismaClient({ adapter })
  } else {
    if (!globalForPrisma.prisma) {
      const pool = new Pool({ connectionString: databaseUrl })
      const adapter = new PrismaNeon(pool)
      globalForPrisma.prisma = new PrismaClient({ adapter })
    }
    prismaClient = globalForPrisma.prisma
  }
}

export const prisma = prismaClient
