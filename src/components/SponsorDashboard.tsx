"use client"

import React, { useState, useEffect } from "react"
import { 
  BarChart3, Globe, Plus, Calendar, Tag, ShieldAlert,
  Loader2, Play, Eye, MousePointerClick, TrendingUp, Sparkles, X, Image as ImageIcon
} from "lucide-react"

type AdCampaignSummary = {
  id: string
  sponsorName: string
  titulo: string
  descripcion: string
  categoria: string
  active: boolean
  impressions: number
  totalClicks: number
  ctr: number
  createdAt: string
}

export default function SponsorDashboard({ onClose }: { onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<AdCampaignSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"analytics" | "create">("analytics")
  
  // Form state
  const [sponsorName, setSponsorName] = useState("")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [categoria, setCategoria] = useState("REPUESTOS")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
  const [budgetLimit, setBudgetLimit] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/centro-motero/ads/analytics")
      const data = await res.json()
      if (data.success) {
        setCampaigns(data.campaigns)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) {
        setBannerUrl(data.url)
      } else {
        alert("Error al subir el banner")
      }
    } catch {
      alert("Error de conexión al subir el banner")
    } finally {
      setUploadingBanner(false)
    }
  }

  // Handle Campaign Submit
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerUrl) {
      alert("Debes subir un banner multimedia para la campaña")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/centro-motero/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorName,
          titulo,
          descripcion,
          targetUrl,
          bannerUrl,
          categoria,
          startDate,
          endDate,
          budgetLimit: Number(budgetLimit),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert("¡Campaña publicitaria creada y activa exitosamente!")
        // Reset form
        setSponsorName("")
        setTitulo("")
        setDescripcion("")
        setTargetUrl("")
        setBannerUrl("")
        setBudgetLimit("")
        setActiveTab("analytics")
        fetchCampaigns()
      } else {
        alert(data.error || "Error al crear campaña")
      }
    } catch (err) {
      console.error(err)
      alert("Error al conectar con el servidor")
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate aggregations
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0)
  const totalClicks = campaigns.reduce((acc, c) => acc + c.totalClicks, 0)
  const averageCtr = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
    : "0.00"

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl p-6 bg-neutral-950/90 relative max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary-orange w-5 h-5" />
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Panel de Campañas Sponsors <Sparkles className="text-yellow-400 w-4 h-4 animate-pulse" />
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-primary-orange text-white"
                : "bg-white/5 hover:bg-white/10 text-text-muted hover:text-white"
            }`}
          >
            📊 Estadísticas y Métricas
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "create"
                ? "bg-primary-orange text-white"
                : "bg-white/5 hover:bg-white/10 text-text-muted hover:text-white"
            }`}
          >
            ➕ Lanzar Campaña Publicitaria
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
          
          {/* TAB 1: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Aggregation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">Impresiones Totales</span>
                    <h3 className="text-lg font-black text-white mt-1">{totalImpressions.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">Clics en Banners</span>
                    <h3 className="text-lg font-black text-white mt-1">{totalClicks.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <MousePointerClick className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold">CTR Medio</span>
                    <h3 className="text-lg font-black text-primary-orange mt-1">{averageCtr}%</h3>
                  </div>
                  <div className="p-3 bg-primary-orange/10 text-primary-orange rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Campaigns Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Historial de Campañas Activas</h4>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-orange" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-xs text-text-muted">No has creado ninguna campaña publicitaria aún.</p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-text-muted">
                      <div className="col-span-4">Campaña / Sponsor</div>
                      <div className="col-span-2 text-center">Categoría</div>
                      <div className="col-span-2 text-center">Impresiones</div>
                      <div className="col-span-2 text-center">Clics</div>
                      <div className="col-span-2 text-center">CTR</div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {campaigns.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 px-4 py-3 items-center text-xs text-white">
                          <div className="col-span-4">
                            <span className="font-extrabold block text-sm">{c.titulo}</span>
                            <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Sponsor: {c.sponsorName}</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="px-2 py-0.5 rounded text-[8px] font-black bg-white/5 text-primary-orange border border-white/10 uppercase">
                              {c.categoria}
                            </span>
                          </div>
                          <div className="col-span-2 text-center font-bold">{c.impressions.toLocaleString()}</div>
                          <div className="col-span-2 text-center font-bold">{c.totalClicks.toLocaleString()}</div>
                          <div className="col-span-2 text-center font-black text-emerald-400">{c.ctr}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CREATE CAMPAIGN */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Nombre del Sponsor *</label>
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="Ej. Motul Colombia S.A."
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Título de la Campaña *</label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej. Nuevo lubricante Motul 7100"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">URL de Destino *</label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="Ej. https://www.motul.com/co"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Límite de Presupuesto (COP) *</label>
                  <input
                    type="number"
                    required
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    placeholder="Ej. 500000"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Categoría del Producto</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 cursor-pointer"
                  >
                    <option value="REPUESTOS">🔩 Repuestos / Aceites</option>
                    <option value="ACCESORIOS">🛡️ Cascos / Protección</option>
                    <option value="MOTOS">🏍️ Concesionarios / Motos</option>
                    <option value="OTROS">🎒 Accesorios de viaje</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Inicio de Campaña</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Fin de Campaña</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Descripción del anuncio *</label>
                <textarea
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe el copy promocional del anuncio..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 resize-none"
                />
              </div>

              {/* Banner Upload */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-primary-orange w-4 h-4" />
                  <h4 className="text-xs font-black uppercase text-white">Diseño del Banner Publicitario</h4>
                </div>
                <p className="text-[10px] text-text-muted">Sube el banner oficial de la campaña (formato horizontal recomendado, admite JPG, PNG o MP4).</p>

                {bannerUrl && (
                  <div className="relative w-full max-w-lg h-36 rounded-xl overflow-hidden border border-white/10 bg-black">
                    {bannerUrl.match(/\.(mp4|mov|webm)/i) ? (
                      <video src={bannerUrl} autoPlay loop muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={bannerUrl} alt="banner-preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setBannerUrl("")}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <label className={`flex items-center gap-2 py-2 px-4 rounded-xl border border-dashed text-xs font-bold transition-all cursor-pointer w-fit ${
                  uploadingBanner
                    ? "border-primary-orange/30 text-text-muted bg-white/5 cursor-not-allowed"
                    : "border-white/20 hover:border-primary-orange/50 text-text-muted hover:text-white bg-white/5 hover:bg-white/10"
                }`}>
                  {uploadingBanner ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-primary-orange" /> Subiendo banner...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Subir Banner Multimedia</>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={handleBannerUpload}
                  />
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => setActiveTab("analytics")}
                  type="button"
                  className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingBanner}
                  className="py-2 px-5 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-neutral-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando campaña...</> : "🚀 Activar Campaña"}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  )
}
