"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ExternalLink, MapPin, Pencil, Plus, Search, Star, Trash2, Wand2 } from "lucide-react"
import { categoryColors, categoryLabels } from "@/lib/events-data"
import { cn } from "@/lib/utils"
import type { PublishedEvent } from "../_lib/types"
import { eventPath, eventUrl, formatDateRange, isPastEvent, timeAgo, todayKey } from "../_lib/utils"
import { CopyButton, EmptyState, IconButton, PrimaryButton, SegmentedControl, inputClass } from "./ui"

type SortKey = "recent" | "upcoming" | "date-desc" | "title"
type FilterKey = "all" | "upcoming" | "past" | "premium"

const sortLabels: Record<SortKey, string> = {
  recent: "Últimos aprobados",
  upcoming: "Próximos primero",
  "date-desc": "Fecha del evento (más nueva)",
  title: "Título (A-Z)",
}

export function EventsTab({
  events,
  onCreate,
  onEdit,
  onDelete,
  onTogglePremium,
  onFixSlug,
}: {
  events: PublishedEvent[]
  onCreate: () => void
  onEdit: (e: PublishedEvent) => void
  onDelete: (e: PublishedEvent) => void
  onTogglePremium: (e: PublishedEvent) => void
  onFixSlug: (e: PublishedEvent) => void
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState<SortKey>("recent")
  const [filter, setFilter] = useState<FilterKey>("all")

  const counts = useMemo(
    () => ({
      all: events.length,
      upcoming: events.filter((e) => !isPastEvent(e)).length,
      past: events.filter((e) => isPastEvent(e)).length,
      premium: events.filter((e) => e.is_premium).length,
    }),
    [events],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = events.filter((e) => {
      if (filter === "upcoming" && isPastEvent(e)) return false
      if (filter === "past" && !isPastEvent(e)) return false
      if (filter === "premium" && !e.is_premium) return false
      if (category && e.category !== category) return false
      if (!q) return true
      return [e.title, e.location, e.city, e.department, e.slug].some((v) => (v || "").toLowerCase().includes(q))
    })
    list = [...list].sort((a, b) => {
      if (sort === "recent") return (b.created_at || "").localeCompare(a.created_at || "")
      if (sort === "title") return a.title.localeCompare(b.title, "es")
      if (sort === "date-desc") return b.date.localeCompare(a.date)
      // Proximos primero: los que no terminaron, por fecha ascendente; despues los pasados
      const today = todayKey()
      const aPast = (a.end_date || a.date) < today
      const bPast = (b.end_date || b.date) < today
      if (aPast !== bPast) return aPast ? 1 : -1
      return aPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    })
    return list
  }, [events, search, category, sort, filter])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todos", count: counts.all },
            { value: "upcoming", label: "Próximos", count: counts.upcoming },
            { value: "past", label: "Pasados", count: counts.past },
            { value: "premium", label: "Destacados", count: counts.premium },
          ]}
        />
        <PrimaryButton onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Nuevo evento
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_200px_220px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className={cn(inputClass, "pl-10")} placeholder="Buscar por título, lugar, ciudad o slug..." />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          <option value="">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={inputClass}>
          {Object.entries(sortLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {visible.length} {visible.length === 1 ? "evento" : "eventos"} · ordenados por {sortLabels[sort].toLowerCase()}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={Search} title="Sin resultados" description="Probá con otra búsqueda o cambiá los filtros." />
      ) : (
        <div className="space-y-2.5">
          {visible.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              onEdit={() => onEdit(e)}
              onDelete={() => onDelete(e)}
              onTogglePremium={() => onTogglePremium(e)}
              onFixSlug={() => onFixSlug(e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EventRow({
  event: e,
  onEdit,
  onDelete,
  onTogglePremium,
  onFixSlug,
}: {
  event: PublishedEvent
  onEdit: () => void
  onDelete: () => void
  onTogglePremium: () => void
  onFixSlug: () => void
}) {
  const past = isPastEvent(e)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
      <div className="flex min-w-0 flex-1 gap-3">
        {e.image_url ? (
          <img src={e.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover sm:h-20 sm:w-20" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted sm:h-20 sm:w-20">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", categoryColors[e.category] || "bg-muted text-muted-foreground")}>
              {categoryLabels[e.category] || e.category}
            </span>
            {e.is_premium && <span className="rounded-full bg-brand-lime px-2 py-0.5 text-[11px] font-bold text-brand-navy">Destacado</span>}
            {past && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Finalizado</span>}
          </div>
          <p className="mt-1 font-bold leading-snug">{e.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateRange(e.date, e.end_date)}
              {e.time ? ` · ${e.time}` : ""}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{[e.location, e.city].filter(Boolean).join(", ")}</span>
            </span>
          </p>
          {/* Link del evento: abrir o copiar */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {e.slug ? (
              <>
                <a
                  href={eventPath(e.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 truncate rounded-lg bg-muted px-2 py-1 font-mono text-[11px] text-foreground/80 hover:text-foreground hover:underline"
                  title="Abrir el evento en una pestaña nueva"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{eventPath(e.slug)}</span>
                </a>
                <CopyButton value={eventUrl(e.slug)} label="Copiar link" successMessage="Link copiado" />
                <CopyButton value={e.slug} label="Copiar slug" successMessage="Slug copiado" />
              </>
            ) : (
              <button
                onClick={onFixSlug}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/30 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Sin link · Generar
              </button>
            )}
            <span className="text-[11px] text-muted-foreground">Aprobado {timeAgo(e.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-center">
        {e.slug && <IconButton icon={ExternalLink} label="Ver evento" href={eventPath(e.slug)} />}
        <IconButton icon={Star} label={e.is_premium ? "Quitar destacado" : "Destacar"} onClick={onTogglePremium} active={e.is_premium} />
        <IconButton icon={Pencil} label="Editar" onClick={onEdit} />
        <IconButton icon={Trash2} label="Eliminar" onClick={onDelete} tone="danger" />
      </div>
    </div>
  )
}
