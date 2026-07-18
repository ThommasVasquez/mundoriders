export const dynamic = "force-dynamic"

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
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requerido" }, { status: 400 })
    }

    // 1. Verify user is a participant of this conversation
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!isParticipant) {
      return NextResponse.json({ error: "Acceso no autorizado a esta conversación" }, { status: 403 })
    }

    // 2. Fetch all messages in chronological order
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nombre: true,
            fotoPerfil: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error("[Intercom GET messages error]:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { conversationId, contenido, mediaUrl } = await request.json()

    if (!conversationId || !contenido?.trim()) {
      return NextResponse.json({ error: "conversationId y contenido requeridos" }, { status: 400 })
    }

    // 1. Verify user is a participant of this conversation
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!isParticipant) {
      return NextResponse.json({ error: "No autorizado a enviar mensajes a este chat" }, { status: 403 })
    }

    // 2. Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        userId: session.user.id,
        contenido: contenido.trim(),
        mediaUrl: mediaUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nombre: true,
            fotoPerfil: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("[Intercom POST message error]:", error)
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }
}
