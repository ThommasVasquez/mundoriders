
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // 1. Get user IDs that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    // Include the current user's ID to show their own stories first in the tray
    const userIds = [session.user.id, ...followingIds]

    // 2. Retrieve users (and their active statuses) from the database
    const usersWithStories = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        statuses: {
          some: {
            expiresAt: { gt: new Date() },
          },
        },
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        fotoPerfil: true,
        statuses: {
          where: {
            expiresAt: { gt: new Date() },
          },
          orderBy: {
            createdAt: "asc", // Ascending so they play in chronological order
          },
        },
      },
    })

    // Sort the list so that the current user always appears first in the tray
    const sortedStories = usersWithStories.sort((a, b) => {
      if (a.id === session.user.id) return -1
      if (b.id === session.user.id) return 1
      return 0
    })

    return NextResponse.json({ success: true, stories: sortedStories })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ error: "Error al obtener las historias" }, { status: 500 })
  }
}
