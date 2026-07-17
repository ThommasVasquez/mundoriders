
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const session = await auth()
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")

  try {
    // If campaignId is provided, get metrics for that specific campaign.
    // If not, return metrics for all campaigns created.
    if (campaignId) {
      const campaign = await prisma.adCampaign.findUnique({
        where: { id: campaignId },
        include: {
          clicks: {
            include: {
              campaign: {
                select: {
                  sponsorName: true,
                }
              }
            }
          },
        },
      })

      if (!campaign) {
        return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 })
      }

      const totalClicks = campaign.clicks.length
      const ctr = campaign.impressions > 0 
        ? ((totalClicks / campaign.impressions) * 100).toFixed(2) 
        : "0.00"

      // Device breakdown
      const devices = campaign.clicks.reduce((acc: Record<string, number>, click) => {
        const deviceType = click.device || "Escritorio"
        acc[deviceType] = (acc[deviceType] || 0) + 1
        return acc
      }, {})

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          sponsorName: campaign.sponsorName,
          titulo: campaign.titulo,
          descripcion: campaign.descripcion,
          active: campaign.active,
          impressions: campaign.impressions,
          totalClicks,
          ctr: Number(ctr),
          devices,
        }
      })
    } else {
      // Get all campaigns
      const campaigns = await prisma.adCampaign.findMany({
        include: {
          clicks: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      const summaryList = campaigns.map((campaign) => {
        const totalClicks = campaign.clicks.length
        const ctr = campaign.impressions > 0 
          ? ((totalClicks / campaign.impressions) * 100).toFixed(2) 
          : "0.00"

        return {
          id: campaign.id,
          sponsorName: campaign.sponsorName,
          titulo: campaign.titulo,
          descripcion: campaign.descripcion,
          active: campaign.active,
          impressions: campaign.impressions,
          totalClicks,
          ctr: Number(ctr),
          createdAt: campaign.createdAt,
        }
      })

      return NextResponse.json({ success: true, campaigns: summaryList })
    }
  } catch (error) {
    console.error("Error fetching ad analytics:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas de publicidad" }, { status: 500 })
  }
}
