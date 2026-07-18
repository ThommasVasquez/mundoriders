
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  contenido: z.string().min(1).optional(),
  visibilidad: z.enum(["publico", "compas", "solo_yo"]).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { postId } = await params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "No puedes editar esta publicación" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: parsed.data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nombre: true,
          fotoPerfil: true,
          bio: true,
          ciudad: true,
          tipoRider: true,
          motos: { select: { id: true, marca: true, modelo: true, cilindraje: true, apodo: true } },
        },
      },
      likes: { select: { userId: true } },
      comments: { select: { id: true } },
    },
  })

  return NextResponse.json({ success: true, post: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { postId } = await params

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar esta publicación" }, { status: 403 })
  }

  await prisma.post.delete({ where: { id: postId } })

  return NextResponse.json({ success: true })
}
