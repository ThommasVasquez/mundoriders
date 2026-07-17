"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import SponsorDashboard from "@/components/SponsorDashboard"
import { 
  Navigation, ShieldAlert, ShoppingBag, Landmark, Award, 
  MapPin, Loader2, Sparkles, AlertTriangle, CheckCircle2, User,
  Volume2, ShieldCheck, Plus, Search, Tag, Phone, Trash2, Calendar, MessageSquare,
  Wrench, PlusCircle, Edit, Radio, Zap, EyeOff, Flame, Bell
} from "lucide-react"

type MarketplaceItem = {
  id: string
  titulo: string
  descripcion: string
  precio: number
  categoria: string
  motoModelo: string | null
  fotoUrl: string | null
  fotosUrls: string[]
  ciudad: string
  telefonoContact: string
  motoOrigenPlaca: string | null
  motoOrigenVin: string | null
  documentoVerificacionUrl: string | null
  procedenciaVerificada: boolean
  createdAt: string
  user: {
    id: string
    username: string | null
    nombre: string | null
    fotoPerfil: string | null
  }
}

type Challenge = {
  id: string
  nombre: string
  descripcion: string
  puntos: number
  medallaName: string
  medallaIcon: string
  progresses: {
    progreso: number
    completado: boolean
  }[]
}

type CityRestriction = {
  ciudad: string
  picoYPlaca: string
  parrillero: string
  chaleco: string
}

const getMapCoords = (lat: number, lng: number) => {
  const minLat = 4.65
  const maxLat = 4.685
  const minLng = -74.05
  const maxLng = -74.015

  const pctLat = (lat - minLat) / (maxLat - minLat)
  const pctLng = (lng - minLng) / (maxLng - minLng)

  const cPctLat = Math.max(0, Math.min(1, pctLat))
  const cPctLng = Math.max(0, Math.min(1, pctLng))

  const x = 10 + cPctLng * 80
  const y = 90 - cPctLat * 80

  return { x: `${x}%`, y: `${y}%` }
}

