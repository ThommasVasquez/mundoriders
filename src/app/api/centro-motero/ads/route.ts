export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const adSchema = z.object({
  sponsorName: z.string().min(2, "El nombre del sponsor es requerido"),
  titulo: z.string().min(3, "El título es requerido"),
  descripcion: z.string().min(5, "La descripción es requerida"),
  targetUrl: z.string().url("Debe ser una URL válida"),
  bannerUrl: z.string().min(5, "El banner multimedia es requerido"),
  categoria: z.string().optional().default("REPUESTOS"),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  budgetLimit: z.number().positive("El límite de presupuesto debe ser positivo"),
})

export async function GET() {
  try {
    const now = new Date()
    
    // Find active campaigns that are within their date limits
    const campaigns = await prisma.adCampaign.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Increment impressions in background/async (without blocking GET response)
    if (campaigns.length > 0) {
      const ids = campaigns.map((c) => c.id)
      await prisma.adCampaign.updateMany({
        where: { id: { in: ids } },
        data: {
          impressions: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true, ads: campaigns })
  } catch (error: any) {
    console.error("Error fetching ad campaigns:", error)
    return NextResponse.json({
      success: false,
      ads: [],
      error: error?.message || String(error),
    }, { status: 200 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = adSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const {
      sponsorName, titulo, descripcion, targetUrl, bannerUrl, categoria,
      startDate, endDate, budgetLimit
    } = parsed.data

    const campaign = await prisma.adCampaign.create({
      data: {
        sponsorName,
        titulo,
        descripcion,
        targetUrl,
        bannerUrl,
        categoria,
        startDate,
        endDate,
        budgetLimit,
        active: true,
        impressions: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Campaña publicitaria creada exitosamente",
      campaign,
    })
  } catch (error) {
    console.error("Error creating ad campaign:", error)
    return NextResponse.json({ error: "Error al crear la campaña publicitaria" }, { status: 500 })
  }
}
