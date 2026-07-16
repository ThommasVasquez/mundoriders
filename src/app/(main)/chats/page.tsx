"use client"

import React, { useState, useEffect, useRef, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { 
  Send, User, Search, MessageSquare, Compass, 
  Loader2, CheckCircle2, ChevronLeft, MapPin, Sparkles,
  Paperclip, FileText, Download, Mic, MicOff, Phone, Video, PhoneOff, Play, Pause, UserPlus, X, Camera
} from "lucide-react"

type Conversation = {
  id: string
  tipo: string
  members: {
    user: {
      id: string
      username: string | null
      nombre: string | null
      fotoPerfil: string | null
    }
  }[]
  messages: {
    id: string
    contenido: string
    createdAt: string
  }[]
}

type Message = {
  id: string
  conversationId: string
  userId: string
  contenido: string
  createdAt: string
  user: {
    id: string
    username: string | null
    nombre: string | null
    fotoPerfil: string | null
  }
}

function ChatsContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialConvId = searchParams.get("conversationId")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sending, setSending] = useState(false)

  // Rich Media, Calling & Audio states
  const [activeCall, setActiveCall] = useState<{
    type: "voz" | "video"
    active: boolean
    duration: number
    members: any[]
    isMuted: boolean
    isVideoOff: boolean
  } | null>(null)
  const [showAddCompasOverlay, setShowAddCompasOverlay] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: "foto" | "video" | "documento"
    name: string
    url: string
  } | null>(null)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)

  const callTimerRef = useRef<any>(null)
  const audioTimerRef = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch all conversations
  const fetchConversations = async (selectId?: string) => {
    try {
      const res = await fetch("/api/chat/conversations")
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations)
        
        // Auto-select conversation if requested
        const targetId = selectId || initialConvId
        if (targetId) {
          const matched = data.conversations.find((c: Conversation) => c.id === targetId)
          if (matched) {
            setActiveConv(matched)
            fetchMessages(matched.id)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setLoadingConvs(false)
    }
  }

  // Fetch messages for active conversation
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session, initialConvId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setActiveConv(conv)
    fetchMessages(conv.id)
    // Update query param without full reload
    router.push(`/chats?conversationId=${conv.id}`, { scroll: false })
  }

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConv || (!messageInput.trim() && !selectedAttachment) || sending) return

    let content = messageInput.trim()
    if (selectedAttachment) {
      content = `[MEDIA:${selectedAttachment.type}:${selectedAttachment.name}:${selectedAttachment.url}]${content}`
    }

    setMessageInput("")
    setSelectedAttachment(null)
    setSending(true)

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          contenido: content,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Optimistically add message
        setMessages((prev) => [...prev, data.message])
        
        // Refresh conversations list to show last message
        fetchConversations(activeConv.id)

        // Trigger simulated response from recipient after 3 seconds for rich interaction
        simulateAutoReply(content)
      }
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setSending(false)
    }
  }

  // Simulate auto-reply for developer demo purposes
  const simulateAutoReply = (userMessage: string) => {
    if (!activeConv) return

    const recipient = activeConv.members[0]?.user
    if (!recipient) return

    setTimeout(async () => {
      let replyContent = "¡Hola hermano de ruta! Copiado. Nos vemos en el asfalto. 🏍️"
      
      const lower = userMessage.toLowerCase()
      if (lower.includes("precio") || lower.includes("repuesto") || lower.includes("vende") || lower.includes("portada") || lower.includes("articulo")) {
        replyContent = "¡Hola! Sí, el artículo del Marketplace todavía está disponible en Bogotá. ¿Cuándo te queda fácil pasar a revisarlo?"
      } else if (lower.includes("rodada") || lower.includes("convoy") || lower.includes("patios") || lower.includes("ruta")) {
        replyContent = "¡Excelente! Cuenta conmigo para la rodada en convoy de este fin de semana. ¿Salimos temprano?"
      } else if (lower.includes("varado") || lower.includes("sos") || lower.includes("ayuda")) {
        replyContent = "¡Copiado, piloto! Voy en camino con herramientas y kit de despinada. Mantén las luces de parqueo encendidas."
      }

      try {
        // We create a mock message in the database sent by the other participant
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConv.id,
            contenido: replyContent,
          }),
        })
        const data = await res.json()
        if (data.success) {
          // Temporarily override the userId to simulate recipient
          const mockMsg = {
            ...data.message,
            userId: recipient.id,
            user: recipient,
          }
          setMessages((prev) => [...prev, mockMsg])
          fetchConversations(activeConv.id)
        }
      } catch (err) {
        console.error(err)
      }
    }, 3000)
  }

  // Start simulated phone/video call
  const startCall = (type: "voz" | "video") => {
    if (!activeRecipient) return
    if (callTimerRef.current) clearInterval(callTimerRef.current)

    setActiveCall({
      type,
      active: true,
      duration: 0,
      members: [activeRecipient],
      isMuted: false,
      isVideoOff: false,
    })

    callTimerRef.current = setInterval(() => {
      setActiveCall((prev) => {
        if (!prev) return null
        return {
          ...prev,
          duration: prev.duration + 1,
        }
      })
    }, 1000)
  }

  const endCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    setActiveCall(null)
    setShowAddCompasOverlay(false)
  }

  const addCompaToCall = (compa: any) => {
    setActiveCall((prev) => {
      if (!prev) return null
      if (prev.members.some((m) => m.id === compa.id)) return prev
      return {
        ...prev,
        members: [...prev.members, compa],
      }
    })
    setShowAddCompasOverlay(false)
  }

  // Audio recording helpers
  const startRecordingAudio = () => {
    setIsRecordingAudio(true)
    setAudioDuration(0)
    if (audioTimerRef.current) clearInterval(audioTimerRef.current)

    audioTimerRef.current = setInterval(() => {
      setAudioDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopRecordingAudio = async (shouldSend: boolean) => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current)
      audioTimerRef.current = null
    }
    setIsRecordingAudio(false)

    if (shouldSend && activeConv) {
      const audioSeconds = audioDuration || 3
      const durationStr = `${Math.floor(audioSeconds / 60)}:${(audioSeconds % 60).toString().padStart(2, "0")}`
      const content = `[MEDIA:audio:Nota_de_voz.mp3:${durationStr}]Nota de voz`
      
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConv.id,
            contenido: content,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setMessages((prev) => [...prev, data.message])
          fetchConversations(activeConv.id)
        }
      } catch (err) {
        console.error("Error sending voice note:", err)
      }
    }
    setAudioDuration(0)
  }

  // Attachment selections
  const handleSelectAttachment = (type: "foto" | "video" | "documento") => {
    let name = ""
    let url = ""
    if (type === "foto") {
      name = "rodada_guatavita.jpg"
      url = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80"
    } else if (type === "video") {
      name = "curvas_alto_letras.mp4"
      url = "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80"
    } else if (type === "documento") {
      name = "ruta_transversal_del_cafe.gpx"
      url = "https://www.w3.org/TR/PNG/iso_8859-1.txt"
    }

    setSelectedAttachment({ type, name, url })
    setShowAttachmentMenu(false)
  }

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      if (audioTimerRef.current) clearInterval(audioTimerRef.current)
    }
  }, [])

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    const recipient = conv.members[0]?.user
    if (!recipient) return false
    const name = (recipient.nombre || "").toLowerCase()
    const username = (recipient.username || "").toLowerCase()
    const search = searchQuery.toLowerCase()
    return name.includes(search) || username.includes(search)
  })

  // Get current active recipient details
  const activeRecipient = activeConv?.members[0]?.user

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-76px)]">
        
        {/* Unified Dual Column Chat Panel */}
        <div className="flex-grow bg-neutral-900/60 border border-white/5 rounded-3xl overflow-hidden flex h-full shadow-2xl backdrop-blur-md">
          
          {/* COLUMN 1: CONVERSATIONS LIST PANEL */}
          <aside className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-neutral-950/40 ${
            activeConv ? "hidden md:flex" : "flex"
          }`}>
            {/* Search header */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <h1 className="text-base font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare className="text-primary-orange w-4 h-4" /> Chats Rider
              </h1>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-primary-orange/50 transition-colors"
                />
              </div>
            </div>

            {/* Conversations list scrollable */}
            <div className="flex-grow overflow-y-auto p-2 space-y-1.5">
              {loadingConvs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-xs space-y-1 opacity-60">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-40" />
                  <p>No tienes chats activos.</p>
                  <p className="text-[10px]">¡Escríbele a un vendedor o rider!</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const rUser = conv.members[0]?.user
                  if (!rUser) return null
                  const lastMsg = conv.messages[0]
                  const isSelected = activeConv?.id === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected 
                          ? "bg-primary-orange/10 border-primary-orange/30 text-white" 
                          : "bg-transparent border-transparent hover:bg-white/5 text-text-muted"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary-orange/15 border border-primary-orange/20 overflow-hidden flex-shrink-0">
                        {rUser.fotoPerfil ? (
                          <img src={rUser.fotoPerfil} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-orange" />
                          </div>
                        )}
                      </div>

                      {/* Details info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="text-xs font-black text-white truncate">{rUser.nombre || rUser.username}</h4>
                        </div>
                        <p className="text-[10px] text-text-muted truncate">
                          {lastMsg ? lastMsg.contenido : "Iniciaste chat..."}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* COLUMN 2: ACTIVE CONVERSATION MESSAGES VIEWPORT */}
          <section className={`flex-grow flex flex-col bg-neutral-900/10 ${
            !activeConv ? "hidden md:flex" : "flex"
          }`}>
            {activeConv && activeRecipient ? (
              <>
                {/* Header chat info */}
                <div className="p-4 border-b border-white/5 bg-neutral-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveConv(null)}
                      className="md:hidden p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="w-9 h-9 rounded-full bg-primary-orange/10 border border-primary-orange/20 overflow-hidden">
                      {activeRecipient.fotoPerfil ? (
                        <img src={activeRecipient.fotoPerfil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-orange" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-black text-white">{activeRecipient.nombre || activeRecipient.username}</h3>
                      <span className="text-[9px] text-primary-orange font-bold uppercase tracking-wider">Piloto Rider</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCall("voz")}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                      title="Llamada de voz de intercomunicador"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall("video")}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                      title="Videollamada de intercomunicador"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages scroll content */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3.5">
                  {loadingMessages ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.userId === session?.user?.id
                      
                      const match = msg.contenido.match(/^\[MEDIA:([^:]+):([^:]+):([^\]]+)\]([\s\S]*)/)
                      const mediaInfo = match 
                        ? { hasMedia: true, type: match[1], name: match[2], url: match[3], text: match[4] }
                        : { hasMedia: false, type: "", name: "", url: "", text: msg.contenido }

                      return (
                        <div 
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-xs md:max-w-md ${
                            isMe 
                              ? "bg-primary-orange text-white rounded-tr-none shadow-lg shadow-primary-orange/5" 
                              : "bg-neutral-800 text-white rounded-tl-none border border-white/5"
                          }`}>
                            {mediaInfo.hasMedia && (
                              <div className="mb-1">
                                {mediaInfo.type === "foto" && (
                                  <img 
                                    src={mediaInfo.url} 
                                    alt={mediaInfo.name} 
                                    className="w-full max-h-48 object-cover rounded-xl mb-1.5 border border-white/10" 
                                  />
                                )}
                                {mediaInfo.type === "video" && (
                                  <div className="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden mb-1.5 border border-white/10 flex flex-col items-center justify-center">
                                    <Video className="w-8 h-8 text-primary-orange animate-pulse" />
                                    <span className="text-[10px] font-bold text-white mt-2">{mediaInfo.name}</span>
                                    <span className="absolute bottom-2 left-2 text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">0:14</span>
                                  </div>
                                )}
                                {mediaInfo.type === "documento" && (
                                  <div className="flex items-center gap-2 p-2 bg-neutral-950/40 rounded-xl mb-1.5 border border-white/10 w-56">
                                    <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-grow">
                                      <span className="block text-[10px] font-bold text-white truncate">{mediaInfo.name}</span>
                                      <span className="block text-[8px] text-text-muted">Documento GPX • 140 KB</span>
                                    </div>
                                    <a 
                                      href={mediaInfo.url} 
                                      download
                                      className="p-1 text-text-muted hover:text-white flex-shrink-0 transition-colors"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                )}
                                {mediaInfo.type === "audio" && (
                                  <div className="flex items-center gap-3 p-2 bg-neutral-950/40 rounded-xl mb-1.5 border border-white/10 w-52">
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        alert("Reproduciendo nota de voz...")
                                      }}
                                      className="w-8 h-8 rounded-full bg-primary-orange/20 flex items-center justify-center text-primary-orange hover:bg-primary-orange/30 transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                    </button>
                                    <div className="flex-grow flex items-center gap-1.5">
                                      <div className="flex items-end gap-0.5 h-5">
                                        <div className="w-0.5 h-2 bg-primary-orange rounded-full" />
                                        <div className="w-0.5 h-4 bg-primary-orange rounded-full animate-pulse" />
                                        <div className="w-0.5 h-5 bg-primary-orange rounded-full" />
                                        <div className="w-0.5 h-3 bg-primary-orange rounded-full" />
                                        <div className="w-0.5 h-4 bg-primary-orange rounded-full" />
                                        <div className="w-0.5 h-2 bg-primary-orange rounded-full" />
                                      </div>
                                      <span className="text-[9px] font-mono text-text-muted">{mediaInfo.url}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {mediaInfo.text && <p className="whitespace-pre-wrap leading-relaxed">{mediaInfo.text}</p>}
                          </div>
                          <span className="text-[8px] text-text-muted mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                 {/* Attachment Preview Box */}
                {selectedAttachment && (
                  <div className="mx-4 mt-2 p-2 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-100">
                    <div className="flex items-center gap-2">
                      {selectedAttachment.type === "foto" && (
                        <img src={selectedAttachment.url} className="w-12 h-12 object-cover rounded-lg border border-white/5" />
                      )}
                      {selectedAttachment.type === "video" && (
                        <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
                          <Video className="w-5 h-5 text-primary-orange" />
                        </div>
                      )}
                      {selectedAttachment.type === "documento" && (
                        <div className="w-12 h-12 bg-neutral-950 rounded-lg flex items-center justify-center border border-white/5">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-white truncate max-w-[150px]">{selectedAttachment.name}</span>
                        <span className="block text-[9px] text-text-muted uppercase font-bold tracking-wider">{selectedAttachment.type} Adjunto</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedAttachment(null)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Input Box form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-neutral-950/20 flex gap-2 items-center">
                  
                  {/* Attachment Button */}
                  {!isRecordingAudio && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="p-2.5 bg-neutral-800 border border-white/10 hover:bg-neutral-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                        title="Adjuntar archivo de ruta"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      {showAttachmentMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowAttachmentMenu(false)} />
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-20 backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-100">
                            <button
                              type="button"
                              onClick={() => handleSelectAttachment("foto")}
                              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Camera className="w-4 h-4 text-emerald-500" />
                              <span>Foto de Rodada</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAttachment("video")}
                              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Video className="w-4 h-4 text-primary-orange" />
                              <span>Video de Rodada</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAttachment("documento")}
                              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span>Ruta GPX / SOAT</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Input Center Field */}
                  {isRecordingAudio ? (
                    <div className="flex-grow bg-neutral-900 border border-primary-orange/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="font-bold text-red-500 uppercase text-[9px] tracking-wider animate-pulse">Grabando intercom...</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs">{Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, "0")}</span>
                        <button 
                          type="button"
                          onClick={() => stopRecordingAudio(false)} 
                          className="text-text-muted hover:text-red-500 font-extrabold uppercase text-[9px] tracking-wider cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required={!selectedAttachment}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={selectedAttachment ? "Añadir comentario..." : "Escribe un mensaje de ruta..."}
                      className="flex-grow bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-primary-orange/50 transition-colors"
                    />
                  )}

                  {/* Send / Mic Trigger */}
                  {(() => {
                    if (isRecordingAudio) {
                      return (
                        <button
                          type="button"
                          onClick={() => stopRecordingAudio(true)}
                          className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-green-600/10"
                          title="Enviar nota de voz"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )
                    }
                    if (!messageInput.trim() && !selectedAttachment) {
                      return (
                        <button
                          type="button"
                          onClick={startRecordingAudio}
                          className="p-2.5 bg-neutral-800 border border-white/10 hover:bg-neutral-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Grabar nota de voz de intercomunicador"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )
                    }
                    return (
                      <button
                        type="submit"
                        disabled={sending}
                        className="p-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    )
                  })()}
                </form>
              </>
            ) : (
              // Empty selection state placeholder
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-70">
                <div className="w-16 h-16 rounded-full bg-primary-orange/10 border border-primary-orange/20 flex items-center justify-center text-primary-orange animate-pulse">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white">Mensajería Activa</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Selecciona un chat activo del panel izquierdo o contacta a un rider para coordinar compras o rodadas.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

      </main>

      {/* Fullscreen Voice/Video Call Overlay Screen */}
      {activeCall && activeCall.active && (
        <div className="fixed inset-0 bg-[#070b0f]/95 z-[999] flex flex-col items-center justify-between p-8 text-white backdrop-blur-xl animate-in fade-in duration-300">
          
          {/* Header: Call type indicator */}
          <div className="w-full flex justify-between items-center max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {activeCall.type === "video" ? "Videollamada Activa" : "Llamada de Voz Activa"}
              </span>
            </div>
            <span className="font-mono text-xs text-text-muted bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {Math.floor(activeCall.duration / 60)}:{(activeCall.duration % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Center Area: video feeds or voice profile */}
          <div className="flex-grow flex items-center justify-center w-full max-w-4xl py-6">
            {activeCall.type === "video" && !activeCall.isVideoOff ? (
              /* Group Video Grid */
              <div className={`grid gap-4 w-full h-full max-h-[60vh] ${
                activeCall.members.length === 1 
                  ? "grid-cols-1 md:grid-cols-2" 
                  : activeCall.members.length === 2 
                    ? "grid-cols-2" 
                    : "grid-cols-2 md:grid-cols-3"
              }`}>
                {/* Your camera feed (simulated local stream) */}
                <div className="relative bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center h-full min-h-[220px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <div className="absolute top-4 left-4 z-20 bg-primary-orange/20 text-primary-orange border border-primary-orange/30 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">Tu Canal (Tú)</div>
                  <img 
                    src={session?.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"} 
                    alt="Tú" 
                    className="w-full h-full object-cover opacity-70"
                  />
                  {activeCall.isMuted && (
                    <span className="absolute bottom-4 right-4 z-20 bg-red-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Silenciado</span>
                  )}
                </div>

                {/* Other members feeds */}
                {activeCall.members.map((member, idx) => (
                  <div key={member.id} className="relative bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center h-full min-h-[220px] animate-in zoom-in-95 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <div className="absolute top-4 left-4 z-20 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                      {member.nombre || member.username}
                    </div>
                    <img 
                      src={member.fotoPerfil || "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=400&auto=format&fit=crop&q=80"} 
                      alt="" 
                      className="w-full h-full object-cover opacity-90"
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Voice Call Profile View */
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center -space-x-6">
                  <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden bg-primary-orange/15 border-2 border-primary-orange p-1 animate-pulse">
                    {activeRecipient && (
                      <img 
                        src={activeRecipient.fotoPerfil || "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=400&auto=format&fit=crop&q=80"} 
                        alt="" 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    )}
                  </div>
                  {activeCall.members.slice(1).map((m, idx) => (
                    <div key={m.id} className="relative w-20 h-20 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 p-1 animate-in slide-in-from-right-3 duration-200">
                      <img src={m.fotoPerfil} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>
                  ))}
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-lg font-black tracking-wide text-white">
                    {activeCall.members.length === 1 
                      ? (activeRecipient?.nombre || activeRecipient?.username || "Rider")
                      : `Intercomunicador de Grupo (${activeCall.members.length + 1} pilotos)`
                    }
                  </h2>
                  <p className="text-xs text-text-muted uppercase font-bold tracking-wider">
                    {activeCall.members.length === 1 ? "Llamada de voz..." : "Conectados vía Bluetooth Cardo"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            
            {/* Add compas overlay selector */}
            {showAddCompasOverlay && (
              <div className="bg-neutral-900 border border-white/10 p-4 rounded-3xl w-full space-y-3 animate-in slide-in-from-bottom-3 duration-200 z-50">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Agregar compas al intercom</h4>
                  <button type="button" onClick={() => setShowAddCompasOverlay(false)} className="text-text-muted hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {conversations
                    .map(c => c.members[0]?.user)
                    .filter(u => u && u.id !== activeRecipient?.id)
                    .map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addCompaToCall(u)}
                        className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl text-left text-xs font-semibold cursor-pointer w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={u.fotoPerfil || ""} className="w-7 h-7 rounded-full object-cover" />
                          <span>{u.nombre || u.username}</span>
                        </div>
                        <span className="text-[8px] bg-primary-orange/20 text-primary-orange border border-primary-orange/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">Llamar</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-5">
              {/* Mute Mic */}
              <button
                type="button"
                onClick={() => setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                  activeCall.isMuted 
                    ? "bg-red-600 border-red-500 text-white" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
                title={activeCall.isMuted ? "Activar micrófono" : "Silenciar micrófono"}
              >
                {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End call button */}
              <button
                type="button"
                onClick={endCall}
                className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all cursor-pointer shadow-lg shadow-red-600/20"
                title="Finalizar intercomunicador"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Toggle Video (only if video call) */}
              {activeCall.type === "video" && (
                <button
                  type="button"
                  onClick={() => setActiveCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null)}
                  className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                    activeCall.isVideoOff 
                      ? "bg-red-600 border-red-500 text-white" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                  title={activeCall.isVideoOff ? "Encender cámara" : "Apagar cámara"}
                >
                  <Video className="w-5 h-5" />
                </button>
              )}

              {/* Add Compas button */}
              <button
                type="button"
                onClick={() => setShowAddCompasOverlay(!showAddCompasOverlay)}
                className="p-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full transition-all cursor-pointer"
                title="Agregar compas a la llamada"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  )
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      </div>
    }>
      <ChatsContent />
    </Suspense>
  )
}
