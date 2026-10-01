"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff, ImageIcon, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Banner, PublishedEvent } from "../_lib/types"
import { eventPath, formatDay, isPastEvent } from "../_lib/utils"
import { EmptyState, Field, FormSection, IconButton, ImageUpload, PrimaryButton, inputClass } from "./ui"

const emptyBanner = { title: "", image_url: "", link_url: "", event_id: "" }

export function BannersTab({
  banners,
  events,
  onCreate,
  onToggle,
  onDelete,
  onMove,
}: {
  banners: Banner[]
  events: PublishedEvent[]
  onCreate: (b: typeof emptyBanner) => Promise<boolean>
  onToggle: (b: Banner) => void
  onDelete: (b: Banner) => void
  onMove: (index: number, direction: "up" | "down") => void
}) {
  const [form, setForm] = useState(emptyBanner)
  const [saving, setSaving] = useState(false)
  // Los eventos vigentes primero en el selector
  const selectable = [...events].sort((a, b) => Number(isPastEvent(a)) - Number(isPastEvent(b)) || a.date.localeCompare(b.date))
  const eventsById = new Map(events.map((e) => [e.id, e]))

  const pickEvent = (id: string) => {
    const ev = eventsById.get(id)
    if (!ev) return setForm({ ...form, event_id: "" })
    setForm({
      event_id: id,
      title: ev.title,
      link_url: ev.slug ? eventPath(ev.slug) : form.link_url,
      image_url: ev.image_url || form.image_url,
    })
  }

  const submit = async () => {
    if (!form.title.trim() || !form.link_url.trim()) {
      toast.error("Completá el título y el link de destino")
      return
    }
    setSaving(true)
    const ok = await onCreate(form)
    setSaving(false)
    if (ok) setForm(emptyBanner)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Banners en la home</h2>
        <p className="text-sm text-muted-foreground">Se muestran en "Eventos destacados" en este orden. Los ocultos no aparecen.</p>
        {banners.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No hay banners" description="Creá el primero con el formulario." />
        ) : (
          <div className="space-y-2.5">
            {banners.map((b, i) => {
              const linked = b.event_id ? eventsById.get(b.event_id) : undefined
              return (
                <div key={b.id} className={cn("flex items-center gap-3 rounded-2xl border border-border bg-card p-3", !b.is_active && "opacity-60")}>
                  <div className="flex flex-col">
                    <button onClick={() => onMove(i, "up")} disabled={i === 0} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20" aria-label="Subir">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onMove(i, "down")}
                      disabled={i === banners.length - 1}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      aria-label="Bajar"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  {linked?.image_url || b.image_url ? (
                    <img src={linked?.image_url || b.image_url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-20 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{linked?.title || b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {linked ? `${formatDay(linked.date)}${isPastEvent(linked) ? " · finalizado" : ""}` : b.link_url}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <IconButton icon={b.is_active ? Eye : EyeOff} label={b.is_active ? "Ocultar" : "Mostrar"} onClick={() => onToggle(b)} />
                    <IconButton icon={Trash2} label="Eliminar" onClick={() => onDelete(b)} tone="danger" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <FormSection title="Nuevo banner" description="Elegí un evento y se completan solos el título, la imagen y el link.">
        <Field label="Evento">
          <select value={form.event_id} onChange={(e) => pickEvent(e.target.value)} className={inputClass}>
            <option value="">Banner personalizado (sin evento)</option>
            {selectable.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {formatDay(e.date)}
                {isPastEvent(e) ? " (pasado)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Título" required>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Link de destino" required hint="Puede ser /evento/... o una URL externa.">
          <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className={inputClass} placeholder="https://..." />
        </Field>
        <Field label="Imagen">
          <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url || "" })} prefix="banner" aspect="wide" />
        </Field>
        <PrimaryButton onClick={submit} disabled={saving} className="w-full">
          <Plus className="h-4 w-4" />
          {saving ? "Guardando..." : "Crear banner"}
        </PrimaryButton>
      </FormSection>
    </div>
  )
}
