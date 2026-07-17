
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const profileUpdateSchema = z.object({
  nombre: z.string().optional().nullable(),
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .regex(/^@[a-zA-Z0-9_]+$/, "El nombre de usuario debe iniciar con @ y contener solo letras, números y guiones bajos")
    .optional(),
  bio: z.string().max(200, "La bio no puede superar los 200 caracteres").optional().nullable(),
  ciudad: z.string().max(100, "La ciudad no puede superar los 100 caracteres").optional().nullable(),
  tipoRider: z.enum(["TOURING", "URBANO", "OFFROAD", "SPORT", "CUSTOM"]).optional(),
  fotoPerfil: z.string().max(500, "La foto de perfil no puede superar los 500 caracteres").optional().nullable(),
  fotoPortada: z.string().max(500, "La foto de portada no puede superar los 500 caracteres").optional().nullable(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const usernameParam = searchParams.get("username")

    let whereClause: any = { id: session.user.id }
    if (usernameParam) {
      let cleanUsername = decodeURIComponent(usernameParam).trim()
      if (cleanUsername.includes("%")) {
        cleanUsername = decodeURIComponent(cleanUsername).trim()
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername)
      
      if (isUuid) {
        whereClause = { id: cleanUsername }
      } else {
        if (!cleanUsername.startsWith("@")) {
          cleanUsername = "@" + cleanUsername
        }
        whereClause = { username: cleanUsername }
      }
    }

    if (whereClause.id === undefined && whereClause.username === undefined) {
      return NextResponse.json({ error: "Identificador de usuario inválido" }, { status: 400 })
    }

    const userProfile = await prisma.user.findUnique({
      where: whereClause,
      include: {
        motos: true,
        emergencyContacts: true,
        badges: {
          include: {
            badge: true,
          },
        },
        statuses: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Calculate experience level dynamically based on achievements (badges) and time since creation
    const badgesCount = userProfile.badges.length
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    let calculatedLevel: "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO" | "EXPERTO" = "PRINCIPIANTE"
    if (badgesCount >= 3 || daysSinceCreation >= 90) {
      calculatedLevel = "EXPERTO"
    } else if (badgesCount >= 2 || daysSinceCreation >= 30) {
      calculatedLevel = "AVANZADO"
    } else if (badgesCount >= 1 || daysSinceCreation >= 7) {
      calculatedLevel = "INTERMEDIO"
    }

    if (userProfile.nivelExperiencia !== calculatedLevel) {
      await prisma.user.update({
        where: { id: userProfile.id },
        data: { nivelExperiencia: calculatedLevel },
      })
      userProfile.nivelExperiencia = calculatedLevel
    }

    return NextResponse.json({ success: true, profile: userProfile })
  } catch (error: any) {
    console.error("[Profile API GET Error]:", error)
    return NextResponse.json({ error: error.message || "Error al obtener el perfil" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    if (body.username) {
      body.username = body.username.trim()
      body.username = "@" + body.username.replace(/^@+/, "")
    }
    const parsed = profileUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { nombre, username, bio, ciudad, tipoRider, fotoPerfil, fotoPortada } = parsed.data

    if (nombre !== undefined) {
      if (nombre === null || nombre.trim().length < 2) {
        return NextResponse.json({ error: "El nombre debe tener al menos 2 caracteres" }, { status: 400 })
      }
    }

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id },
        },
      })
      if (existingUser) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 400 })
      }
    }

    // Build dynamic update data object to avoid setting unprovided values to null
    const updateData: any = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (username !== undefined) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    if (ciudad !== undefined) updateData.ciudad = ciudad
    if (tipoRider !== undefined) updateData.tipoRider = tipoRider
    if (fotoPerfil !== undefined) updateData.fotoPerfil = fotoPerfil
    if (fotoPortada !== undefined) updateData.fotoPortada = fotoPortada

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("[Profile API PUT Error]:", error)
    return NextResponse.json({ error: error.message || "Error al actualizar el perfil" }, { status: 500 })
  }
}
