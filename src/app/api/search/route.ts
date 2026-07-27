import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() || ""

    if (!q || q.length < 1) {
      return NextResponse.json({
        success: true,
        users: [],
        groups: [],
        shops: [],
      })
    }

    const cleanQ = q.replace(/^@/, "")

    // 1. Busqueda de Usuarios (Riders)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { nombre: { contains: cleanQ, mode: "insensitive" } },
          { username: { contains: cleanQ, mode: "insensitive" } },
          { ciudad: { contains: cleanQ, mode: "insensitive" } },
          { rutasFrecuentes: { contains: cleanQ, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        fotoPerfil: true,
        ciudad: true,
        tipoRider: true,
        nivelExperiencia: true,
        motos: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            apodo: true,
          },
        },
        statuses: {
          where: {
            expiresAt: { gt: new Date() },
          },
          take: 1,
        },
      },
      take: 8,
    })

    // 2. Busqueda de Grupos / Clubs & Rodadas
    const clubs = await prisma.club.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
          { ciudad: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      take: 6,
    })

    const rides = await prisma.ride.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        organizador: {
          select: {
            id: true,
            nombre: true,
            username: true,
            fotoPerfil: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
      take: 6,
    })

    // Normalizar grupos (clubes + rodadas)
    const groups = [
      ...clubs.map((c) => ({
        id: c.id,
        tipo: "club" as const,
        nombre: c.nombre,
        descripcion: c.descripcion,
        ciudad: c.ciudad,
        logoUrl: c.logoUrl,
        verificado: c.verificado,
        membersCount: c._count.members,
        link: `/centro-motero#convoy`,
      })),
      ...rides.map((r) => ({
        id: r.id,
        tipo: "rodada" as const,
        nombre: r.nombre,
        descripcion: r.descripcion,
        ciudad: "En Ruta",
        logoUrl: null,
        verificado: false,
        membersCount: r._count.participants,
        organizador: r.organizador,
        link: `/centro-motero#convoy`,
      })),
    ].slice(0, 8)

    // 3. Busqueda de Tiendas / Marketplace Items
    const shops = await prisma.marketplaceItem.findMany({
      where: {
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
          { categoria: { contains: q, mode: "insensitive" } },
          { motoModelo: { contains: q, mode: "insensitive" } },
          { ciudad: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            username: true,
            fotoPerfil: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    })

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        hasActiveStatus: u.statuses.length > 0,
      })),
      groups,
      shops: shops.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        descripcion: s.descripcion,
        precio: s.precio,
        categoria: s.categoria,
        fotoUrl: s.fotoUrl || (s.fotosUrls && s.fotosUrls.length > 0 ? s.fotosUrls[0] : null),
        ciudad: s.ciudad,
        procedenciaVerificada: s.procedenciaVerificada,
        seller: s.user,
        link: `/centro-motero#marketplace`,
      })),
    })
  } catch (error: any) {
    console.error("[Search API Error]:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Error al realizar la búsqueda",
      users: [],
      groups: [],
      shops: [],
    }, { status: 500 })
  }
}
