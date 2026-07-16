import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // 1. Get all conversation IDs where the user is a participant
    const participantConvs = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id },
      select: { conversationId: true },
    })
    const conversationIds = participantConvs.map((pc) => pc.conversationId)

    // 2. Fetch those conversations with members and last message details
    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      include: {
        members: {
          where: { userId: { not: session.user.id } },
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
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ success: true, conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Error al obtener conversaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: "ID del destinatario requerido" }, { status: 400 })
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "No puedes chatear contigo mismo" }, { status: 400 })
    }

    // 1. Check if a direct conversation already exists between the two users
    const existingConv = await prisma.conversation.findFirst({
      where: {
        tipo: "DIRECTO",
        AND: [
          { members: { some: { userId: session.user.id } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          where: { userId: { not: session.user.id } },
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
        },
      },
    })

    if (existingConv) {
      return NextResponse.json({ success: true, conversation: existingConv, message: "Conversación existente" })
    }

    // 2. Create a new conversation and link both participants
    const conversation = await prisma.conversation.create({
      data: {
        tipo: "DIRECTO",
        members: {
          create: [
            { userId: session.user.id },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        members: {
          where: { userId: { not: session.user.id } },
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
        },
      },
    })

    return NextResponse.json({ success: true, conversation, message: "Conversación creada correctamente" })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Error al crear la conversación" }, { status: 500 })
  }
}
