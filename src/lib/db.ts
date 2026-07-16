import { PrismaClient } from "@prisma/client"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"

// Cloudflare Workers tiene WebSocket nativo — no necesita el paquete ws.
// En Node.js local (dev), WebSocket no existe nativamente, así que lo cargamos.
if (typeof globalThis.WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require("ws")
    neonConfig.webSocketConstructor = ws
  } catch {
    // En CF Workers con nodejs_compat, require de paquetes npm no aplica.
    // Si llegamos aquí es CF Workers y el WebSocket nativo se usa automáticamente.
  }
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
