"use client"

import React, { useEffect, useRef } from "react"
import LinkNext from "next/link"
import { useSession } from "next-auth/react"
import { Flame, Compass, ShieldAlert, Wrench, ChevronRight, Sparkles, Star, Users, Map } from "lucide-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function LandingPage() {
  const { data: session } = useSession()
  
  // GSAP animation refs
  const headerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // GSAP Intro Animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    
    // Header animation
    if (headerRef.current) {
      tl.fromTo(headerRef.current, 
        { y: -80, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1 }
      )
    }

    // Logo rotate/grow
    if (logoRef.current) {
      tl.fromTo(logoRef.current,
        { scale: 0, rotate: -180 },
        { scale: 1, rotate: 0, duration: 1.2, ease: "back.out(1.7)" },
        "-=0.6"
      )
    }

    // Hero content
    if (heroRef.current) {
      const children = Array.from(heroRef.current.children)
      tl.fromTo(children,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 },
        "-=0.8"
      )
    }

    // Feature Cards stagger
    if (featuresRef.current) {
      const cards = Array.from(featuresRef.current.children)
      gsap.fromTo(cards,
        { y: 60, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.2, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          }
        }
      )
    }
  }, [])

  return (
    <div className="flex-grow flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background Dust */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,106,0,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <header 
        ref={headerRef} 
        className="w-full border-b border-white/5 bg-background/40 backdrop-blur-xl sticky top-0 z-50 opacity-0"
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-primary-orange">
            <div ref={logoRef} className="opacity-0">
              <Flame className="w-8 h-8 fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-wider font-mono">RIDER</span>
          </div>
          <div>
            {session ? (
              <LinkNext
                href="/autopista"
                className="py-2 px-5 bg-primary-orange hover:bg-primary-orange-hover text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary-orange/10 hover:shadow-primary-orange/20 cursor-pointer"
              >
                Autopista
              </LinkNext>
            ) : (
              <LinkNext
                href="/login"
                className="py-2 px-5 border border-white/10 hover:bg-white/5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Iniciar Sesión
              </LinkNext>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto space-y-12 py-20 z-10">
        <div ref={heroRef} className="space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-orange-glow border border-primary-orange/25 text-primary-orange uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" /> La Red Social de las 2 Ruedas
          </span>
          <h1 className="text-4xl sm:text-7xl font-black text-white leading-tight uppercase tracking-tight">
            CONECTA. COMPARTE.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-orange via-amber-500 to-orange-400">
              CONDUCE SEGURO.
            </span>
          </h1>
          <p className="text-text-muted text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            La plataforma definitiva para la comunidad biker en Colombia. Registra tu garaje, crea o únete a rodadas multitudinarias, comparte rutas y rueda seguro con nuestro sistema inteligente de detección de accidentes.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {session ? (
              <LinkNext
                href="/autopista"
                className="py-4 px-10 bg-primary-orange hover:bg-primary-orange-hover text-white font-extrabold rounded-xl transition-all shadow-lg shadow-primary-orange/20 hover:shadow-primary-orange/45 flex items-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
              >
                <span>Acceder a la Autopista</span>
                <ChevronRight className="w-5 h-5" />
              </LinkNext>
            ) : (
              <>
                <LinkNext
                  href="/register"
                  className="py-4 px-10 bg-primary-orange hover:bg-primary-orange-hover text-white font-extrabold rounded-xl transition-all shadow-lg shadow-primary-orange/20 hover:shadow-primary-orange/45 flex items-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
                >
                  <span>Registrarme Gratis</span>
                  <ChevronRight className="w-5 h-5" />
                </LinkNext>
                <LinkNext
                  href="/login"
                  className="py-4 px-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer text-sm"
                >
                  Explorar Cuenta
                </LinkNext>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div 
          ref={featuresRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-16 w-full"
        >
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl text-left space-y-4 tilt-card opacity-0">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 border border-primary-orange/20 flex items-center justify-center text-primary-orange shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl text-white tracking-wide uppercase">Comunidad Real</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Descubre moteros de tu zona, únete a clubes organizados y comparte fotos de tus viajes y de tu garaje en la autopista social.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl text-left space-y-4 tilt-card opacity-0">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 border border-primary-orange/20 flex items-center justify-center text-primary-orange shadow-inner">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl text-white tracking-wide uppercase">Rutas GPX & Alertas</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Planifica tus próximas rodadas, comparte mapas interactivos de Colombia, y reporta alertas de retenes, estado del clima y estado vial en el camino.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl text-left space-y-4 tilt-card opacity-0">
            <div className="w-12 h-12 rounded-xl bg-primary-orange/10 border border-primary-orange/20 flex items-center justify-center text-primary-orange shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl text-white tracking-wide uppercase">S.O.S Accidentes</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Monitoreo activo del celular en rodadas. Si se detecta un accidente, enviamos alertas SMS/WhatsApp automáticas a tus contactos de emergencia con tu ubicación.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-text-muted text-xs bg-black/40 z-10 mt-auto">
        <p>© {new Date().getFullYear()} Rider Colombia. Rodamos juntos, volvemos juntos.</p>
      </footer>
    </div>
  )
}
