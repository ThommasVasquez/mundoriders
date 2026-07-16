import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { latitude, longitude, tipoEmergencia } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Coordenadas requeridas" }, { status: 400 })
    }

    // 1. Query real nearby users in 5km using PostGIS geography
    let nearbyRiders = await prisma.$queryRaw<any[]>`
      SELECT 
        ul."userId",
        u."username",
        u."nombre",
        u."fotoPerfil",
        ST_Distance(
          ul."ubicacion"::geography, 
          ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography
        ) AS distance
      FROM "UserLocation" ul
      JOIN "User" u ON ul."userId" = u."id"
      WHERE ul."userId" != ${session.user.id}
        AND ST_DWithin(
          ul."ubicacion"::geography, 
          ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography, 
          5000
        )
      ORDER BY distance ASC
      LIMIT 3
    `

    // 2. If no nearby riders exist (dev environment), auto-simulate/seed locations for other users
    if (nearbyRiders.length === 0) {
      const otherUsers = await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        take: 3,
      })

      // Seed them with small offsets (+/- 0.005 to 0.02 degrees)
      const offsets = [
        { lat: 0.008, lng: -0.01 },
        { lat: -0.006, lng: 0.012 },
        { lat: 0.015, lng: 0.005 },
      ]

      for (let i = 0; i < otherUsers.length; i++) {
        const u = otherUsers[i];
        const offset = offsets[i] || { lat: 0.01, lng: -0.01 };
        const mockLat = latitude + offset.lat;
        const mockLng = longitude + offset.lng;

        await prisma.$executeRaw`
          INSERT INTO "UserLocation" ("userId", "ubicacion", "updatedAt")
          VALUES (${u.id}, ST_SetSRID(ST_Point(${mockLng}, ${mockLat}), 4326), NOW())
          ON CONFLICT ("userId") DO UPDATE
          SET "ubicacion" = ST_SetSRID(ST_Point(${mockLng}, ${mockLat}), 4326), "updatedAt" = NOW()
        `
      }

      // Re-run search query
      nearbyRiders = await prisma.$queryRaw<any[]>`
        SELECT 
          ul."userId",
          u."username",
          u."nombre",
          u."fotoPerfil",
          ST_Distance(
            ul."ubicacion"::geography, 
            ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography
          ) AS distance
        FROM "UserLocation" ul
        JOIN "User" u ON ul."userId" = u."id"
        WHERE ul."userId" != ${session.user.id}
          AND ST_DWithin(
            ul."ubicacion"::geography, 
            ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography, 
            15000
          )
        ORDER BY distance ASC
        LIMIT 3
      `
    }

    return NextResponse.json({ 
      success: true, 
      tipoEmergencia: tipoEmergencia || "GENERAL",
      nearbyRiders: nearbyRiders.map(item => ({
        userId: item.userId,
        username: item.username,
        nombre: item.nombre,
        fotoPerfil: item.fotoPerfil,
        distanceMeters: Math.round(Number(item.distance)),
      }))
    })
  } catch (error) {
    console.error("Error sending rescue SOS:", error)
    return NextResponse.json({ error: "Error al emitir alerta SOS" }, { status: 500 })
  }
}
