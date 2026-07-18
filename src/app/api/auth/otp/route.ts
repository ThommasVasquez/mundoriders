export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const otpSchema = z.object({
  phone: z.string().min(8, "Número de teléfono no válido"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = otpSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phone } = parsed.data

    // 1. Generar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 5 * 60 * 1000) // Expiración en 5 minutos

    // 2. Limpiar tokens anteriores para este número de teléfono
    await prisma.verificationToken.deleteMany({
      where: { identifier: phone },
    })

    // 3. Crear token en la base de datos
    await prisma.verificationToken.create({
      data: {
        identifier: phone,
        token: code,
        expires,
      },
    })

    // 4. Modo desarrollo: imprimir en la consola para testeo rápido
    console.log(`\n--- OTP GENERATED FOR RIDER ---`)
    console.log(`Teléfono: ${phone}`)
    console.log(`Código OTP: ${code}`)
    console.log(`Expiración: ${expires.toLocaleTimeString()}`)
    console.log(`--------------------------------\n`)

    // 5. Enviar SMS real si las credenciales de Twilio están configuradas
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env
    let sentRealSms = false

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const formattedPhone = phone.startsWith("+") ? phone : (phone.startsWith("57") ? `+${phone}` : `+57${phone}`)
        const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${basicAuth}`
            },
            body: new URLSearchParams({
              Body: `Tu código de verificación de Rider es: ${code}. Válido por 5 minutos.`,
              From: TWILIO_PHONE_NUMBER,
              To: formattedPhone,
            })
          }
        )
        if (response.ok) {
          console.log(`Real SMS sent successfully via Twilio to ${formattedPhone}`)
          sentRealSms = true
        } else {
          const errText = await response.text()
          console.error("Twilio API error:", errText)
        }
      } catch (smsError) {
        console.error("Failed to send real SMS via Twilio API:", smsError)
      }
    } else {
      console.log("Twilio credentials missing. Logging OTP to console (Dev Mode).")
    }

    return NextResponse.json({
      success: true,
      message: sentRealSms 
        ? "Código enviado por SMS correctamente." 
        : "Código generado correctamente. En desarrollo, revisa la consola del servidor.",
      // Para propósitos de testeo rápido, también lo devolvemos en la respuesta de API si está en desarrollo
      mockCode: process.env.NODE_ENV !== "production" ? code : undefined,
    })
  } catch (error) {
    console.error("Error generating OTP:", error)
    return NextResponse.json(
      { error: "Error interno al enviar código OTP" },
      { status: 500 }
    )
  }
}
