"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Flame, User, LogOut, MessageSquare, Compass, Bell, Sun, Moon, Store, Users, Bookmark, Wrench, Sliders, Gauge } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()
  const [hasActiveStatus, setHasActiveStatus] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light")
    setIsDark(!isLight)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showMenu && !target.closest(".navbar-settings-container")) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [showMenu])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      setIsDark(false)
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
      setIsDark(true)
      localStorage.setItem("theme", "dark")
    }
  }

  const checkStatus = async () => {
    if (!session?.user) return
    try {
      const res = await fetch("/api/garage/status")
      if (!res.ok) return
      const data = await res.json()
      setHasActiveStatus(!!data?.activeStatus)
    } catch (err) {
      console.warn("Error checking status silently:", err)
    }
  }

  useEffect(() => {
    checkStatus()
    
    // Listen to live status updates
    window.addEventListener("status-updated", checkStatus)
    return () => {
      window.removeEventListener("status-updated", checkStatus)
    }
  }, [session])

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/autopista" className="flex items-center space-x-2 text-primary-orange">
              <Flame className="w-8 h-8 fill-current" />
              <span className="text-xl font-extrabold tracking-wider font-mono">RIDER</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/autopista" className="text-text-muted hover:text-white transition-colors text-sm font-medium">
              Autopista
            </Link>
            <span className="text-white/10 text-sm">|</span>
            <Link href="/centro-motero" className="text-text-muted hover:text-white transition-colors text-sm font-medium">
              Centro Motero
            </Link>
            <span className="text-white/10 text-sm">|</span>
            <span className="text-text-muted text-sm font-medium cursor-not-allowed opacity-50 flex items-center gap-1" title="Próximamente">
              <Compass className="w-4 h-4" /> Rodadas
            </span>
            <Link href="/intercom" className="text-text-muted hover:text-white transition-colors text-sm font-medium">
              Intercom
            </Link>
          </div>

          {/* Right Section: User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {session && session.user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={`/garage/${session.user.username || session.user.id}`}
                  className="flex items-center space-x-2.5 p-1 px-3 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {session.user.image ? (
                    <div className={hasActiveStatus ? "ring-fire-sm" : ""}>
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Garage"}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary-orange/20 border border-primary-orange/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-orange" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold text-white/90">
                    {session.user.username?.startsWith("@") ? session.user.username : `@${session.user.username || "rider"}`}
                  </span>
                </Link>

                <div className="relative navbar-settings-container">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                    title="Ajustes de Piloto"
                  >
                    <Gauge className="w-5 h-5 hover:rotate-12 transition-transform duration-300" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-12 mt-1 w-64 bg-[#0e141c]/98 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md flex flex-col gap-0.5 text-left text-white animate-in fade-in slide-in-from-top-2 duration-150">
                      
                      {/* Theme Toggle */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? (
                            <Sun className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Moon className="w-4 h-4 text-indigo-400" />
                          )}
                          <span>Modo {isDark ? "Claro" : "Oscuro"}</span>
                        </div>
                        <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded font-mono uppercase">
                          {isDark ? "Light" : "Dark"}
                        </span>
                      </button>

                      <div className="h-px bg-white/5 my-1" />

                      {/* Crear Tienda */}
                      <Link
                        href="/centro-motero#marketplace"
                        onClick={() => setShowMenu(false)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>Crear Tienda (Ventas)</span>
                      </Link>

                      {/* Crear Grupo de Riders */}
                      <Link
                        href="/centro-motero#convoy"
                        onClick={() => setShowMenu(false)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>Crear Grupo de Riders</span>
                      </Link>

                      {/* Publicaciones Guardadas */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          alert("Publicaciones Guardadas: Se ha cargado tu garaje de publicaciones archivadas.")
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-yellow-400" />
                        <span>Publicaciones Guardadas</span>
                      </button>

                      {/* Mi Garage */}
                      <Link
                        href={`/garage/${session.user.username || session.user.id}`}
                        onClick={() => setShowMenu(false)}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Wrench className="w-4 h-4 text-primary-orange" />
                        <span>Mi Garage</span>
                      </Link>

                      {/* Ajustes de Intercom */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          alert("Ajustes de Intercomunicador: Volumen y canales Cardo/Sena sincronizados.")
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-4 h-4 text-purple-400" />
                        <span>Ajustes de Intercom</span>
                      </button>

                      <div className="h-px bg-white/5 my-1" />

                      {/* Cerrar Sesión */}
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>

                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="py-1.5 px-4 bg-primary-orange hover:bg-primary-orange-hover text-white text-sm font-bold rounded-lg transition-all"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
