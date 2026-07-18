export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendVerificationEmail } from "@/lib/mail"

const registerSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
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
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username, email, password, nombre, phone } = parsed.data

    // Verificar si el correo ya está registrado
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 400 }
      )
    }

    // Verificar si el nombre de usuario ya está registrado
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 400 }
      )
    }

    // Generar código de verificación de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // Expiración en 10 minutos

    // Guardar el código en VerificationToken (primero limpiar los anteriores)
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires,
      },
    })

    // Enviar correo de verificación
    await sendVerificationEmail(email, code)

    return NextResponse.json(
      {
        success: true,
        message: "Código de verificación enviado con éxito",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    )
  }
}
