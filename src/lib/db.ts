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

// Cache de instancia únicamente en entorno de desarrollo local (Node.js HMR).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder"

  // En desarrollo local (Node.js), reutilizar la instancia en globalThis para evitar agotar conexiones durante HMR
  if (process.env.NODE_ENV === "development") {
    if (!globalForPrisma.prisma) {
      const pool = new Pool({ connectionString: databaseUrl })
      const adapter = new PrismaNeon(pool)
      globalForPrisma.prisma = new PrismaClient({ adapter })
    }
    return globalForPrisma.prisma
  }

  // En producción (Cloudflare Workers), instanciar un nuevo Pool y PrismaClient por cada llamada/solicitud.
  // Esto previene de forma definitiva el error "Cannot perform I/O on behalf of a different request" de Workers.
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}

// Proxy que resuelve el PrismaClient en el momento de la llamada,
// garantizando que use la URL y el contexto de solicitud correctos.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = (client as any)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})

