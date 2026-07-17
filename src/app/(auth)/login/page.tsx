"use client"

import React, { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Phone, Mail, Lock, ShieldCheck, Flame, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"email" | "phone">("phone") // OTP por celular por defecto
  
  // Estados para Email
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Estados para OTP Celular
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [mockOtp, setMockOtp] = useState("")

  // Estados comunes
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get("error")
      if (errorParam) {
        if (errorParam === "CredentialsSignin") {
          setErrorMsg("Credenciales incorrectas")
        } else if (errorParam === "Configuration") {
          setErrorMsg("Configuración de base de datos o credenciales incorrecta.")
        } else {
          setErrorMsg(`Error de inicio de sesión: ${errorParam}`)
        }
      }
    }
  }, [])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el OTP")
      }

      setOtpSent(true)
      setSuccessMsg(data.message)
      if (data.mockCode) {
        setMockOtp(data.mockCode)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const res = await signIn("phone-otp", {
        phone,
        code: otpCode,
        redirect: false,
      })

      if (res?.error) {
        setErrorMsg("Código OTP incorrecto o expirado")
      } else {
        router.push("/autopista")
        router.refresh()
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setErrorMsg("Credenciales incorrectas")
      } else {
        router.push("/autopista")
        router.refresh()
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/autopista" })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-orange/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-2 text-primary-orange mb-2">
            <Flame className="w-10 h-10 fill-current animate-pulse" />
            <span className="text-3xl font-extrabold tracking-wider font-mono">RIDER</span>
          </div>
          <p className="text-text-muted text-sm">Red Social de Motociclistas en Colombia</p>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-black/40 p-1.5 rounded-lg border border-white/5">
          <button
            onClick={() => {
              setActiveTab("phone")
              setErrorMsg("")
              setSuccessMsg("")
            }}
            className={`py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "phone"
                ? "bg-primary-orange text-white shadow-lg"
                : "text-text-muted hover:text-white"
            }`}
          >
            Celular (OTP)
          </button>
          <button
            onClick={() => {
              setActiveTab("email")
              setErrorMsg("")
              setSuccessMsg("")
            }}
            className={`py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "email"
                ? "bg-primary-orange text-white shadow-lg"
                : "text-text-muted hover:text-white"
            }`}
          >
            Correo
          </button>
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

        {/* MOCK OTP BANNER FOR DEV */}
        {activeTab === "phone" && otpSent && mockOtp && (
          <div className="mb-4 p-3 bg-primary-orange-glow border border-primary-orange/30 rounded-lg text-primary-orange text-xs flex flex-col gap-1">
            <span className="font-semibold">Simulador de SMS (Modo Dev):</span>
            <span>Código de verificación generado: <strong className="text-white text-sm tracking-widest">{mockOtp}</strong></span>
          </div>
        )}

        {/* Phone OTP Form */}
        {activeTab === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Número de Celular
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-text-muted text-sm">+57</span>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="3001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-3.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/10 disabled:text-text-muted text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Enviar Código OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Código OTP Recibido
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                    <input
                      id="otp"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Escribe el código"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-lg tracking-widest text-center focus:border-primary-orange focus:outline-none transition-colors"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode("")
                    }}
                    className="w-1/3 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="w-2/3 py-3.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/10 disabled:text-text-muted text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verificar y Entrar</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Email Form */}
        {activeTab === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  id="pass"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-base focus:border-primary-orange focus:outline-none transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || password.length < 6}
              className="w-full py-3.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/10 disabled:text-text-muted text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Iniciar Sesión</span>}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-white/10" />
          <span className="text-text-muted text-xs uppercase tracking-widest">O también</span>
          <span className="w-1/5 border-b border-white/10" />
        </div>

        {/* Google login */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 px-4 border border-white/10 hover:bg-white/5 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Acceder con Google</span>
        </button>

        {/* Register redirection */}
        <div className="mt-8 text-center text-xs text-text-muted">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="text-primary-orange hover:underline font-bold">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
