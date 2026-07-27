"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import FriendsList from "@/components/FriendsList"
import SearchModal from "@/components/SearchModal"
import { useRouter } from "next/navigation"
import { useNotification } from "@/components/NotificationProvider"
import { 
  Heart, MessageCircle, Send, Image, Plus, X, 
  MapPin, Loader2, User, Sparkles, AlertTriangle, CheckCircle2,
  Compass, ShieldCheck, Map, ShieldAlert, Award, Calendar, Bell, Wrench, Navigation, Flame,
  Settings, Bookmark, Link2, History, EyeOff, UserX, Ban, PlusCircle, MinusCircle, Info, Clock, Droplet, Radio, UserPlus,
  Video, Smile, BarChart2, AtSign, Route, Gauge, Laugh, ChevronDown, CheckCheck, Timer, Fuel, Zap, TrendingUp
} from "lucide-react"
import gsap from "gsap"

type Comment = {
  id: string
  contenido: string
  createdAt: string
  user: {
    id: string
    username: string | null
    nombre: string | null
    fotoPerfil: string | null
  }
}

type Post = {
  id: string
  contenido: string
  mediaUrls: string[]
  createdAt: string
  updatedAt: string
  visibilidad: 'publico' | 'compas' | 'solo_yo'
  user: {
    id: string
    username: string | null
    nombre: string | null
    fotoPerfil: string | null
    bio?: string | null
    ciudad?: string | null
    tipoRider?: string | null
    motos?: {
      id: string
      marca: string
      modelo: string
      cilindraje: string | null
      apodo: string | null
    }[]
  }
  likes: { userId: string }[]
  comments: { id: string }[]
}


const PistonIcon = ({ className = "w-5 h-5", ...props }: { className?: string, [key: string]: any }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Piston Head / Crown */}
    <rect x="5" y="3" width="14" height="6.5" rx="0.5" />
    {/* Compression ring grooves */}
    <line x1="5" y1="5" x2="19" y2="5" stroke="currentColor" strokeWidth="0.8" />
    <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="0.8" />
    {/* Piston Skirt Sides */}
    <path d="M5 9.5v3h2.5v-3z" />
    <path d="M16.5 9.5v3h2.5v-3z" />
    {/* Wrist pin / joint */}
    <circle cx="12" cy="9.5" r="1.5" />
    {/* Connecting rod (Biela) */}
    <path d="M10.8 9.5h2.4v7.5h-2.4z" />
    {/* Rod cap */}
    <circle cx="12" cy="18.5" r="2.5" />
    {/* Inner crankshaft journal hole */}
    <circle cx="12" cy="18.5" r="1" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
)

