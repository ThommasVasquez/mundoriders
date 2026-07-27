import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener los compas que sigue el usuario
    const follows = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      include: {
        following: {
          select: {
            id: true,
            nombre: true,
            username: true,
            fotoPerfil: true,
            ciudad: true,
            tipoRider: true,
            nivelExperiencia: true,
            motos: {
              select: {
                id: true,
                marca: true,
                modelo: true,
                apodo: true,
              },
            },
            statuses: {
              where: {
                expiresAt: { gt: new Date() },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const friends = follows.map((f) => ({
      ...f.following,
      hasActiveStatus: f.following.statuses.length > 0,
    }))

    return NextResponse.json({
      success: true,
      friends,
      count: friends.length,
    })
  } catch (error: any) {
    console.error("[Friends API GET Error]:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener la lista de compas",
        friends: [],
      },
      { status: 500 }
    )
  }
}