export default function CentroMotero() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"convoy" | "sos" | "marketplace" | "normativa" | "challenges">("convoy")

  // State for Marketplace
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([])
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [marketFilter, setMarketFilter] = useState("TODOS")
  const [marketCity, setMarketCity] = useState("TODOS")
  const [showAddListing, setShowAddListing] = useState(false)
  const [newListing, setNewListing] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    categoria: "REPUESTOS",
    motoModelo: "",
    ciudad: "Bogotá",
    telefonoContact: "",
    motoOrigenPlaca: "",
    motoOrigenVin: "",
    documentoVerificacionUrl: "",
  })
  const [submittingListing, setSubmittingListing] = useState(false)
  const [listingFotosUrls, setListingFotosUrls] = useState<string[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [activeMedia, setActiveMedia] = useState<Record<string, number>>({})
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [showSponsorDashboard, setShowSponsorDashboard] = useState(false)
  const [activeAds, setActiveAds] = useState<any[]>([])

  // State for SOS Rescue
  const [sendingSOS, setSendingSOS] = useState(false)
  const [sosStatus, setSosStatus] = useState<"idle" | "searching" | "success" | "error">("idle")
  const [nearbyHelpers, setNearbyHelpers] = useState<any[]>([])

  // State for City Restrictions
  const [selectedCity, setSelectedCity] = useState("BOGOTA")
  const [restrictions, setRestrictions] = useState<CityRestriction | null>(null)
  const [loadingRestrictions, setLoadingRestrictions] = useState(false)

  // State for Documents Expiration Tracker
  const [soatDate, setSoatDate] = useState("2026-12-15")
  const [technoDate, setTechnoDate] = useState("2026-10-10")

  // State for Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loadingChallenges, setLoadingChallenges] = useState(false)

  // State for Convoy/Rodadas
  const [isStreamingLocation, setIsStreamingLocation] = useState(false)
  const [convoyRiders, setConvoyRiders] = useState<any[]>([])
  const [loadingConvoy, setLoadingConvoy] = useState(false)
  const [mockRiderPos, setMockRiderPos] = useState({ lat: 4.65, lng: -74.05 })
  const convoyInterval = useRef<any>(null)

  // Auto-Intercom States
  const [isIntercomMuted, setIsIntercomMuted] = useState(false)
  const [intercomChannel, setIntercomChannel] = useState("Canal 1 (General)")
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const [pairedDevice, setPairedDevice] = useState<string | null>(null)
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const [intercomLogs, setIntercomLogs] = useState<Array<{
    id: string
    username: string
    nombre: string
    message: string
    time: string
    type: "alert" | "chat"
  }>>([])
  const [roadAlerts, setRoadAlerts] = useState<Array<{
    id: string
    type: "police" | "hazard" | "accident" | "rain" | "gas"
    lat: number
    lng: number
    label: string
    reporter: string
  }>>([])


  // Fetch Marketplace items
  const fetchMarketplace = async () => {
    setLoadingMarket(true)
    try {
      const res = await fetch(`/api/centro-motero/marketplace?category=${marketFilter}&city=${marketCity}`)
      const data = await res.json()
      if (data.success) {
        setMarketplaceItems(data.items)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMarket(false)
    }
  }

  // Fetch restrictions
  const fetchRestrictions = async (city: string) => {
    setLoadingRestrictions(true)
    try {
      const res = await fetch(`/api/centro-motero/restrictions?city=${city}`)
      const data = await res.json()
      if (data.success) {
        setRestrictions(data.restriction)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRestrictions(false)
    }
  }

  // Fetch challenges
  const fetchChallenges = async () => {
    setLoadingChallenges(true)
    try {
      const res = await fetch("/api/centro-motero/challenges")
      const data = await res.json()
      if (data.success) {
        setChallenges(data.challenges)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingChallenges(false)
    }
  }

  // Fetch convoy riders
  const fetchConvoy = async () => {
    setLoadingConvoy(true)
    try {
      const res = await fetch("/api/centro-motero/convoy")
      const data = await res.json()
      if (data.success) {
        let riders = data.convoy || []
        const hasCarlos = riders.some((r: any) => r.username === "carlos_rr")
        if (!hasCarlos) {
          riders = [
            ...riders,
            {
              id: "mock-rider-1",
              username: "carlos_rr",
              nombre: "Carlos Rodriguez",
              rol: "LIDER",
              fotoPerfil: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
              latitude: mockRiderPos.lat + 0.007,
              longitude: mockRiderPos.lng + 0.009,
            },
            {
              id: "mock-rider-2",
              username: "maria_r6",
              nombre: "María Fernanda",
              rol: "RIDER",
              fotoPerfil: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
              latitude: mockRiderPos.lat - 0.004,
              longitude: mockRiderPos.lng - 0.005,
            },
            {
              id: "mock-rider-3",
              username: "jorge_f800",
              nombre: "Jorge Duarte",
              rol: "ESCOBA",
              fotoPerfil: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
              latitude: mockRiderPos.lat - 0.009,
              longitude: mockRiderPos.lng - 0.012,
            }
          ]
        }
        setConvoyRiders(riders)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingConvoy(false)
    }
  }

  // Fetch active Ad campaigns
  const fetchAds = async () => {
    try {
      const res = await fetch("/api/centro-motero/ads")
      const data = await res.json()
      if (data.success) {
        setActiveAds(data.ads)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle ad click registration
  const handleAdClick = async (campaignId: string, targetUrl: string) => {
    try {
      await fetch("/api/centro-motero/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
    } catch (err) {
      console.error(err)
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer")
  }

  // Trigger loading when tab changes
  useEffect(() => {
    if (activeTab === "marketplace") {
      fetchMarketplace()
      fetchAds()
    } else if (activeTab === "normativa") {
      fetchRestrictions(selectedCity)
    } else if (activeTab === "challenges") {
      fetchChallenges()
    } else if (activeTab === "convoy") {
      fetchConvoy()
    }
  }, [activeTab, marketFilter, marketCity])

  const simulatedChats = [
    { username: "carlos_rr", nombre: "Carlos Rodriguez", message: "¡Rodada iniciada! Mantengamos formación de convoy.", type: "chat" as const },
    { username: "maria_r6", nombre: "María Fernanda", message: "Ojo muchachos, asfalto algo húmedo en las curvas de la 85.", type: "chat" as const },
    { username: "jorge_f800", nombre: "Jorge Duarte", message: "Líder Carlos, voy en la escoba cerrando el convoy. Ritmo perfecto.", type: "chat" as const },
    { username: "carlos_rr", nombre: "Carlos Rodriguez", message: "Enterado Jorge. Vamos subiendo agrupados.", type: "chat" as const },
    { username: "maria_r6", nombre: "María Fernanda", message: "¡Excelente clima para subir hoy! La vía se ve despejada.", type: "chat" as const }
  ]

  const simulatedVias = [
    { username: "maria_r6", nombre: "María Fernanda", type: "hazard" as const, label: "Obstáculo en vía", message: "¡Cuidado! Hay grava suelta en la curva del km 4.", lat: 4.664, lng: -74.032 },
    { username: "jorge_f800", nombre: "Jorge Duarte", type: "police", label: "Control policial", message: "Pilas señores, agentes de tránsito unos metros antes del peaje.", lat: 4.673, lng: -74.025 },
    { username: "carlos_rr", nombre: "Carlos Rodriguez", type: "rain", label: "Llovizna leve", message: "Riders, empezó una llovizna suave arriba. Visores abajo.", lat: 4.678, lng: -74.018 }
  ]

  const isSpeechEnabledRef = useRef(isSpeechEnabled)
  const isIntercomMutedRef = useRef(isIntercomMuted)

  useEffect(() => {
    isSpeechEnabledRef.current = isSpeechEnabled
  }, [isSpeechEnabled])

  useEffect(() => {
    isIntercomMutedRef.current = isIntercomMuted
  }, [isIntercomMuted])

  const triggerTTS = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && isSpeechEnabledRef.current && !isIntercomMutedRef.current) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-MX"
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleUserReportAlert = (type: "police" | "hazard" | "accident" | "rain" | "gas", label: string) => {
    const newAlertId = Math.random().toString()
    const newAlert = {
      id: newAlertId,
      type,
      lat: mockRiderPos.lat + 0.001,
      lng: mockRiderPos.lng + 0.0015,
      label,
      reporter: session?.user?.name || "Tú"
    }

    setRoadAlerts(prev => [...prev, newAlert])

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setIntercomLogs(prev => [
      {
        id: newAlertId,
        username: session?.user?.username || "tú",
        nombre: session?.user?.name || "Tú",
        message: `📢 ¡Reporte! ${label} detectado adelante por mí.`,
        time: timeString,
        type: "alert"
      },
      ...prev
    ])

    triggerTTS(`Has reportado ${label} adelante. Transmitiendo a convoy.`)
  }

  // Handle stream location simulation
  const handleToggleStreamLocation = async () => {
    if (isStreamingLocation) {
      setIsStreamingLocation(false)
      if (convoyInterval.current) clearInterval(convoyInterval.current)
      return
    }

    setIsStreamingLocation(true)
    setIntercomLogs([])
    setRoadAlerts([])
    
    // Initial call
    await reportLocation(4.65, -74.05)

    // Simulate location updates with slight random shifts (crawling across Peaje Patios path)
    let currentLat = 4.65
    let currentLng = -74.05
    let step = 0

    convoyInterval.current = setInterval(async () => {
      step += 1
      currentLat += 0.0012 + Math.random() * 0.0004
      currentLng += 0.0018 + Math.random() * 0.0003
      
      setMockRiderPos({ lat: currentLat, lng: currentLng })
      await reportLocation(currentLat, currentLng)
      await fetchConvoy()

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // Trigger simulated chat message every 2 ticks (8 seconds)
      if (step % 2 === 0) {
        const chatIdx = Math.floor((step / 2) - 1) % simulatedChats.length
        const chatMsg = simulatedChats[chatIdx]
        
        setIntercomLogs(prev => [
          {
            id: `sim-chat-${step}`,
            username: chatMsg.username,
            nombre: chatMsg.nombre,
            message: chatMsg.message,
            time: timeString,
            type: "chat"
          },
          ...prev
        ])

        // Glow active speaker
        setActiveSpeaker(chatMsg.username)
        setTimeout(() => setActiveSpeaker(null), 3000)

        // Speech
        if (typeof window !== "undefined" && "speechSynthesis" in window && isSpeechEnabledRef.current && !isIntercomMutedRef.current) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(`${chatMsg.nombre} dice: ${chatMsg.message}`)
          utterance.lang = "es-MX"
          window.speechSynthesis.speak(utterance)
        }
      }

      // Trigger simulated road alert every 4 ticks (16 seconds)
      if (step % 4 === 0) {
        const alertIdx = Math.floor((step / 4) - 1) % simulatedVias.length
        const alertMsg = simulatedVias[alertIdx]

        const newAlert = {
          id: `sim-alert-${step}`,
          type: alertMsg.type as any,
          lat: alertMsg.lat,
          lng: alertMsg.lng,
          label: alertMsg.label,
          reporter: alertMsg.nombre
        }

        setRoadAlerts(prev => [...prev, newAlert])

        setIntercomLogs(prev => [
          {
            id: `sim-log-alert-${step}`,
            username: alertMsg.username,
            nombre: alertMsg.nombre,
            message: `⚠️ ¡Alerta! ${alertMsg.label}: ${alertMsg.message}`,
            time: timeString,
            type: "alert"
          },
          ...prev
        ])

        // Glow active speaker
        setActiveSpeaker(alertMsg.username)
        setTimeout(() => setActiveSpeaker(null), 3000)

        // Speech
        if (typeof window !== "undefined" && "speechSynthesis" in window && isSpeechEnabledRef.current && !isIntercomMutedRef.current) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(`Alerta de intercomunicador. ${alertMsg.nombre} reporta ${alertMsg.label}. ${alertMsg.message}`)
          utterance.lang = "es-MX"
          window.speechSynthesis.speak(utterance)
        }
      }
    }, 4000)
  }

  const reportLocation = async (lat: number, lng: number) => {
    try {
      await fetch("/api/centro-motero/convoy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: "default", 
          rol: "LIDER",
          latitude: lat,
          longitude: lng,
        }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    return () => {
      if (convoyInterval.current) clearInterval(convoyInterval.current)
    }
  }, [])

  // Read URL hash to activate the correct tab on load
  useEffect(() => {
    const validTabs = ["convoy", "sos", "marketplace", "normativa", "challenges"]
    const hash = window.location.hash.replace("#", "")
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash as any)
    }

    // Also listen for hash changes (e.g. browser back/forward)
    const onHashChange = () => {
      const newHash = window.location.hash.replace("#", "")
      if (newHash && validTabs.includes(newHash)) {
        setActiveTab(newHash as any)
      }
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // Handle SOS Alert
  const handleSendSOS = async (tipo: string) => {
    setSendingSOS(true)
    setSosStatus("searching")
    setNearbyHelpers([])

    try {
      // Simulate sending emergency coordinates (default around Bogota Peaje Patios area)
      const res = await fetch("/api/centro-motero/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: 4.655,
          longitude: -74.048,
          tipoEmergencia: tipo,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNearbyHelpers(data.nearbyRiders)
        setSosStatus("success")
      } else {
        setSosStatus("error")
      }
    } catch (err) {
      console.error(err)
      setSosStatus("error")
    } finally {
      setSendingSOS(false)
    }
  }

  // Upload a single file and return its URL
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success) return data.url
      return null
    } catch {
      return null
    }
  }

  // Handle media files (photos/videos) selection
  const handleListingMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingMedia(true)
    const uploaded: string[] = []
    for (const file of files) {
      const url = await uploadFile(file)
      if (url) uploaded.push(url)
    }
    setListingFotosUrls(prev => [...prev, ...uploaded])
    setUploadingMedia(false)
    e.target.value = ""
  }

  // Handle document file selection
  const handleListingDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    const url = await uploadFile(file)
    if (url) setNewListing(prev => ({ ...prev, documentoVerificacionUrl: url }))
    setUploadingDoc(false)
    e.target.value = ""
  }

  // Handle listing submit (POST for new, PATCH for edit)
  const handleAddListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingListing(true)

    const isEditing = !!editingListingId
    const url = isEditing 
      ? `/api/centro-motero/marketplace?id=${editingListingId}` 
      : "/api/centro-motero/marketplace"
    const method = isEditing ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: newListing.titulo,
          descripcion: newListing.descripcion,
          precio: Number(newListing.precio),
          categoria: newListing.categoria,
          motoModelo: newListing.motoModelo || null,
          fotoUrl: listingFotosUrls[0] || null,
          fotosUrls: listingFotosUrls,
          ciudad: newListing.ciudad,
          telefonoContact: newListing.telefonoContact,
          motoOrigenPlaca: newListing.motoOrigenPlaca || null,
          motoOrigenVin: newListing.motoOrigenVin || null,
          documentoVerificacionUrl: newListing.documentoVerificacionUrl || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setShowAddListing(false)
        setEditingListingId(null)
        setNewListing({
          titulo: "",
          descripcion: "",
          precio: "",
          categoria: "REPUESTOS",
          motoModelo: "",
          ciudad: "Bogotá",
          telefonoContact: "",
          motoOrigenPlaca: "",
          motoOrigenVin: "",
          documentoVerificacionUrl: "",
        })
        setListingFotosUrls([])
        fetchMarketplace()
        alert(data.message || (isEditing ? "Anuncio actualizado exitosamente" : "Anuncio publicado exitosamente"))
      } else {
        alert(data.error || "Error al procesar el anuncio")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión al procesar el anuncio")
    } finally {
      setSubmittingListing(false)
    }
  }

  // Share listing to Feed
  const handleShareToFeed = async (item: MarketplaceItem) => {
    try {
      const contentText = `📢 ¡Hola riders! He publicado un artículo en la Tienda Rider:\n\n* **Artículo:** ${item.titulo}\n* **Precio:** $${item.precio.toLocaleString()} COP\n* **Ciudad:** ${item.ciudad}\n* **Compatible:** ${item.motoModelo || "Universal"}\n\n🏍️💨 ¡Pregúntame o revisa la tienda para ver más fotos y los datos de procedencia legal!`;
      
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: contentText,
          mediaUrls: item.fotosUrls && item.fotosUrls.length > 0 ? item.fotosUrls.slice(0, 4) : (item.fotoUrl ? [item.fotoUrl] : []),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        alert("¡Anuncio publicado en el feed social con éxito! Puedes revisarlo en la pestaña Feed.")
      } else {
        alert(data.error || "Error al publicar en el feed")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión al compartir en el feed")
    }
  }

  // Delete listing
  const handleDeleteListing = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este anuncio de la tienda? Esta acción es irreversible.")) return
    try {
      const res = await fetch(`/api/centro-motero/marketplace?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        fetchMarketplace()
        alert(data.message || "Anuncio eliminado exitosamente")
      } else {
        alert(data.error || "Error al eliminar el anuncio")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión al eliminar el anuncio")
    }
  }

  // Start Edit Listing
  const handleStartEditListing = (item: MarketplaceItem) => {
    setEditingListingId(item.id)
    setNewListing({
      titulo: item.titulo,
      descripcion: item.descripcion,
      precio: String(item.precio),
      categoria: item.categoria,
      motoModelo: item.motoModelo || "",
      ciudad: item.ciudad,
      telefonoContact: item.telefonoContact,
      motoOrigenPlaca: item.motoOrigenPlaca || "",
      motoOrigenVin: item.motoOrigenVin || "",
      documentoVerificacionUrl: item.documentoVerificacionUrl || "",
    })
    setListingFotosUrls(item.fotosUrls || (item.fotoUrl ? [item.fotoUrl] : []))
    setShowAddListing(true)
    // Scroll to the top of the form with a sutil offset
    window.scrollTo({ top: 100, behavior: 'smooth' })
  }
  // Cancel edit/create form and reset states
  const handleCancelForm = () => {
    setShowAddListing(false)
    setEditingListingId(null)
    setListingFotosUrls([])
    setNewListing({
      titulo: "",
      descripcion: "",
      precio: "",
      categoria: "REPUESTOS",
      motoModelo: "",
      ciudad: "Bogotá",
      telefonoContact: "",
      motoOrigenPlaca: "",
      motoOrigenVin: "",
      documentoVerificacionUrl: "",
    })
  }
  const handleContactSeller = async (item: MarketplaceItem) => {
    if (!session) {
      alert("Debes iniciar sesión para chatear con el vendedor")
      return
    }

    try {
      const res = await fetch("/api/intercom/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: item.user.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Send initial contextual message automatically to start conversation
        await fetch("/api/intercom/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: data.conversation.id,
            contenido: `Hola, estoy interesado en tu artículo: "${item.titulo}" publicado para la ciudad de ${item.ciudad}.`,
          }),
        })

        // Route directly to intercom page with the conversation open
        router.push(`/intercom?conversationId=${data.conversation.id}`)
      } else {
        alert(data.error || "Error al iniciar conversación")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle challenge checkpoint check-in
  const handleChallengeCheckIn = async (challengeId: string) => {
    try {
      const res = await fetch("/api/centro-motero/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          action: "CHECK_IN",
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchChallenges()
        // Force status update trigger for global layout avatar ring refresh
        window.dispatchEvent(new Event("status-updated"))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate days left for documents
  const getDaysLeft = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 300 * 288))) // Days count approx
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Title Banner */}
        <div className="relative glass-panel rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden border border-white/5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-orange/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-primary-orange w-7 h-7" /> CENTRO MOTERO
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-xl">
              Panel integrado con herramientas y servicios avanzados para la comunidad y carreteras de Colombia.
            </p>
          </div>

          <div className="relative z-10 flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleSendSOS("MECANICO")}
              className="flex-1 sm:flex-initial py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> ¡BOTÓN SOS!
            </button>
          </div>
        </div>

        {/* Unified Responsive Navigation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* TAB SIDEBAR SECTOR */}
          <aside className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-1 gap-2.5">
            {[
              { id: "convoy", label: "Convoy en Vivo", icon: Navigation, desc: "Rodadas en convoy" },
              { id: "sos", label: "Red de Rescate", icon: ShieldAlert, desc: "Asistencia SOS vial" },
              { id: "marketplace", label: "Marketplace", icon: ShoppingBag, desc: "Compra y venta" },
              { id: "normativa", label: "Normativa y SOAT", icon: Landmark, desc: "Leyes y documentos" },
              { id: "challenges", label: "Retos y Medallas", icon: Award, desc: "Trophy room motera" },
            ].map((tab) => {
              const Icon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    window.history.replaceState(null, "", `#${tab.id}`)
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer text-center lg:text-left ${
                    isSelected 
                      ? "bg-primary-orange/15 border-primary-orange/45 text-white" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-text-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? "text-primary-orange" : "text-text-muted"}`} />
                  <div>
                    <span className="text-xs font-extrabold block text-white">{tab.label}</span>
                    <span className="text-[9px] text-text-muted hidden lg:block">{tab.desc}</span>
                  </div>
                </button>
              )
            })}
          </aside>

          {/* DASHBOARD TAB CONTAINER */}
          <section className="lg:col-span-9 space-y-6">
            {activeTab === "convoy" && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                      <Navigation className="text-primary-orange w-5 h-5 rotate-45" /> CONVOY EN VIVO & INTERCOM
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      Transmite ubicación GPS y conéctate al intercomunicador de voz automático de la rodada.
                    </p>
                  </div>

                  <button
                    onClick={handleToggleStreamLocation}
                    className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isStreamingLocation 
                        ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30" 
                        : "bg-primary-orange hover:bg-primary-orange-hover text-white shadow-lg shadow-primary-orange/5"
                    }`}
                  >
                    {isStreamingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detener Rodada
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" /> Iniciar Rodada en Vivo
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: GPS Map Viewport */}
                  <div className="lg:col-span-8 glass-panel p-4 rounded-3xl border border-white/5 shadow-xl space-y-4">
                    <div className="relative h-[480px] w-full rounded-2xl border border-white/5 bg-neutral-950 overflow-hidden flex items-center justify-center">
                      {/* Grid overlay lines */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]" />
                      
                      {/* Radar pulse radar lines */}
                      <div className="absolute w-72 h-72 rounded-full border border-primary-orange/5 animate-ping opacity-25" />
                      <div className="absolute w-96 h-96 rounded-full border border-primary-orange/10 opacity-30" />

                      {/* Route path (Bogota -> Patios) */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M 50 350 Q 200 280 320 200 T 600 80" 
                          fill="none" 
                          stroke="#ff6a00" 
                          strokeWidth="3" 
                          strokeDasharray="6 4"
                          className="animate-pulse"
                        />
                      </svg>

                      {/* Map Labels */}
                      <div className="absolute bottom-6 left-8 text-[10px] text-text-muted flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/5">
                        <MapPin className="w-3 h-3 text-primary-orange" /> Bogotá (Inicio Rodada)
                      </div>
                      <div className="absolute top-8 right-8 text-[10px] text-text-muted flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-white/5">
                        <MapPin className="w-3 h-3 text-red-500" /> Peaje Patios (Meta)
                      </div>

                      {/* Simulated Convoy Markers */}
                      {loadingConvoy && convoyRiders.length === 0 ? (
                        <div className="text-xs text-text-muted flex items-center gap-1.5 z-10 bg-black/85 p-4 rounded-2xl border border-white/5 shadow-2xl">
                          <Loader2 className="w-4 h-4 animate-spin text-primary-orange" /> Sincronizando ubicación de riders...
                        </div>
                      ) : (
                        <>
                          {/* Active Convoy Member Markers */}
                          {convoyRiders.map((rider) => {
                            const coords = getMapCoords(rider.latitude, rider.longitude)
                            const isSpeaking = activeSpeaker === rider.username
                            
                            return (
                              <div 
                                key={rider.id}
                                style={{ left: coords.x, top: coords.y }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-1000"
                              >
                                <div className="relative">
                                  {isSpeaking && (
                                    <div className="absolute inset-0 rounded-full border-2 border-primary-orange animate-ping scale-150 opacity-75" />
                                  )}
                                  <div className={`w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center p-0.5 overflow-hidden shadow-lg border ${
                                    isSpeaking ? "border-primary-orange ring-2 ring-primary-orange/50 animate-pulse" : "border-primary-orange/45"
                                  }`}>
                                    {rider.fotoPerfil ? (
                                      <img src={rider.fotoPerfil} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-primary-orange" />
                                    )}
                                  </div>
                                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded text-[7px] font-black bg-primary-orange text-white uppercase tracking-wider">
                                    {rider.rol}
                                  </span>
                                </div>
                                <span className="text-[9px] text-white font-extrabold bg-black/85 px-1.5 py-0.5 rounded-md border border-white/5 mt-1 shadow">
                                  {rider.nombre || rider.username}
                                </span>
                              </div>
                            )
                          })}

                          {/* Current User Streaming Tracker */}
                          {isStreamingLocation && (() => {
                            const coords = getMapCoords(mockRiderPos.lat, mockRiderPos.lng)
                            const isUserSpeaking = activeSpeaker === (session?.user?.username || "tú")
                            return (
                              <div 
                                style={{ left: coords.x, top: coords.y }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-1000"
                              >
                                <div className="relative">
                                  {isUserSpeaking && (
                                    <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping scale-150 opacity-75" />
                                  )}
                                  <div className={`w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center p-0.5 overflow-hidden shadow-lg border ${
                                    isUserSpeaking ? "border-red-500 ring-2 ring-red-500/50" : "border-red-500"
                                  }`}>
                                    {session?.user?.image ? (
                                      <img src={session.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-30 pointer-events-none" />
                                </div>
                                <span className="text-[9px] text-red-400 font-extrabold bg-black/90 px-1.5 py-0.5 rounded-md border border-red-500/20 mt-1 shadow">
                                  Tú (Transmitiendo)
                                </span>
                              </div>
                            )
                          })()}

                          {/* Road Alerts Markers */}
                          {roadAlerts.map((alert) => {
                            const coords = getMapCoords(alert.lat, alert.lng)
                            return (
                              <div 
                                key={alert.id}
                                style={{ left: coords.x, top: coords.y }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 animate-bounce"
                              >
                                <div className="w-7 h-7 rounded-xl bg-red-600/90 border border-red-400 flex items-center justify-center shadow-lg">
                                  <span className="text-xs">
                                    {alert.type === "police" ? "👮" : 
                                     alert.type === "hazard" ? "⚠️" : 
                                     alert.type === "accident" ? "💥" : 
                                     alert.type === "rain" ? "🌧️" : "⛽"}
                                  </span>
                                </div>
                                <span className="text-[8px] text-white font-black bg-red-950/95 px-1.5 rounded border border-red-500/30 mt-0.5 shadow whitespace-nowrap">
                                  {alert.label}
                                </span>
                              </div>
                            )
                          })}

                          {/* Live Indicator overlay banner */}
                          <div className="absolute top-3 left-3 bg-black/85 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Servidor Activo</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Legend list */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-primary-orange tracking-wider">Líder de Convoy</h4>
                        <p className="text-xs text-white font-semibold mt-0.5">Abre la ruta y marca ritmo</p>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0">
                        <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Riders Oficiales</h4>
                        <p className="text-xs text-white font-semibold mt-0.5">Pilotos vinculados al grupo</p>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0">
                        <h4 className="text-[10px] font-black uppercase text-red-500 tracking-wider">Piloto Escoba</h4>
                        <p className="text-xs text-white font-semibold mt-0.5">Cierra convoy y apoya varados</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Auto-Intercom Control Center */}
                  <div className="lg:col-span-4 glass-panel p-5 rounded-3xl border border-white/5 shadow-xl space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Intercom Connection Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Radio className={`w-4 h-4 ${isStreamingLocation ? "text-emerald-400 animate-pulse" : "text-text-muted"}`} />
                          <span className="text-xs font-black text-white uppercase tracking-wider">Intercom de Grupo</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          isStreamingLocation ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse" : "bg-white/5 text-text-muted"
                        }`}>
                          {isStreamingLocation ? "Conectado" : "Desconectado"}
                        </span>
                      </div>

                      {/* Speaking Visualizer Waveform */}
                      {isStreamingLocation ? (
                        <div className="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2">
                          {activeSpeaker ? (
                            <>
                              <span className="text-[10px] font-extrabold text-primary-orange animate-pulse uppercase tracking-wider">
                                {activeSpeaker === (session?.user?.username || "tú") ? "Hablas tú..." : `@${activeSpeaker} transmitiendo...`}
                              </span>
                              <div className="flex items-end gap-1 h-6">
                                <span className="w-1 bg-primary-orange rounded animate-voice-bar-1" />
                                <span className="w-1 bg-primary-orange rounded animate-voice-bar-2" />
                                <span className="w-1 bg-primary-orange rounded animate-voice-bar-3" />
                                <span className="w-1 bg-primary-orange rounded animate-voice-bar-2" />
                                <span className="w-1 bg-primary-orange rounded animate-voice-bar-1" />
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Canal en Silencio (Escuchando)</span>
                              <div className="flex items-end gap-1 h-6">
                                <span className="w-1 h-1 bg-white/10 rounded" />
                                <span className="w-1 h-1 bg-white/10 rounded" />
                                <span className="w-1 h-1 bg-white/10 rounded" />
                                <span className="w-1 h-1 bg-white/10 rounded" />
                                <span className="w-1 h-1 bg-white/10 rounded" />
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
                          <Radio className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-40" />
                          <p className="text-[11px] text-text-muted leading-relaxed">
                            Inicia la rodada en vivo para conectarte automáticamente al intercomunicador de voz.
                          </p>
                        </div>
                      )}

                      {/* Device Sync State */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            if (pairedDevice) {
                              setPairedDevice(null)
                              triggerTTS("Dispositivo Bluetooth desconectado")
                            } else {
                              setPairedDevice("Sena 50S")
                              triggerTTS("Dispositivo Sena 50S sincronizado por Bluetooth")
                            }
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl border text-[10px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            pairedDevice 
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {pairedDevice ? `Conectado: ${pairedDevice}` : "Sincronizar Sena/Cardo"}
                        </button>
                      </div>

                      {/* Audio Controls */}
                      {isStreamingLocation && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIsIntercomMuted(!isIntercomMuted)
                              if (isIntercomMuted) {
                                triggerTTS("Micrófono activado")
                              }
                            }}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              isIntercomMuted 
                                ? "bg-red-500/20 border-red-500/40 text-red-400" 
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                            {isIntercomMuted ? <EyeOff className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                            {isIntercomMuted ? "Silenciado" : "Transmitir"}
                          </button>

                          <button
                            onClick={() => {
                              setIsSpeechEnabled(!isSpeechEnabled)
                              if (!isSpeechEnabled) {
                                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                  window.speechSynthesis.cancel()
                                  const utterance = new SpeechSynthesisUtterance("Audio alertas activadas")
                                  utterance.lang = "es-MX"
                                  window.speechSynthesis.speak(utterance)
                                }
                              }
                            }}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              isSpeechEnabled 
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
                                : "bg-white/5 border-white/10 text-white opacity-60 hover:opacity-100"
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                            {isSpeechEnabled ? "Voz Casco ON" : "Voz Casco OFF"}
                          </button>
                        </div>
                      )}

                      {/* Report Alert Buttons */}
                      {isStreamingLocation && (
                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">Reportar en el Intercom</span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => handleUserReportAlert("police", "Control Policial")}
                              className="py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-[9px] font-extrabold text-red-400 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                            >
                              <span>👮</span>
                              <span>Policía</span>
                            </button>
                            <button
                              onClick={() => handleUserReportAlert("hazard", "Obstáculo")}
                              className="py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-[9px] font-extrabold text-amber-400 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                            >
                              <span>⚠️</span>
                              <span>Peligro</span>
                            </button>
                            <button
                              onClick={() => handleUserReportAlert("accident", "Accidente")}
                              className="py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-[9px] font-extrabold text-rose-400 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                            >
                              <span>💥</span>
                              <span>Accidente</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Voice logs */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">Bitácora de Radio</span>
                        <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-thin">
                          {intercomLogs.length === 0 ? (
                            <p className="text-text-muted text-[10px] italic text-center pt-12">
                              {isStreamingLocation ? "Canal silencioso. Esperando transmisiones..." : "Intercomunicador desconectado."}
                            </p>
                          ) : (
                            intercomLogs.map((log) => (
                              <div key={log.id} className={`p-2 rounded-xl border transition-all ${
                                log.type === "alert" 
                                  ? "bg-red-500/5 border-red-500/15 text-red-300" 
                                  : "bg-white/5 border-white/5 text-white/90"
                              }`}>
                                <div className="flex justify-between items-center text-[9px] font-extrabold mb-0.5">
                                  <span className={log.type === "alert" ? "text-red-400" : "text-primary-orange"}>
                                    @{log.username}
                                  </span>
                                  <span className="text-text-muted">{log.time}</span>
                                </div>
                                <p className="text-[11px] font-semibold leading-tight">{log.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAB RED DE RESCATE SOS */}
            {activeTab === "sos" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                    <ShieldAlert className="text-red-500 w-5 h-5" /> RED DE RESCATE SOS Y APRESO
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Solicita ayuda vial inmediata. Enviaremos tus coordenadas GPS a la comunidad motera en el sector.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Crash alert triggering */}
                  <div className="bg-red-500/5 p-5 rounded-2xl border border-red-500/25 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> SOS Accidentes / Emergencia Médica
                      </h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Emite una alarma sonora y de posición máxima. Notifica a contactos de emergencia y despliega tu ficha médica del piloto.
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendSOS("MEDICO")}
                      disabled={sendingSOS}
                      className="py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-text-muted text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {sendingSOS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
                      Solicitar Emergencia Médica
                    </button>
                  </div>

                  {/* Mechanical breakdown rescue */}
                  <div className="bg-primary-orange/5 p-5 rounded-2xl border border-primary-orange/20 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-primary-orange flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Auxilio Mecánico / Varada Vial
                      </h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        ¿Pinchado, sin combustible o con falla de batería? Reporta tu varada para que motociclistas cercanos acudan en tu ayuda.
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendSOS("MECANICO")}
                      disabled={sendingSOS}
                      className="py-2.5 px-4 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-neutral-800 disabled:text-text-muted text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {sendingSOS ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      Reportar Varada (5km)
                    </button>
                  </div>
                </div>

                {/* Emergency Search Results Panel */}
                {sosStatus === "searching" && (
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary-orange animate-spin mb-3" />
                    <span className="text-xs text-white font-extrabold uppercase tracking-wider">Escaneando red de apoyo motero...</span>
                    <span className="text-[10px] text-text-muted mt-1">Buscando riders activos en el área metropolitana</span>
                  </div>
                )}

                {sosStatus === "success" && (
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Alerta enviada. Riders en camino
                    </div>

                    <div className="space-y-3">
                      {nearbyHelpers.length === 0 ? (
                        <p className="text-xs text-text-muted italic">No se encontraron pilotos en el radio de 5km de esta zona.</p>
                      ) : (
                        nearbyHelpers.map((helper) => (
                          <div key={helper.userId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-orange/10 border border-primary-orange/20 overflow-hidden flex items-center justify-center">
                                {helper.fotoPerfil ? (
                                  <img src={helper.fotoPerfil} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-primary-orange" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white">{helper.nombre || helper.username}</h4>
                                <span className="text-[10px] text-text-muted">Aproximándose • {helper.distanceMeters} metros de distancia</span>
                              </div>
                            </div>
                            
                            <a 
                              href={`https://wa.me/573000000000`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                            >
                              Contactar
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TAB GARAJE MARKETPLACE */}
            {activeTab === "marketplace" && (
              <div className="space-y-6">
                
                {/* Search & Action Bar */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-2">
                    {["TODOS", "REPUESTOS", "ACCESORIOS", "MOTOS"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setMarketFilter(cat)}
                        className={`py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                          marketFilter === cat 
                            ? "bg-primary-orange border-primary-orange text-white" 
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-text-muted hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* City Select */}
                    <select
                      value={marketCity}
                      onChange={(e) => setMarketCity(e.target.value)}
                      className="bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="TODOS">Todas las Ciudades</option>
                      <option value="Bogotá">Bogotá</option>
                      <option value="Medellín">Medellín</option>
                      <option value="Cali">Cali</option>
                      <option value="Barranquilla">Barranquilla</option>
                    </select>

                    <button
                      onClick={() => setShowSponsorDashboard(true)}
                      className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      📊 Panel Sponsors
                    </button>

                    <button
                      onClick={() => setShowAddListing(!showAddListing)}
                      className="py-1.5 px-3 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Publicar
                    </button>
                  </div>
                </div>

                {/* Add Item form */}
                {showAddListing && (
                  <form onSubmit={handleAddListingSubmit} className="glass-panel p-6 rounded-3xl border border-primary-orange/20 bg-primary-orange/5 space-y-5">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <Tag className="text-primary-orange w-4 h-4" /> {editingListingId ? "Editar Anuncio de Tienda" : "Publicar en Tienda Rider"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Título del anuncio *</label>
                        <input
                          type="text"
                          required
                          value={newListing.titulo}
                          onChange={(e) => setNewListing({ ...newListing, titulo: e.target.value })}
                          placeholder="Ej. Llantas Michelin Pilot Street"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Precio (COP) *</label>
                        <input
                          type="number"
                          required
                          value={newListing.precio}
                          onChange={(e) => setNewListing({ ...newListing, precio: e.target.value })}
                          placeholder="Ej. 180000"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Categoría</label>
                        <select
                          value={newListing.categoria}
                          onChange={(e) => setNewListing({ ...newListing, categoria: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 cursor-pointer"
                        >
                          <option value="REPUESTOS">🔩 Repuestos</option>
                          <option value="ACCESORIOS">🛡️ Accesorios</option>
                          <option value="MOTOS">🏍️ Motos</option>
                          <option value="OTROS">📦 Otros</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Compatibilidad de Moto</label>
                        <input
                          type="text"
                          value={newListing.motoModelo}
                          onChange={(e) => setNewListing({ ...newListing, motoModelo: e.target.value })}
                          placeholder="Ej. Pulsar NS 200, Universal"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Ciudad *</label>
                        <select
                          value={newListing.ciudad}
                          onChange={(e) => setNewListing({ ...newListing, ciudad: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 cursor-pointer"
                        >
                          <option value="Bogotá">Bogotá</option>
                          <option value="Medellín">Medellín</option>
                          <option value="Cali">Cali</option>
                          <option value="Barranquilla">Barranquilla</option>
                          <option value="Bucaramanga">Bucaramanga</option>
                          <option value="Pereira">Pereira</option>
                          <option value="Manizales">Manizales</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">WhatsApp de contacto *</label>
                        <input
                          type="text"
                          required
                          value={newListing.telefonoContact}
                          onChange={(e) => setNewListing({ ...newListing, telefonoContact: e.target.value })}
                          placeholder="Ej. 3001234567"
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Descripción del artículo *</label>
                      <textarea
                        required
                        value={newListing.descripcion}
                        onChange={(e) => setNewListing({ ...newListing, descripcion: e.target.value })}
                        placeholder="Describe el estado, kilometraje, detalles del artículo..."
                        rows={3}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary-orange/50 resize-none"
                      />
                    </div>

                    {/* Real Media Upload */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="text-blue-400 w-4 h-4" />
                        <h4 className="text-xs font-black uppercase text-white">Fotos y Videos del Artículo</h4>
                      </div>
                      <p className="text-[10px] text-text-muted">Sube hasta 8 fotos o videos (JPG, PNG, MP4, MOV). La primera imagen será la portada del anuncio.</p>

                      {/* Photo/video previews */}
                      {listingFotosUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {listingFotosUrls.map((url, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                              {url.match(/\.(mp4|mov|webm)/i) ? (
                                <video src={url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={url} alt={`foto-${idx}`} className="w-full h-full object-cover" />
                              )}
                              {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 bg-primary-orange/80 text-white text-[8px] font-black text-center py-0.5">PORTADA</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setListingFotosUrls(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600/80 hover:bg-red-600 rounded-full text-white text-[10px] font-bold hidden group-hover:flex items-center justify-center cursor-pointer"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className={`flex items-center gap-2 py-2 px-4 rounded-xl border border-dashed text-xs font-bold transition-all cursor-pointer ${
                        uploadingMedia
                          ? "border-primary-orange/30 text-text-muted bg-white/5 cursor-not-allowed"
                          : "border-white/20 hover:border-primary-orange/50 text-text-muted hover:text-white bg-white/5 hover:bg-white/10"
                      } ${ listingFotosUrls.length >= 8 ? "opacity-40 pointer-events-none" : "" }`}>
                        {uploadingMedia ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-primary-orange" /> Subiendo...</>
                        ) : (
                          <><Plus className="w-4 h-4" /> Agregar fotos / videos ({listingFotosUrls.length}/8)</>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          disabled={uploadingMedia || listingFotosUrls.length >= 8}
                          onChange={handleListingMediaChange}
                        />
                      </label>
                    </div>

                    {/* Anti-Theft Verification Fields */}
                    <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="text-amber-400 w-4 h-4" />
                        <h4 className="text-xs font-black uppercase text-white">Seguridad y Procedencia Legal</h4>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Para combatir la venta de autopartes hurtadas en Colombia, solicitamos el registro de la moto de origen y su soporte documental. Los anuncios validados obtienen el sello <span className="text-emerald-400 font-extrabold">✅ Verificado</span>.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">Placa Moto de Origen</label>
                          <input
                            type="text"
                            value={newListing.motoOrigenPlaca}
                            onChange={(e) => setNewListing({ ...newListing, motoOrigenPlaca: e.target.value })}
                            placeholder="Ej. AAA00A"
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-text-muted uppercase font-bold mb-1">VIN / Serial de Motor</label>
                          <input
                            type="text"
                            value={newListing.motoOrigenVin}
                            onChange={(e) => setNewListing({ ...newListing, motoOrigenVin: e.target.value })}
                            placeholder="Ej. 9F321000..."
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      {/* Real document upload */}
                      <div>
                        <label className="block text-[10px] text-text-muted uppercase font-bold mb-2">Soporte de Procedencia (Factura / Tarjeta de Propiedad)</label>
                        <label className={`inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-dashed text-xs font-bold transition-all cursor-pointer ${
                          uploadingDoc
                            ? "border-amber-500/30 text-text-muted bg-white/5 cursor-not-allowed"
                            : newListing.documentoVerificacionUrl
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-white/20 hover:border-amber-500/50 text-text-muted hover:text-white bg-white/5 hover:bg-white/10"
                        }`}>
                          {uploadingDoc ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo documento...</>
                          ) : newListing.documentoVerificacionUrl ? (
                            <><CheckCircle2 className="w-4 h-4" /> Documento adjuntado ✓ (clic para cambiar)</>
                          ) : (
                            <><Search className="w-4 h-4" /> Adjuntar documento (PDF, JPG, PNG)</>
                          )}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            disabled={uploadingDoc}
                            onChange={handleListingDocChange}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleCancelForm}
                        type="button"
                        className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingListing || uploadingMedia || uploadingDoc}
                        className="py-2 px-5 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-neutral-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {submittingListing ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                        ) : editingListingId ? (
                          "💾 Guardar Cambios"
                        ) : (
                          "🚀 Publicar Anuncio"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Active Ad Banner (patrocinado) */}
                {activeAds.length > 0 && (
                  <div 
                    onClick={() => handleAdClick(activeAds[0].id, activeAds[0].targetUrl)}
                    className="glass-panel p-4.5 rounded-3xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition-all flex flex-col md:flex-row gap-4 items-center relative overflow-hidden"
                  >
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full z-10 animate-pulse">
                      Patrocinado
                    </div>
                    <div className="w-full md:w-32 h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                      {(() => {
                        const isVideo = activeAds[0].bannerUrl.toLowerCase().endsWith(".mp4") || 
                                        activeAds[0].bannerUrl.toLowerCase().endsWith(".webm") || 
                                        activeAds[0].bannerUrl.toLowerCase().endsWith(".mov")
                        return isVideo ? (
                          <video src={activeAds[0].bannerUrl} autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={activeAds[0].bannerUrl} alt="ad-banner" className="w-full h-full object-cover" />
                        )
                      })()}
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left pr-10">
                      <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">{activeAds[0].sponsorName}</span>
                      <h3 className="font-extrabold text-sm text-white">{activeAds[0].titulo}</h3>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{activeAds[0].descripcion}</p>
                    </div>
                  </div>
                )}

                {/* Listings Grid */}
                {loadingMarket ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between shadow-lg">
                        <div>
                          <div className="h-40 bg-white/5 w-full" />
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-white/10 rounded w-3/4" />
                            <div className="flex gap-2">
                              <div className="h-3 bg-white/5 rounded w-1/3" />
                              <div className="h-3 bg-white/5 rounded w-1/4" />
                            </div>
                            <div className="space-y-1.5 pt-2">
                              <div className="h-3 bg-white/5 rounded w-full" />
                              <div className="h-3 bg-white/5 rounded w-5/6" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/10">
                          <div className="h-4 bg-white/10 rounded w-1/4" />
                          <div className="h-8 bg-white/10 rounded-xl w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : marketplaceItems.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-3xl border border-white/5 shadow-xl">
                    <ShoppingBag className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
                    <h3 className="font-semibold text-white">Sin publicaciones</h3>
                    <p className="text-text-muted text-xs mt-1">No hay artículos disponibles con los filtros actuales.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {marketplaceItems.map((item) => (
                      <div key={item.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between shadow-lg">
                        <div>
                          {(() => {
                            const mediaList = item.fotosUrls && item.fotosUrls.length > 0 
                              ? item.fotosUrls 
                              : (item.fotoUrl ? [item.fotoUrl] : []);
                            const activeIdx = activeMedia[item.id] || 0;
                            const activeUrl = mediaList[activeIdx] || "";
                            const isVideo = activeUrl.match(/\.(mp4|mov|webm)/i);

                            return (
                              <div className="relative h-40 bg-black/45 overflow-hidden group">
                                {activeUrl ? (
                                  isVideo ? (
                                    <video src={activeUrl} controls className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={activeUrl} alt={item.titulo} className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5 text-text-muted text-xs">Sin fotos</div>
                                )}

                                {/* Left/Right controls if multiple media */}
                                {mediaList.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveMedia(prev => ({
                                          ...prev,
                                          [item.id]: (activeIdx - 1 + mediaList.length) % mediaList.length
                                        }));
                                      }}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full text-white text-xs flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 z-20"
                                    >
                                      &lt;
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveMedia(prev => ({
                                          ...prev,
                                          [item.id]: (activeIdx + 1) % mediaList.length
                                        }));
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full text-white text-xs flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 z-20"
                                    >
                                      &gt;
                                    </button>
                                    {/* Media counter indicator */}
                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10">
                                      {activeIdx + 1}/{mediaList.length}
                                    </span>
                                  </>
                                )}

                                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-primary-orange text-white uppercase tracking-wider w-fit">
                                    {item.categoria}
                                  </span>
                                  {item.procedenciaVerificada ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-0.5 w-fit">
                                      Verificado ✅
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-600 text-white uppercase tracking-wider flex items-center gap-0.5 w-fit">
                                      Pendiente ⚠️
                                    </span>
                                  )}
                                  {item.documentoVerificacionUrl && (
                                    <a
                                      href={item.documentoVerificacionUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 rounded text-[8px] font-black bg-blue-600 hover:bg-blue-700 text-white uppercase tracking-wider flex items-center gap-0.5 w-fit pointer-events-auto transition-colors"
                                    >
                                      📄 Doc. Soporte
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="p-4 space-y-1.5">
                            <span className="text-[9px] text-primary-orange font-bold uppercase">{item.ciudad}</span>
                            <h3 className="font-extrabold text-sm text-white line-clamp-1">{item.titulo}</h3>
                            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{item.descripcion}</p>
                            
                            {/* Placa / VIN details to show transparency */}
                            {(item.motoOrigenPlaca || item.motoOrigenVin) && (
                              <div className="bg-white/5 rounded-lg p-2 text-[9px] text-text-muted space-y-0.5 mt-1 border border-white/5">
                                {item.motoOrigenPlaca && (
                                  <div>
                                    <span className="font-bold text-white uppercase">Placa de origen:</span>{" "}
                                    {item.motoOrigenPlaca.substring(0, 3)}***
                                  </div>
                                )}
                                {item.motoOrigenVin && (
                                  <div>
                                    <span className="font-bold text-white uppercase">VIN / Chasis:</span>{" "}
                                    {item.motoOrigenVin.substring(0, 4)}***********
                                  </div>
                                )}
                              </div>
                            )}

                            {item.motoModelo && (
                              <div className="pt-2 flex items-center gap-1 text-[10px] text-text-muted">
                                <span className="font-bold text-white">Compatible:</span> {item.motoModelo}
                              </div>
                            )}
                          </div>
                        </div>

                        {session?.user?.id === item.user.id ? (
                          <div className="p-4 pt-0 flex flex-col gap-2.5 border-t border-white/5 mt-2">
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-black text-white text-sm">
                                ${item.precio.toLocaleString()} COP
                              </span>
                              <span className="text-[9px] text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/5 font-semibold">Tuyo</span>
                            </div>
                            
                            <div className="flex gap-2 w-full">
                              {/* Share to Feed */}
                              <button
                                onClick={() => handleShareToFeed(item)}
                                className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                title="Publicar en Feed Social"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> En Feed
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleStartEditListing(item)}
                                className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                title="Editar anuncio"
                              >
                                <Wrench className="w-3.5 h-3.5 text-primary-orange" /> Editar
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteListing(item.id)}
                                className="py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 hover:border-red-500/50 text-red-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                title="Eliminar anuncio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 pt-0 flex justify-between items-center border-t border-white/5 mt-2">
                            <span className="font-black text-white text-sm">
                              ${item.precio.toLocaleString()} COP
                            </span>

                            <button
                              onClick={() => handleContactSeller(item)}
                              className="p-2 bg-primary-orange hover:bg-primary-orange-hover text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                              title="Chatear con el vendedor"
                            >
                              <MessageSquare className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. TAB NORMATIVA & SOAT EXPIRY */}
            {activeTab === "normativa" && (
              <div className="space-y-6">
                
                {/* SOAT & Techno tracker */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5">
                  <h2 className="text-base font-black text-white flex items-center gap-1.5">
                    <Calendar className="text-primary-orange w-5 h-5" /> VENCIMIENTO DE DOCUMENTOS OBLIGATORIOS (COLOMBIA)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* SOAT expiry */}
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Fecha Vencimiento SOAT</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">SOAT obligatorio para motos particulares</p>
                        
                        <div className="mt-4 flex items-center gap-4">
                          <input 
                            type="date"
                            value={soatDate}
                            onChange={(e) => setSoatDate(e.target.value)}
                            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black text-primary-orange block">{getDaysLeft(soatDate)} días</span>
                            <span className="text-[9px] text-text-muted">Restantes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tecno expiry */}
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Fecha Vencimiento Tecnicomecánica</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Revisión técnico-mecánica obligatoria</p>
                        
                        <div className="mt-4 flex items-center gap-4">
                          <input 
                            type="date"
                            value={technoDate}
                            onChange={(e) => setTechnoDate(e.target.value)}
                            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black text-primary-orange block">{getDaysLeft(technoDate)} días</span>
                            <span className="text-[9px] text-text-muted">Restantes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* City Restrictions card */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-base font-black text-white flex items-center gap-1.5">
                        <Landmark className="text-primary-orange w-5 h-5" /> RESTRICCIONES DE TRÁNSITO PARA MOTOS
                      </h2>
                      <p className="text-xs text-text-muted mt-0.5">Leyes locales actualizadas por alcaldías municipales.</p>
                    </div>

                    {/* City Select */}
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value)
                        fetchRestrictions(e.target.value)
                      }}
                      className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="BOGOTA">Bogotá</option>
                      <option value="MEDELLIN">Medellín</option>
                      <option value="CALI">Cali</option>
                      <option value="BARRANQUILLA">Barranquilla</option>
                    </select>
                  </div>

                  {loadingRestrictions ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                          <div className="h-3.5 bg-white/10 rounded w-1/2" />
                          <div className="space-y-2">
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Pico y Placa */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                        <h4 className="text-[10px] font-black uppercase text-primary-orange tracking-wider">Pico y Placa</h4>
                        <p className="text-xs text-white font-medium leading-relaxed">
                          {restrictions?.picoYPlaca || "Cargando restricciones..."}
                        </p>
                      </div>

                      {/* Parrillero */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                        <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Acompañante / Parrillero</h4>
                        <p className="text-xs text-white font-medium leading-relaxed">
                          {restrictions?.parrillero || "Cargando restricciones..."}
                        </p>
                      </div>

                      {/* Chaleco */}
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                        <h4 className="text-[10px] font-black uppercase text-red-400 tracking-wider">Prendas Reflectivas</h4>
                        <p className="text-xs text-white font-medium leading-relaxed">
                          {restrictions?.chaleco || "Cargando restricciones..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. TAB DESAFÍOS & MEDALLAS */}
            {activeTab === "challenges" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                    <Award className="text-primary-orange w-5 h-5" /> TROPHY ROOM: DESAFÍOS COLOMBIANOS
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Completa hitos moteros, acumula puntos y expón tus medallas de honor en tu perfil público.
                  </p>
                </div>

                {loadingChallenges ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="h-4 bg-white/10 rounded w-1/2" />
                            <div className="h-4 bg-white/10 rounded w-16" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-5/6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <div className="h-3 bg-white/5 rounded w-10" />
                              <div className="h-3 bg-white/5 rounded w-12" />
                            </div>
                            <div className="h-2.5 bg-white/5 rounded-full w-full" />
                          </div>
                        </div>
                        <div className="h-9 bg-white/10 rounded-xl w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {challenges.map((ch) => {
                      const progressRecord = ch.progresses[0] || { progreso: 0, completado: false }
                      const percent = progressRecord.progreso
                      const isDone = progressRecord.completado

                      return (
                        <div 
                          key={ch.id} 
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                            isDone 
                              ? "bg-amber-600/5 border-amber-500/25 shadow-lg shadow-amber-500/5" 
                              : "bg-white/5 border-white/5"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-sm text-white flex items-center gap-1">
                                {ch.nombre}
                              </h3>
                              <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded border border-white/5 text-primary-orange">
                                +{ch.puntos} PTS
                              </span>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed">{ch.descripcion}</p>
                          </div>

                          <div className="space-y-3">
                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-text-muted">Progreso ruta</span>
                                <span className="font-bold text-white">{percent}%</span>
                              </div>
                              <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  style={{ width: `${percent}%` }}
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isDone ? "bg-amber-500" : "bg-primary-orange"
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Rewards indicators */}
                            <div className="flex justify-between items-center pt-1">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                  isDone 
                                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse shadow-md shadow-amber-500/10" 
                                    : "bg-white/5 border border-white/5 text-text-muted opacity-40"
                                }`}>
                                  {ch.medallaIcon}
                                </div>
                                <div>
                                  <span className="text-[9px] text-text-muted block uppercase font-bold leading-none">Medalla</span>
                                  <span className={`text-[10px] font-black ${isDone ? "text-amber-400" : "text-white/60"}`}>
                                    {ch.medallaName}
                                  </span>
                                </div>
                              </div>

                              {!isDone ? (
                                <button
                                  onClick={() => handleChallengeCheckIn(ch.id)}
                                  className="py-1 px-3 bg-primary-orange hover:bg-primary-orange-hover text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Reportar Hito
                                </button>
                              ) : (
                                <span className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 fill-amber-500/20" /> Completado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </section>
        </div>

      </main>

      {showSponsorDashboard && (
        <SponsorDashboard onClose={() => { setShowSponsorDashboard(false); fetchAds() }} />
      )}
    </div>
  )
}
