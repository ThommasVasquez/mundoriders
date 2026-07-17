export const runtime = "edge";


import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const DEFAULT_CHALLENGES = [
  {
    nombre: "El Rey de Letras 🏔️",
    descripcion: "Corona el mítico Alto de Letras (Mariquita - Manizales), uno de los puertos de montaña más largos y exigentes del mundo.",
    puntos: 1500,
    medallaName: "Conquistador de las Alturas",
    medallaIcon: "🏔️",
  },
  {
    nombre: "Sobreviviente al Trampolín 🌀",
    descripcion: "Supera el 'Trampolín de la Muerte' en el Putumayo, una de las trochas y vías más arriesgadas y hermosas de Colombia.",
    puntos: 2000,
    medallaName: "Rider Off-Road Extremo",
    medallaIcon: "🌀",
  },
  {
    nombre: "La Ruta del Sol ☀️",
    descripcion: "Recorre de punta a punta la Tronco del Magdalena, conectando el interior con la costa caribe bajo temperaturas extremas.",
    puntos: 1200,
    medallaName: "Correcaminos del Caribe",
    medallaIcon: "☀️",
  },
  {
    nombre: "Curvando en Las Palmas 🏁",
    descripcion: "Completa la subida técnica por la Vía Las Palmas en Medellín un jueves de rodada nocturna.",
    puntos: 800,
    medallaName: "As de las Curvas Paisas",
    medallaIcon: "🏁",
  },
]

export async function GET() {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // 1. Check if challenges exist in db. If not, seed them.
    let dbChallenges = await prisma.challenge.findMany()
    if (dbChallenges.length === 0) {
      for (const item of DEFAULT_CHALLENGES) {
        await prisma.challenge.create({
          data: item,
        })
      }
      dbChallenges = await prisma.challenge.findMany()
    }

    // 2. Make sure UserChallenge records exist for this user for each challenge
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId: session.user.id },
    })

    if (userChallenges.length < dbChallenges.length) {
      const existingChallengeIds = userChallenges.map((uc) => uc.challengeId)
      for (const ch of dbChallenges) {
        if (!existingChallengeIds.includes(ch.id)) {
          await prisma.userChallenge.create({
            data: {
              userId: session.user.id,
              challengeId: ch.id,
              completado: false,
              progreso: 0.0,
            },
          })
        }
      }
    }

    // 3. Return joined challenges list
    const challengesWithProgress = await prisma.challenge.findMany({
      include: {
        progresses: {
          where: { userId: session.user.id },
        },
      },
    })

    return NextResponse.json({ success: true, challenges: challengesWithProgress })
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return NextResponse.json({ error: "Error al obtener desafíos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No unauthorized" }, { status: 401 })
  }

  try {
    const { challengeId, action } = await request.json()

    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: session.user.id,
          challengeId,
        },
      },
      include: {
        challenge: true,
      },
    })

    if (!userChallenge) {
      return NextResponse.json({ error: "Desafío no encontrado" }, { status: 404 })
    }

    let newProgreso = userChallenge.progreso
    let newCompletado = userChallenge.completado
    let completadoAt = userChallenge.completadoAt

    if (action === "CHECK_IN") {
      newProgreso = Math.min(100, newProgreso + 25)
      if (newProgreso === 100 && !newCompletado) {
        newCompletado = true
        completadoAt = new Date()

        // Auto-seed/create a Badge matching the challenge reward if it doesn't exist
        let badge = await prisma.badge.findUnique({
          where: { nombre: userChallenge.challenge.medallaName },
        })
        if (!badge) {
          badge = await prisma.badge.create({
            data: {
              nombre: userChallenge.challenge.medallaName,
              descripcion: `Otorgada por completar el desafío: ${userChallenge.challenge.nombre}`,
              iconoUrl: userChallenge.challenge.medallaIcon,
            },
          })
        }

        // Link the badge to the user
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: session.user.id,
              badgeId: badge.id,
            },
          },
          create: {
            userId: session.user.id,
            badgeId: badge.id,
          },
          update: {},
        })
      }
    } else if (action === "COMPLETE") {
      newProgreso = 100
      newCompletado = true
      completadoAt = new Date()

      let badge = await prisma.badge.findUnique({
        where: { nombre: userChallenge.challenge.medallaName },
      })
      if (!badge) {
        badge = await prisma.badge.create({
          data: {
            nombre: userChallenge.challenge.medallaName,
            descripcion: `Otorgada por completar el desafío: ${userChallenge.challenge.nombre}`,
            iconoUrl: userChallenge.challenge.medallaIcon,
          },
        })
      }

      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: session.user.id,
            badgeId: badge.id,
          },
        },
        create: {
          userId: session.user.id,
          badgeId: badge.id,
        },
          update: {},
      })
    }

    const updated = await prisma.userChallenge.update({
      where: {
        id: userChallenge.id,
      },
      data: {
        progreso: newProgreso,
        completado: newCompletado,
        completadoAt,
      },
      include: {
        challenge: true,
      },
    })

    return NextResponse.json({
      success: true,
      progress: updated,
      message: newCompletado ? "¡Desafío completado y medalla obtenida!" : "Progreso actualizado correctamente",
    })
  } catch (error) {
    console.error("Error updating challenge progress:", error)
    return NextResponse.json({ error: "Error al actualizar progreso" }, { status: 500 })
  }
}
