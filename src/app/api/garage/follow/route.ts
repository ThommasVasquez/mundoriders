
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get("targetUserId")
    const username = searchParams.get("username")

    let targetId = targetUserId

    // Resolve user ID by username if needed
    if (!targetId && username) {
      let cleanUsername = decodeURIComponent(username).trim()
      if (cleanUsername.includes("%")) {
        cleanUsername = decodeURIComponent(cleanUsername).trim()
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername)
      if (isUuid) {
        targetId = cleanUsername
      } else {
        if (!cleanUsername.startsWith("@")) {
          cleanUsername = "@" + cleanUsername
        }
        const user = await prisma.user.findUnique({
          where: { username: cleanUsername },
          select: { id: true },
        })
        if (user) {
          targetId = user.id
        }
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "Usuario no especificado o no encontrado" }, { status: 400 })
    }

    // Check if following
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetId,
        },
      },
    })

    // Get follower counts
    const followersCount = await prisma.follow.count({
      where: { followingId: targetId },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: targetId },
    })

    return NextResponse.json({
      success: true,
      following: !!followRecord,
      followersCount,
      followingCount,
    })
  } catch (error: any) {
    console.error("[Follow API GET Error]:", error)
    return NextResponse.json({ error: error.message || "Error al verificar seguimiento" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { targetUserId, username } = await request.json()
    let targetId = targetUserId

    if (!targetId && username) {
      let cleanUsername = decodeURIComponent(username).trim()
      if (cleanUsername.includes("%")) {
        cleanUsername = decodeURIComponent(cleanUsername).trim()
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername)
      if (isUuid) {
        targetId = cleanUsername
      } else {
        if (!cleanUsername.startsWith("@")) {
          cleanUsername = "@" + cleanUsername
        }
        const user = await prisma.user.findUnique({
          where: { username: cleanUsername },
          select: { id: true },
        })
        if (user) {
          targetId = user.id
        }
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "ID del piloto requerido" }, { status: 400 })
    }

    if (targetId === session.user.id) {
      return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 })
    }

    // Toggle follow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetId,
        },
      },
    })

    let following = false
    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetId,
          },
        },
      })
      following = false
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetId,
        },
      })
      following = true
    }

    // Return new follow state and updated counts
    const followersCount = await prisma.follow.count({
      where: { followingId: targetId },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: targetId },
    })

    return NextResponse.json({
      success: true,
      following,
      followersCount,
      followingCount,
    })
  } catch (error: any) {
    console.error("[Follow API POST Error]:", error)
    return NextResponse.json({ error: error.message || "Error al actualizar seguimiento" }, { status: 500 })
  }
}
