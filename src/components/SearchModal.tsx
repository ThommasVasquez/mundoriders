"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search, X, User, Users, Store, Loader2, Sparkles, CheckCircle2,
  ChevronRight, Flame, ShieldCheck, Tag, ArrowRight, Compass
} from "lucide-react"

type SearchUser = {
  id: string
  nombre: string | null
  username: string | null
  fotoPerfil: string | null
  ciudad: string | null
  tipoRider: string | null
  nivelExperiencia: string | null
  hasActiveStatus: boolean
  motos: { id: string; marca: string; modelo: string; apodo: string | null }[]
}

type SearchGroup = {
  id: string
  tipo: "club" | "rodada"
  nombre: string
  descripcion: string
  ciudad: string
  logoUrl: string | null
  verificado: boolean
  membersCount: number
  link: string
  organizador?: {
    id: string
    nombre: string | null
    username: string | null
    fotoPerfil: string | null
  }
}

type SearchShopItem = {
  id: string
  titulo: string
  descripcion: string
  precio: number
  categoria: string
  fotoUrl: string | null
  ciudad: string
  procedenciaVerificada: boolean
  seller: {
    id: string
    nombre: string | null
    username: string | null
    fotoPerfil: string | null
  }
  link: string
}

type SearchModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"todos" | "pilotos" | "grupos" | "tiendas">("todos")
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState<{
    users: SearchUser[]
    groups: SearchGroup[]
    shops: SearchShopItem[]
  }>({
    users: [],
    groups: [],
    shops: [],
  })

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setResults({ users: [], groups: [], shops: [] })
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Live search effect with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], groups: [], shops: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (data.success) {
          setResults({
            users: data.users || [],
            groups: data.groups || [],
            shops: data.shops || [],
          })
        }
      } catch (err) {
        console.error("Error searching:", err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const totalResults = results.users.length + results.groups.length + results.shops.length
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val)

  const handleSelectResult = (url: string) => {
    onClose()
    router.push(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Search Panel */}
      <div className="w-full max-w-3xl bg-[#0d131c]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Header Input */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <Search className="w-6 h-6 text-primary-orange flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pilotos, grupos de riders, tiendas o artículos..."
            className="w-full bg-transparent text-white placeholder-text-muted text-base sm:text-lg focus:outline-none font-medium"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-primary-orange animate-spin flex-shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-white/10 px-2 py-1 rounded text-text-muted">
              ESC
            </span>
          )}
        </div>

        {/* Filter Category Tabs */}
        {query.trim() && (
          <div className="px-4 py-2 border-b border-white/5 flex gap-2 overflow-x-auto bg-black/30 no-scrollbar">
            <button
              onClick={() => setActiveTab("todos")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "todos"
                  ? "bg-primary-orange text-white shadow-md shadow-primary-orange/20"
                  : "bg-white/5 text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Todos ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab("pilotos")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "pilotos"
                  ? "bg-primary-orange text-white shadow-md shadow-primary-orange/20"
                  : "bg-white/5 text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-400" /> Pilotos ({results.users.length})
            </button>
            <button
              onClick={() => setActiveTab("grupos")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "grupos"
                  ? "bg-primary-orange text-white shadow-md shadow-primary-orange/20"
                  : "bg-white/5 text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" /> Grupos ({results.groups.length})
            </button>
            <button
              onClick={() => setActiveTab("tiendas")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "tiendas"
                  ? "bg-primary-orange text-white shadow-md shadow-primary-orange/20"
                  : "bg-white/5 text-text-muted hover:text-white hover:bg-white/10"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" /> Tiendas & Ventas ({results.shops.length})
            </button>
          </div>
        )}

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
          {!query.trim() ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary-orange/15 border border-primary-orange/30 text-primary-orange mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-base">Buscador Rider</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                Encuentra compas de ruta, clubes moteros, rodadas activas o repuestos y accesorios en las tiendas del Marketplace.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["@thommyenergy", "Yamaha MT09", "Club Bogota", "Casco Shoei", "Rodada Patios"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-[11px] font-medium bg-white/5 border border-white/10 hover:border-primary-orange/40 text-text-muted hover:text-white px-3 py-1 rounded-full transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="py-12 text-center space-y-2">
              <Compass className="w-10 h-10 text-text-muted/40 mx-auto" />
              <h4 className="font-bold text-white text-sm">Sin resultados</h4>
              <p className="text-xs text-text-muted">
                No encontramos coincidencias para &quot;<span className="text-white">{query}</span>&quot;. Intenta con otra palabra clave.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION: PILOTOS (USUARIOS) */}
              {(activeTab === "todos" || activeTab === "pilotos") && results.users.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" /> Pilotos ({results.users.length})
                    </h4>
                    {activeTab === "todos" && results.users.length > 3 && (
                      <button
                        onClick={() => setActiveTab("pilotos")}
                        className="text-[11px] font-bold text-primary-orange hover:underline flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activeTab === "todos" ? results.users.slice(0, 4) : results.users).map((user) => {
                      const userLink = `/garage/${user.username || user.id}`
                      const mainMoto = user.motos && user.motos.length > 0 ? user.motos[0] : null

                      return (
                        <div
                          key={user.id}
                          onClick={() => handleSelectResult(userLink)}
                          className="p-3 bg-white/5 border border-white/5 hover:border-primary-orange/40 hover:bg-white/10 rounded-2xl transition-all cursor-pointer flex items-center gap-3 group"
                        >
                          <div className={`w-11 h-11 rounded-full relative flex-shrink-0 ${user.hasActiveStatus ? "ring-fire p-[2px]" : ""}`}>
                            {user.fotoPerfil ? (
                              <img src={user.fotoPerfil} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-primary-orange/20 flex items-center justify-center text-primary-orange font-bold text-sm">
                                {user.nombre?.[0] || "R"}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm truncate group-hover:text-primary-orange transition-colors">
                                {user.nombre || user.username}
                              </span>
                              {user.username?.toLowerCase().includes("thommyenergy") && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/25 flex-shrink-0" />
                              )}
                            </div>
                            <span className="block text-[11px] text-text-muted truncate">
                              {user.username?.startsWith("@") ? user.username : `@${user.username || "rider"}`}
                              {user.ciudad ? ` • 📍 ${user.ciudad}` : ""}
                            </span>
                            {mainMoto && (
                              <span className="inline-block mt-1 text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-amber-300/90 truncate max-w-full">
                                🏍️ {mainMoto.marca} {mainMoto.modelo}
                              </span>
                            )}
                          </div>

                          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary-orange group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: GRUPOS & CLUBS */}
              {(activeTab === "todos" || activeTab === "grupos") && results.groups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" /> Grupos & Clubs ({results.groups.length})
                    </h4>
                    {activeTab === "todos" && results.groups.length > 3 && (
                      <button
                        onClick={() => setActiveTab("grupos")}
                        className="text-[11px] font-bold text-primary-orange hover:underline flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activeTab === "todos" ? results.groups.slice(0, 4) : results.groups).map((group) => (
                      <div
                        key={group.id}
                        onClick={() => handleSelectResult(group.link)}
                        className="p-3 bg-white/5 border border-white/5 hover:border-blue-500/40 hover:bg-white/10 rounded-2xl transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 overflow-hidden">
                          {group.logoUrl ? (
                            <img src={group.logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                              {group.nombre}
                            </span>
                            {group.verificado && (
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted line-clamp-1">
                            {group.descripcion || "Grupo de riders apasionados por las rutas."}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-blue-500/15 text-blue-300 font-bold px-2 py-0.5 rounded">
                              {group.membersCount} integrantes
                            </span>
                            <span className="text-[10px] text-text-muted">📍 {group.ciudad}</span>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: TIENDAS & MARKETPLACE */}
              {(activeTab === "todos" || activeTab === "tiendas") && results.shops.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-400" /> Tiendas & Repuestos ({results.shops.length})
                    </h4>
                    {activeTab === "todos" && results.shops.length > 3 && (
                      <button
                        onClick={() => setActiveTab("tiendas")}
                        className="text-[11px] font-bold text-primary-orange hover:underline flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activeTab === "todos" ? results.shops.slice(0, 4) : results.shops).map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => handleSelectResult(shop.link)}
                        className="p-3 bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:bg-white/10 rounded-2xl transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {shop.fotoUrl ? (
                            <img src={shop.fotoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-6 h-6 text-emerald-400/60" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="font-extrabold text-white text-sm block truncate group-hover:text-emerald-400 transition-colors">
                            {shop.titulo}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-xs block mt-0.5">
                            {formatCOP(shop.precio)}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-white/10 text-text-muted px-2 py-0.5 rounded font-mono uppercase">
                              {shop.categoria}
                            </span>
                            {shop.procedenciaVerificada && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verificado
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-text-muted">
          <span>Consejo: Presiona <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">ESC</kbd> para salir.</span>
          <span className="font-mono font-bold text-primary-orange">RAIDER SEARCH v1.0</span>
        </div>
      </div>
    </div>
  )
}
