"use client"

import { useState } from "react"
import { X, Newspaper } from "lucide-react"

interface GacetillaProps {
  titulo: string
  imagen?: string
  texto: string
}

export function GacetillaButton({ titulo, imagen, texto }: GacetillaProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border hover:border-foreground/30 transition-colors text-sm font-semibold w-full"
      >
        <Newspaper className="h-4 w-4 shrink-0" />
        <span>Gacetilla de prensa</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-lime/20 flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gacetilla de prensa</p>
                  <h2 className="font-bold text-base leading-tight">{titulo}</h2>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Imagen */}
            {imagen && (
              <div className="w-full aspect-video overflow-hidden">
                <img src={imagen} alt={titulo} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Texto */}
            <div className="p-5">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{texto}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
