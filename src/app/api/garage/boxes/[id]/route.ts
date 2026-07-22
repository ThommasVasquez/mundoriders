export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const motoUpdateSchema = z.object({
  marca: z.string().min(2, "La marca es requerida").optional(),
  modelo: z.string().min(1, "El modelo es requerido").optional(),
  cilindraje: z.number().int().positive("El cilindraje debe ser positivo").optional(),
  anio: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  apodo: z.string().optional().nullable(),
  fotoUrl: z.string().max(500, "La foto no puede superar los 500 caracteres").optional().nullable(),
  galeria: z.array(z.string()).optional(),
  mods: z.array(z.string()).optional(),
  kilometraje: z.number().int().nonnegative().optional(),
  estado: z.enum(["actual", "anterior"]).optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const moto = await prisma.moto.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!moto) {
      return NextResponse.json({ error: "Moto no encontrada" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = motoUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updatedMoto = await prisma.moto.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({
      success: true,
      message: "Moto actualizada correctamente",
      moto: updatedMoto,
    })
  } catch (error: any) {
    console.error("Error updating moto:", error)
    return NextResponse.json({ error: error?.message || "Error al actualizar la moto" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const moto = await prisma.moto.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!moto) {
      return NextResponse.json({ error: "Moto no encontrada" }, { status: 404 })
    }

    await prisma.moto.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Moto eliminada correctamente",
    })
  } catch (error) {
    console.error("Error deleting moto:", error)
    return NextResponse.json({ error: "Error al eliminar la moto" }, { status: 500 })
  }
}
