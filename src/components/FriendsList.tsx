"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, User, Wrench, Search, Loader2, Sparkles, CheckCircle2, ChevronRight } from "lucide-react"
import { useNotification } from "@/components/NotificationProvider"

type Friend = {
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

type FriendsListProps = {
  onOpenSearch?: () => void
}

export default function FriendsList({ onOpenSearch }: FriendsListProps) {
  const router = useRouter()
  const { toast } = useNotification()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({})

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/garage/friends")
      const data = await res.json()
      if (data.success) {
        setFriends(data.friends || [])
      }
    } catch (err) {
      console.warn("Error fetching friends:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const handleOpenIntercomChat = async (targetUserId: string) => {
    if (chatLoading[targetUserId]) return
    setChatLoading((prev) => ({ ...prev, [targetUserId]: true }))
    try {
      const res = await fetch("/api/intercom/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      })
      const data = await res.json()
      if (data.success) {
        router.push("/intercom")
      } else {
        toast.error("Error al abrir conversación de intercomunicador.")
      }
    } catch (err) {
      console.error("Error opening chat:", err)
      toast.error("Error al conectar intercomunicador.")
    } finally {
      setChatLoading((prev) => ({ ...prev, [targetUserId]: false }))
    }
  }

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-orange" /> Mis Compas
        </h4>
        <span className="text-[10px] font-mono font-bold bg-primary-orange/15 border border-primary-orange/20 text-primary-orange px-2 py-0.5 rounded-full">
          {friends.length}
        </span>
      </div>

      {loading ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
          <span className="text-[11px] text-text-muted">Cargando compas...</span>
        </div>
      ) : friends.length === 0 ? (
        <div className="py-4 text-center space-y-2.5">
          <p className="text-xs text-text-muted leading-relaxed">
            Aún no sigues a otros pilotos. ¡Síguelos para armar tu convoy de compas y ver sus publicaciones!
          </p>
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-orange/40 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-primary-orange group-hover:scale-110 transition-transform" />
              <span>Buscar Pilotos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
          {friends.map((friend) => {
            const friendLink = `/garage/${friend.username || friend.id}`
            const mainMoto = friend.motos && friend.motos.length > 0 ? friend.motos[0] : null
            const isChatting = chatLoading[friend.id]

            return (
              <div
                key={friend.id}
                className="p-2.5 bg-black/30 border border-white/5 hover:border-primary-orange/30 rounded-xl transition-all flex items-center justify-between gap-2 group"
              >
                <Link href={friendLink} className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full relative flex-shrink-0 ${friend.hasActiveStatus ? "ring-fire p-[2px]" : ""}`}>
                    {friend.fotoPerfil ? (
                      <img src={friend.fotoPerfil} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary-orange/20 flex items-center justify-center text-primary-orange font-bold text-xs">
                        {friend.nombre?.[0] || "R"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white text-xs truncate group-hover:text-primary-orange transition-colors">
                        {friend.nombre || friend.username}
                      </span>
                    </div>
                    <span className="block text-[10px] text-text-muted truncate">
                      {friend.username?.startsWith("@") ? friend.username : `@${friend.username || "rider"}`}
                      {friend.ciudad ? ` • 📍 ${friend.ciudad}` : ""}
                    </span>
                    {mainMoto && (
                      <span className="block text-[9px] text-amber-400/90 font-mono truncate">
                        🏍️ {mainMoto.marca} {mainMoto.modelo}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Quick Chat Button */}
                <button
                  type="button"
                  onClick={() => handleOpenIntercomChat(friend.id)}
                  disabled={isChatting}
                  title="Abrir Intercomunicador"
                  className="p-2 bg-white/5 hover:bg-primary-orange text-text-muted hover:text-white rounded-lg transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isChatting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
