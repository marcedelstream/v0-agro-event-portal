"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Star, ChevronRight, MapPin } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { categoryLabels, categoryColors, categoryGradients } from "@/lib/events-data"
import { departmentsList, getCities } from "@/lib/paraguay-data"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  slug: string | null
  description: string
  date: string
  time: string
  location: string
  department: string | null
  city: string | null
  category: string
  is_premium: boolean
  image_url: string | null
}

function slugToDepartment(slug: string): string | null {
  const normalized = decodeURIComponent(slug).replace(/-/g, " ").toLowerCase()
  return departmentsList.find((dep) => dep.toLowerCase() === normalized) || null
}

export default function UbicacionPage() {
  const params = useParams()
  const slug = params.slug as string
  const departmentName = slugToDepartment(slug)

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<string>("")

  const cities = departmentName ? getCities(departmentName) : []

  useEffect(() => {
    async function loadEvents() {
      if (!departmentName) {
        setLoading(false)
        return
      }
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_approved", true)
        .eq("department", departmentName)
        .order("date", { ascending: true })

      setEvents(data || [])
      setLoading(false)
    }
    loadEvents()
  }, [departmentName])

  const filteredEvents = selectedCity
    ? events.filter((e) => e.city === selectedCity)
    : events

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

    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} dias`
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Manana"
    return `En ${diffDays} dias`
  }

  if (!departmentName) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Departamento no encontrado</p>
          <Link href="/">
            <Button className="mt-4">Volver al inicio</Button>
          </Link>
        </main>
      </div>
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

          {/* Header del departamento */}
          <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-3 w-3 inline mr-1" />
              {departmentName}
            </span>
            <h1 className="text-2xl font-bold mt-3">Eventos en {departmentName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredEvents.length} {filteredEvents.length === 1 ? "evento" : "eventos"} encontrados
            </p>
          </div>

          {/* Filtro por ciudad */}
          {cities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Filtrar por ciudad</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity("")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105",
                    !selectedCity
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25",
                  )}
                >
                  Todas
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105",
                      selectedCity === city
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25",
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de eventos */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No hay eventos en esta ubicacion</p>
              <p className="text-sm mt-1">
                {selectedCity
                  ? "Proba con otra ciudad o mira todos los eventos del departamento"
                  : "Vuelve pronto para ver nuevos eventos"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => {
                const daysText = getDaysUntil(event.date)
                const isPast = daysText.startsWith("Hace")

                return (
                  <Link
                    key={event.id}
                    href={`/evento/${event.slug || event.id}`}
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
                          <span>-</span>
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              categoryColors[event.category] || "bg-gray-500/20 text-gray-400",
                            )}
                          >
                            {categoryLabels[event.category] || event.category}
                          </span>
                          {event.city && (
                            <>
                              <span>-</span>
                              <span className="truncate">{event.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-lg",
                          isPast
                            ? "bg-muted text-muted-foreground"
                            : daysText === "Hoy" || daysText === "Manana"
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
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
