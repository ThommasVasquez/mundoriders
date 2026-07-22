import { NextResponse } from "next/server"
import { AwsClient } from "aws4fetch"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params

    if (!filename || filename.includes("..") || filename.includes("/")) {
      return new Response("Nombre de archivo inválido", { status: 400 })
    }

    const s3AccessKey = process.env.S3_ACCESS_KEY_ID
    const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY
    const s3Bucket = process.env.S3_BUCKET_NAME
    const s3Endpoint = process.env.S3_ENDPOINT

    if (!s3AccessKey || !s3SecretKey || !s3Bucket || !s3Endpoint) {
      return new Response("Almacenamiento R2 no configurado", { status: 503 })
    }

    const aws = new AwsClient({
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
      region: process.env.S3_REGION || "auto",
      service: "s3",
    })

    const cleanEndpoint = s3Endpoint.replace(/\/$/, "")
    const objectUrl = `${cleanEndpoint}/${s3Bucket}/${filename}`

    const response = await aws.fetch(objectUrl, {
      method: "GET",
    })

    if (!response.ok) {
      return new Response("Archivo no encontrado", { status: response.status })
    }

    // Infer content type from filename extension or R2 response header
    let contentType = response.headers.get("content-type")
    if (!contentType || contentType === "application/octet-stream") {
      const ext = filename.split(".").pop()?.toLowerCase()
      if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg"
      else if (ext === "png") contentType = "image/png"
      else if (ext === "webp") contentType = "image/webp"
      else if (ext === "gif") contentType = "image/gif"
      else if (ext === "mp4") contentType = "video/mp4"
      else if (ext === "webm") contentType = "video/webm"
      else if (ext === "mov") contentType = "video/quicktime"
      else contentType = "application/octet-stream"
    }

    const body = await response.arrayBuffer()

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    console.error("Error serving R2 media file:", error)
    return new Response("Error al servir archivo", { status: 500 })
  }
}
