export const runtime = "edge";

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const motoSchema = z.object({
  marca: z.string().min(2, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  cilindraje: z.number().int().positive("El cilindraje debe ser positivo"),
  anio: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  apodo: z.string().optional().nullable(),
  fotoUrl: z.string().max(500, "La foto no puede superar los 500 caracteres").optional().nullable(),
  galeria: z.array(z.string()).optional(),
  mods: z.array(z.string()).optional(),
  kilometraje: z.number().int().nonnegative().optional(),
  estado: z.enum(["actual", "anterior"]).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const motos = await prisma.moto.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, motos })
  } catch (error: any) {
    console.error("Error fetching boxes:", error)
    return NextResponse.json({ error: error.message || "Error al obtener los boxes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
      message: "Box registrado con éxito",
      moto,
    })
  } catch (error: any) {
    console.error("Error creating box:", error)
    return NextResponse.json({ error: error.message || "Error al registrar el box" }, { status: 500 })
  }
}
