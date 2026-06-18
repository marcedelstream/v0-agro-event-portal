"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Star, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { categoryLabels, categoryColors, categoryGradients } from "@/lib/events-data"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  slug: string
  avatar_url: string | null
}

interface Event {
  id: string
  title: string
  slug: string | null
  date: string
  time: string
  location: string
  category: string
  is_premium: boolean
}

export default function OrganizadorPage() {
  const params = useParams()
  const slug = params.slug as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient()
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, slug, avatar_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()

      if (org) {
        setOrganization(org)
        const { data: orgEvents } = await supabase
          .from("events")
          .select("id, title, slug, date, time, location, category, is_premium")
          .eq("organization_id", org.id)
          .eq("is_approved", true)
          .order("date", { ascending: true })
        setEvents(orgEvents || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })

  const getEventUrl = (event: Event) => `/evento/${event.slug || event.id}`

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          <div className="h-20 bg-muted rounded-2xl animate-pulse" />
          <div className="h-16 bg-muted rounded-xl animate-pulse" />
        </main>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Organizacion no encontrada</h1>
        <p className="text-muted-foreground mb-4">La organizacion que buscas no existe</p>
        <Link href="/">
          <Button className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
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

          <div className="flex items-center gap-4 rounded-2xl p-6 mb-6 bg-gradient-to-br from-primary/15 to-primary/5">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shrink-0">
              {organization.avatar_url ? (
                <img src={organization.avatar_url} alt={organization.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{organization.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {events.length} {events.length === 1 ? "evento" : "eventos"}
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">Esta organizacion aun no tiene eventos publicados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={getEventUrl(event)}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors duration-200 group",
                    event.is_premium
                      ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent hover:shadow-md"
                      : "border-border bg-card hover:bg-muted/50",
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
                        {event.is_premium && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
