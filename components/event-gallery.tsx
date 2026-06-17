"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryImage {
  id: string
  image_url: string
  caption?: string
}

interface EventGalleryProps {
  images: GalleryImage[]
}

export function EventGallery({ images }: EventGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (!images || images.length === 0) return null

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

  return (
    <>
      <div className="space-y-3">
        {/* Imagen principal */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted group">
          <img
            src={images[current].image_url}
            alt={images[current].caption || `Foto ${current + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {/* Overlay zoom */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all"
          >
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
          </button>
          {/* Flechas */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          {/* Contador */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
            {current + 1} / {images.length}
          </div>
        </div>

        {/* Caption */}
        {images[current].caption && (
          <p className="text-xs text-muted-foreground text-center italic">{images[current].caption}</p>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                  i === current ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img.image_url} alt={img.caption || `Foto ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={images[current].image_url}
            alt={images[current].caption || `Foto ${current + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images[current].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
              {images[current].caption}
            </p>
          )}
        </div>
      )}
    </>
  )
}
