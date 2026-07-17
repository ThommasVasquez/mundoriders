
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const postSchema = z.object({
  contenido: z.string().min(1, "El contenido de la publicación no puede estar vacío"),
  mediaUrls: z.array(z.string().max(500)).max(4, "Máximo 4 imágenes por publicación"),
  rutaId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    let posts: any[] = []

    if (session && session.user && session.user.id) {
      // 1. Obtener los IDs de las personas a las que sigue el usuario
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })
      const followingIds = following.map((f) => f.followingId)

      // 2. Obtener los clubes del usuario
      const clubMemberships = await prisma.clubMember.findMany({
        where: { userId: session.user.id },
        select: { clubId: true },
      })
      const clubIds = clubMemberships.map((cm) => cm.clubId)

      // 3. Buscar posts de seguidos o del propio usuario (o de sus clubes)
      posts = await prisma.post.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: { in: followingIds } },
            // Si el post está asociado a una ruta que pertenece a un club, o si en el futuro se asocia a club,
            // por ahora los posts son de usuarios. Si no sigue a nadie, mostramos posts globales para no dejar vacío el feed.
          ],
        },
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
              motos: {
                select: {
                  id: true,
                  marca: true,
                  modelo: true,
                  cilindraje: true,
                  apodo: true,
                }
              }
            }
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          route: {
            select: {
              id: true,
              nombre: true,
              distanciaKm: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    // Fallback si no está autenticado o si el feed está vacío (mostrar posts globales)
    if (posts.length === 0) {
      posts = await prisma.post.findMany({
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
              motos: {
                select: {
                  id: true,
                  marca: true,
                  modelo: true,
                  cilindraje: true,
                  apodo: true,
                }
              }
            }
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          route: {
            select: {
              id: true,
              nombre: true,
              distanciaKm: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    }

    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Error al obtener las publicaciones" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const body = await req.json()
    const parsed = postSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { contenido, mediaUrls, rutaId } = parsed.data

    const post = await prisma.post.create({
      data: {
        contenido,
        mediaUrls,
        rutaId: rutaId || null,
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
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Publicación creada correctamente",
      post,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Error al crear la publicación" }, { status: 500 })
  }
}
