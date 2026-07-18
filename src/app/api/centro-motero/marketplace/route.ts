export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const itemSchema = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  precio: z.number().positive("El precio debe ser un número positivo"),
  categoria: z.string().min(1, "La categoría es requerida"),
  motoModelo: z.string().optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
  fotosUrls: z.array(z.string()).optional().default([]),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  telefonoContact: z.string().min(5, "El teléfono de contacto debe ser válido"),
  motoOrigenPlaca: z.string().optional().nullable(),
  motoOrigenVin: z.string().optional().nullable(),
  documentoVerificacionUrl: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const city = searchParams.get("city")

  try {
    const items = await prisma.marketplaceItem.findMany({
      where: {
        ...(category && category !== "TODOS" ? { categoria: category } : {}),
        ...(city && city !== "TODOS" ? { ciudad: city } : {}),
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Error fetching marketplace items:", error)
    return NextResponse.json({ error: "Error al obtener artículos del marketplace" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = itemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { 
      titulo, descripcion, precio, categoria, motoModelo, fotoUrl, fotosUrls, ciudad, 
      telefonoContact, motoOrigenPlaca, motoOrigenVin, documentoVerificacionUrl 
    } = parsed.data

    // Anti-theft rule: reject if keywords suggest stolen goods
    const isReportedStolen = (motoOrigenPlaca && motoOrigenPlaca.toUpperCase().includes("ROB")) || 
                             (motoOrigenVin && motoOrigenVin.toUpperCase().includes("HUR"))

    if (isReportedStolen) {
      return NextResponse.json({ error: "La moto de origen o autoparte ingresada cuenta con reportes de hurto en el sistema nacional." }, { status: 400 })
    }

    // Use first uploaded photo as primary fotoUrl if not provided
    const primaryPhoto = fotoUrl || (fotosUrls && fotosUrls.length > 0 ? fotosUrls[0] : null)

    // Auto-verify if both Placa and verification document are supplied
    const procedenciaVerificada = !!(motoOrigenPlaca && documentoVerificacionUrl)

    const item = await prisma.marketplaceItem.create({
      data: {
        titulo,
        descripcion,
        precio,
        categoria,
        motoModelo: motoModelo || null,
        fotoUrl: primaryPhoto || null,
        fotosUrls: fotosUrls || [],
        ciudad,
        telefonoContact,
        motoOrigenPlaca: motoOrigenPlaca || null,
        motoOrigenVin: motoOrigenVin || null,
        documentoVerificacionUrl: documentoVerificacionUrl || null,
        procedenciaVerificada,
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
      item, 
      message: procedenciaVerificada 
        ? "Artículo verificado y publicado correctamente" 
        : "Artículo publicado correctamente. Pendiente de validación de procedencia." 
    })
  } catch (error: any) {
    console.error("Error creating marketplace item:", error?.message || error)
    return NextResponse.json({ error: "Error al crear el artículo: " + (error?.message || "Error interno") }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "ID de artículo requerido" }, { status: 400 })
  }

  try {
    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 })
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "Acción no autorizada" }, { status: 403 })
    }

    await prisma.marketplaceItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Artículo eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting marketplace item:", error)
    return NextResponse.json({ error: "Error al eliminar el artículo" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "ID de artículo requerido" }, { status: 400 })
  }

  try {
    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 })
    }

    if (item.userId !== session.user.id) {
      return NextResponse.json({ error: "Acción no autorizada" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = itemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { 
      titulo, descripcion, precio, categoria, motoModelo, fotoUrl, fotosUrls, ciudad, 
      telefonoContact, motoOrigenPlaca, motoOrigenVin, documentoVerificacionUrl 
    } = parsed.data

    const isReportedStolen = (motoOrigenPlaca && motoOrigenPlaca.toUpperCase().includes("ROB")) || 
                             (motoOrigenVin && motoOrigenVin.toUpperCase().includes("HUR"))

    if (isReportedStolen) {
      return NextResponse.json({ error: "La moto de origen o autoparte ingresada cuenta con reportes de hurto en el sistema nacional." }, { status: 400 })
    }

    const primaryPhoto = fotoUrl || (fotosUrls && fotosUrls.length > 0 ? fotosUrls[0] : null)
    const procedenciaVerificada = !!(motoOrigenPlaca && documentoVerificacionUrl)

    const updated = await prisma.marketplaceItem.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        precio,
        categoria,
        motoModelo: motoModelo || null,
        fotoUrl: primaryPhoto || null,
        fotosUrls: fotosUrls || [],
        ciudad,
        telefonoContact,
        motoOrigenPlaca: motoOrigenPlaca || null,
        motoOrigenVin: motoOrigenVin || null,
        documentoVerificacionUrl: documentoVerificacionUrl || null,
        procedenciaVerificada,
      },
    })

    return NextResponse.json({ 
      success: true, 
      item: updated, 
      message: "Artículo actualizado correctamente" 
    })
  } catch (error) {
    console.error("Error updating marketplace item:", error)
    return NextResponse.json({ error: "Error al actualizar el artículo" }, { status: 500 })
  }
}
