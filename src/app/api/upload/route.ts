
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { AwsClient } from "aws4fetch"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Validar límite de tamaño para evitar crasheos de memoria en Cloudflare (128MB max en Edge)
    const MAX_SIZE = 12 * 1024 * 1024 // 12MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `El archivo supera el límite de 12MB permitido para subidas en el Edge (${(file.size / (1024 * 1024)).toFixed(1)}MB). Por favor comprime el archivo.` 
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const fileData = new Uint8Array(bytes)

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`

    const s3AccessKey = process.env.S3_ACCESS_KEY_ID
    const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY
    const s3Bucket = process.env.S3_BUCKET_NAME
    const s3Endpoint = process.env.S3_ENDPOINT  // S3 API endpoint, e.g. https://account.r2.cloudflarestorage.com
    const s3PublicUrl = process.env.S3_PUBLIC_URL // Public CDN URL, e.g. https://pub-xxx.r2.dev OR https://assets.mundoriders.com

    // ── Producción: subir a S3/R2 ───────────────────────────────────────────
    if (s3AccessKey && s3SecretKey && s3Bucket) {
      const aws = new AwsClient({
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
        region: process.env.S3_REGION || "auto",
        service: "s3",
      })

      if (!s3Endpoint) {
        throw new Error("S3_ENDPOINT no está configurado")
      }

      const cleanEndpoint = s3Endpoint.replace(/\/$/, "")
      const uploadUrl = `${cleanEndpoint}/${s3Bucket}/${uniqueFilename}`

      const response = await aws.fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: fileData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`R2/S3 upload failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // URL pública del archivo subido:
      let publicUrl: string
      if (s3PublicUrl) {
        publicUrl = `${s3PublicUrl.replace(/\/$/, "")}/${uniqueFilename}`
      } else {
        publicUrl = `/api/media/${uniqueFilename}`
      }

      return NextResponse.json({ success: true, url: publicUrl })
    }

    // ── Desarrollo local: guardar en public/uploads/ ─────────────────────────
    if (process.env.NODE_ENV !== "production") {
      try {
        // @ts-ignore
        const fs = typeof require !== "undefined" ? eval('require("fs/promises")') : null
        // @ts-ignore
        const path = typeof require !== "undefined" ? eval('require("path")') : null
        if (!fs || !path) {
          throw new Error("El sistema de archivos local no está disponible en este entorno")
        }
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        await fs.mkdir(uploadsDir, { recursive: true })
        await fs.writeFile(path.join(uploadsDir, uniqueFilename), fileData)
        const publicUrl = `/uploads/${uniqueFilename}`
        return NextResponse.json({ success: true, url: publicUrl })
      } catch (fsError: any) {
        return NextResponse.json({
          error: "Error al guardar el archivo localmente",
          details: fsError?.message || String(fsError),
        }, { status: 500 })
      }
    }

    // ── Producción sin S3 configurado ────────────────────────────────────────
    return NextResponse.json({
      error: "El almacenamiento S3/R2 no está configurado. Configura S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME y S3_ENDPOINT en Cloudflare Pages.",
      hint: "Ve a Cloudflare Dashboard → Pages → mundoriders → Settings → Environment Variables",
    }, { status: 503 })

  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json({
      error: `Error al subir el archivo: ${error?.message || String(error)}`,
      details: error?.stack || String(error),
    }, { status: 500 })
  }
}
