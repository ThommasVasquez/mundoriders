"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, Phone, UserPlus, Flame, Loader2, ShieldCheck } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  
  const [step, setStep] = useState<"form" | "verify">("form")
  const [verificationCode, setVerificationCode] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          username,
          email,
          password,
          phone: phone || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el usuario")
      }

      setSuccessMsg("Código de verificación enviado a tu correo. Por favor, revísalo.")
      setStep("verify")
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          username,
          email,
          password,
          phone: phone || undefined,
          code: verificationCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Código incorrecto o expirado")
      }

      setSuccessMsg("¡Registro exitoso! Redirigiéndote al inicio de sesión...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      >
        <source src="/moto.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65 -z-10" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-orange/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-2 text-primary-orange mb-2">
            <Flame className="w-10 h-10 fill-current animate-pulse" />
            <span className="text-3xl font-extrabold tracking-wider font-mono">RIDER</span>
          </div>
          <p className="text-text-muted text-sm">Únete a la comunidad biker de Colombia</p>
        </div>

        {/* Feedbacks */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-950/50 border border-green-500/30 rounded-lg text-green-200 text-xs">
            {successMsg}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="nombre"
                  type="text"
                  required
                  placeholder="Pedro Picapiedra"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Nombre de Usuario (@username)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-text-muted text-base">@</span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="pedrobiker"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="pedro@rider.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Número de Celular (Opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="3001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                  inputMode="tel"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="pass"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !nombre || !username || !email || password.length < 6}
              className="w-full py-3.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/10 disabled:text-text-muted text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Crear Cuenta RIDER</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Código de Verificación Recibido
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Escribe el código de 6 dígitos"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-lg tracking-widest text-center focus:border-primary-orange focus:outline-none transition-colors"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("form")
                  setVerificationCode("")
                  setErrorMsg("")
                  setSuccessMsg("")
                }}
                className="w-1/3 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-2/3 py-3.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/10 disabled:text-text-muted text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verificar y Crear</span>}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-text-muted">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-primary-orange hover:underline font-bold">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}

