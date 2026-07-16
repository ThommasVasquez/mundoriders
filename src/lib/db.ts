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

// Standard fallback database URL to prevent crashes during static generation/builds
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder_user:placeholder_password@localhost:5432/placeholder_db"

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

export const prisma = prismaClient
