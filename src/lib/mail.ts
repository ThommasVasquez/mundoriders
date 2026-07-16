import nodemailer from "nodemailer"

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
})

export async function sendVerificationEmail(to: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Rider App" <no-reply@riderapp.com>',
    to,
    subject: "Verifica tu cuenta RIDER",
    html: `
      <div style="font-family: 'Comfortaa', sans-serif; background-color: #080b0e; color: #f3f4f6; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto; border: 1px solid rgba(255,255,255,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6a00; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: 2px;">RIDER</h1>
          <p style="color: #8e9cae; font-size: 14px; margin-top: 5px;">Comunidad Biker de Colombia</p>
        </div>
        <div style="background-color: rgba(15, 22, 30, 0.75); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; text-align: center;">
          <h2 style="font-size: 20px; margin-bottom: 20px; font-weight: 700; color: #fff;">Código de Verificación</h2>
          <p style="color: #8e9cae; font-size: 14px; margin-bottom: 25px; line-height: 1.6;">Usa el siguiente código de 6 dígitos para verificar tu dirección de correo electrónico y completar tu registro en Rider.</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff6a00; background-color: rgba(255, 106, 0, 0.08); padding: 15px; border-radius: 8px; display: inline-block; margin-bottom: 25px; border: 1px solid rgba(255,106,0,0.2);">
            ${code}
          </div>
          <p style="color: #8e9cae; font-size: 11px;">Este código expira en 10 minutos. Si no solicitaste este registro, por favor ignora este correo.</p>
        </div>
      </div>
    `,
  }

  // Fallback logs for local development when credentials are not configured
  console.log(`\n--- REGISTRATION EMAIL CODE GENERATED ---`)
  console.log(`Destinatario: ${to}`)
  console.log(`Código: ${code}`)
  console.log(`-----------------------------------------\n`)

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("SMTP credentials missing. Logging verification code to console (Dev Mode).")
    return { success: true, mocked: true }
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}
