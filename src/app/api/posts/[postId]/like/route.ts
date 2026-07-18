
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

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

    // Verificar si ya existe el like
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      // Si existe, lo removemos (unlike)
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id,
          },
        },
      })
      return NextResponse.json({ success: true, liked: false, message: "Like removido" })
    } else {
      // Si no existe, lo agregamos (like)
      await prisma.like.create({
        data: {
          postId,
          userId: session.user.id,
        },
      })
      return NextResponse.json({ success: true, liked: true, message: "Like agregado" })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Error al procesar el like" }, { status: 500 })
  }
}
