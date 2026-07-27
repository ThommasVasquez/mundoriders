
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const dynamic = "force-dynamic"

const profileUpdateSchema = z.object({
  nombre: z.string().optional().nullable(),
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .regex(/^@[a-zA-Z0-9_]+$/, "El nombre de usuario debe iniciar con @ y contener solo letras, números y guiones bajos")
    .optional(),
  bio: z.string().max(200, "La bio no puede superar los 200 caracteres").optional().nullable(),
  ciudad: z.string().max(100, "La ciudad no puede superar los 100 caracteres").optional().nullable(),
  rutasFrecuentes: z.string().max(200, "La zona de rutas no puede superar los 200 caracteres").optional().nullable(),
  rutaSonada: z.string().max(200, "La ruta soñada no puede superar los 200 caracteres").optional().nullable(),
  tipoRider: z.enum(["TOURING", "URBANO", "OFFROAD", "SPORT", "CUSTOM"]).optional(),
  fotoPerfil: z.string().max(500, "La foto de perfil no puede superar los 500 caracteres").optional().nullable(),
  fotoPortada: z.string().max(500, "La foto de portada no puede superar los 500 caracteres").optional().nullable(),
  tipoSangre: z.string().optional().nullable(),
  alergias: z.string().optional().nullable(),
  casco: z.string().optional().nullable(),
  intercom: z.string().optional().nullable(),
  chaqueta: z.string().optional().nullable(),
  guantesBotas: z.string().optional().nullable(),
  maxKmDia: z.number().optional().nullable(),
  departamentosVisitados: z.array(z.string()).optional(),
  estiloTags: z.array(z.string()).optional(),
})

export async function GET(req: Request) {
  try {
    let session = null
    try {
      session = await auth()
    } catch (e) {
      console.warn("auth() failed in GET /api/garage:", e)
    }

    const { searchParams } = new URL(req.url)
    const usernameParam = searchParams.get("username")

    let whereClause: any = session?.user?.id ? { id: session.user.id } : null

    if (usernameParam) {
      let cleanUsername = decodeURIComponent(usernameParam).trim()
      while (cleanUsername.includes("%")) {
        try {
          const decoded = decodeURIComponent(cleanUsername).trim()
          if (decoded === cleanUsername) break
          cleanUsername = decoded
        } catch {
          break
        }
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername)

      if (isUuid) {
        whereClause = { id: cleanUsername }
      } else {
        const rawName = cleanUsername.replace(/^@+/, "")
        whereClause = {
          OR: [
            { username: "@" + rawName },
            { username: rawName },
            { username: { equals: "@" + rawName, mode: "insensitive" } },
            { username: { equals: rawName, mode: "insensitive" } },
          ],
        }
      }
    }

    if (!whereClause) {
      return NextResponse.json({ error: "No autorizado o identificador no especificado" }, { status: 401 })
    }

    const userProfile = await prisma.user.findFirst({
      where: whereClause,
      include: {
        motos: true,
        emergencyContacts: true,
        badges: {
          include: {
            badge: true,
          },
        },
        clubMemberships: {
          include: {
            club: true,
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

    // Calcular estadísticas en tiempo real
    let kmRodadas = 0
    let ridesJoinedCount = 0
    try {
      const ridesJoined = await prisma.rideParticipant.findMany({
        where: { userId: userProfile.id, estado: "CONFIRMADO" },
        include: { ride: { include: { route: true } } },
      })
      ridesJoinedCount = ridesJoined.length
      kmRodadas = ridesJoined.reduce((sum, rp) => sum + (rp.ride?.route?.distanciaKm || 0), 0)
    } catch (e) {
      console.warn("Error calculating ridesJoined stats:", e)
    }

    let kmRutasCreadas = 0
    let routesCreatedCount = 0
    try {
      const routesCreated = await prisma.route.findMany({
        where: { creadorId: userProfile.id },
      })
      routesCreatedCount = routesCreated.length
      kmRutasCreadas = routesCreated.reduce((sum, r) => sum + (r.distanciaKm || 0), 0)
    } catch (e) {
      console.warn("Error calculating routesCreated stats:", e)
    }

    const kmTotales = Math.round(kmRodadas + kmRutasCreadas)
    let ridesOrganizedCount = 0
    try {
      ridesOrganizedCount = await prisma.ride.count({ where: { organizadorId: userProfile.id } })
    } catch (e) {
      console.warn("Error counting ridesOrganized:", e)
    }

    const ridesParticipatedCount = ridesJoinedCount
    const boxesCount = userProfile.motos ? userProfile.motos.length : 0

    // Fórmula modular de nivel de experiencia
    const expScore = (kmTotales * 0.5) + (ridesOrganizedCount * 15) + (ridesParticipatedCount * 10) + (boxesCount * 5)

    let calculatedLevel: "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO" | "EXPERTO" = "PRINCIPIANTE"
    if (expScore >= 150) {
      calculatedLevel = "EXPERTO"
    } else if (expScore >= 75) {
      calculatedLevel = "AVANZADO"
    } else if (expScore >= 30) {
      calculatedLevel = "INTERMEDIO"
    }

    if (userProfile.nivelExperiencia !== calculatedLevel) {
      try {
        await prisma.user.update({
          where: { id: userProfile.id },
          data: { nivelExperiencia: calculatedLevel },
        })
        userProfile.nivelExperiencia = calculatedLevel
      } catch (e) {
        console.warn("Error updating calculated level:", e)
      }
    }

    return NextResponse.json({
      success: true,
      profile: userProfile,
      stats: {
        kmTotales,
        ridesOrganizedCount,
        ridesParticipatedCount,
        routesCreatedCount,
        boxesCount,
      },
    })
  } catch (error: any) {
    console.error("[Profile API GET Error]:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Error al obtener el perfil",
    }, { status: 200 })
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

    const {
      nombre, username, bio, ciudad, rutasFrecuentes, rutaSonada, tipoRider,
      fotoPerfil, fotoPortada, tipoSangre, alergias, casco, intercom, chaqueta,
      guantesBotas, maxKmDia, departamentosVisitados, estiloTags
    } = parsed.data

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
    if (rutasFrecuentes !== undefined) updateData.rutasFrecuentes = rutasFrecuentes
    if (rutaSonada !== undefined) updateData.rutaSonada = rutaSonada
    if (tipoRider !== undefined) updateData.tipoRider = tipoRider
    if (fotoPerfil !== undefined) updateData.fotoPerfil = fotoPerfil
    if (fotoPortada !== undefined) updateData.fotoPortada = fotoPortada
    if (tipoSangre !== undefined) updateData.tipoSangre = tipoSangre
    if (alergias !== undefined) updateData.alergias = alergias
    if (casco !== undefined) updateData.casco = casco
    if (intercom !== undefined) updateData.intercom = intercom
    if (chaqueta !== undefined) updateData.chaqueta = chaqueta
    if (guantesBotas !== undefined) updateData.guantesBotas = guantesBotas
    if (maxKmDia !== undefined) updateData.maxKmDia = maxKmDia
    if (departamentosVisitados !== undefined) updateData.departamentosVisitados = departamentosVisitados
    if (estiloTags !== undefined) updateData.estiloTags = estiloTags

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: "Garage actualizado correctamente",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("[Profile API PUT Error]:", error)
    return NextResponse.json({ error: error.message || "Error al actualizar el perfil" }, { status: 500 })
  }
}
