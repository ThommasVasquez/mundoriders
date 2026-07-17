export const runtime = "edge";


import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // 1. Get user IDs that the current user already follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    // 2. Get the current user's rider type (interests)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tipoRider: true },
    })

    // 3. Fetch up to 3 users who share the same rider type (interests) first
    const matchedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [session.user.id, ...followingIds],
        },
        tipoRider: currentUser?.tipoRider || undefined,
      },
      take: 3,
      select: {
        id: true,
        username: true,
        nombre: true,
        fotoPerfil: true,
        tipoRider: true,
        bio: true,
        ciudad: true,
        motos: {
          take: 1,
          select: {
            marca: true,
            modelo: true,
            apodo: true,
          },
        },
      },
    })

    const matchedIds = matchedUsers.map((u) => u.id)

    // 4. Fill remaining slots (up to 4 total) with other riders
    const otherUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [session.user.id, ...followingIds, ...matchedIds],
        },
      },
      take: 4 - matchedUsers.length,
      select: {
        id: true,
        username: true,
        nombre: true,
        fotoPerfil: true,
        tipoRider: true,
        bio: true,
        ciudad: true,
        motos: {
          take: 1,
          select: {
            marca: true,
            modelo: true,
            apodo: true,
          },
        },
      },
    })

    const discoverUsers = [...matchedUsers, ...otherUsers]

    return NextResponse.json({ success: true, users: discoverUsers })
  } catch (error) {
    console.error("Error in discover API:", error)
    return NextResponse.json({ error: "Error al obtener sugerencias" }, { status: 500 })
  }
}
