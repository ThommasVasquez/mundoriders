import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Endpoint de diagnóstico básico — seguro para producción
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
      stack: e?.stack?.split("\n").slice(0, 8) ?? [],
    }
  }


  // Test 2: posts query simulation
  try {
    const userId = "87f2b92b-5a3c-437e-96dc-2275d88c7cf1"
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: { in: followingIds } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            motos: {
              select: { id: true }
            }
          }
        }
      },
      take: 1
    })
    result.postsQuery = {
      ok: true,
      followingCount: followingIds.length,
      postsCount: posts.length,
    }
  } catch (e: any) {
    result.postsQuery = {
      ok: false,
      error: e?.message ?? String(e),
      stack: e?.stack?.split("\n").slice(0, 3) || []
    }
  }

  // Test 3: conversations query simulation
  try {
    const userId = "87f2b92b-5a3c-437e-96dc-2275d88c7cf1"
    const participantConvs = await prisma.conversationParticipant.findMany({
      where: { userId: userId },
      select: { conversationId: true },
    })
    const conversationIds = participantConvs.map((pc) => pc.conversationId)
    result.convsQuery = {
      ok: true,
      convsCount: conversationIds.length,
    }
  } catch (e: any) {
    result.convsQuery = {
      ok: false,
      error: e?.message ?? String(e),
      stack: e?.stack?.split("\n").slice(0, 3) || []
    }
  }

  // Test 4: prisma
  try {
    const count = await prisma.user.count()
    result.db = { 
      ok: true, 
      userCount: count,
    }
  } catch (e: any) {
    result.db = {
      ok: false,
      error: e?.message ?? String(e),
    }
  }

  return NextResponse.json(result)
}
