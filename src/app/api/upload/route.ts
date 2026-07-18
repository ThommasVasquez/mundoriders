
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

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
      const s3 = new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
        },
      })

      await s3.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: uniqueFilename,
          Body: fileData,
          ContentType: file.type,
          // ACL public-read para AWS S3. Para Cloudflare R2 con acceso público, omitir ACL.
          ...(s3Endpoint?.includes("r2.cloudflarestorage.com") ? {} : { ACL: "public-read" }),
        })
      )

      // URL pública del archivo subido:
      let publicUrl: string
      if (s3PublicUrl) {
        publicUrl = `${s3PublicUrl.replace(/\/$/, "")}/${uniqueFilename}`
      } else if (s3Endpoint?.includes("r2.cloudflarestorage.com")) {
        // R2 sin dominio público configurado: devolver URL del bucket público si existe
        publicUrl = `https://${s3Bucket}.r2.dev/${uniqueFilename}`
      } else {
        publicUrl = `https://${s3Bucket}.s3.amazonaws.com/${uniqueFilename}`
      }

      return NextResponse.json({ success: true, url: publicUrl })
    }

    // ── Desarrollo local: guardar en public/uploads/ ─────────────────────────
    if (process.env.NODE_ENV !== "production") {
      try {
        const fs = await import("fs/promises")
        const path = await import("path")
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
      error: "Error al subir el archivo",
      details: error?.message || String(error),
    }, { status: 500 })
  }
}
