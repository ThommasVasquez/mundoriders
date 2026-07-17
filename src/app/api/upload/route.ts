
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExtension = file.name.split(".").pop() || ""
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`

    const s3AccessKey = process.env.S3_ACCESS_KEY_ID
    const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY
    const s3Bucket = process.env.S3_BUCKET_NAME
    const s3Endpoint = process.env.S3_ENDPOINT

    if (!s3AccessKey || !s3SecretKey || !s3Bucket) {
      return NextResponse.json({ 
        error: "El almacenamiento S3 no está configurado. Por favor configura las variables de entorno S3 en Cloudflare." 
      }, { status: 400 })
    }

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

    const publicUrl = s3Endpoint
      ? `${s3Endpoint}/${s3Bucket}/${uniqueFilename}`
      : `https://${s3Bucket}.s3.amazonaws.com/${uniqueFilename}`

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }
}
