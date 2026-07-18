export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const DEFAULT_RESTRICTIONS: Record<string, { picoYPlaca: string; parrillero: string; chaleco: string }> = {
  BOGOTA: {
    picoYPlaca: "Restricción para motos según último dígito de placa en días hábiles (Pares/Impares). Consulta calendario distrital.",
    parrillero: "Permitido acompañante (hombre o mujer). Se prohibe el parrillero hombre en ciertas zonas comerciales de alta seguridad de 7:00 PM a 4:00 AM.",
    chaleco: "Obligatorio uso de chaleco reflectivo con el número de placa impreso desde las 6:00 PM hasta las 6:00 AM del día siguiente.",
  },
  MEDELLIN: {
    picoYPlaca: "Pico y Placa para motos de 2 y 4 tiempos basado en el primer dígito de la placa de 5:00 AM a 8:00 PM.",
    parrillero: "Se prohibe parrillero hombre en el casco urbano de Medellín en ciertos horarios definidos por la alcaldía local.",
    chaleco: "Obligatorio uso de chaleco reflectivo o prenda reflectiva después de las 6:00 PM y hasta las 6:00 AM.",
  },
  CALI: {
    picoYPlaca: "Sin pico y placa vigente para motocicletas particulares en el casco urbano actualmente.",
    parrillero: "Prohibido el parrillero hombre mayor de 14 años las 24 horas del día por decreto municipal de seguridad.",
    chaleco: "Recomendado uso de prendas reflectivas y casco reglamentario en todo momento. Chaleco obligatorio de 6:00 PM a 6:00 AM.",
  },
  BARRANQUILLA: {
    picoYPlaca: "Sin pico y placa general. Restricción de circulación en la zona centro y ciertas avenidas específicas para motocarros.",
    parrillero: "Prohibido acompañante hombre en el cuadrante de la zona norte de la ciudad de 6:00 AM a 7:00 PM.",
    chaleco: "Obligatorio el uso de casco con placa y chaleco reflectivo desde las 6:00 PM hasta las 6:00 AM.",
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = (searchParams.get("city") || "BOGOTA").toUpperCase()

  try {
    let restriction = await prisma.cityRestriction.findUnique({
      where: { ciudad: city },
    })

    if (!restriction) {
      // Auto-seed for the requested city
      const defaults = DEFAULT_RESTRICTIONS[city] || {
        picoYPlaca: "Sin restricciones vigentes reportadas para esta ciudad.",
        parrillero: "Permitido parrillero bajo normas de tránsito estándar.",
        chaleco: "Obligatorio uso de chaleco reflectivo de 6:00 PM a 6:00 AM.",
      }

      restriction = await prisma.cityRestriction.create({
        data: {
          ciudad: city,
          ...defaults,
        },
      })
    }

    return NextResponse.json({ success: true, restriction })
  } catch (error) {
    console.error("Error fetching city restrictions:", error)
    return NextResponse.json({ error: "Error al obtener restricciones de tránsito" }, { status: 500 })
  }
}
