import { PrismaClient } from "@prisma/client"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { AsyncLocalStorage } from "node:async_hooks"

// Cloudflare Workers tiene WebSocket nativo — no necesita el paquete ws.
// En Node.js local (dev), WebSocket no existe nativamente, así que lo cargamos.
if (typeof globalThis.WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require("ws")
    neonConfig.webSocketConstructor = ws
  } catch {
    // En CF Workers con nodejs_compat, require de paquetes npm no aplica.
  }
}

// Cache de instancia únicamente en entorno de desarrollo local (Node.js HMR).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Almacenamiento desacoplado por solicitud (AsyncLocalStorage) para producción.
// Esto permite que todas las consultas dentro de una misma solicitud compartan
// la misma conexión WebSocket de Neon, pero evita compartir sockets entre solicitudes distintas.
const requestPrismaStore = new AsyncLocalStorage<PrismaClient>()

export function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder"

  // En desarrollo local (Node.js), reutilizar la instancia en globalThis
  if (process.env.NODE_ENV === "development") {
    if (!globalForPrisma.prisma) {
      const pool = new Pool({ connectionString: databaseUrl })
      const adapter = new PrismaNeon(pool)
      globalForPrisma.prisma = new PrismaClient({ adapter })
    }
    return globalForPrisma.prisma
  }

  // 1. Si ya existe un cliente en el contexto de la solicitud actual, reutilizarlo
  const currentClient = requestPrismaStore.getStore()
  if (currentClient) {
    return currentClient
  }

  // 2. Si es la primera consulta de esta solicitud, crear la conexión e introducirla al contexto
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaNeon(pool)
  const client = new PrismaClient({ adapter })

  try {
    requestPrismaStore.enterWith(client)
  } catch {
    // Fallback si enterWith no estuviera disponible
  }

  return client
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

