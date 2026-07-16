"use client"

import React, { useState, useEffect, use, useRef } from "react"
import { useSession } from "next-auth/react"
import Navbar from "@/components/Navbar"
import { useNotification } from "@/components/NotificationProvider"
import { 
  User, MapPin, Award, ShieldAlert, Plus, Trash2, Edit2, Check, X,
  Wrench, Calendar, Tag, Compass, Sparkles, Loader2, Image, CheckCircle2, Navigation,
  Camera, Upload, Flame, UserPlus, UserCheck
} from "lucide-react"
import gsap from "gsap"

// Types
type Moto = {
  id: string
  marca: string
  modelo: string
  cilindraje: number
  anio: number
  apodo: string | null
  fotoUrl: string | null
}

type UserProfile = {
  id: string
  username: string
  nombre: string | null
  fotoPerfil: string | null
  fotoPortada: string | null
  bio: string | null
  ciudad: string | null
  nivelExperiencia: "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO" | "EXPERTO"
  tipoRider: "TOURING" | "URBANO" | "OFFROAD" | "SPORT" | "CUSTOM"
  motos: Moto[]
  emergencyContacts: any[]
  statuses?: any[]
}

// VerifiedBadge helper
function VerifiedBadge({ username, className = "w-4 h-4" }: { username?: string | null, className?: string }) {
  if (!username) return null
  const cleanUsername = username.toLowerCase().replace("@", "")
  if (cleanUsername === "thommyenergy") {
    return (
      <span className="inline-flex items-center" title="Usuario Verificado">
        <CheckCircle2 className={`text-blue-500 fill-blue-500/25 ml-1 flex-shrink-0 ${className}`} />
      </span>
    )
  }
  return null
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { data: session, update } = useSession()
  const { toast, showAlert } = useNotification()
  const { username } = use(params)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [nombre, setNombre] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [bio, setBio] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [nivelExperiencia, setNivelExperiencia] = useState<UserProfile["nivelExperiencia"]>("PRINCIPIANTE")
  const [tipoRider, setTipoRider] = useState<UserProfile["tipoRider"]>("URBANO")
  const [fotoPerfil, setFotoPerfil] = useState("")
  const [fotoPortada, setFotoPortada] = useState("")

  // Follow & Story states
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [showStoryViewer, setShowStoryViewer] = useState(false)

  // Moto form states
  const [showAddMoto, setShowAddMoto] = useState(false)
  const [motoMarca, setMotoMarca] = useState("")
  const [motoModelo, setMotoModelo] = useState("")
  const [motoCilindraje, setMotoCilindraje] = useState(150)
  const [motoAnio, setMotoAnio] = useState(new Date().getFullYear())
  const [motoApodo, setMotoApodo] = useState("")
  const [motoFoto, setMotoFoto] = useState("")
  
  // GSAP Refs
  const profileCardRef = useRef<HTMLDivElement>(null)
  const garajeSectionRef = useRef<HTMLDivElement>(null)

  const cleanSessionUsername = session?.user?.username?.toLowerCase().replace("@", "")
  const cleanParamUsername = decodeURIComponent(username)?.toLowerCase().replace("@", "")
  const isOwnProfile = (cleanSessionUsername && cleanParamUsername && cleanSessionUsername === cleanParamUsername) || session?.user?.id === username

  // Parse cover position
  const coverUrl = profile?.fotoPortada ? profile.fotoPortada.split("?pos=")[0] : ""
  const coverPosParam = profile?.fotoPortada && profile.fotoPortada.includes("?pos=")
    ? parseInt(profile.fotoPortada.split("?pos=")[1], 10)
    : 50

  const [isRepositioning, setIsRepositioning] = useState(false)
  const [tempYPos, setTempYPos] = useState(coverPosParam)
  const bannerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startPos = useRef(50)

  // Avatar Menu & Existing Photos States & Refs
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [showExistingPhotosModal, setShowExistingPhotosModal] = useState(false)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const profileFileInputRef = useRef<HTMLInputElement>(null)
  const statusFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempYPos(coverPosParam)
  }, [profile])

  useEffect(() => {
    if (showExistingPhotosModal) {
      const fetchPhotos = async () => {
        setLoadingPhotos(true)
        try {
          const res = await fetch(`/api/posts`)
          const data = await res.json()
          if (data.success && data.posts) {
            // Filter user posts media urls
            const urls = data.posts
              .filter((p: any) => p.userId === profile?.id)
              .flatMap((p: any) => p.mediaUrls || [])
            
            const presets = [
              "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=300&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=300&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=300&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
            ]
            const uniqueUrls = Array.from(new Set([...urls, ...presets]))
            setExistingPhotos(uniqueUrls)
          }
        } catch (err) {
          console.error("Error fetching existing photos:", err)
        } finally {
          setLoadingPhotos(false)
        }
      }
      fetchPhotos()
    }
  }, [showExistingPhotosModal, profile])

  const getClientY = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return e.touches[0].clientY
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return e.changedTouches[0].clientY
    }
    return e.clientY
  }

  const handleStartDrag = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
    if (!isRepositioning) return
    e.preventDefault()
    isDragging.current = true
    const clientY = getClientY(e)
    startY.current = clientY
    startPos.current = tempYPos
  }

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !bannerRef.current) return
    const clientY = getClientY(e)
    const deltaY = clientY - startY.current
    const bannerHeight = bannerRef.current.clientHeight
    const percentMovement = (deltaY / bannerHeight) * 100
    const newY = Math.max(0, Math.min(100, startPos.current - percentMovement))
    setTempYPos(Math.round(newY))
  }

  const handleEndDrag = () => {
    isDragging.current = false
  }

  useEffect(() => {
    if (isRepositioning) {
      window.addEventListener("mousemove", handleDrag)
      window.addEventListener("mouseup", handleEndDrag)
      window.addEventListener("touchmove", handleDrag)
      window.addEventListener("touchend", handleEndDrag)
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag)
      window.removeEventListener("mouseup", handleEndDrag)
      window.removeEventListener("touchmove", handleDrag)
      window.removeEventListener("touchend", handleDrag)
    }
  }, [isRepositioning, tempYPos])

  const handleSavePosition = async () => {
    try {
      const finalUrl = `${coverUrl}?pos=${tempYPos}`
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fotoPortada: finalUrl
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setIsRepositioning(false)
      fetchProfile()
    } catch (err: any) {
      toast.error("Error al guardar posición: " + err.message)
    }
  }

  const handleCancelPosition = () => {
    setTempYPos(coverPosParam)
    setIsRepositioning(false)
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Error al obtener el perfil")
      
      setProfile(data.profile)
      
      setNombre(data.profile.nombre || "")
      setUsernameInput(data.profile.username || "")
      setBio(data.profile.bio || "")
      setCiudad(data.profile.ciudad || "")
      setNivelExperiencia(data.profile.nivelExperiencia || "PRINCIPIANTE")
      setTipoRider(data.profile.tipoRider || "URBANO")
      setFotoPerfil(data.profile.fotoPerfil || "")
      setFotoPortada(data.profile.fotoPortada || "")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowStatus = async () => {
    try {
      const res = await fetch(`/api/profile/follow?username=${encodeURIComponent(username)}`)
      const data = await res.json()
      if (data.success) {
        setIsFollowing(data.following)
        setFollowersCount(data.followersCount)
        setFollowingCount(data.followingCount)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleFollow = async () => {
    try {
      const res = await fetch("/api/profile/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      if (data.success) {
        setIsFollowing(data.following)
        setFollowersCount(data.followersCount)
        setFollowingCount(data.followingCount)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAvatarClick = () => {
    if (profile?.statuses && profile.statuses.length > 0) {
      setActiveStoryIndex(0)
      setShowStoryViewer(true)
    } else if (isOwnProfile) {
      setShowAvatarMenu(!showAvatarMenu)
    }
  }

  useEffect(() => {
    if (!showStoryViewer || !profile?.statuses || profile.statuses.length === 0) return

    const timer = setTimeout(() => {
      if (profile?.statuses && activeStoryIndex < profile.statuses.length - 1) {
        setActiveStoryIndex(prev => prev + 1)
      } else {
        setShowStoryViewer(false)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [showStoryViewer, activeStoryIndex, profile])

  useEffect(() => {
    fetchProfile()
    fetchFollowStatus()
  }, [username])

  // GSAP Intro animation for profile loaded
  useEffect(() => {
    if (!loading && profile) {
      const ctx = gsap.context(() => {
        // Animate Profile Card
        if (profileCardRef.current) {
          gsap.fromTo(profileCardRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
          )
        }

        // Animate Moto Cards (Stagger)
        if (garajeSectionRef.current) {
          const cards = garajeSectionRef.current.querySelectorAll(".moto-card")
          if (cards.length > 0) {
            gsap.fromTo(cards,
              { y: 50, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out" }
            )
          }
        }
      })
      return () => ctx.revert()
    }
  }, [loading, profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          username: usernameInput,
          bio: bio || null,
          ciudad: ciudad || null,
          tipoRider,
          fotoPerfil: fotoPerfil || null,
          fotoPortada: fotoPortada || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (update) {
        await update({
          name: nombre,
          username: usernameInput,
          image: fotoPerfil || null,
        })
      }

      if (profile && usernameInput !== profile.username) {
        window.location.href = `/perfil/${usernameInput}`
        return
      }

      setIsEditing(false)
      fetchProfile()
    } catch (err: any) {
      showAlert(err.message, "Error al guardar perfil", "error")
    }
  }

  const handleAddMoto = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/profile/motos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marca: motoMarca,
          modelo: motoModelo,
          cilindraje: Number(motoCilindraje),
          anio: Number(motoAnio),
          apodo: motoApodo || null,
          fotoUrl: motoFoto || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowAddMoto(false)
      setMotoMarca("")
      setMotoModelo("")
      setMotoCilindraje(150)
      setMotoAnio(new Date().getFullYear())
      setMotoApodo("")
      setMotoFoto("")
      
      fetchProfile()
    } catch (err: any) {
      showAlert(err.message, "Error al agregar moto", "error")
    }
  }

  const handleDeleteMoto = async (motoId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta moto?")) return
    
    try {
      const res = await fetch(`/api/profile/motos/${motoId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      fetchProfile()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, target: "profile" | "moto" | "portada" | "status") => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (target === "profile") {
        setFotoPerfil(data.url)
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fotoPerfil: data.url
          }),
        })
        if (update) {
          await update({
            image: data.url
          })
        }
        fetchProfile()
      } else if (target === "portada") {
        setFotoPortada(data.url)
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fotoPortada: data.url
          }),
        })
        fetchProfile()
      } else if (target === "status") {
        const resStatus = await fetch("/api/profile/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaUrl: data.url
          }),
        })
        if (!resStatus.ok) {
          const statusData = await resStatus.json()
          throw new Error(statusData.error || "Error al subir el estado")
        }
        showAlert("¡Estado subido con éxito! Tu avatar ahora tiene el anillo de fuego.", "Estado Actualizado", "success")
        window.dispatchEvent(new Event("status-updated"))
        fetchProfile()
      } else {
        setMotoFoto(data.url)
      }
    } catch (err: any) {
      toast.error("Error al subir archivo: " + err.message)
    }
  }

  const handleSelectExistingPhoto = async (url: string) => {
    try {
      setFotoPerfil(url)
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fotoPerfil: url
        }),
      })
      if (update) {
        await update({
          image: url
        })
      }
      setShowExistingPhotosModal(false)
      fetchProfile()
    } catch (err: any) {
      toast.error("Error al seleccionar foto: " + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error de Perfil</h2>
          <p className="text-text-muted mb-4">{error || "No se pudo cargar el perfil"}</p>
          <button 
            onClick={fetchProfile}
            className="px-5 py-2 bg-primary-orange text-white rounded-xl"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <Navbar />
      
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 z-10">
        
        {/* Profile Card */}
        <section 
          ref={profileCardRef} 
          className="glass-panel rounded-2xl overflow-hidden relative shadow-2xl opacity-0"
        >
          {/* Banner cover */}
          <div 
            ref={bannerRef}
            className="h-44 sm:h-56 relative w-full overflow-hidden bg-gradient-to-r from-neutral-950 via-primary-orange-glow to-neutral-950 border-b border-white/5"
          >
            {profile.fotoPortada ? (
              <img
                src={coverUrl}
                alt="Portada"
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={handleStartDrag}
                onTouchStart={handleStartDrag}
                style={{ 
                  objectPosition: `50% ${tempYPos}%`, 
                  cursor: isRepositioning ? 'ns-resize' : 'default',
                  userSelect: 'none'
                }}
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              </div>
            )}

            {/* Reposition instruction overlay */}
            {isRepositioning && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10">
                <span className="bg-black/80 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-medium flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 rotate-90 text-primary-orange" /> Arrastra verticalmente para ajustar la portada
                </span>
              </div>
            )}

            {/* Action buttons inside cover */}
            {isOwnProfile && isEditing && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-40">
                {isRepositioning ? (
                  <>
                    <button
                      onClick={handleCancelPosition}
                      type="button"
                      className="py-1.5 px-3 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePosition}
                      type="button"
                      className="py-1.5 px-3 bg-primary-orange hover:bg-primary-orange-hover border border-primary-orange/30 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Guardar Posición
                    </button>
                  </>
                ) : (
                  <>
                    {profile.fotoPortada && (
                      <button
                        onClick={() => setIsRepositioning(true)}
                        type="button"
                        className="py-1.5 px-3 bg-black/70 hover:bg-black/90 border border-white/10 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Reposicionar
                      </button>
                    )}
                    <label className="py-1.5 px-3 bg-black/70 hover:bg-black/90 border border-white/10 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                      Cambiar Portada
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadFile(e, "portada")}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 pt-0 sm:pt-0">
            {/* Avatar & User Details overlap */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-16 relative z-20 mb-6 text-center sm:text-left">
              {/* Avatar */}
              <div className="relative">
                <div 
                  onClick={handleAvatarClick}
                  className={`rounded-full relative select-none ${isOwnProfile || (profile?.statuses && profile.statuses.length > 0) ? "cursor-pointer group" : ""} ${profile?.statuses && profile.statuses.length > 0 ? "ring-fire p-[3.5px]" : ""}`}
                >
                  {fotoPerfil ? (
                    <img
                      src={fotoPerfil}
                      alt={nombre || profile.username || "Usuario"}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-background bg-background shadow-xl group-hover:brightness-90 transition-all"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary-orange/10 border-4 border-dashed border-primary-orange/30 flex items-center justify-center text-primary-orange bg-background shadow-xl group-hover:brightness-95 transition-all">
                      <User className="w-10 h-10" />
                    </div>
                  )}

                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAvatarMenu(!showAvatarMenu)
                      }}
                      className="absolute bottom-0 right-0 p-1.5 bg-primary-orange hover:bg-primary-orange-hover rounded-full text-white border border-background shadow-lg z-30 transition-transform group-hover:scale-105"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Menu Popover */}
                {showAvatarMenu && isOwnProfile && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAvatarMenu(false)} />
                    <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-52 bg-[#0e141c]/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md">
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false)
                          profileFileInputRef.current?.click()
                        }}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-primary-orange" /> Subir nueva foto
                      </button>
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false)
                          setShowExistingPhotosModal(true)
                        }}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5 text-primary-orange" /> Elegir foto existente
                      </button>
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false)
                          statusFileInputRef.current?.click()
                        }}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-primary-orange" /> Subir estado (24h)
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Info details */}
              <div className="flex-grow pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                      {nombre || profile.username || "Piloto Rider"}
                    </h1>
                    <p className="text-primary-orange font-semibold text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                      {profile.username ? (profile.username.startsWith("@") ? profile.username : `@${profile.username}`) : "@sin_usuario"}
                      <VerifiedBadge username={profile.username} />
                    </p>
                  </div>
                  {isOwnProfile && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="py-2 px-4 border border-white/10 hover:bg-white/5 text-xs text-white rounded-lg flex items-center gap-2 cursor-pointer w-fit mx-auto sm:mx-0 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar Perfil
                    </button>
                  )}
                  {!isOwnProfile && session && (
                    <button
                      onClick={handleToggleFollow}
                      className={`py-2 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer w-fit mx-auto sm:mx-0 transition-colors ${
                        isFollowing
                          ? "bg-neutral-800 border border-white/10 hover:bg-neutral-750 text-white"
                          : "bg-primary-orange hover:bg-primary-orange-hover text-white"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Siguiendo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Seguir
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Badges, bio & remaining info */}
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white">
                  <span className="font-extrabold text-primary-orange">{followersCount}</span> Seguidores
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white">
                  <span className="font-extrabold text-primary-orange">{followingCount}</span> Seguidos
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-orange/15 border border-primary-orange/20 text-white">
                  <Award className="w-3.5 h-3.5" /> {nivelExperiencia}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-text-muted">
                  <Compass className="w-3.5 h-3.5" /> {tipoRider}
                </span>
                {ciudad && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-text-muted">
                    <MapPin className="w-3.5 h-3.5" /> {ciudad}
                  </span>
                )}
              </div>

              <p className="text-text-muted text-sm italic max-w-lg leading-relaxed text-center sm:text-left">
                {bio || "Este motociclista aún no ha escrito su biografía."}
              </p>
            </div>

          {/* EDIT FORM MODAL INLINE */}
          {isEditing && (
            <form onSubmit={handleUpdateProfile} className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Editar Perfil</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Nombre de Usuario (@username)</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/\s/g, "")
                      const cleanVal = val.startsWith("@") 
                        ? "@" + val.replace(/^@+/, "") 
                        : "@" + val
                      setUsernameInput(cleanVal)
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                    placeholder="Ej: Bogotá, Medellín"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Tipo de Rider</label>
                  <select
                    value={tipoRider}
                    onChange={(e: any) => setTipoRider(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none text-white"
                  >
                    <option value="TOURING">Touring / Aventura</option>
                    <option value="URBANO">Urbano / Diario</option>
                    <option value="OFFROAD">Off-Road / Enduro</option>
                    <option value="SPORT">Sport / Pista</option>
                    <option value="CUSTOM">Custom / Chopper</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Biografía</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                    placeholder="Cuéntanos un poco sobre ti y tu moto..."
                  />
                 </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 bg-white/5 hover:bg-white/10 text-xs font-medium rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 inline mr-1" /> Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary-orange hover:bg-primary-orange-hover text-xs font-bold rounded-lg cursor-pointer text-white"
                >
                  <Check className="w-4 h-4 inline mr-1" /> Guardar Cambios
                </button>
              </div>
            </form>
          )}
          </div>
        </section>

        {/* Motos Section */}
        <section ref={garajeSectionRef} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-orange" /> Mi Garaje Biker
            </h2>
            {isOwnProfile && !showAddMoto && (
              <button
                onClick={() => setShowAddMoto(true)}
                className="py-1.5 px-3.5 bg-primary-orange/10 hover:bg-primary-orange/20 border border-primary-orange/30 text-xs text-primary-orange font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Registrar Moto
              </button>
            )}
          </div>

          {/* Add Moto Form */}
          {showAddMoto && (
            <form onSubmit={handleAddMoto} className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Agregar Nueva Moto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Yamaha, Honda, BMW..."
                    value={motoMarca}
                    onChange={(e) => setMotoMarca(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Modelo / Línea</label>
                  <input
                    type="text"
                    required
                    placeholder="MT-09, XRE 300, R 1250 GS..."
                    value={motoModelo}
                    onChange={(e) => setMotoModelo(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Cilindraje (cc)</label>
                  <input
                    type="number"
                    required
                    min={49}
                    max={2500}
                    value={motoCilindraje}
                    onChange={(e) => setMotoCilindraje(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Año Modelo</label>
                  <input
                    type="number"
                    required
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    value={motoAnio}
                    onChange={(e) => setMotoAnio(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Apodo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: La consentida"
                    value={motoApodo}
                    onChange={(e) => setMotoApodo(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Foto de la Moto</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={motoFoto}
                      onChange={(e) => setMotoFoto(e.target.value)}
                      className="flex-grow bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-primary-orange focus:outline-none"
                      placeholder="URL de foto o sube"
                    />
                    <label className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-xs rounded-lg cursor-pointer">
                      Sube
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadFile(e, "moto")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMoto(false)}
                  className="py-2 px-4 bg-white/5 hover:bg-white/10 text-xs font-medium rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary-orange hover:bg-primary-orange-hover text-xs font-bold rounded-lg text-white cursor-pointer"
                >
                  Agregar Moto
                </button>
              </div>
            </form>
          )}

          {/* Garaje Grid */}
          {profile.motos.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl">
              <Wrench className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
              <p className="text-text-muted text-sm">Tu garaje está vacío. ¡Registra tu moto para que otros riders la vean!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile.motos.map((moto) => (
                <div key={moto.id} className="moto-card glass-panel rounded-2xl overflow-hidden group flex flex-col tilt-card opacity-0">
                  <div className="h-44 bg-gradient-to-br from-primary-orange-glow to-black/60 relative overflow-hidden flex items-center justify-center">
                    {moto.fotoUrl ? (
                      <img
                        src={moto.fotoUrl}
                        alt={`${moto.marca} ${moto.modelo}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-text-muted opacity-40">
                        <Wrench className="w-12 h-12 mb-2" />
                        <span className="text-xs uppercase font-mono">Sin Imagen</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteMoto(moto.id)}
                        className="absolute top-3 right-3 p-2 bg-red-950/80 hover:bg-red-600 border border-red-500/20 hover:border-red-500 rounded-lg text-red-200 hover:text-white transition-colors cursor-pointer"
                        title="Eliminar Moto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {moto.apodo && (
                      <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-orange text-white shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" /> {moto.apodo}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-grow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white tracking-wide uppercase">
                        {moto.marca} {moto.modelo}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-black/35 border border-white/5 p-2.5 rounded-xl text-center">
                        <span className="block text-[10px] text-text-muted uppercase font-bold tracking-wider">Cilindraje</span>
                        <span className="text-sm font-black text-white mt-0.5 block">{moto.cilindraje} cc</span>
                      </div>
                      <div className="bg-black/35 border border-white/5 p-2.5 rounded-xl text-center">
                        <span className="block text-[10px] text-text-muted uppercase font-bold tracking-wider">Año Modelo</span>
                        <span className="text-sm font-black text-white mt-0.5 block">{moto.anio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Existing Photos Modal */}
      {showExistingPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowExistingPhotosModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-[#0a0f14] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Elegir foto existente
              </h3>
              <button
                onClick={() => setShowExistingPhotosModal(false)}
                className="text-text-muted hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loadingPhotos ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Cargando fotos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {existingPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectExistingPhoto(url)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-primary-orange transition-all cursor-pointer group"
                  >
                    <img 
                      src={url} 
                      alt={`Foto ${i}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-[10px] text-text-muted mt-4 uppercase font-bold tracking-wider text-center">
              Selecciona una imagen de tus publicaciones o presets
            </p>
          </div>
        </div>
      )}

      {/* Hidden inputs for file uploads */}
      <input
        ref={profileFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => uploadFile(e, "profile")}
        className="hidden"
      />
      <input
        ref={statusFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => uploadFile(e, "status")}
        className="hidden"
      />
      {/* Fullscreen Story Viewer Modal */}
      {showStoryViewer && profile?.statuses && profile.statuses.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-lg">
          {/* Top Header / Progress Bars */}
          <div className="w-full space-y-4 max-w-lg mx-auto">
            {/* Progress segment bars */}
            <div className="flex gap-1.5 w-full">
              {profile.statuses.map((_: any, idx: number) => (
                <div key={idx} className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-primary-orange transition-all duration-[5000ms] ease-linear ${
                      idx < activeStoryIndex 
                        ? "w-full" 
                        : idx === activeStoryIndex 
                          ? "w-full animate-story-progress" 
                          : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Author info & Close */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-orange/15 border border-primary-orange/20">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-orange" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black">{nombre || profile.username || "Piloto Rider"}</h4>
                  <span className="text-[9px] text-text-muted">
                    {new Date(profile.statuses[activeStoryIndex]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowStoryViewer(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Image Viewer */}
          <div className="flex-grow flex items-center justify-center max-h-[75vh] max-w-lg mx-auto w-full">
            <img 
              src={profile.statuses[activeStoryIndex]?.mediaUrl} 
              alt="Estado Rider" 
              className="max-w-full max-h-full rounded-2xl object-contain border border-white/5 shadow-2xl"
            />
          </div>

          {/* Bottom Controls / Text */}
          <div className="py-6 flex justify-between items-center px-4 max-w-lg mx-auto w-full">
            <button
              onClick={() => {
                if (activeStoryIndex > 0) {
                  setActiveStoryIndex(prev => prev - 1)
                }
              }}
              disabled={activeStoryIndex === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
              Historia {activeStoryIndex + 1} de {profile?.statuses?.length || 0}
            </span>
            <button
              onClick={() => {
                if (profile?.statuses && activeStoryIndex < profile.statuses.length - 1) {
                  setActiveStoryIndex(prev => prev + 1)
                } else {
                  setShowStoryViewer(false)
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-orange hover:bg-primary-orange-hover rounded-xl transition-all cursor-pointer"
            >
              {profile?.statuses && activeStoryIndex === profile.statuses.length - 1 ? "Cerrar" : "Siguiente"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
