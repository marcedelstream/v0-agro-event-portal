"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Plus, Star, RotateCcw } from "lucide-react"
import { categoryLabels, categoryColors, categoryGradients, type AgroEvent } from "@/lib/events-data"
import { departmentsList } from "@/lib/paraguay-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SubmitEventForm } from "@/components/submit-event-form"
import { EventSearch } from "@/components/event-search"
import { createBrowserClient } from "@/lib/supabase/client"
import { PromoBanner } from "@/components/promo-banner"
import { OrganizationsRow } from "@/components/organizations-row"

interface InlineCalendarProps {
  currentMonth: Date
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onClose: () => void
  eventDates: Set<string>
}

function InlineCalendar({ currentMonth, selectedDate, onSelectDate, onClose, eventDates }: InlineCalendarProps) {
  const [viewMonth, setViewMonth] = useState(currentMonth)

  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const startDay = firstDayOfMonth.getDay()

  const days: (Date | null)[] = []
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i))
  }

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  const hasEvents = (date: Date) => eventDates.has(formatDateKey(date))

  return (
    <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-border rounded-2xl p-4 mb-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2.5 hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold capitalize text-lg">
          {viewMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={nextMonth}
          className="p-2.5 hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((day) => (
          <div key={day} className="text-muted-foreground font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => (
          <button
            key={index}
            disabled={!day}
            onClick={() => {
              if (day) onSelectDate(day)
            }}
            className={cn(
              "h-11 w-full rounded-xl text-sm flex flex-col items-center justify-center relative transition-all duration-200",
              !day && "invisible",
              day && "hover:bg-muted hover:scale-105 active:scale-95",
              day &&
                formatDateKey(day) === formatDateKey(selectedDate) &&
                "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground scale-110 shadow-lg shadow-primary/30 z-10 font-bold",
              day && hasEvents(day) && formatDateKey(day) !== formatDateKey(selectedDate) && "font-bold text-primary",
            )}
          >
            {day?.getDate()}
            {day && hasEvents(day) && (
              <span
                className={cn(
                  "absolute bottom-1 w-2 h-2 rounded-full",
                  formatDateKey(day) === formatDateKey(selectedDate)
                    ? "bg-primary-foreground"
                    : "bg-gradient-to-r from-primary to-accent",
                )}
              />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all font-medium"
      >
        Cerrar calendario
      </button>
    </div>
  )
}

function generateDateRange(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  for (let i = -7; i <= 180; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }
  return dates
}

const TODAY_INDEX = 7

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()
}

function formatDayNumber(date: Date): string {
  return date.getDate().toString()
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
}

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string
  is_active: boolean
  events?: {
    title: string
    date: string
    end_date?: string
    location: string
    image_url: string
    slug: string
  }
}

