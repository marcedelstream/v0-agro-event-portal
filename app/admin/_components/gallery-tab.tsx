"use client"

import { useEffect, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { GalleryImage, PublishedEvent } from "../_lib/types"
import { errorMessage, formatDay, uploadImage } from "../_lib/utils"
import { EmptyState, Field, inputClass } from "./ui"

export function GalleryTab({ events }: { events: PublishedEvent[] }) {
  const [eventId, setEventId] = useState("")
  const [images, setImages] = useState<GalleryImage[]>([])
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(0)
  // Primero los eventos mas recientes, que son los que suelen recibir fotos
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date))

  const load = async (id: string) => {
    if (!id) return setImages([])
    const { data, error } = await createBrowserClient()
      .from("event_gallery")
      .select("id, image_url, caption")
      .eq("event_id", id)
      .order("display_order", { ascending: true })
    if (error) toast.error(error.message)
    setImages(data || [])
  }

  useEffect(() => {
    load(eventId)
  }, [eventId])

  // Permite subir varias fotos de una vez
  const uploadFiles = async (files: FileList) => {
    if (!eventId) return
    const list = Array.from(files)
    setUploading(list.length)
    const supabase = createBrowserClient()
    let ok = 0
    for (const [i, file] of list.entries()) {
      try {
        const url = await uploadImage(file, "gallery")
        const { error } = await supabase.from("event_gallery").insert({
          event_id: eventId,
          image_url: url,
          caption: caption.trim() || null,
          display_order: images.length + i,
        })
        if (error) throw error
        ok++
      } catch (error) {
        toast.error(`${file.name}: ${errorMessage(error)}`)
      }
      setUploading(list.length - i - 1)
    }
    if (ok) toast.success(ok === 1 ? "Foto subida" : `${ok} fotos subidas`)
    setCaption("")
    load(eventId)
  }

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta foto?")) return
    const { error } = await createBrowserClient().from("event_gallery").delete().eq("id", id)
    if (error) toast.error(error.message)
    else toast.success("Foto eliminada")
    load(eventId)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <Field label="Evento">
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
            <option value="">Elegí un evento</option>
            {sorted.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {formatDay(e.date)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción (opcional)">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} placeholder="Se aplica a las fotos que subas" disabled={!eventId} />
        </Field>
        <label
          className={cn(
            "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-navy px-5 text-sm font-semibold text-white hover:bg-brand-navy/90 dark:bg-brand-lime dark:text-brand-navy",
            (!eventId || uploading > 0) && "pointer-events-none opacity-50",
          )}
        >
          {uploading > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading > 0 ? `Subiendo (${uploading})...` : "Subir fotos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </label>
      </div>

      {!eventId ? (
        <EmptyState icon={ImageIcon} title="Elegí un evento" description="Vas a ver sus fotos y podés subir varias a la vez." />
      ) : images.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Este evento todavía no tiene fotos" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <img src={img.image_url} alt={img.caption || ""} className="h-full w-full object-cover" />
              {img.caption && <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 p-1.5 text-xs text-white">{img.caption}</div>}
              <button
                onClick={() => remove(img.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Eliminar foto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
