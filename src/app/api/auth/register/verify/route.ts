export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const verifySchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  code: z.string().length(6, "El código debe tener exactamente 6 dígitos"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.username) {
      body.username = body.username.trim()
      if (!body.username.startsWith("@")) {
        body.username = "@" + body.username
      }
    }
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { nombre, username, email, password, phone, code } = parsed.data

    // 1. Verificar OTP en VerificationToken
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: code,
        expires: { gte: new Date() },
      },
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Código de verificación incorrecto o expirado" },
        { status: 400 }
      )
    }

    // 2. Consumir token
    await prisma.verificationToken.delete({
      where: { token: code },
    })

    // 3. Verificar nuevamente si el correo o username ya se registraron en el intervalo
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 400 }
      )
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })
    if (existingUsername) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 400 }
      )
    }

    // 4. Hash de la contraseña y creación del usuario
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        nombre,
        phone: phone || null,
        nivelExperiencia: "PRINCIPIANTE",
        tipoRider: "URBANO",
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Usuario creado con éxito",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nombre: user.nombre,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error verifying registration code:", error)
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    )
  }
}
