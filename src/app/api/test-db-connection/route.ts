import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const envVars = {
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + "..." : "none",
    AUTH_SECRET_EXISTS: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
    AUTH_GOOGLE_ID_EXISTS: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET_EXISTS: !!process.env.AUTH_GOOGLE_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "none",
    NODE_ENV: process.env.NODE_ENV,
  }

  try {
    console.log("[TestDB] Testing query execution...")
    const userCount = await prisma.user.count()
    return NextResponse.json({
      status: "success",
      message: `Successfully connected to DB! Total users: ${userCount}`,
      envVars,
    })
  } catch (error: any) {
    console.error("[TestDB] Connection failed:", error)
    return NextResponse.json({
      status: "error",
      message: error.message || "Unknown error",
      stack: error.stack,
      errorName: error.name,
      envVars,
    }, { status: 500 })
  }
}
