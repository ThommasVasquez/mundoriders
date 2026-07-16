export const runtime = "edge";

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth()
  const userId = session?.user?.id || null

  try {
    const { campaignId } = await request.json()
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId es requerido" }, { status: 400 })
    }

    // Check if campaign exists
    const campaign = await prisma.adCampaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 })
    }

    // Get client IP and User Agent headers for tracking
    const userAgent = request.headers.get("user-agent") || "Desconocido"
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"

    // Parse simple device type from user agent
    let device = "Escritorio"
    if (/mobile/i.test(userAgent)) device = "Móvil"
    if (/tablet/i.test(userAgent)) device = "Tablet"

    // Create click analytics entry
    const click = await prisma.adAnalytic.create({
      data: {
        campaignId,
        userId,
        ipAddress,
        device,
      },
    })

    return NextResponse.json({ success: true, message: "Clic registrado", click })
  } catch (error) {
    console.error("Error registering ad click:", error)
    return NextResponse.json({ error: "Error al registrar el clic" }, { status: 500 })
  }
}
