export const runtime = "edge";


import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  let rideId = searchParams.get("rideId")

  try {
    // 1. If no rideId is provided or no rides exist, find or create a default ride
    if (!rideId) {
      let ride = await prisma.ride.findFirst()
      if (!ride) {
        // Seed a default ride
        // First need a user to organize it
        const firstUser = await prisma.user.findFirst()
        if (firstUser) {
          const defaultLocationId = crypto.randomUUID()
          // Create a ride with a raw PostGIS point for starting location
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Ride" ("id", "nombre", "organizadorId", "puntoEncuentro", "fechaHora", "descripcion", "createdAt")
            VALUES ('${defaultLocationId}', 'Rodada Nocturna a Patios (Bogotá)', '${firstUser.id}', ST_SetSRID(ST_Point(-74.05, 4.65), 4326), NOW() + INTERVAL '1 day', 'Gran rodada de jueves por la noche. Encuentro en la bomba de la 85.', NOW())
          `)
          ride = await prisma.ride.findUnique({ where: { id: defaultLocationId } })
        }
      }
      rideId = ride?.id || ""
    }

    if (!rideId) {
      return NextResponse.json({ success: true, convoy: [], rideId: "" })
    }

    // 2. Fetch convoy participants with PostGIS coordinates
    const convoy = await prisma.$queryRaw<any[]>`
      SELECT 
        cp."id", 
        cp."rideId", 
        cp."userId", 
        cp."rol", 
        u."username", 
        u."nombre", 
        u."fotoPerfil",
        ST_X(cp."ultimaUbicacion"::geometry) AS longitude,
        ST_Y(cp."ultimaUbicacion"::geometry) AS latitude
      FROM "ConvoyParticipant" cp
      JOIN "User" u ON cp."userId" = u."id"
      WHERE cp."rideId" = ${rideId}
    `

    return NextResponse.json({ 
      success: true, 
      rideId,
      convoy: convoy.map(item => ({
        id: item.id,
        rideId: item.rideId,
        userId: item.userId,
        rol: item.rol,
        username: item.username,
        nombre: item.nombre,
        fotoPerfil: item.fotoPerfil,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
      }))
    })
  } catch (error) {
    console.error("Error fetching convoy location:", error)
    return NextResponse.json({ error: "Error al obtener ubicaciones del convoy" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { rideId, rol, latitude, longitude } = await request.json()

    if (!rideId || !latitude || !longitude) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const roleValue = rol || "RIDER"

    // Upsert ConvoyParticipant using raw PostGIS SQL
    await prisma.$executeRaw`
      INSERT INTO "ConvoyParticipant" ("id", "rideId", "userId", "rol", "ultimaUbicacion", "updatedAt")
      VALUES (
        ${id}, 
        ${rideId}, 
        ${session.user.id}, 
        ${roleValue}, 
        ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326), 
        NOW()
      )
      ON CONFLICT ("rideId", "userId") DO UPDATE
      SET 
        "rol" = ${roleValue}, 
        "ultimaUbicacion" = ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326), 
        "updatedAt" = NOW()
    `

    // Also update the general UserLocation for the Rescue SOS module
    await prisma.$executeRaw`
      INSERT INTO "UserLocation" ("userId", "ubicacion", "updatedAt")
      VALUES (
        ${session.user.id}, 
        ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326), 
        NOW()
      )
      ON CONFLICT ("userId") DO UPDATE
      SET 
        "ubicacion" = ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326), 
        "updatedAt" = NOW()
    `

    return NextResponse.json({ success: true, message: "Ubicación reportada correctamente" })
  } catch (error) {
    console.error("Error reporting location:", error)
    return NextResponse.json({ error: "Error al reportar ubicación" }, { status: 500 })
  }
}
