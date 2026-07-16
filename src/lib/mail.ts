declare const __non_webpack_require__: any;

let transporter: any = null;

export async function sendVerificationEmail(to: string, code: string) {
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
    if (process.env.NEXT_RUNTIME === 'edge') {
      // Direct HTTP API fallback if using Resend (100% Edge compatible)
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || 'Rider App <onboarding@resend.dev>',
            to,
            subject: "Verifica tu cuenta RIDER",
            html: `
              <div style="font-family: sans-serif; background-color: #080b0e; color: #f3f4f6; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
                <h2>Código de Verificación</h2>
                <div style="font-size: 36px; font-weight: 800; color: #ff6a00;">${code}</div>
              </div>
            `
          })
        });
        if (response.ok) {
          const data = await response.json();
          return { success: true, messageId: (data as any).id };
        }
      }
      console.warn("SMTP email sending not supported in Edge runtime without RESEND_API_KEY. Using logged console code.");
      return { success: true, mocked: true };
    }

    // Node.js environment - load nodemailer dynamically to prevent Edge compiler errors
    if (!transporter) {
      const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require;
      const nodemailer = req("nodemailer");
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      })
    }

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
            <p style="color: #8e9cae; font-size: 11px;">Este código expira en 10clock. Si no solicitaste este registro, por favor ignora este correo.</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}
