"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasLoadedOnce = useRef(false)

  const hideLoader = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  useEffect(() => {
    // Detectar cambio de página
    const isPageChange = prevPathname.current !== pathname
    
    if (isPageChange && hasLoadedOnce.current) {
      // En cambios de página subsecuentes, mostrar splash brevemente
      prevPathname.current = pathname
      setIsLoading(true)
      setIsFadingOut(false)
    }

    // Tiempo mínimo de visualización del splash (para que se vea fluido)
    const minDisplayTime = hasLoadedOnce.current ? 400 : 800
    const minTimer = setTimeout(() => {
      checkAndHide()
    }, minDisplayTime)

    // Verificar que el contenido esté completamente renderizado
    const checkAndHide = () => {
      if (!contentRef.current) {
        // Si no hay ref, esperar un poco más
        setTimeout(checkAndHide, 100)
        return
      }

      // Verificar que haya contenido real renderizado
      const hasContent = contentRef.current.children.length > 0
      const hasHeight = contentRef.current.scrollHeight > 0

      if (hasContent && hasHeight) {
        hasLoadedOnce.current = true
        hideLoader()
      } else {
        // Reintentar en 100ms
        setTimeout(checkAndHide, 100)
      }
    }

    // Observador de mutaciones para detectar cuando React termine de renderizar
    let observer: MutationObserver | null = null
    
    if (contentRef.current) {
      observer = new MutationObserver((mutations) => {
        // Si hay cambios significativos en el DOM, verificar si ya podemos ocultar
        const hasSignificantChanges = mutations.some(
          mutation => mutation.addedNodes.length > 0 || mutation.type === 'childList'
        )
        
        if (hasSignificantChanges) {
          checkAndHide()
        }
      })

      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: false
      })
    }

    // Fallback de seguridad: ocultar después de 3 segundos máximo
    const maxTimer = setTimeout(() => {
      hasLoadedOnce.current = true
      hideLoader()
    }, 3000)

    return () => {
      clearTimeout(minTimer)
      clearTimeout(maxTimer)
      observer?.disconnect()
    }
  }, [pathname, hideLoader])

  return (
    <>
      {/* Contenido real - se renderiza en segundo plano */}
      <div
        ref={contentRef}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        style={{
          visibility: isLoading ? "hidden" : "visible"
        }}
      >
        {children}
      </div>

      {/* Splash Screen - se muestra encima mientras carga */}
      {isLoading && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
            isFadingOut ? "opacity-0" : "opacity-100"
          )}
        >
          {/* Logo Container */}
          <div className="relative flex flex-col items-center">
            {/* Logo Icon con animación */}
            <div className="relative mb-6">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse scale-150" />
              
              {/* Logo circle */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-primary/40 animate-[bounce_2s_ease-in-out_infinite]">
                {/* Calendar icon simplified */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-12 h-12 text-white"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  {/* Star in calendar */}
                  <path d="M12 15l-1.5 1.5L12 18l1.5-1.5L12 15z" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Eventos Agro
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Calendario de eventos agropecuarios
            </p>

            {/* Loading Spinner */}
            <div className="relative">
              {/* Spinner track */}
              <div className="w-12 h-12 rounded-full border-4 border-muted" />
              {/* Spinner indicator */}
              <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>

            {/* Loading text */}
            <p className="mt-4 text-xs text-muted-foreground animate-pulse">
              Cargando eventos...
            </p>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-[pulse_1s_ease-in-out_infinite]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      )}
    </>
  )
}
