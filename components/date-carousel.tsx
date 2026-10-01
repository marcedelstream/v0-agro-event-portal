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
  onClose?: () => void
  eventDates: Set<string>
}

function InlineCalendar({ currentMonth, selectedDate, onSelectDate, onClose, eventDates }: InlineCalendarProps) {
  const [viewMonth, setViewMonth] = useState(currentMonth)

  // Si la fecha elegida pasa a otro mes (por ejemplo desde la tira de dias), el calendario la sigue
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()
  useEffect(() => {
    setViewMonth(new Date(currentYear, currentMonthIndex, 1))
  }, [currentYear, currentMonthIndex])

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
    <div className="bg-card border border-border rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2.5 hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-lg">
          {viewMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).replace(/^./, (c) => c.toUpperCase())}
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
              "h-11 w-full rounded-xl text-sm flex flex-col items-center justify-center relative transition-colors duration-200",
              !day && "invisible",
              day && "hover:bg-muted active:scale-95",
              day &&
                formatDateKey(day) === formatDateKey(selectedDate) &&
                "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy font-bold",
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

      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all font-medium"
        >
          Cerrar calendario
        </button>
      )}
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

  const selectedDateLabel = selectedDate
    .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase())

  const categoriesBlock = (
    <div>
      <p className="eyebrow mb-3">Explorar por categoría</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Link
            key={key}
            href={`/categoria/${key}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80",
              categoryColors[key],
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )

  const locationsBlock = (
    <div>
      <p className="eyebrow mb-3">Por ubicación</p>
      <div className="flex flex-wrap gap-2">
        {departmentsList.map((dep) => (
          <Link
            key={dep}
            href={`/ubicacion/${encodeURIComponent(dep.toLowerCase().replace(/\s+/g, "-"))}`}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-border bg-card hover:border-foreground/30"
          >
            {dep}
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <section className="py-4 md:py-6 lg:py-10">
      {/* Mobile: una columna. Desktop (lg): eventos a la izquierda + barra lateral fija a la derecha */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0 space-y-4 lg:space-y-8">
          {/* En desktop el buscador va en el hero de la home */}
          <div className="lg:hidden">
            <EventSearch />
          </div>

          {banners.length > 0 ? (
            <div>
              <p className="eyebrow mb-3">Eventos destacados</p>
              <div
                className="flex gap-3 overflow-x-auto pb-2 lg:gap-4 snap-x"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {banners.map((banner) => (
                  <Link
                    key={banner.id}
                    href={banner.events?.slug ? `/evento/${banner.events.slug}` : banner.link_url || "#"}
                    className="shrink-0 snap-start w-56 lg:w-[calc((100%-2rem)/3)] rounded-2xl border border-border bg-card overflow-hidden group hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
                  >
                    <div className="h-36 lg:h-44 overflow-hidden">
                      <img
                        src={banner.events?.image_url || banner.image_url || "/placeholder.svg"}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="px-3 py-2.5 lg:px-4 lg:py-3.5">
                      <p className="font-bold text-[15px] lg:text-base leading-snug line-clamp-2">
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
            <div className="h-28 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('/agricultural-fair-banner-with-tractors.jpg')] bg-cover bg-center opacity-20" />
              <div className="text-center z-10">
                <p className="text-xs text-muted-foreground font-medium mb-1">Espacio publicitario</p>
                <p className="text-sm font-bold text-primary">Eventos Patrocinados</p>
                <p className="text-xs text-muted-foreground">Tu evento destacado aqui</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3 relative">
              <div>
                <p className="eyebrow mb-1">Agenda</p>
                <h2 className="text-2xl lg:text-3xl font-extrabold">Próximos eventos</h2>
                <p className="text-sm text-muted-foreground font-medium">{formatMonthYear(selectedDate).replace(/^./, (c) => c.toUpperCase())}</p>
              </div>
              {/* En desktop el calendario del mes esta siempre visible en la barra lateral */}
              <Button
                variant={showCalendar ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 rounded-full font-semibold transition-all h-9 px-4 lg:hidden"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{showCalendar ? "Ocultar" : "Ver mes"}</span>
              </Button>
            </div>

            {showCalendar ? (
              <div className="lg:hidden">
                <InlineCalendar
                  currentMonth={selectedDate}
                  selectedDate={selectedDate}
                  onSelectDate={handleCalendarSelect}
                  onClose={() => setShowCalendar(false)}
                  eventDates={eventDates}
                />
              </div>
            ) : null}

            <div className={cn(showCalendar && "hidden lg:block")}>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => scroll("left")}
                  className="hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card hover:bg-muted active:scale-95 transition-all shrink-0"
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
                          "flex flex-col items-center justify-center rounded-2xl border transition-all duration-200 shrink-0 min-w-[64px] h-[76px]",
                          isSelected(date)
                            ? "bg-brand-navy text-white border-brand-navy dark:bg-brand-lime dark:text-brand-navy dark:border-brand-lime"
                            : "bg-card border-border hover:border-foreground/30 active:scale-95",
                          isToday(date) && !isSelected(date) && "border-primary",
                          past && !isSelected(date) && "opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isSelected(date) ? "opacity-75" : "text-muted-foreground",
                          )}
                        >
                          {formatDayName(date)}
                        </span>
                        <span className="font-extrabold text-xl">
                          {formatDayNumber(date)}
                        </span>
                        {hasEvents && (
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full mt-0.5",
                              isSelected(date) ? "bg-brand-lime dark:bg-brand-navy" : "bg-brand-lime",
                            )}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => scroll("right")}
                  className="hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card hover:bg-muted active:scale-95 transition-all shrink-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Espacio siempre reservado: el boton aparece sin mover el resto de la pagina */}
              <div className="flex h-8 items-center justify-center">
                {!isSelectedToday && (
                  <button
                    onClick={scrollToToday}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Volver a hoy
                  </button>
                )}
              </div>
            </div>

            <p className="hidden lg:block text-sm font-semibold text-muted-foreground">{selectedDateLabel}</p>

            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-4">
              {loading ? (
                <>
                  <div className="h-24 bg-muted rounded-2xl animate-pulse" />
                  <div className="h-24 bg-muted rounded-2xl animate-pulse" />
                </>
              ) : eventsForSelectedDate.length === 0 ? (
                <div className="lg:col-span-2 text-center py-10 text-muted-foreground rounded-2xl border border-dashed border-border">
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
                      "flex items-center gap-3 p-3 lg:p-4 rounded-2xl border bg-card transition-all duration-200 group hover:shadow-lg hover:shadow-black/5 active:scale-[0.99]",
                      event.is_premium ? "border-brand-lime ring-1 ring-brand-lime/40" : "border-border",
                    )}
                  >
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt=""
                        className="shrink-0 h-16 w-16 lg:h-20 lg:w-20 rounded-xl object-cover bg-muted"
                      />
                    ) : (
                      <div
                        className={cn(
                          "shrink-0 w-1.5 h-12 rounded-full bg-gradient-to-b",
                          categoryGradients[event.category] || "from-gray-500 to-gray-500/50",
                        )}
                      />
                    )}

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
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-lime text-brand-navy font-semibold">
                            <Star className="h-3 w-3 fill-current" />
                            Premium
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[15px] truncate lg:whitespace-normal lg:line-clamp-2">{event.title}</h3>
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
                className="lg:col-span-2 w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-foreground/20 text-foreground hover:border-primary hover:bg-card transition-all duration-200 font-semibold active:scale-[0.99]"
              >
                <Plus className="h-5 w-5" />
                <span>Agregar evento</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <PromoBanner />
          </div>

          <div className="mt-6 lg:mt-0">
            <OrganizationsRow />
          </div>

          <div className="mt-6 space-y-4 lg:hidden">
            {categoriesBlock}
            {locationsBlock}
          </div>
        </div>

        {/* Barra lateral (solo desktop) */}
        <aside className="hidden lg:block">
          <div className="space-y-8">
            <div>
              <p className="eyebrow mb-3">Calendario</p>
              <InlineCalendar
                currentMonth={selectedDate}
                selectedDate={selectedDate}
                onSelectDate={handleCalendarSelect}
                eventDates={eventDates}
              />
            </div>
            {categoriesBlock}
            {locationsBlock}
            <PromoBanner />
          </div>
        </aside>
      </div>

      {showSubmitForm && <SubmitEventForm onClose={() => setShowSubmitForm(false)} selectedDate={selectedDate} />}
    </section>
  )
}
