import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const commentSchema = z.object({
  contenido: z.string().min(1, "El comentario no puede estar vacío").max(500, "El comentario no puede superar los 500 caracteres"),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
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
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ success: true, comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Error al obtener los comentarios" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { postId } = await params

  try {
    // Verificar que la publicación exista
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = commentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        contenido: parsed.data.contenido,
        postId,
        userId: session.user.id,
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

    return NextResponse.json({
      success: true,
      message: "Comentario agregado correctamente",
      comment,
    })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Error al crear el comentario" }, { status: 500 })
  }
}
