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

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    // Phase of build or initial module loading when env vars are not bound yet
    const placeholderUrl = "postgresql://placeholder_user:placeholder_password@localhost:5432/placeholder_db"
    const pool = new Pool({ connectionString: placeholderUrl })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaNeon(pool)
  prismaInstance = new PrismaClient({ adapter })
  return prismaInstance
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop)
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  }
})
