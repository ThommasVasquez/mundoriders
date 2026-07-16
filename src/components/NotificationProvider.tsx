"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Info, X, ShieldAlert } from "lucide-react"

type NotificationType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: NotificationType
  title?: string
}

interface ModalAlert {
  isOpen: boolean
  message: string
  title?: string
  type: NotificationType
}

interface NotificationContextProps {
  toast: {
    success: (message: string, title?: string) => void
    error: (message: string, title?: string) => void
    info: (message: string, title?: string) => void
  }
  showAlert: (message: string, title?: string, type?: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification debe usarse dentro de un NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<ModalAlert>({
    isOpen: false,
    message: "",
    title: "",
    type: "info",
  })

  // Expose toast methods
  const showToast = (message: string, type: NotificationType, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, message, type, title }
    
    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const toast = {
    success: (message: string, title?: string) => showToast(message, "success", title),
    error: (message: string, title?: string) => showToast(message, "error", title),
    info: (message: string, title?: string) => showToast(message, "info", title),
  }

  // Expose modal alert method
  const showAlert = (message: string, title?: string, type: NotificationType = "info") => {
    setModal({
      isOpen: true,
      message,
      title: title || (type === "error" ? "Atención" : type === "success" ? "Éxito" : "Información"),
      type,
    })
  }

  // Monkey-patch window.alert
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert
      window.alert = (message: any) => {
        showAlert(String(message), "Mensaje del Sistema", "info")
      }
      return () => {
        window.alert = originalAlert
      }
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ toast, showAlert }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const Icon = t.type === "success" ? CheckCircle : t.type === "error" ? AlertTriangle : Info
          const borderColor = 
            t.type === "success" 
              ? "border-emerald-500/30 shadow-emerald-500/5 bg-neutral-950/90" 
              : t.type === "error"
              ? "border-red-500/30 shadow-red-500/5 bg-neutral-950/90"
              : "border-primary-orange/30 shadow-primary-orange/5 bg-neutral-950/90"

          const iconColor = 
            t.type === "success" 
              ? "text-emerald-400" 
              : t.type === "error"
              ? "text-red-400"
              : "text-primary-orange"

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 pointer-events-auto animate-slide-in ${borderColor}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-grow">
                {t.title && <h5 className="text-xs font-black text-white leading-none mb-1">{t.title}</h5>}
                <p className="text-[11px] text-zinc-300 leading-normal">{t.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Custom Modal Alert */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-in">
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-orange/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center">
              {modal.type === "error" ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mb-4">
                  <ShieldAlert className="w-8 h-8 animate-pulse" />
                </div>
              ) : modal.type === "success" ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-3 bg-primary-orange/10 border border-primary-orange/20 text-primary-orange rounded-full mb-4">
                  <Info className="w-8 h-8" />
                </div>
              )}

              <h3 className="text-sm font-black uppercase text-white tracking-wider mb-2">
                {modal.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mb-6">
                {modal.message}
              </p>

              <button
                onClick={() => setModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all duration-200 cursor-pointer shadow-lg hover:shadow-orange-500/20 hover:-translate-y-[1px] active:translate-y-0"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}
