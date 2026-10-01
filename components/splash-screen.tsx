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
          {/* Logo + linea de carga, igual que el splash de agroconecta.com.py */}
          <div className="flex flex-col items-center">
            <img src="/logo-claro.png" alt="Eventos Agro" className="h-14 w-auto dark:hidden" />
            <img src="/logo.png" alt="Eventos Agro" className="h-14 w-auto hidden dark:block" />
            <p className="mt-3 text-sm text-muted-foreground">Calendario de eventos agropecuarios del Paraguay</p>
            <div className="mt-8 h-0.5 w-32 overflow-hidden rounded-full bg-border">
              <div className="h-full w-1/2 rounded-full bg-brand-lime animate-[splash-bar_1.1s_ease-in-out_infinite]" />
            </div>
          </div>
          <style>{`@keyframes splash-bar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
        </div>
      )}
    </>
  )
}
