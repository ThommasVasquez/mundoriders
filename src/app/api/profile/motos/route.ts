
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const motoSchema = z.object({
  marca: z.string().min(2, "La marca es requerida"),
  modelo: z.string().min(2, "El modelo es requerido"),
  cilindraje: z.number().int().positive("El cilindraje debe ser positivo"),
  anio: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  apodo: z.string().optional().nullable(),
  fotoUrl: z.string().max(500, "La foto no puede superar los 500 caracteres").optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const motos = await prisma.moto.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, motos })
  } catch (error) {
    console.error("Error fetching motos:", error)
    return NextResponse.json({ error: "Error al obtener las motos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = motoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const moto = await prisma.moto.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Moto registrada con éxito",
      moto,
    })
  } catch (error) {
    console.error("Error creating moto:", error)
    return NextResponse.json({ error: "Error al crear la moto" }, { status: 500 })
  }
}