export function DateCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [events, setEvents] = useState<AgroEvent[]>([])
  const [eventDates, setEventDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const dates = generateDateRange()

  const todayKey = formatDateKey(new Date())
  const isSelectedToday = formatDateKey(selectedDate) === todayKey

  useEffect(() => {
    async function loadEvents() {
      const supabase = createBrowserClient()
      const [eventsRes, bannersRes] = await Promise.all([
        supabase.from("events").select("*").eq("is_approved", true).order("date"),
        supabase
          .from("banners")
          .select("*, events(title, date, end_date, location, image_url, slug)")
          .eq("is_active", true)
          .order("display_order"),
      ])

      if (eventsRes.data) {
        const mappedEvents = eventsRes.data.map((e) => ({
          ...e,
          event_date: e.date,
          event_time: e.time,
        }))
        setEvents(mappedEvents)
        const datesWithEvents = new Set<string>()
        eventsRes.data.forEach((e) => {
          datesWithEvents.add(e.date)
          if (e.end_date) {
            const start = new Date(e.date + "T12:00:00")
            const end = new Date(e.end_date + "T12:00:00")
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              datesWithEvents.add(formatDateKey(d))
            }
          }
        })
        setEventDates(datesWithEvents)
      }
      if (bannersRes.data && bannersRes.data.length > 0) {
        setBanners(bannersRes.data)
        setCurrentBannerIndex(Math.floor(Math.random() * bannersRes.data.length))
      }
      setLoading(false)
    }
    loadEvents()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const itemWidth = 72
        scrollRef.current.scrollLeft = TODAY_INDEX * itemWidth
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

// Auto-scroll para banners (cada 5 segundos)
// El autoplay se reinicia cada vez que currentBannerIndex cambia, ya sea
// por el propio autoplay o por una navegacion manual (flecha, punto o swipe),
// asi nunca compiten por el mismo cambio de banner.
useEffect(() => {
  if (banners.length <= 1) return

  const interval = setInterval(() => {
    setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
  }, 5000)

  return () => clearInterval(interval)
}, [banners.length, currentBannerIndex])

const goToBanner = (index: number) => {
  setCurrentBannerIndex(index)
}
const goToPrevBanner = () => {
  setCurrentBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
}
const goToNextBanner = () => {
  setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
}

// Swipe tactil para mobile (el slide en si se anima por transform, no por scroll)
const touchStartX = useRef(0)
const handleBannerTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX
}
const handleBannerTouchEnd = (e: React.TouchEvent) => {
  if (banners.length <= 1) return
  const delta = e.changedTouches[0].clientX - touchStartX.current
  if (Math.abs(delta) < 40) return
  if (delta < 0) {
    goToNextBanner()
  } else {
    goToPrevBanner()
  }
}

  const scrollToDate = useCallback(
    (date: Date) => {
      if (!scrollRef.current) return
      const dateIndex = dates.findIndex((d) => formatDateKey(d) === formatDateKey(date))
      if (dateIndex >= 0) {
        const itemWidth = 72
        scrollRef.current.scrollTo({
          left: dateIndex * itemWidth,
          behavior: "smooth",
        })
      }
    },
    [dates],
  )

  const scrollToToday = () => {
    const today = new Date()
    setSelectedDate(today)
    scrollToDate(today)
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      })
    }
  }

  const eventsForSelectedDate = events.filter((event) => {
    const selectedKey = formatDateKey(selectedDate)
    // Usar event.date si event_date no existe (por si el mapeo falla)
    const eventStartDate = event.event_date || event.date
    if (!event.end_date) {
      return eventStartDate === selectedKey
    }
    const startDate = new Date(eventStartDate + "T12:00:00")
    const endDate = new Date(event.end_date + "T12:00:00")
    const selected = new Date(selectedKey + "T12:00:00")
    return selected >= startDate && selected <= endDate
  })

  const isToday = (date: Date) => formatDateKey(date) === todayKey
  const isSelected = (date: Date) => formatDateKey(date) === formatDateKey(selectedDate)
  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  const handleCalendarSelect = (date: Date) => {
    setSelectedDate(date)
    setShowCalendar(false)
    setTimeout(() => scrollToDate(date), 150)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <section className="py-4 md:py-6">
      <div className="space-y-4">
        <EventSearch />

        {banners.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">Eventos destacados</p>
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {banners.map((banner) => (
                <Link
                  key={banner.id}
                  href={banner.events?.slug ? `/evento/${banner.events.slug}` : banner.link_url || "#"}
                  className="shrink-0 w-56 rounded-2xl border-2 border-border bg-card overflow-hidden group hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={banner.events?.image_url || banner.image_url || "/placeholder.svg"}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {banner.events?.title || banner.title}
                    </p>
                    {banner.events && (
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(banner.events.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                          {banner.events.end_date && ` — ${new Date(banner.events.end_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{banner.events.location}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-28 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/agricultural-fair-banner-with-tractors.jpg')] bg-cover bg-center opacity-20" />
            <div className="text-center z-10">
              <p className="text-xs text-muted-foreground font-medium mb-1">Espacio publicitario</p>
              <p className="text-sm font-bold text-primary">Eventos Patrocinados</p>
              <p className="text-xs text-muted-foreground">Tu evento destacado aqui</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 relative">
          <div>
            <h2 className="text-xl font-bold">Proximos Eventos</h2>
            <p className="text-sm text-muted-foreground capitalize font-medium">{formatMonthYear(selectedDate)}</p>
          </div>
          <Button
            variant={showCalendar ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className={cn(
              "flex items-center gap-2 rounded-xl font-semibold transition-all",
              showCalendar && "shadow-lg shadow-primary/30",
            )}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{showCalendar ? "Ocultar" : "Ver mes"}</span>
          </Button>
        </div>

        {showCalendar ? (
          <InlineCalendar
            currentMonth={selectedDate}
            selectedDate={selectedDate}
            onSelectDate={handleCalendarSelect}
            onClose={() => setShowCalendar(false)}
            eventDates={eventDates}
          />
        ) : (
          <>
            {!isSelectedToday && (
              <button
                onClick={scrollToToday}
                className="mb-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mx-auto font-semibold bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <RotateCcw className="h-3 w-3" />
                Volver a hoy
              </button>
            )}

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-card hover:bg-muted hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {dates.map((date) => {
                  const hasEvents = eventDates.has(formatDateKey(date))
                  const past = isPast(date) && !isToday(date)

                  return (
                    <button
                      key={formatDateKey(date)}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 shrink-0",
                        isSelected(date)
                          ? "min-w-[76px] h-[88px] bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground border-primary scale-110 shadow-xl shadow-primary/40 z-10"
                          : "min-w-[64px] h-[76px] bg-card border-border hover:border-primary/50 hover:scale-105 active:scale-95",
                        isToday(date) && !isSelected(date) && "border-primary/50 bg-primary/5",
                        past && !isSelected(date) && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isSelected(date) ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {formatDayName(date)}
                      </span>
                      <span className={cn("font-bold", isSelected(date) ? "text-2xl" : "text-xl")}>
                        {formatDayNumber(date)}
                      </span>
                      {hasEvents && (
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mt-0.5",
                            isSelected(date) ? "bg-primary-foreground" : "bg-gradient-to-r from-primary to-accent",
                          )}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => scroll("right")}
                className="hidden md:flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border bg-card hover:bg-muted hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-muted rounded-2xl" />
                <div className="h-16 bg-muted rounded-2xl" />
              </div>
            </div>
          ) : eventsForSelectedDate.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-gradient-to-br from-muted/30 to-transparent rounded-2xl border-2 border-dashed border-border">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No hay eventos programados</p>
              <p className="text-sm mt-1 mb-4">
                {isPast(selectedDate) && !isToday(selectedDate)
                  ? "Esta fecha ya paso"
                  : "Selecciona otra fecha o envia un evento"}
              </p>
            </div>
          ) : (
            eventsForSelectedDate.map((event) => (
              <Link
                key={event.id}
                href={`/evento/${event.slug || event.id}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99]",
                  event.is_premium
                    ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-orange-500/5 hover:shadow-xl hover:shadow-yellow-500/20"
                    : "border-border bg-card hover:bg-muted/50 hover:shadow-lg",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-1.5 h-12 rounded-full bg-gradient-to-b",
                    categoryGradients[event.category] || "from-gray-500 to-gray-500/50",
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        categoryColors[event.category] || "bg-gray-500/20 text-gray-400",
                      )}
                    >
                      {categoryLabels[event.category] || event.category}
                    </span>
                    {event.is_premium && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-500 font-semibold">
                        <Star className="h-3 w-3 fill-current" />
                        Premium
                      </span>
                    )}
                  </div>
                  <h3
                    className={cn(
                      "font-bold text-sm truncate group-hover:text-primary transition-colors",
                      event.is_premium && "text-yellow-500 group-hover:text-yellow-400",
                    )}
                  >
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.event_time}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))
          )}

          <Link
            href="/publicar-evento"
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-200 font-semibold hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            <span>Agregar evento</span>
          </Link>
        </div>

        <div className="mt-6">
          <PromoBanner />
        </div>

        <div className="mt-6">
          <OrganizationsRow />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Explorar por categoria</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Link
                key={key}
                href={`/categoria/${key}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105",
                  categoryColors[key],
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Por ubicacion</h3>
          <div className="flex flex-wrap gap-2">
            {departmentsList.map((dep) => (
              <Link
                key={dep}
                href={`/ubicacion/${encodeURIComponent(dep.toLowerCase().replace(/\s+/g, "-"))}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
              >
                {dep}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {showSubmitForm && <SubmitEventForm onClose={() => setShowSubmitForm(false)} selectedDate={selectedDate} />}
    </section>
  )
}