function VerifiedBadge({ username, className = "w-3.5 h-3.5" }: { username?: string | null, className?: string }) {
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

function PostCardSkeleton() {
  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-white/10 rounded-md w-1/3" />
          <div className="h-2.5 bg-white/5 rounded-md w-1/4" />
        </div>
      </div>
      {/* Text Lines Skeleton */}
      <div className="space-y-2 py-1">
        <div className="h-3.5 bg-white/10 rounded-md w-full" />
        <div className="h-3.5 bg-white/10 rounded-md w-4/5" />
        <div className="h-3 bg-white/5 rounded-md w-2/3" />
      </div>
      {/* Media Placeholder Skeleton */}
      <div className="w-full h-48 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/5" />
      </div>
      {/* Action Bar Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="h-7 w-20 bg-white/5 rounded-lg" />
        <div className="h-7 w-20 bg-white/5 rounded-lg" />
        <div className="h-7 w-20 bg-white/5 rounded-lg" />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast, showAlert } = useNotification()
  const [isPageSearchOpen, setIsPageSearchOpen] = useState(false)
  const statusInputRef = useRef<HTMLInputElement>(null)
  const [uploadingStatus, setUploadingStatus] = useState(false)
  const [showStoryUploadChoice, setShowStoryUploadChoice] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeAds, setActiveAds] = useState<any[]>([])

  // Rich post form state
  type PostType = 'normal' | 'poll' | 'alert' | 'route' | 'stats' | 'callout' | 'moto_del_dia'
  const [postType, setPostType] = useState<PostType>('normal')
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [postMood, setPostMood] = useState<string | null>(null)
  const [postLocation, setPostLocation] = useState("")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [pollDuration, setPollDuration] = useState<'1d' | '3d' | '7d'>('1d')
  const [routeKm, setRouteKm] = useState("")
  const [routeDest, setRouteDest] = useState("")
  const [statsMaxSpeed, setStatsMaxSpeed] = useState("")
  const [statsTime, setStatsTime] = useState("")
  const [statsFuel, setStatsFuel] = useState("")
  const [calloutDate, setCalloutDate] = useState("")
  const [calloutTime, setCalloutTime] = useState("")
  const [calloutSlots, setCalloutSlots] = useState("5")
  const [calloutFrom, setCalloutFrom] = useState("")

  const MOODS = [
    { label: "En ruta 🏍️", value: "en_ruta" },
    { label: "Quemado 🔥", value: "quemado" },
    { label: "Buscando compas 👊", value: "buscando_compas" },
    { label: "Garaje mode 🔧", value: "garaje" },
    { label: "Fin de rodada ✅", value: "fin_rodada" },
    { label: "Alerta vial 🚨", value: "alerta" },
    { label: "Estreno de moto 🆕", value: "estreno" },
    { label: "Lluvia en la vía 🌧️", value: "lluvia" },
  ]

  const togglePanel = (panel: string) => {
    setActivePanel(prev => prev === panel ? null : panel)
  }

  const resetPostForm = () => {
    setContent("")
    setMediaUrls([])
    setPostType('normal')
    setActivePanel(null)
    setPostMood(null)
    setPostLocation("")
    setPollOptions(["", ""])
    setPollDuration('1d')
    setRouteKm("")
    setRouteDest("")
    setStatsMaxSpeed("")
    setStatsTime("")
    setStatsFuel("")
    setCalloutDate("")
    setCalloutTime("")
    setCalloutSlots("5")
    setCalloutFrom("")
  }

  const buildPostContent = () => {
    let meta = ""
    if (postType === 'poll') {
      const validOpts = pollOptions.filter(o => o.trim())
      if (validOpts.length >= 2) {
        meta = `[poll:${JSON.stringify({ options: validOpts, duration: pollDuration })}]\n`
      }
    } else if (postType === 'alert') {
      meta = `[alert:{}]\n`
    } else if (postType === 'route') {
      meta = `[route:${JSON.stringify({ km: routeKm, dest: routeDest })}]\n`
    } else if (postType === 'stats') {
      meta = `[stats:${JSON.stringify({ maxSpeed: statsMaxSpeed, time: statsTime, fuel: statsFuel, km: routeKm })}]\n`
    } else if (postType === 'callout') {
      meta = `[callout:${JSON.stringify({ date: calloutDate, time: calloutTime, slots: calloutSlots, from: calloutFrom })}]\n`
    } else if (postType === 'moto_del_dia') {
      meta = `[moto_del_dia:{}]\n`
    }
    if (postMood) meta += `[mood:${postMood}]\n`
    if (postLocation.trim()) meta += `[location:${postLocation}]\n`
    return meta + content
  }

  // Profile status details (mock/local cache)
  const [profileStats, setProfileStats] = useState<any>(null)
  const [motosCount, setMotosCount] = useState(0)
  const [nivelExp, setNivelExp] = useState("INTERMEDIO")
  const [hoveredPilotId, setHoveredPilotId] = useState<string | null>(null)
  const [hoveredPostUserId, setHoveredPostUserId] = useState<string | null>(null)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null)
  const [activeReactionsPostId, setActiveReactionsPostId] = useState<string | null>(null)
  const [postReactions, setPostReactions] = useState<Record<string, 'fuerza' | 'no_gusta' | null>>({})
  const [followedPilotIds, setFollowedPilotIds] = useState<Record<string, boolean>>({})
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({})
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({})

  // Edit / Delete post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.")) return
    setDeletingPostId(postId)
    try {
      const res = await fetch(`/api/posts/${postId}/edit`, { method: "DELETE" })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
        setActiveMenuPostId(null)
      } else {
        const data = await res.json()
        alert(data.error || "Error al eliminar")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: editContent }),
      })
      const data = await res.json()
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, contenido: data.post.contenido, updatedAt: data.post.updatedAt } : p))
        setEditingPostId(null)
      } else {
        alert(data.error || "Error al editar")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleChangeVisibility = async (postId: string, visibilidad: 'publico' | 'compas' | 'solo_yo') => {
    try {
      const res = await fetch(`/api/posts/${postId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilidad }),
      })
      const data = await res.json()
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, visibilidad: data.post.visibilidad } : p))
        setActiveMenuPostId(null)
      } else {
        alert(data.error || "Error al cambiar visibilidad")
      }
    } catch (err) {
      console.error(err)
    }
  }


  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (activeMenuPostId && !target.closest('.post-options-container')) {
        setActiveMenuPostId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [activeMenuPostId])

  const handleSerCompas = async (pilotId: string) => {
    if (followingLoading[pilotId]) return
    setFollowingLoading((prev) => ({ ...prev, [pilotId]: true }))
    try {
      const res = await fetch("/api/garage/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pilotId }),
      })
      const data = await res.json()
      if (data.success) {
        setFollowedPilotIds((prev) => ({ ...prev, [pilotId]: data.following }))
      }
    } catch (err) {
      console.error("Error toggling follow:", err)
    } finally {
      setFollowingLoading((prev) => ({ ...prev, [pilotId]: false }))
    }
  }

  const handleIntercomunicador = async (pilotId: string) => {
    if (chatLoading[pilotId]) return
    setChatLoading((prev) => ({ ...prev, [pilotId]: true }))
    try {
      const res = await fetch("/api/intercom/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pilotId }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/intercom")
      }
    } catch (err) {
      console.error("Error creating chat:", err)
    } finally {
      setChatLoading((prev) => ({ ...prev, [pilotId]: false }))
    }
  }

  const handleHidePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setActiveMenuPostId(null)
    toast.success("Publicación ocultada de tu feed.")
  }

  const handleHideUser = (userId: string, userName: string) => {
    setPosts((prev) => prev.filter((p) => p.user.id !== userId))
    setActiveMenuPostId(null)
    toast.info(`Hemos ocultado todas las publicaciones de ${userName}.`)
  }

  const handleCopyLink = (postId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`)
      setActiveMenuPostId(null)
      toast.success("Enlace copiado al portapapeles.")
    }
  }

  const handleFeedback = (type: string) => {
    setActiveMenuPostId(null)
    toast.info(type === "interesa" 
      ? "¡Copiado! Personalizaremos tu feed para mostrarte contenido similar." 
      : "Entendido. Mostraremos menos contenido como este.")
  }
  
  // Comentarios
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({})

  // GSAP Refs
  const sidebarLeftRef = useRef<HTMLDivElement>(null)
  const feedCenterRef = useRef<HTMLDivElement>(null)
  const sidebarRightRef = useRef<HTMLDivElement>(null)

  const fetchProfileStats = async () => {
    try {
      const res = await fetch("/api/garage")
      const data = await res.json()
      if (res.ok && data.profile) {
        setProfileStats(data.profile)
        setMotosCount(data.profile.motos.length)
        setNivelExp(data.profile.nivelExperiencia || "PRINCIPIANTE")
      }
    } catch (err) {
      console.warn("Error fetching profile stats for sidebar:", err)
    }
  }

  // Stories & Discover states
  const [stories, setStories] = useState<any[]>([])
  const [activeStoryUserIdx, setActiveStoryUserIdx] = useState(0)
  const [activeStoryIdx, setActiveStoryIdx] = useState(0)
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([])

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/garage/stories")
      const data = await res.json()
      if (data.success) {
        setStories(data.stories)
      }
    } catch (err) {
      console.warn("Error fetching stories:", err)
    }
  }

  const fetchDiscoverUsers = async () => {
    try {
      const res = await fetch("/api/garage/discover")
      const data = await res.json()
      if (data.success) {
        setDiscoverUsers(data.users)
      }
    } catch (err) {
      console.warn("Error fetching discover suggestions:", err)
    }
  }

  useEffect(() => {
    if (!showStoryViewer || stories.length === 0) return

    const activeUser = stories[activeStoryUserIdx]
    if (!activeUser || !activeUser.statuses || activeUser.statuses.length === 0) return

    const timer = setTimeout(() => {
      if (activeStoryIdx < activeUser.statuses.length - 1) {
        setActiveStoryIdx(prev => prev + 1)
      } else if (activeStoryUserIdx < stories.length - 1) {
        setActiveStoryUserIdx(prev => prev + 1)
        setActiveStoryIdx(0)
      } else {
        setShowStoryViewer(false)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [showStoryViewer, activeStoryIdx, activeStoryUserIdx, stories])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/posts")
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts)
      }
    } catch (err) {
      console.error("Error fetching posts:", err)
    } finally {
      setLoading(false)
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
      console.error("Error fetching ads:", err)
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

  useEffect(() => {
    fetchPosts()
    fetchProfileStats()
    fetchStories()
    fetchDiscoverUsers()
    fetchAds()
  }, [])

  // GSAP entrance animation when posts load
  useEffect(() => {
    if (!loading && posts.length > 0) {
      const ctx = gsap.context(() => {
        // Sidebar Left
        if (sidebarLeftRef.current) {
          gsap.fromTo(sidebarLeftRef.current.children, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
          )
        }

        // Sidebar Right
        if (sidebarRightRef.current) {
          gsap.fromTo(sidebarRightRef.current.children, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
          )
        }

        // Center Feed
        if (feedCenterRef.current) {
          const cards = feedCenterRef.current.querySelectorAll(".post-card")
          gsap.fromTo(cards, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
          )
        }
      })
      return () => ctx.revert()
    }
  }, [loading, posts])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalContent = buildPostContent()
    if (!finalContent.trim() && mediaUrls.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: finalContent,
          mediaUrls,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        resetPostForm()
        setPosts([data.post, ...posts])
      } else {
        alert(data.error)
      }
    } catch (err) {
      console.error("Error creating post:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (mediaUrls.length + files.length > 4) {
      alert("Máximo 4 imágenes por publicación.")
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          setMediaUrls((prev) => [...prev, data.url])
        } else {
          showAlert("Error al subir imagen: " + data.error, "Error", "error")
        }
      }
    } catch (err) {
      console.error("Error uploading file:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleStatusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingStatus(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target", "status")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const resStatus = await fetch("/api/garage/status", {
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
      
      fetchStories()
      fetchProfileStats()
    } catch (err: any) {
      showAlert("Error al subir estado: " + err.message, "Error", "error")
    } finally {
      setUploadingStatus(false)
    }
  }

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLike = async (postId: string, reactionType?: 'fuerza' | 'no_gusta') => {
    if (!session) return

    const type = reactionType || 'fuerza'
    const currentReaction = postReactions[postId] || null
    const isRemoving = currentReaction === type

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" })
      if (res.ok) {
        setPostReactions((prev) => ({
          ...prev,
          [postId]: isRemoving ? null : type,
        }))

        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              const currentLikes = p.likes
              const hasLiked = currentLikes.some((l) => l.userId === session.user.id)
              return {
                ...p,
                likes: hasLiked
                  ? currentLikes.filter((l) => l.userId !== session.user.id)
                  : [...currentLikes, { userId: session.user.id }],
              }
            }
            return p
          })
        )
      }
    } catch (err) {
      console.error("Error toggling like:", err)
    }
  }

  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null)
      return
    }

    setActiveCommentsPostId(postId)

    if (!postComments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }))
      try {
        const res = await fetch(`/api/posts/${postId}/comments`)
        const data = await res.json()
        if (res.ok) {
          setPostComments((prev) => ({ ...prev, [postId]: data.comments }))
        }
      } catch (err) {
        console.error("Error loading comments:", err)
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }))
      }
    }
  }

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault()
    const commentText = newCommentContent[postId] || ""
    if (!commentText.trim()) return

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: commentText }),
      })
      const data = await res.json()
      if (res.ok) {
        setPostComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }))
        setNewCommentContent((prev) => ({ ...prev, [postId]: "" }))
        
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, { id: data.comment.id }] } : p
          )
        )
      }
    } catch (err) {
      console.error("Error adding comment:", err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Main Grid Layout (3 Columns for Authentic Social Network Experience) */}
      <div className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COL 1: LEFT SIDEBAR (User Profile Summary & Quick Stats) */}
        <aside ref={sidebarLeftRef} className="lg:col-span-3 space-y-6 hidden lg:block sticky top-22">
          {session && session.user && (
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
              {/* Cover mini image background */}
              <div className="h-20 relative w-full overflow-hidden bg-gradient-to-r from-primary-orange to-amber-600">
                {profileStats?.fotoPortada ? (
                  <img
                    src={profileStats.fotoPortada.split("?pos=")[0]}
                    alt="Portada de perfil"
                    style={{
                      objectPosition: `50% ${
                        profileStats.fotoPortada.includes("?pos=")
                          ? profileStats.fotoPortada.split("?pos=")[1]
                          : "50"
                      }%`,
                    }}
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary-orange to-amber-600 opacity-85" />
                )}
              </div>
              
              {/* Profile Details Container */}
              <div className="px-5 pb-5 relative -mt-10 flex flex-col items-center text-center">
                <Link href={`/garage/${profileStats?.username || session.user.username || session.user.id}`} className="group">
                  {profileStats?.fotoPerfil ? (
                    <img
                      src={profileStats.fotoPerfil}
                      alt={profileStats.nombre || "Perfil"}
                      className="w-16 h-16 rounded-full border-2 border-background object-cover bg-background shadow-md transition-transform group-hover:scale-105 duration-200"
                    />
                  ) : session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ""}
                      className="w-16 h-16 rounded-full border-2 border-background object-cover bg-background shadow-md transition-transform group-hover:scale-105 duration-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-orange/20 border-2 border-background flex items-center justify-center text-primary-orange shadow-md transition-transform group-hover:scale-105 duration-200">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                </Link>

                <h3 className="font-extrabold text-white text-base mt-3">
                  {profileStats?.nombre || session.user.name}
                </h3>
                <span className="text-xs text-text-muted flex items-center gap-1 justify-center mt-0.5">
                  {(profileStats?.username || session.user.username || "rider").startsWith("@") 
                    ? (profileStats?.username || session.user.username || "rider") 
                    : `@${profileStats?.username || session.user.username || "rider"}`}
                  <VerifiedBadge username={profileStats?.username || session.user.username} />
                </span>

                {/* Experience Tag */}
                <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-orange/15 border border-primary-orange/20 text-primary-orange uppercase">
                  <Award className="w-3 h-3" /> {nivelExp}
                </span>

                {/* Vertical Divider */}
                <div className="w-full border-t border-white/5 my-4" />

                {/* Garage Quick Info */}
                <div className="flex justify-around w-full">
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-text-muted">Mi Garaje</span>
                    <Link href={`/garage/${profileStats?.username || session.user.username || session.user.id}`} className="text-lg font-black text-white hover:text-primary-orange transition-colors flex items-center gap-1.5 justify-center mt-1">
                      <Wrench className="w-4 h-4 text-primary-orange" /> {motosCount}
                    </Link>
                  </div>
                  <div className="border-l border-white/5" />
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-text-muted">País</span>
                    <span className="text-sm font-extrabold text-white flex items-center gap-1 justify-center mt-1">
                      🇨🇴 Colombia
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Friends List Widget */}
          <FriendsList onOpenSearch={() => setIsPageSearchOpen(true)} />

          {/* Quick Info Box */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary-orange" /> Conducción Segura
            </h4>
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-green-400">Algoritmo S.O.S Activo</span>
                <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">
                  El sensor está listo. Las rodadas monitorean tu velocidad y desaceleración en segundo plano.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* COL 2: CENTER FEED (Write box & Post Cards) */}
        <section ref={feedCenterRef} className="col-span-1 lg:col-span-6 space-y-6">
          
          {/* Stories Tray */}
          {session && (
            <div className="glass-panel p-4 rounded-2xl shadow-xl flex gap-4 overflow-x-auto select-none no-scrollbar">
              {/* Creator Story Upload trigger / Self Story */}
              <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                <div 
                  onClick={() => {
                    const selfStoryIdx = stories.findIndex(s => s.id === session.user.id)
                    if (selfStoryIdx !== -1) {
                      setShowStoryUploadChoice(true)
                    } else {
                      statusInputRef.current?.click()
                    }
                  }}
                  className={`w-12 h-12 rounded-full relative bg-neutral-900 border border-white/10 flex items-center justify-center transition-all ${
                    stories.some(s => s.id === session.user.id)
                      ? "ring-fire p-[2px]"
                      : "hover:border-primary-orange/50"
                  }`}
                >
                  {profileStats?.fotoPerfil ? (
                    <img src={profileStats.fotoPerfil} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
                  )}
                  
                  {!stories.some(s => s.id === session.user.id) && (
                    <div className="absolute -bottom-1 -right-1 bg-primary-orange border-2 border-[#080b0e] w-5 h-5 rounded-full flex items-center justify-center text-white">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-text-muted mt-1.5 font-bold tracking-wide group-hover:text-white transition-colors">
                  Tu Estado
                </span>
              </div>

              {/* Friends' Active Stories */}
              {stories.filter(s => s.id !== session.user.id).map((storyUser) => {
                const originalIndex = stories.findIndex(s => s.id === storyUser.id)

                return (
                  <div 
                    key={storyUser.id}
                    onClick={() => {
                      setActiveStoryUserIdx(originalIndex)
                      setActiveStoryIdx(0)
                      setShowStoryViewer(true)
                    }}
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full ring-fire p-[2px] relative">
                      {storyUser.fotoPerfil ? (
                        <img src={storyUser.fotoPerfil} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary-orange/15 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-orange" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted mt-1.5 font-bold truncate max-w-[64px] group-hover:text-white transition-colors">
                      {storyUser.nombre || storyUser.username}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Write Box — Rich Post Creation */}
          {session && session.user && (
            <div className={`glass-panel rounded-2xl shadow-xl overflow-hidden transition-all ${
              postType === 'alert' ? 'ring-1 ring-amber-500/40' :
              postType === 'moto_del_dia' ? 'ring-1 ring-primary-orange/50' :
              postType === 'callout' ? 'ring-1 ring-blue-500/40' :
              postType === 'poll' ? 'ring-1 ring-purple-500/40' : ''
            }`}>
              
              {/* Post type badge strip */}
              {postType !== 'normal' && (
                <div className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  postType === 'alert' ? 'bg-amber-500/15 text-amber-400' :
                  postType === 'moto_del_dia' ? 'bg-primary-orange/15 text-primary-orange' :
                  postType === 'callout' ? 'bg-blue-500/15 text-blue-400' :
                  postType === 'poll' ? 'bg-purple-500/15 text-purple-400' :
                  postType === 'route' ? 'bg-emerald-500/15 text-emerald-400' :
                  postType === 'stats' ? 'bg-cyan-500/15 text-cyan-400' :
                  'bg-white/5 text-text-muted'
                }`}>
                  {postType === 'alert' && <><AlertTriangle className="w-3 h-3" /> Alerta Vial</>}
                  {postType === 'moto_del_dia' && <><Flame className="w-3 h-3" /> Mi Moto del Día</>}
                  {postType === 'callout' && <><UserPlus className="w-3 h-3" /> Convocatoria de Ruta</>}
                  {postType === 'poll' && <><BarChart2 className="w-3 h-3" /> Encuesta de Rodada</>}
                  {postType === 'route' && <><Route className="w-3 h-3" /> Log de Ruta</>}
                  {postType === 'stats' && <><Gauge className="w-3 h-3" /> Estadísticas de Rodada</>}
                  <button type="button" onClick={() => setPostType('normal')} className="ml-auto text-current opacity-60 hover:opacity-100 cursor-pointer"><X className="w-3 h-3" /></button>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Author + Textarea */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-orange/20 border border-primary-orange/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profileStats?.fotoPerfil ? (
                      <img src={profileStats.fotoPerfil} alt={profileStats.nombre || ""} className="w-full h-full object-cover" />
                    ) : session.user.image ? (
                      <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary-orange" />
                    )}
                  </div>
                  <div className="flex-grow">
                    {/* Mood badge above textarea */}
                    {postMood && (
                      <div className="mb-2 inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white">
                        {MOODS.find(m => m.value === postMood)?.label}
                        <button type="button" onClick={() => setPostMood(null)} className="text-text-muted hover:text-white cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    )}
                    {/* Location badge */}
                    {postLocation && (
                      <div className="mb-2 inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ml-1">
                        <MapPin className="w-2.5 h-2.5 text-primary-orange" />{postLocation}
                        <button type="button" onClick={() => setPostLocation("")} className="text-text-muted hover:text-white cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    )}
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={
                        postType === 'alert' ? '⚠️ Describe el peligro vial: derrumbe, aceite, control, bache...' :
                        postType === 'moto_del_dia' ? '🔥 Cuéntanos sobre la foto del día con tu moto...' :
                        postType === 'callout' ? '👊 ¿A dónde vamos? Describe la ruta y el plan...' :
                        postType === 'poll' ? '📊 ¿Cuál es la pregunta para la comunidad?' :
                        postType === 'route' ? '🗺️ Comparte cómo fue la ruta de hoy...' :
                        postType === 'stats' ? '⚡ ¿Cómo estuvo la rodada? Agrega comentarios...' :
                        '¿Cuál es la ruta o rodada de hoy? Comparte algo con la comunidad...'
                      }
                      rows={3}
                      className="w-full bg-transparent resize-none text-white text-sm focus:outline-none placeholder-text-muted"
                    />
                  </div>
                </div>

                {/* ── EXPANDABLE PANELS ── */}

                {/* POLL PANEL */}
                {activePanel === 'poll' && (
                  <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5"><BarChart2 className="w-3 h-3" /> Opciones de la encuesta</p>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-400 w-4">{i + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions]
                            next[i] = e.target.value
                            setPollOptions(next)
                          }}
                          placeholder={`Opción ${i + 1}...`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-purple-500/40"
                        />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button type="button" onClick={() => setPollOptions(prev => [...prev, ""])} className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-bold">
                        <Plus className="w-3 h-3" /> Agregar opción
                      </button>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-text-muted font-bold">Duración:</span>
                      {(['1d', '3d', '7d'] as const).map(d => (
                        <button key={d} type="button" onClick={() => setPollDuration(d)}
                          className={`text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer transition-colors ${pollDuration === d ? 'bg-purple-500 text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}>
                          {d === '1d' ? '1 día' : d === '3d' ? '3 días' : '7 días'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MOOD PANEL */}
                {activePanel === 'mood' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5"><Smile className="w-3 h-3" /> ¿Cómo vas hoy?</p>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map(m => (
                        <button key={m.value} type="button" onClick={() => { setPostMood(m.value === postMood ? null : m.value); setActivePanel(null) }}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer transition-colors ${postMood === m.value ? 'bg-primary-orange text-white' : 'bg-white/8 text-text-muted hover:bg-white/15 hover:text-white'}`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* LOCATION PANEL */}
                {activePanel === 'location' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary-orange" /> Fijar Ubicación</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={postLocation}
                        onChange={(e) => setPostLocation(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setActivePanel(null) }}
                        placeholder="Ej: Alto de Letras, Manizales..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary-orange/40"
                      />
                      <button type="button" onClick={() => setActivePanel(null)} className="px-3 py-1.5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-bold rounded-lg cursor-pointer">Fijar</button>
                    </div>
                  </div>
                )}

                {/* ROUTE LOG PANEL */}
                {activePanel === 'route' && (
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><Route className="w-3 h-3" /> Log de Ruta</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Kilómetros recorridos</label>
                        <input type="number" value={routeKm} onChange={(e) => setRouteKm(e.target.value)} placeholder="Ej: 240"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-emerald-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Destino</label>
                        <input type="text" value={routeDest} onChange={(e) => setRouteDest(e.target.value)} placeholder="Ej: Santa Marta"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-emerald-500/40" />
                      </div>
                    </div>
                  </div>
                )}

                {/* RIDE STATS PANEL */}
                {activePanel === 'stats' && (
                  <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5"><Gauge className="w-3 h-3" /> Estadísticas de Rodada</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block flex items-center gap-1"><Zap className="w-3 h-3" /> Vel. Máx (km/h)</label>
                        <input type="number" value={statsMaxSpeed} onChange={(e) => setStatsMaxSpeed(e.target.value)} placeholder="Ej: 160"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block flex items-center gap-1"><Route className="w-3 h-3" /> Kilómetros</label>
                        <input type="number" value={routeKm} onChange={(e) => setRouteKm(e.target.value)} placeholder="Ej: 350"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block flex items-center gap-1"><Timer className="w-3 h-3" /> Duración</label>
                        <input type="text" value={statsTime} onChange={(e) => setStatsTime(e.target.value)} placeholder="Ej: 4h 30min"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block flex items-center gap-1"><Fuel className="w-3 h-3" /> Combustible (L)</label>
                        <input type="number" value={statsFuel} onChange={(e) => setStatsFuel(e.target.value)} placeholder="Ej: 12.5"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/40" />
                      </div>
                    </div>
                  </div>
                )}

                {/* CALLOUT PANEL */}
                {activePanel === 'callout' && (
                  <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5"><UserPlus className="w-3 h-3" /> Convocar Compas de Ruta</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Fecha</label>
                        <input type="date" value={calloutDate} onChange={(e) => setCalloutDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Hora de salida</label>
                        <input type="time" value={calloutTime} onChange={(e) => setCalloutTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Punto de encuentro</label>
                        <input type="text" value={calloutFrom} onChange={(e) => setCalloutFrom(e.target.value)} placeholder="Ej: Parque de Bolívar"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-blue-500/40" />
                      </div>
                      <div>
                        <label className="text-[9px] text-text-muted font-bold uppercase mb-1 block">Cupos disponibles</label>
                        <input type="number" min="1" max="50" value={calloutSlots} onChange={(e) => setCalloutSlots(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/40" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Previews */}
                {mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mediaUrls.map((url, idx) => (
                      <div key={idx} className="h-24 rounded-lg relative overflow-hidden group border border-white/10">
                        <img src={url} alt="Adjunto" className="w-full h-full object-cover" />
                        <button onClick={() => removeMedia(idx)} type="button"
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 rounded-full text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── TOOLBAR ── */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  {/* Standard tools row */}
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-[9px] text-text-muted font-black uppercase tracking-widest mr-1">Adjuntar:</span>
                    
                    {/* Photo/Video */}
                    <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'media' ? 'bg-primary-orange/20 text-primary-orange' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`} title="Foto o Video">
                      <Image className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Foto/Video</span>
                      <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>

                    {/* Mood */}
                    <button type="button" onClick={() => togglePanel('mood')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'mood' || postMood ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Estado de ánimo">
                      <Smile className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Estado</span>
                    </button>

                    {/* Location */}
                    <button type="button" onClick={() => togglePanel('location')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'location' || postLocation ? 'bg-primary-orange/20 text-primary-orange' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Ubicación">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ubicación</span>
                    </button>

                    {/* Poll */}
                    <button type="button" onClick={() => { togglePanel('poll'); setPostType('poll') }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'poll' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Encuesta">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Encuesta</span>
                    </button>
                  </div>

                  {/* Moto-exclusive tools row */}
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-[9px] text-text-muted font-black uppercase tracking-widest mr-1">🏍️ Moto:</span>

                    {/* Route Log */}
                    <button type="button" onClick={() => { togglePanel('route'); setPostType('route') }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'route' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Log de ruta">
                      <Route className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ruta</span>
                    </button>

                    {/* Ride Stats */}
                    <button type="button" onClick={() => { togglePanel('stats'); setPostType('stats') }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'stats' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Estadísticas de rodada">
                      <Gauge className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Stats</span>
                    </button>

                    {/* Alert */}
                    <button type="button" onClick={() => { setPostType('alert'); setActivePanel(null) }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${postType === 'alert' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Alerta vial">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Alerta Vial</span>
                    </button>

                    {/* Callout */}
                    <button type="button" onClick={() => { togglePanel('callout'); setPostType('callout') }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${activePanel === 'callout' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Convocar compas">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Convocar</span>
                    </button>

                    {/* Moto del día */}
                    <button type="button" onClick={() => setPostType(p => p === 'moto_del_dia' ? 'normal' : 'moto_del_dia')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${postType === 'moto_del_dia' ? 'bg-primary-orange/20 text-primary-orange' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}
                      title="Mi Moto del Día">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Moto del Día</span>
                    </button>

                    {/* Mechanic / Diagnosis */}
                    <button type="button" onClick={() => { setPostType('normal'); setActivePanel(null); setContent(prev => (prev ? prev : "🔧 Consulta mecánica: ")) }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer bg-white/5 text-text-muted hover:bg-white/10 hover:text-white transition-all"
                      title="Diagnóstico mecánico">
                      <Wrench className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mecánica</span>
                    </button>
                  </div>

                  {/* Submit row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {uploading && (
                        <span className="text-xs text-text-muted flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-orange" /> Subiendo...
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={submitting || (!content.trim() && mediaUrls.length === 0 && postType === 'normal' && !postMood && !postLocation)}
                      className="py-2 px-5 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/5 disabled:text-text-muted text-white text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary-orange/10 uppercase tracking-wide"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Publicar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-6">
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl shadow-xl">
              <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
              <h3 className="font-semibold text-white">Feed Vacío</h3>
              <p className="text-text-muted text-sm mt-1">Nadie ha publicado nada todavía. ¡Comparte tu primera ruta!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, idx) => {
                const hasLiked = session && post.likes?.some((l) => l.userId === session.user.id)
                const isAdVideo = activeAds.length > 0 && (
                  activeAds[0].bannerUrl.toLowerCase().endsWith(".mp4") ||
                  activeAds[0].bannerUrl.toLowerCase().endsWith(".webm") ||
                  activeAds[0].bannerUrl.toLowerCase().endsWith(".mov")
                )
                
                return (
                  <React.Fragment key={post.id}>
                    {idx === 2 && activeAds.length > 0 && (
                      <div 
                        onClick={() => handleAdClick(activeAds[0].id, activeAds[0].targetUrl)}
                        className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 relative border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-white block">{activeAds[0].sponsorName}</span>
                              <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider block">Patrocinado 📢</span>
                            </div>
                          </div>
                          
                          <span className="text-[9px] text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/5 font-semibold">AD</span>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-extrabold text-sm text-white">{activeAds[0].titulo}</h3>
                          <p className="text-xs text-text-muted leading-relaxed">{activeAds[0].descripcion}</p>
                          
                          <div className="w-full h-48 rounded-xl overflow-hidden bg-black border border-white/10">
                            {isAdVideo ? (
                              <video src={activeAds[0].bannerUrl} autoPlay loop muted className="w-full h-full object-cover" />
                            ) : (
                              <img src={activeAds[0].bannerUrl} alt="ad-post-banner" className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center text-[10px] text-blue-400 font-bold border-t border-white/5">
                          <span>Más información en su web oficial</span>
                          <span className="flex items-center gap-1 hover:underline">Visitar Sitio →</span>
                        </div>
                      </div>
                    )}

                    <div 
                      className={`post-card glass-panel p-5 rounded-2xl shadow-xl space-y-4 opacity-0 relative transition-all ${
                        activeMenuPostId === post.id || (hoveredPostUserId === post.user.id && hoveredPostId === post.id)
                          ? "z-30" 
                          : "z-10"
                      }`}
                    >
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div 
                        className="relative"
                        onMouseEnter={() => { setHoveredPostUserId(post.user.id); setHoveredPostId(post.id); }}
                        onMouseLeave={() => { setHoveredPostUserId(null); setHoveredPostId(null); }}
                      >
                        <Link 
                          href={`/garage/${post.user.username}`}
                          className="flex items-center space-x-3 group cursor-pointer"
                        >
                          {post.user.fotoPerfil ? (
                            <img
                              src={post.user.fotoPerfil}
                              alt={post.user.nombre || ""}
                              className="w-10 h-10 rounded-full object-cover group-hover:scale-105 duration-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-orange/10 border border-primary-orange/20 flex items-center justify-center group-hover:scale-105 duration-200">
                              <User className="w-5 h-5 text-primary-orange" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-sm text-white group-hover:text-primary-orange transition-colors">
                              {post.user.nombre || post.user.username}
                            </h4>
                            <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5 flex-wrap">
                              {(post.user.username || "rider").startsWith("@") 
                                ? (post.user.username || "rider") 
                                : `@${post.user.username || "rider"}`}
                              <VerifiedBadge username={post.user.username} />
                              <span>• {new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.updatedAt && post.updatedAt !== post.createdAt && (
                                <span className="text-[10px] text-text-muted/60 italic flex items-center gap-0.5">
                                  · editado
                                </span>
                              )}
                              {post.visibilidad && post.visibilidad !== 'publico' && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${post.visibilidad === 'compas' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/10 text-text-muted'}`}>
                                  {post.visibilidad === 'compas' ? '👊 Compas' : '🔒 Solo yo'}
                                </span>
                              )}
                            </span>
                          </div>
                        </Link>

                        {/* Hover Card Modal Preview for Post Author */}
                        {hoveredPostUserId === post.user.id && hoveredPostId === post.id && (
                          <div className="absolute left-0 top-full pt-2 w-72 z-50 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto">
                            <div className="p-4 bg-[#0e141c]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-orange/15 border border-primary-orange/20 flex-shrink-0">
                                  {post.user.fotoPerfil ? (
                                    <img src={post.user.fotoPerfil} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-primary-orange" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-black text-white truncate">{post.user.nombre || post.user.username}</h5>
                                  <span className="text-[9px] text-primary-orange font-bold uppercase tracking-wider">{post.user.tipoRider || "Piloto"}</span>
                                </div>
                              </div>

                              {post.user.bio && (
                                <p className="text-[10px] text-text-muted leading-relaxed italic border-t border-white/5 pt-2">
                                  "{post.user.bio}"
                                </p>
                              )}

                              <div className="border-t border-white/5 pt-2 space-y-1 text-[10px] text-text-muted">
                                {post.user.ciudad && (
                                  <div className="flex justify-between">
                                    <span className="font-bold">Ciudad:</span>
                                    <span className="text-white">{post.user.ciudad}</span>
                                  </div>
                                )}

                                {post.user.motos && post.user.motos.length > 0 && (
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="font-bold flex-shrink-0">Moto:</span>
                                    <span className="text-white text-right truncate max-w-[140px]">
                                      🏍️ {post.user.motos[0].marca} {post.user.motos[0].modelo}
                                      {post.user.motos[0].apodo && ` ("${post.user.motos[0].apodo}")`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Compas and Intercom Buttons - only show for other users */}
                              {post.user.id !== session?.user?.id && (
                              <div className="border-t border-white/5 pt-3 flex gap-2">
                                {/* Ser Compas Button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSerCompas(post.user.id);
                                  }}
                                  disabled={followingLoading[post.user.id]}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    followedPilotIds[post.user.id]
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : "bg-primary-orange hover:bg-primary-orange-hover text-white"
                                  }`}
                                >
                                  {followingLoading[post.user.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : followedPilotIds[post.user.id] ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserPlus className="w-3.5 h-3.5" />
                                  )}
                                  {followedPilotIds[post.user.id] ? "Compas" : "Ser Compas"}
                                </button>

                                {/* Intercomunicador Button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleIntercomunicador(post.user.id);
                                  }}
                                  disabled={chatLoading[post.user.id]}
                                  className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  {chatLoading[post.user.id] ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <MessageCircle className="w-3.5 h-3.5 text-primary-orange" />
                                  )}
                                  Intercom
                                </button>
                              </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Context Menu Dropdown */}
                      <div className="relative post-options-container">
                        <button
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {activeMenuPostId === post.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setActiveMenuPostId(null)} />
                            <div className="absolute right-0 top-[110%] w-72 bg-neutral-950/98 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-30 backdrop-blur-lg flex flex-col text-left text-white max-h-[80vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                              
                              {/* ── OWNER SECTION ── */}
                              {session?.user?.id === post.user.id && (
                                <>
                                  <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest text-primary-orange">Tu publicación</p>

                                  {/* Edit */}
                                  <button
                                    onClick={() => {
                                      setEditingPostId(post.id)
                                      setEditContent(post.contenido.replace(/\[[\w]+:\{.*?\}\]\n?/g, "").replace(/\[mood:[^\]]+\]\n?/g, "").replace(/\[location:[^\]]+\]\n?/g, "").trim())
                                      setActiveMenuPostId(null)
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                                  >
                                    <Wrench className="w-4 h-4 text-primary-orange flex-shrink-0" />
                                    <span>Editar publicación</span>
                                  </button>

                                  {/* Visibility submenu */}
                                  <div className="px-3 py-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1.5 flex items-center gap-1.5">
                                      <EyeOff className="w-3 h-3" /> Quién puede verla
                                    </p>
                                    <div className="flex gap-1.5">
                                      {([
                                        { key: 'publico', label: '🌐 Público', color: 'emerald' },
                                        { key: 'compas', label: '👊 Compas', color: 'blue' },
                                        { key: 'solo_yo', label: '🔒 Solo yo', color: 'neutral' },
                                      ] as const).map(opt => (
                                        <button
                                          key={opt.key}
                                          type="button"
                                          onClick={() => handleChangeVisibility(post.id, opt.key)}
                                          className={`flex-1 text-[10px] py-1.5 px-1 rounded-lg font-bold cursor-pointer transition-colors text-center ${
                                            post.visibilidad === opt.key
                                              ? 'bg-primary-orange text-white'
                                              : 'bg-white/8 text-text-muted hover:bg-white/15 hover:text-white'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    disabled={deletingPostId === post.id}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors cursor-pointer text-red-400 disabled:opacity-50"
                                  >
                                    {deletingPostId === post.id
                                      ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                      : <Ban className="w-4 h-4 flex-shrink-0" />}
                                    <span>Eliminar publicación</span>
                                  </button>

                                  <div className="border-t border-white/5 my-1.5" />
                                </>
                              )}


                              <button
                                onClick={() => handleFeedback("interesa")}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Me interesa</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Verás más publicaciones como esta.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => handleFeedback("no_interesa")}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <MinusCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">No me interesa</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Verás menos publicaciones como esta.</span>
                                </div>
                              </button>

                              <div className="border-t border-white/5 my-1.5" />

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert("Publicación guardada en tus elementos guardados.")
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <Bookmark className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Guardar video / publicación</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Agregar a tus elementos guardados.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => handleCopyLink(post.id)}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-white">Copiar enlace</span>
                              </button>

                              <div className="border-t border-white/5 my-1.5" />

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert("Esta publicación no tiene ediciones registradas.")
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <History className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span className="text-white">Ver historial de cambios</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert("Notificaciones activadas para esta publicación.")
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Bell className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span className="text-white">Activar notificaciones de esta publicación</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert("Ves esto porque sigues a este piloto o compartes intereses de rodada comunes.")
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-text-muted flex-shrink-0" />
                                <span className="text-white">¿Por qué veo esta publicación?</span>
                              </button>

                              <div className="border-t border-white/5 my-1.5" />

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert("Reporte enviado a los administradores del grupo.")
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span className="text-white">Reportar publicación a administradores del grupo</span>
                              </button>

                              <button
                                onClick={() => handleHidePost(post.id)}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <EyeOff className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Ocultar publicación</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Ver menos publicaciones como esta.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => handleHideUser(post.user.id, post.user.nombre || post.user.username || "Piloto")}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <Clock className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Ocultar a {post.user.nombre || post.user.username} durante 30 días</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Dejar de ver publicaciones temporalmente.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => handleHideUser(post.user.id, post.user.nombre || post.user.username || "Piloto")}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <UserX className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Ocultar todo de {post.user.nombre || post.user.username}</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Dejar de ver publicaciones de esta persona.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  alert(`Gracias por el reporte. Revisaremos la publicación de ${post.user.nombre || post.user.username || "este piloto"} de forma confidencial.`)
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Reportar publicación</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">No le diremos a {post.user.nombre || post.user.username} quién envió el reporte.</span>
                                </div>
                              </button>

                              <button
                                onClick={() => handleHideUser(post.user.id, post.user.nombre || post.user.username || "Piloto")}
                                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer"
                              >
                                <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="block text-white">Bloquear el perfil de {post.user.nombre || post.user.username}</span>
                                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">Ya no podrán verse ni contactarse.</span>
                                </div>
                              </button>

                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {editingPostId === post.id ? (
                      <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-neutral-900/60 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary-orange/40 resize-none"
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPostId(null)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] font-bold text-white transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditPost(post.id)}
                            disabled={editSubmitting}
                            className="px-3 py-1.5 bg-primary-orange hover:bg-primary-orange-hover disabled:bg-white/5 disabled:text-text-muted rounded-lg text-[11px] font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const raw = post.contenido || ""
                        const metaRegex = /\[(\w+):(\{.*?\}|\{\})\]\n?/g
                        const metas: Record<string, any> = {}
                        let plainText = raw.replace(metaRegex, (_, type, json) => {
                          try { metas[type] = JSON.parse(json) } catch { metas[type] = {} }
                          return ""
                        })
                        const mood = raw.match(/\[mood:([^\]]+)\]/)?.[1]
                        const location = raw.match(/\[location:([^\]]+)\]/)?.[1]
                        plainText = plainText.replace(/\[mood:[^\]]+\]\n?/g, "").replace(/\[location:[^\]]+\]\n?/g, "").trim()

                        return (
                          <div className="space-y-3">
                            {/* Mood + Location badges */}
                            {(mood || location) && (
                              <div className="flex flex-wrap gap-2">
                                {mood && (
                                  <span className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white">
                                    <Smile className="w-3 h-3 text-yellow-400" />
                                    {[
                                      { label: "En ruta 🏍️", value: "en_ruta" },
                                      { label: "Quemado 🔥", value: "quemado" },
                                      { label: "Buscando compas 👊", value: "buscando_compas" },
                                      { label: "Garaje mode 🔧", value: "garaje" },
                                      { label: "Fin de rodada ✅", value: "fin_rodada" },
                                      { label: "Alerta vial 🚨", value: "alerta" },
                                      { label: "Estreno de moto 🆕", value: "estreno" },
                                      { label: "Lluvia en la vía 🌧️", value: "lluvia" },
                                    ].find(m => m.value === mood)?.label || mood}
                                  </span>
                                )}
                                {location && (
                                  <span className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white">
                                    <MapPin className="w-3 h-3 text-primary-orange" />{location}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Alert Card */}
                            {metas.alert && (
                              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Alerta Vial</span>
                              </div>
                            )}

                            {/* Moto del día Card */}
                            {metas.moto_del_dia && (
                              <div className="bg-primary-orange/10 border border-primary-orange/30 rounded-xl px-4 py-3 flex items-center gap-3">
                                <Flame className="w-5 h-5 text-primary-orange flex-shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-orange">Mi Moto del Día</span>
                              </div>
                            )}

                            {/* Route Card */}
                            {metas.route && (metas.route.km || metas.route.dest) && (
                              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-2"><Route className="w-3 h-3" /> Log de Ruta</p>
                                <div className="flex gap-4">
                                  {metas.route.km && <div><p className="text-[9px] text-text-muted font-bold uppercase">Distancia</p><p className="text-white font-black text-lg leading-tight">{metas.route.km} <span className="text-xs font-normal text-text-muted">km</span></p></div>}
                                  {metas.route.dest && <div><p className="text-[9px] text-text-muted font-bold uppercase">Destino</p><p className="text-white font-black text-lg leading-tight">{metas.route.dest}</p></div>}
                                </div>
                              </div>
                            )}

                            {/* Stats Card */}
                            {metas.stats && (
                              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-3"><Gauge className="w-3 h-3" /> Estadísticas de Rodada</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {metas.stats.maxSpeed && <div className="text-center"><Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" /><p className="text-white font-black text-base leading-tight">{metas.stats.maxSpeed}<span className="text-[9px] text-text-muted font-normal"> km/h</span></p><p className="text-[9px] text-text-muted">Vel. Máx</p></div>}
                                  {metas.stats.km && <div className="text-center"><Route className="w-4 h-4 text-cyan-400 mx-auto mb-1" /><p className="text-white font-black text-base leading-tight">{metas.stats.km}<span className="text-[9px] text-text-muted font-normal"> km</span></p><p className="text-[9px] text-text-muted">Recorridos</p></div>}
                                  {metas.stats.time && <div className="text-center"><Timer className="w-4 h-4 text-cyan-400 mx-auto mb-1" /><p className="text-white font-black text-base leading-tight">{metas.stats.time}</p><p className="text-[9px] text-text-muted">Duración</p></div>}
                                  {metas.stats.fuel && <div className="text-center"><Fuel className="w-4 h-4 text-cyan-400 mx-auto mb-1" /><p className="text-white font-black text-base leading-tight">{metas.stats.fuel}<span className="text-[9px] text-text-muted font-normal"> L</span></p><p className="text-[9px] text-text-muted">Combustible</p></div>}
                                </div>
                              </div>
                            )}

                            {/* Callout Card */}
                            {metas.callout && (
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5 mb-3"><UserPlus className="w-3 h-3" /> Convocatoria de Ruta</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {metas.callout.date && <div><p className="text-[9px] text-text-muted font-bold uppercase">Fecha</p><p className="text-white font-bold">{metas.callout.date}</p></div>}
                                  {metas.callout.time && <div><p className="text-[9px] text-text-muted font-bold uppercase">Hora</p><p className="text-white font-bold">{metas.callout.time}</p></div>}
                                  {metas.callout.from && <div><p className="text-[9px] text-text-muted font-bold uppercase">Encuentro</p><p className="text-white font-bold">{metas.callout.from}</p></div>}
                                  {metas.callout.slots && <div><p className="text-[9px] text-text-muted font-bold uppercase">Cupos</p><p className="text-white font-bold">{metas.callout.slots} disponibles</p></div>}
                                </div>
                              </div>
                            )}

                            {/* Poll Card */}
                            {metas.poll && metas.poll.options && (
                              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 mb-3"><BarChart2 className="w-3 h-3" /> Encuesta · {metas.poll.duration === '1d' ? '1 día' : metas.poll.duration === '3d' ? '3 días' : '7 días'}</p>
                                <div className="space-y-2">
                                  {(metas.poll.options as string[]).map((opt: string, i: number) => (
                                    <button key={i} type="button" className="w-full text-left bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-lg px-3 py-2 text-xs text-white font-semibold cursor-pointer transition-colors">
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Plain text */}
                            {plainText && (
                              <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed">{plainText}</p>
                            )}
                          </div>
                        )
                      })()
                    )}

                    {/* Bento-style Image/Video Grid */}
                    {post.mediaUrls.length > 0 && (() => {
                      const count = post.mediaUrls.length
                      let gridClass = ""
                      if (count === 1) gridClass = "grid-cols-1 h-80"
                      else if (count === 2) gridClass = "grid-cols-2 h-80"
                      else if (count === 3) gridClass = "grid-cols-3 grid-rows-2 h-96"
                      else gridClass = "grid-cols-4 grid-rows-2 h-[450px]"

                      return (
                        <div className={`grid gap-2 rounded-2xl overflow-hidden ${gridClass}`}>
                          {post.mediaUrls.slice(0, 4).map((url, idx) => {
                            const isVideo = url.toLowerCase().endsWith(".mp4") ||
                                            url.toLowerCase().endsWith(".mov") ||
                                            url.toLowerCase().endsWith(".webm")
                            
                            let itemSpan = "h-full w-full"
                            if (count === 3) {
                              if (idx === 0) itemSpan = "col-span-2 row-span-2 h-full w-full"
                              else itemSpan = "col-span-1 row-span-1 h-full w-full"
                            } else if (count >= 4) {
                              if (idx === 0) itemSpan = "col-span-2 row-span-2 h-full w-full"
                              else if (idx === 1) itemSpan = "col-span-2 row-span-1 h-full w-full"
                              else itemSpan = "col-span-1 row-span-1 h-full w-full"
                            }

                            return (
                              <div key={idx} className={`relative bg-neutral-900 overflow-hidden ${itemSpan}`}>
                                {isVideo ? (
                                  <video
                                    src={url}
                                    controls
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt="Adjunto Rider"
                                    className="w-full h-full object-cover"
                                  />
                                )}

                                {count > 4 && idx === 3 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                                    <span className="text-white text-xl font-black">+{count - 4}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Action buttons */}
                    <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                      {/* Custom Piston Like / Reaction Button */}
                      <div
                        onMouseEnter={() => setActiveReactionsPostId(post.id)}
                        onMouseLeave={() => setActiveReactionsPostId(null)}
                        className="relative flex items-center"
                      >
                        {/* Reactions Popover */}
                        {activeReactionsPostId === post.id && (
                          <div className="absolute bottom-full left-0 pb-3 z-40 animate-in fade-in slide-in-from-bottom-2 duration-100">
                            <div className="bg-[#0c121a]/98 border border-white/10 rounded-2xl shadow-2xl py-2 px-3.5 flex gap-4 backdrop-blur-lg items-center">
                              {/* Option 1: Dar Fuerza (Pistón) */}
                              <button
                                onClick={() => handleLike(post.id, "fuerza")}
                                className="flex flex-col items-center gap-1 group/btn cursor-pointer transition-transform duration-150 hover:scale-110"
                              >
                                <PistonIcon className="w-6 h-6 text-primary-orange fill-primary-orange/20 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider group-hover/btn:text-primary-orange">Dar Fuerza</span>
                              </button>

                              {/* Option 2: No gusta (gotitas de aceite) */}
                              <button
                                onClick={() => handleLike(post.id, "no_gusta")}
                                className="flex flex-col items-center gap-1 group/btn cursor-pointer transition-transform duration-150 hover:scale-110"
                              >
                                <Droplet className="w-6 h-6 text-amber-500 fill-amber-500/25 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider group-hover/btn:text-amber-500">No gusta</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Main Button Trigger */}
                        <button
                          onClick={() => handleLike(post.id, postReactions[post.id] || "fuerza")}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                            hasLiked 
                              ? postReactions[post.id] === "no_gusta" 
                                ? "text-amber-500" 
                                : "text-primary-orange"
                              : "text-text-muted hover:text-primary-orange"
                          }`}
                        >
                          {hasLiked && postReactions[post.id] === "no_gusta" ? (
                            <Droplet className="w-5 h-5 fill-current" />
                          ) : (
                            <PistonIcon className={`w-5 h-5 ${hasLiked ? "fill-primary-orange/20" : ""}`} />
                          )}
                          <span>
                            {hasLiked && postReactions[post.id] === "no_gusta" ? "No gusta" : "Dar fuerza"} ({post.likes?.length || 0})
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-primary-orange transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                    </div>

                    {/* Comments block */}
                    {activeCommentsPostId === post.id && (
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        {loadingComments[post.id] ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                          </div>
                        ) : (postComments[post.id] || []).length === 0 ? (
                          <p className="text-xs text-text-muted italic">Sin comentarios. ¡Di algo!</p>
                        ) : (
                          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                            {(postComments[post.id] || []).map((comment) => (
                              <div key={comment.id} className="flex gap-2.5 bg-black/35 p-3 rounded-xl border border-white/5">
                                <div className="w-7 h-7 rounded-full bg-primary-orange/20 flex items-center justify-center flex-shrink-0">
                                  {comment.user.fotoPerfil ? (
                                    <img
                                      src={comment.user.fotoPerfil}
                                      alt={comment.user.nombre || ""}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-4 h-4 text-primary-orange" />
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-extrabold text-white">
                                      {comment.user.nombre || comment.user.username}
                                    </span>
                                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                                      {(comment.user.username || "rider").startsWith("@") 
                                        ? (comment.user.username || "rider") 
                                        : `@${comment.user.username || "rider"}`}
                                       <VerifiedBadge username={comment.user.username} className="w-3 h-3" />
                                      <span>• {new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/80">{comment.contenido}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Input */}
                        {session && (
                          <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Añade tu respuesta..."
                              value={newCommentContent[post.id] || ""}
                              onChange={(e) =>
                                setNewCommentContent((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              className="flex-grow bg-black/40 border border-white/10 rounded-lg p-2.5 px-3 text-xs focus:border-primary-orange focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="p-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                  </div>
                </React.Fragment>
              )
            })}
            </div>
          )}
        </section>

        {/* COL 3: RIGHT SIDEBAR (Active Rodadas, Alertas Viales, SOS Widget) */}
        <aside ref={sidebarRightRef} className="lg:col-span-3 space-y-6 sticky top-22">
          
          {/* Suggested Pilots Widget */}
          {discoverUsers.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
              <h4 className="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary-orange" /> Descubrir Pilotos
              </h4>
              <div className="space-y-3">
                {discoverUsers.map((pilot) => (
                  <div 
                    key={pilot.id} 
                    onMouseEnter={() => setHoveredPilotId(pilot.id)}
                    onMouseLeave={() => setHoveredPilotId(null)}
                    className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 relative"
                  >
                    {/* Hover Card Modal Preview */}
                    {hoveredPilotId === pilot.id && (
                      <div className="absolute right-full top-1/2 -translate-y-1/2 pr-3 w-72 z-50 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto">
                        <div className="p-4 bg-[#0e141c]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-orange/15 border border-primary-orange/20 flex-shrink-0">
                              {pilot.fotoPerfil ? (
                                <img src={pilot.fotoPerfil} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary-orange" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-white truncate">{pilot.nombre || pilot.username}</h5>
                              <span className="text-[9px] text-primary-orange font-bold uppercase tracking-wider">{pilot.tipoRider}</span>
                            </div>
                          </div>

                          {pilot.bio && (
                            <p className="text-[10px] text-text-muted leading-relaxed italic border-t border-white/5 pt-2">
                              "{pilot.bio}"
                            </p>
                          )}

                          <div className="border-t border-white/5 pt-2 space-y-1 text-[10px] text-text-muted">
                            {pilot.ciudad && (
                              <div className="flex justify-between">
                                <span className="font-bold">Ciudad:</span>
                                <span className="text-white">{pilot.ciudad}</span>
                              </div>
                            )}

                            {pilot.motos && pilot.motos.length > 0 && (
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold flex-shrink-0">Moto:</span>
                                <span className="text-white text-right truncate max-w-[140px]">
                                  🏍️ {pilot.motos[0].marca} {pilot.motos[0].modelo}
                                  {pilot.motos[0].apodo && ` ("${pilot.motos[0].apodo}")`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Compas and Intercom Buttons */}
                          <div className="border-t border-white/5 pt-3 flex gap-2">
                            {/* Ser Compas Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleSerCompas(pilot.id);
                              }}
                              disabled={followingLoading[pilot.id]}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                followedPilotIds[pilot.id]
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : "bg-primary-orange hover:bg-primary-orange-hover text-white"
                              }`}
                            >
                              {followingLoading[pilot.id] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : followedPilotIds[pilot.id] ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              {followedPilotIds[pilot.id] ? "Compas" : "Ser Compas"}
                            </button>

                            {/* Intercomunicador Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleIntercomunicador(pilot.id);
                              }}
                              disabled={chatLoading[pilot.id]}
                              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {chatLoading[pilot.id] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5 text-primary-orange" />
                              )}
                              Intercom
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Link href={`/garage/${pilot.username}`} className="flex items-center gap-2.5 group cursor-pointer">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-orange/15 border border-primary-orange/20">
                        {pilot.fotoPerfil ? (
                          <img src={pilot.fotoPerfil} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-orange" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-black text-white truncate group-hover:text-primary-orange transition-colors">
                          {pilot.nombre || pilot.username}
                        </span>
                        <span className="block text-[9px] text-text-muted uppercase font-bold tracking-wider">
                          {pilot.tipoRider}
                        </span>
                      </div>
                    </Link>

                    <Link
                      href={`/garage/${pilot.username}`}
                      className="px-2 py-1 bg-primary-orange hover:bg-primary-orange-hover text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Widget 1: Rodadas Próximas */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
            <h4 className="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-orange" /> Rodadas en Colombia
            </h4>
            <div className="space-y-3">
              {/* Rodada 1 */}
              <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xs text-white uppercase">Bogotá - Guatavita</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-orange/20 text-primary-orange">12 JUL</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-primary-orange" /> Punto: C.C. Bima Autonorte (7:00 AM)
                </div>
                <button className="w-full py-1.5 bg-white/5 hover:bg-primary-orange hover:text-white border border-white/5 hover:border-primary-orange text-[10px] font-bold rounded-lg transition-all cursor-pointer">
                  Confirmar Asistencia
                </button>
              </div>

              {/* Rodada 2 */}
              <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xs text-white uppercase">Vuelta a Oriente (Medellín)</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary-orange/20 text-primary-orange">19 JUL</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-primary-orange" /> Punto: San Diego (8:30 AM)
                </div>
                <button className="w-full py-1.5 bg-white/5 hover:bg-primary-orange hover:text-white border border-white/5 hover:border-primary-orange text-[10px] font-bold rounded-lg transition-all cursor-pointer">
                  Confirmar Asistencia
                </button>
              </div>
            </div>
          </div>

          {/* Widget 2: Alertas Viales Recientes */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary-orange" /> Alertas Viales
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="p-2.5 bg-red-950/20 border border-red-500/10 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-[10px]">
                  <span className="font-bold text-red-300 block">Retén de Policía</span>
                  <p className="text-text-muted mt-0.5">Vía La Calera km 4.5 • Hace 15 min</p>
                </div>
              </div>

              <div className="p-2.5 bg-amber-950/25 border border-amber-500/10 rounded-xl flex items-start gap-2">
                <Compass className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-[10px]">
                  <span className="font-bold text-amber-300 block">Lluvia Fuerte / Niebla</span>
                  <p className="text-text-muted mt-0.5">Alto de Letras • Hace 40 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: Contacto S.O.S de Emergencia */}
          <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3.5">
            <h4 className="font-black text-white uppercase text-xs tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> S.O.S. Contactos
            </h4>
            <p className="text-[10px] text-text-muted leading-relaxed">
              En caso de un impacto severo monitoreado por el giroscopio, notificaremos de inmediato a:
            </p>
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-white">Mamá (Contacto Biker)</span>
                <span className="text-[10px] text-text-muted">315 765 4321</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-green-950 text-green-300 font-bold border border-green-500/20">Vinculado</span>
            </div>
            
            <Link 
              href={`/garage/${session?.user?.username || 'user'}`}
              className="block text-center text-[10px] font-bold text-primary-orange hover:underline cursor-pointer"
            >
              Configurar contactos en Perfil →
            </Link>
          </div>

        </aside>

      </div>
      {/* Fullscreen Story Viewer Modal */}
      {showStoryViewer && stories.length > 0 && stories[activeStoryUserIdx] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-lg">
          {/* Top Header / Progress Bars */}
          <div className="w-full space-y-4 max-w-lg mx-auto">
            {/* Progress segment bars */}
            <div className="flex gap-1.5 w-full">
              {stories[activeStoryUserIdx].statuses.map((_: any, idx: number) => (
                <div key={idx} className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-primary-orange transition-all duration-[5000ms] ease-linear ${
                      idx < activeStoryIdx 
                        ? "w-full" 
                        : idx === activeStoryIdx 
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
                  {stories[activeStoryUserIdx].fotoPerfil ? (
                    <img src={stories[activeStoryUserIdx].fotoPerfil} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-orange" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black">
                    {stories[activeStoryUserIdx].nombre || stories[activeStoryUserIdx].username}
                  </h4>
                  <span className="text-[9px] text-text-muted">
                    {new Date(stories[activeStoryUserIdx].statuses[activeStoryIdx]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              src={stories[activeStoryUserIdx].statuses[activeStoryIdx]?.mediaUrl} 
              alt="Estado Rider" 
              className="max-w-full max-h-full rounded-2xl object-contain border border-white/5 shadow-2xl"
            />
          </div>

          {/* Bottom Controls / Text */}
          <div className="py-6 flex justify-between items-center px-4 max-w-lg mx-auto w-full">
            <button
              onClick={() => {
                if (activeStoryIdx > 0) {
                  setActiveStoryIdx(prev => prev - 1)
                } else if (activeStoryUserIdx > 0) {
                  setActiveStoryUserIdx(prev => prev - 1)
                  setActiveStoryIdx(stories[activeStoryUserIdx - 1].statuses.length - 1)
                }
              }}
              disabled={activeStoryIdx === 0 && activeStoryUserIdx === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
              {stories[activeStoryUserIdx].nombre || stories[activeStoryUserIdx].username} ({activeStoryIdx + 1}/{stories[activeStoryUserIdx].statuses.length})
            </span>
            <button
              onClick={() => {
                if (activeStoryIdx < stories[activeStoryUserIdx].statuses.length - 1) {
                  setActiveStoryIdx(prev => prev + 1)
                } else if (activeStoryUserIdx < stories.length - 1) {
                  setActiveStoryUserIdx(prev => prev + 1)
                  setActiveStoryIdx(0)
                } else {
                  setShowStoryViewer(false)
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-orange hover:bg-primary-orange-hover rounded-xl transition-all cursor-pointer"
            >
              {activeStoryIdx === stories[activeStoryUserIdx].statuses.length - 1 && activeStoryUserIdx === stories.length - 1 ? "Cerrar" : "Siguiente"}
            </button>
          </div>
        </div>
      )}

      {/* Story upload choice modal */}
      {showStoryUploadChoice && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 relative animate-scale-in">
            <h3 className="text-sm font-black uppercase text-white tracking-wider mb-4 text-center">
              Tu Estado
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowStoryUploadChoice(false)
                  const selfStoryIdx = stories.findIndex(s => s.id === session?.user?.id)
                  if (selfStoryIdx !== -1) {
                    setActiveStoryUserIdx(selfStoryIdx)
                    setActiveStoryIdx(0)
                    setShowStoryViewer(true)
                  }
                }}
                className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Ver mis estados
              </button>
              <button
                onClick={() => {
                  setShowStoryUploadChoice(false)
                  statusInputRef.current?.click()
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-orange-500/20"
              >
                Subir nuevo estado
              </button>
              <button
                onClick={() => setShowStoryUploadChoice(false)}
                className="w-full py-2 px-4 text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {uploadingStatus && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl animate-scale-in">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            <span className="text-xs text-white font-bold">Subiendo tu estado...</span>
          </div>
        </div>
      )}

      {/* Hidden Status file input upload */}
      <input
        type="file"
        ref={statusInputRef}
        onChange={handleStatusUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Global Search Modal */}
      <SearchModal isOpen={isPageSearchOpen} onClose={() => setIsPageSearchOpen(false)} />
    </div>
  )
}
