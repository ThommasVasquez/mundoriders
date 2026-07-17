import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Endpoint de diagnóstico — solo para debugging en producción
// Retorna el estado del auth y de la DB sin crashear
export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
      nodeEnv: process.env.NODE_ENV,
    },
  }

  // Test 1: auth()
  try {
    const session = await auth()
    result.auth = {
      ok: true,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
    }
  } catch (e: any) {
    result.auth = {
      ok: false,
      error: e?.message ?? String(e),
      stack: e?.stack?.split("\n").slice(0, 5) ?? [],
    }
  }

  // Test 2: prisma simple query
  try {
    const count = await prisma.user.count()
    result.db = { ok: true, userCount: count }
  } catch (e: any) {
    result.db = {
      ok: false,
      error: e?.message ?? String(e),
      code: e?.code ?? null,
    }
  }

  return NextResponse.json(result)
}
