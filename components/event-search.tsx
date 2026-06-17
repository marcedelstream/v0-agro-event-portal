"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X, Clock, MapPin } from "lucide-react"
import { categoryLabels, type AgroEvent } from "@/lib/events-data"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"

export function EventSearch() {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [events, setEvents] = useState<AgroEvent[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function searchEvents() {
      if (!query || query.length < 2) {
        setEvents([])
        return
      }

      setLoading(true)
      const supabase = createBrowserClient()

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_approved", true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%,department.ilike.%${query}%,city.ilike.%${query}%`)
        .order("date", { ascending: true })
        .limit(10)

      const mappedEvents = (data || []).map((e) => ({
        ...e,
        event_date: e.date,
        event_time: e.time,
      }))
      setEvents(mappedEvents)
      setLoading(false)
    }

    const debounce = setTimeout(searchEvents, 300)
    return () => clearTimeout(debounce)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const clearSearch = () => {
    setQuery("")
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className="relative mb-4">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/20">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <input
          type="text"
          placeholder="Buscar eventos..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => query && setShowResults(true)}
          className="w-full h-12 pl-12 pr-10 rounded-2xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 font-medium"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && query.length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-card/95 backdrop-blur-lg border-2 border-border rounded-2xl shadow-2xl max-h-72 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : events.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No se encontraron eventos
            </div>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/evento/${event.slug || event.id}`}
                onClick={() => setShowResults(false)}
                className={cn(
                  "flex flex-col gap-1.5 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0",
                  event.is_premium && "bg-gradient-to-r from-yellow-500/10 to-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                    {categoryLabels[event.category] || event.category}
                  </span>
                  {event.is_premium && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-500 font-medium">
                      Premium
                    </span>
                  )}
                </div>
                <span className="font-semibold text-sm">{event.title}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.event_time || event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
