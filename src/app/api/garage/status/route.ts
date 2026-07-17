export const runtime = "edge";


import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ activeStatus: null })
    }

    const activeStatus = await prisma.userStatus.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json({ activeStatus })
  } catch (error: any) {
    console.error("[Status API GET Error]:", error)
    return NextResponse.json({ error: error.message || "Error al obtener el estado" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { mediaUrl } = body

    if (!mediaUrl) {
      return NextResponse.json({ error: "Se requiere la URL de la imagen del estado" }, { status: 400 })
    }

    // Crear nuevo estado que expira en 24 horas
    const status = await prisma.userStatus.create({
      data: {
        userId: session.user.id,
        mediaUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    })

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error("[Status API POST Error]:", error)
    return NextResponse.json({ error: error.message || "Error al crear el estado" }, { status: 500 })
  }
}
