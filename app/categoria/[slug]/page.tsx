"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Star, ChevronRight, History, ChevronDown, ChevronUp } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { categoryLabels, categoryColors, categoryGradients } from "@/lib/events-data"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  slug: string | null
  description: string
  date: string
  end_date?: string | null
  time: string
  location: string
  category: string
  is_premium: boolean
  image_url: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showPastEvents, setShowPastEvents] = useState(false)

  const categoryName = categoryLabels[slug] || slug

  useEffect(() => {
    async function loadEvents() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_approved", true)
        .eq("category", slug)
        .order("date", { ascending: true })

      setEvents(data || [])
      setLoading(false)
    }
    loadEvents()
  }, [slug])

  // Un evento se considera pasado recien cuando termina su ultimo dia (end_date si existe, sino date)
  const isEventPast = (event: Event) => {
    const lastDay = new Date(`${event.end_date || event.date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return lastDay.getTime() < today.getTime()
  }

  const upcomingEvents = events.filter((event) => !isEventPast(event))
  const pastEvents = events
    .filter((event) => isEventPast(event))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr + "T12:00:00")
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    eventDate.setHours(12, 0, 0, 0)
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Mañana"
    return `En ${diffDays} días`
  }

  const getEventUrl = (event: Event) => {
    return `/evento/${event.slug || event.id}`
  }

  const renderEventRow = (event: Event, isPast: boolean) => {
    const daysText = getDaysUntil(event.date)

    return (
      <Link
        key={event.id}
        href={getEventUrl(event)}
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99]",
          event.is_premium
            ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent hover:shadow-lg hover:shadow-yellow-500/10"
            : "border-border bg-card hover:bg-muted/50 hover:shadow-md",
          isPast && "opacity-60",
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "shrink-0 w-1 h-10 rounded-full bg-gradient-to-b",
              categoryGradients[event.category] || "from-gray-500 to-gray-500/50",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {event.is_premium && (
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
              )}
              <h3
                className={cn(
                  "font-semibold text-sm truncate group-hover:text-primary transition-colors",
                  event.is_premium && "text-yellow-500 group-hover:text-yellow-400",
                )}
              >
                {event.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formatDate(event.date)}</span>
              <span>•</span>
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-lg",
              isPast
                ? "bg-muted text-muted-foreground"
                : daysText === "Hoy" || daysText === "Mañana"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-foreground",
            )}
          >
            {daysText}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto">
        <div className="px-4 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <div
            className={cn(
              "rounded-2xl p-6 mb-6 bg-gradient-to-br",
              slug === "agricultura" && "from-green-500/20 to-green-500/5",
              slug === "ganaderia" && "from-amber-500/20 to-amber-500/5",
              slug === "forestal" && "from-emerald-500/20 to-emerald-500/5",
              slug === "sostenibilidad" && "from-teal-500/20 to-teal-500/5",
              slug === "capacitaciones" && "from-blue-500/20 to-blue-500/5",
            )}
          >
            <span className={cn("text-xs px-3 py-1 rounded-full font-semibold", categoryColors[slug])}>
              {categoryName}
            </span>
            <h1 className="text-2xl font-bold mt-3">Eventos de {categoryName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {events.length} {events.length === 1 ? "evento" : "eventos"} encontrados
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No hay eventos en esta categoría</p>
              <p className="text-sm mt-1">Vuelve pronto para ver nuevos eventos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">{upcomingEvents.map((event) => renderEventRow(event, false))}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-sm">No hay próximos eventos en esta categoría</p>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPastEvents((prev) => !prev)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 text-sm font-semibold text-muted-foreground transition-all"
                  >
                    <History className="h-4 w-4" />
                    {showPastEvents ? "Ocultar histórico" : `Ver histórico (${pastEvents.length})`}
                    {showPastEvents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showPastEvents && (
                    <div className="space-y-2 mt-3">{pastEvents.map((event) => renderEventRow(event, true))}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
