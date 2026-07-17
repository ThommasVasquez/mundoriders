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

// Cache de instancias separadas: una real (con URL real) y una dummy (para build-time).
let prismaRealInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  // Si tenemos URL real, usar la instancia cacheada (o crearla)
  if (databaseUrl && !databaseUrl.includes("placeholder")) {
    if (!prismaRealInstance) {
      const pool = new Pool({ connectionString: databaseUrl })
      const adapter = new PrismaNeon(pool)
      prismaRealInstance = new PrismaClient({ adapter })
    }
    return prismaRealInstance
  }

  // Sin URL real (build-time / module eval sin env vars):
  // Creamos una instancia dummy nueva cada vez — nunca se usará para queries reales.
  // Esto evita que el módulo crashee durante la compilación.
  const placeholderUrl = "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  const pool = new Pool({ connectionString: placeholderUrl })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}

// Proxy que resuelve el PrismaClient real en el momento de la llamada,
// garantizando que siempre use la URL de entorno correcta en runtime.
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
