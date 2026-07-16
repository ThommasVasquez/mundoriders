import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExtension = file.name.split(".").pop() || ""
    const uniqueFilename = `${randomUUID()}.${fileExtension}`

    // 1. Intentar subir a S3 si las variables están configuradas
    const s3AccessKey = process.env.S3_ACCESS_KEY_ID
    const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY
    const s3Bucket = process.env.S3_BUCKET_NAME
    const s3Endpoint = process.env.S3_ENDPOINT

    if (s3AccessKey && s3SecretKey && s3Bucket) {
      try {
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
            Body: buffer,
            ContentType: file.type,
          })
        )

        // URL del objeto S3
        const publicUrl = s3Endpoint
          ? `${s3Endpoint}/${s3Bucket}/${uniqueFilename}`
          : `https://${s3Bucket}.s3.amazonaws.com/${uniqueFilename}`

        return NextResponse.json({ success: true, url: publicUrl })
      } catch (s3Error) {
        console.warn("Fallo al subir a S3, reintentando con guardado local:", s3Error)
      }
    }

    // 2. Fallback: Guardar localmente en public/uploads/
    const uploadsDir = join(process.cwd(), "public", "uploads")
    
    // Crear el directorio si no existe
    await mkdir(uploadsDir, { recursive: true })
    
    const filePath = join(uploadsDir, uniqueFilename)
    await writeFile(filePath, buffer)

    const localUrl = `/uploads/${uniqueFilename}`

    return NextResponse.json({ success: true, url: localUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }
}
