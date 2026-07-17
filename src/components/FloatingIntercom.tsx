"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare, X, ChevronDown, Send, Loader2,
  User, Search, ArrowLeft, Maximize2, Mic, Paperclip,
  Circle
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvUser = {
  id: string
  username: string | null
  nombre: string | null
  fotoPerfil: string | null
}

type Conversation = {
  id: string
  tipo: string
  members: { user: ConvUser }[]
  messages: { id: string; contenido: string; createdAt: string }[]
}

type Message = {
  id: string
  conversationId: string
  userId: string
  contenido: string
  createdAt: string
  user: ConvUser
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = "md" }: { user: ConvUser; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-11 h-11" }
  const iconMap = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-primary-orange/15 border border-primary-orange/20 overflow-hidden flex-shrink-0 flex items-center justify-center`}>
      {user.fotoPerfil ? (
        <img src={user.fotoPerfil} alt="" className="w-full h-full object-cover" />
      ) : (
        <User className={`${iconMap[size]} text-primary-orange`} />
      )}
    </div>
  )
}

function parseMedia(contenido: string) {
  const match = contenido.match(/^\[MEDIA:([^:]+):([^:]+):([^\]]+)\]([\s\S]*)/)
  if (match) return { type: match[1], name: match[2], url: match[3], text: match[4] }
  return null
}

// ─── Active Chat Window ───────────────────────────────────────────────────────

function ChatWindow({
  conv,
  currentUserId,
  onClose,
  onBack,
}: {
  conv: Conversation
  currentUserId: string
  onClose: () => void
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const recipient = conv.members[0]?.user

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/intercom/messages?conversationId=${conv.id}`)
      const data = await res.json()
      if (data.success) setMessages(data.messages)
    } catch {}
    finally { setLoading(false) }
  }, [conv.id])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-focus input when window opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Poll for new messages every 8s while window is open
  useEffect(() => {
    const interval = setInterval(fetchMessages, 8000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/intercom/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.id, contenido: content }),
      })
      const data = await res.json()
      if (data.success) setMessages(prev => [...prev, data.message])
    } catch {}
    finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-neutral-950/60 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer flex-shrink-0"
          title="Volver a conversaciones"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

        {recipient && <Avatar user={recipient} size="sm" />}

        <div className="flex-grow min-w-0">
          <p className="text-xs font-black text-white truncate leading-tight">
            {recipient?.nombre || recipient?.username || "Rider"}
          </p>
          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Circle className="w-1.5 h-1.5 fill-current" /> En línea
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/intercom?conversationId=${conv.id}`}
            title="Abrir en Intercom"
            className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center opacity-60">
            <MessageSquare className="w-8 h-8 text-primary-orange/40 mb-2" />
            <p className="text-[10px] text-text-muted">Sin mensajes aún.<br />¡Saluda al piloto!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === currentUserId
            const media = parseMedia(msg.contenido)
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                  isMe
                    ? "bg-primary-orange text-white rounded-tr-none"
                    : "bg-neutral-800 text-white border border-white/5 rounded-tl-none"
                }`}>
                  {media ? (
                    <span className="italic opacity-80">📎 {media.name}{media.text ? ` — ${media.text}` : ""}</span>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.contenido}</span>
                  )}
                  <div className={`text-[8px] mt-0.5 ${isMe ? "text-white/60" : "text-text-muted"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-2.5 border-t border-white/5 bg-neutral-950/40 flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mensaje al piloto..."
          className="flex-grow bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-text-muted outline-none focus:border-primary-orange/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-2 bg-primary-orange hover:bg-primary-orange-hover disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </form>
    </div>
  )
}

// ─── Conversation List Panel ──────────────────────────────────────────────────

function ConversationList({
  conversations,
  loading,
  onSelect,
  onClose,
  onMinimize,
}: {
  conversations: Conversation[]
  loading: boolean
  onSelect: (conv: Conversation) => void
  onClose: () => void
  onMinimize: () => void
}) {
  const [search, setSearch] = useState("")

  const filtered = conversations.filter(conv => {
    const u = conv.members[0]?.user
    if (!u) return false
    const q = search.toLowerCase()
    return (
      (u.nombre || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-neutral-950/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-orange" />
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Intercom</h2>
          {conversations.length > 0 && (
            <span className="text-[9px] bg-primary-orange text-white px-1.5 py-0.5 rounded-full font-black">
              {conversations.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/intercom"
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
            title="Abrir Intercom completo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Minimizar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-2.5 pb-1 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3 h-3 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rider..."
            className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-7 pr-3 py-1.5 text-[11px] text-white placeholder:text-text-muted outline-none focus:border-primary-orange/40 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto py-1 px-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-[10px] opacity-60 space-y-1">
            <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p>{search ? "Sin resultados." : "Sin intercomunicaciones."}</p>
            <p className="text-[9px]">Contacta un rider desde la Autopista.</p>
          </div>
        ) : (
          filtered.map(conv => {
            const u = conv.members[0]?.user
            if (!u) return null
            const lastMsg = conv.messages[0]
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left group cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <Avatar user={u} size="md" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-black text-white truncate group-hover:text-primary-orange transition-colors">
                    {u.nombre || u.username}
                  </p>
                  <p className="text-[9px] text-text-muted truncate leading-tight mt-0.5">
                    {lastMsg?.contenido
                      ? lastMsg.contenido.startsWith("[MEDIA:")
                        ? "📎 Adjunto"
                        : lastMsg.contenido.slice(0, 42)
                      : "Iniciaste intercomunicación..."}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main Floating Widget ─────────────────────────────────────────────────────

export default function FloatingIntercom() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const hasFetched = useRef(false)

  // Don't render on the intercom page itself — it has its own full UI
  const isIntercomPage = pathname?.startsWith("/intercom")
  // Don't render on auth pages
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return
    setLoadingConvs(true)
    try {
      const res = await fetch("/api/intercom/conversations")
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations)
        // Simple unread heuristic: count convs with messages
        setUnreadCount(
          data.conversations.filter((c: Conversation) => c.messages.length > 0).length
        )
      }
    } catch {}
    finally { setLoadingConvs(false) }
  }, [session?.user])

  // Fetch on open
  useEffect(() => {
    if (open && !hasFetched.current) {
      fetchConversations()
      hasFetched.current = true
    }
  }, [open, fetchConversations])

  // Re-fetch periodically to update badge
  useEffect(() => {
    if (!session?.user) return
    const id = setInterval(fetchConversations, 30000)
    return () => clearInterval(id)
  }, [fetchConversations, session?.user])

  if (!session?.user || isIntercomPage || isAuthPage) return null

  const handleOpen = () => {
    setOpen(true)
    setMinimized(false)
  }

  const handleClose = () => {
    setOpen(false)
    setMinimized(false)
    setActiveConv(null)
  }

  const handleMinimize = () => {
    setMinimized(true)
    setOpen(false)
  }

  const handleSelectConv = (conv: Conversation) => {
    setActiveConv(conv)
  }

  return (
    <>
      {/* ── Floating Panel ──────────────────────────────── */}
      {open && !minimized && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-[900] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/8 bg-neutral-950/95 backdrop-blur-xl"
          style={{ width: 320, height: 460 }}
        >
          {activeConv ? (
            <ChatWindow
              conv={activeConv}
              currentUserId={session.user.id!}
              onClose={handleClose}
              onBack={() => setActiveConv(null)}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              loading={loadingConvs}
              onSelect={handleSelectConv}
              onClose={handleClose}
              onMinimize={handleMinimize}
            />
          )}
        </div>
      )}

      {/* ── FAB Button ──────────────────────────────────── */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? "Cerrar Intercom" : "Abrir Intercom"}
        className={`
          fixed bottom-5 right-4 sm:right-6 z-[901]
          w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-2xl shadow-primary-orange/20
          transition-all duration-300 ease-out
          cursor-pointer
          ${open
            ? "bg-neutral-800 border border-white/10 rotate-0 scale-100"
            : "bg-primary-orange hover:bg-primary-orange-hover hover:scale-110 active:scale-95"
          }
        `}
      >
        {/* Toggle icon with animation */}
        <div className={`transition-all duration-200 ${open ? "rotate-0 opacity-100" : "rotate-0 opacity-100"}`}>
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageSquare className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-background animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
