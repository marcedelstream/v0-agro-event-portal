"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarPlus,
  CalendarX,
  Clock,
  ExternalLink,
  ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
  Users,
} from "lucide-react"
import { Header } from "@/components/header"
import { CountdownTimer } from "@/components/countdown-timer"
import { GacetillaButton } from "@/components/gacetilla-button"
import { EventGallery } from "@/components/event-gallery"
import { Button } from "@/components/ui/button"
import { categoryLabels, categoryColors } from "@/lib/events-data"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { SPONSOR_WHATSAPP, whatsappLink } from "@/lib/site-config"

export interface EventDetail {
  id: string
  title: string
  description: string
  long_description?: string
  date: string
  end_date?: string
  time: string
  location: string
  department?: string
  city?: string
  maps_url?: string
  category: string
  speakers?: string[]
  is_premium: boolean
  image_url?: string
  slug: string
  contact_email?: string
  contact_phone?: string
  allow_contact_form?: boolean
  important_links?: { label: string; url: string }[]
  internal_banner_url?: string
  gacetilla_titulo?: string
  gacetilla_imagen?: string
  gacetilla_texto?: string
  organization_id?: string
}

export interface EventOrganization {
  name: string
  slug: string
  avatar_url: string | null
}

export interface GalleryImage {
  id: string
  image_url: string
  caption?: string
}

interface EventoClientPageProps {
  event: EventDetail | null
  galleryImages: GalleryImage[]
  organization: EventOrganization | null
}

type ContactType = "info" | "sponsor" | "stand"

const DAY_MS = 1000 * 60 * 60 * 24

// Las fechas vienen como "YYYY-MM-DD"; se anclan al mediodia para que la zona horaria no corra el dia.
function parseDay(value: string) {
  return new Date(`${value}T12:00:00`)
}

function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function withProtocol(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
}

function toCalendarDay(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

function googleCalendarUrl(event: EventDetail) {
  const start = parseDay(event.date)
  // En Google Calendar el fin de un evento de dia completo es exclusivo: se suma un dia.
  const end = parseDay(event.end_date || event.date)
  end.setDate(end.getDate() + 1)
  const location = [event.location, event.city, event.department].filter(Boolean).join(", ")
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarDay(start)}/${toCalendarDay(end)}`,
    details: event.description || "",
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function isVirtual(event: EventDetail) {
  const text = `${event.location} ${event.city ?? ""}`.toLowerCase()
  return event.category === "webinar" || /virtual|online|zoom|meet/.test(text)
}

export function EventoClientPage({ event, galleryImages, organization }: EventoClientPageProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactType, setContactType] = useState<ContactType>("info")
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // "Hoy" se calcula recien en el navegador para no desfasar el HTML del servidor (UTC) con el del usuario.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
  }, [])

  const handleContactSubmit = async () => {
    if (!event) return
    setSubmitting(true)
    const supabase = createBrowserClient()
    await supabase.from("event_contact_requests").insert({
      event_id: event.id,
      contact_type: contactType,
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      message: contactForm.message,
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  const openContact = (type: ContactType) => {
    setContactType(type)
    setShowContactForm(true)
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
          <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">El evento que buscás no existe o fue eliminado</p>
          <Button asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const startDay = parseDay(event.date)
  const endDay = event.end_date && event.end_date !== event.date ? parseDay(event.end_date) : null
  const eventDuration = endDay ? Math.round((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1 : 1

  const monthShort = startDay.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase()
  const longDate = capitalizeFirst(startDay.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))
  const longEndDate = endDay?.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  // Estado relativo a hoy (solo en el navegador)
  let daysUntilStart: number | null = null
  let daysSinceEnd: number | null = null
  if (now) {
    const today = new Date(now)
    today.setHours(12, 0, 0, 0)
    daysUntilStart = Math.round((startDay.getTime() - today.getTime()) / DAY_MS)
    daysSinceEnd = Math.round((today.getTime() - (endDay || startDay).getTime()) / DAY_MS)
  }
  const hasEnded = daysSinceEnd !== null && daysSinceEnd > 0
  const isOngoing = daysUntilStart !== null && daysUntilStart <= 0 && !hasEnded
  const showYear = now !== null && startDay.getFullYear() !== now.getFullYear()
  const eventStart = new Date(`${event.date}T${event.time || "00:00"}:00`)

  // Evita "Asuncion, Asuncion" cuando ciudad y departamento coinciden
  const placeLine = [...new Set([event.city, event.department].filter(Boolean))].join(", ")
  const virtual = isVirtual(event)
  const mapQuery = [event.location, event.city, event.department, "Paraguay"].filter(Boolean).join(", ")
  const allowContactForm = event.allow_contact_form !== false
  const hasDirectContact = Boolean(event.contact_email || event.contact_phone)

  const organizerBlock = (
    <div className="space-y-3">
      <SectionTitle>Organizado por</SectionTitle>
      {organization ? (
        <Link href={`/organizador/${organization.slug}`} className="flex items-center gap-3 group">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center">
            {organization.avatar_url ? (
              <img src={organization.avatar_url} alt={organization.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">{organization.name.charAt(0)}</span>
            )}
          </div>
          <span className="font-semibold group-hover:underline underline-offset-4">{organization.name}</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="" className="h-9 w-9 rounded-full border border-border bg-card object-contain p-1" />
          <span className="font-semibold">Eventos Agro</span>
        </div>
      )}
      {hasDirectContact && (
        <div className="flex flex-col gap-1.5 pt-1 text-sm">
          {event.contact_email && (
            <a href={`mailto:${event.contact_email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{event.contact_email}</span>
            </a>
          )}
          {event.contact_phone && (
            <a href={`tel:${event.contact_phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4" />
              {event.contact_phone}
            </a>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="relative min-h-screen bg-background">
      <Header />

      {/* Fondo difuminado con los colores del flyer, como en Luma */}
      {event.image_url && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
          <img src={event.image_url} alt="" className="h-full w-full scale-125 object-cover opacity-30 blur-3xl dark:opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>
      )}

      <main className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 md:pt-10 xl:max-w-6xl xl:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Todos los eventos
        </Link>

        <div className="grid gap-8 md:grid-cols-[320px_minmax(0,1fr)] md:gap-12 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-16">
          {/* Columna izquierda: flyer + organizador */}
          <aside className="space-y-8 md:sticky md:top-24 md:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="block h-auto w-full" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-brand-navy">
                  <img src="/logo.png" alt="Eventos Agro" className="w-2/3 opacity-90" />
                </div>
              )}
            </div>

            <div className="hidden md:block">{organizerBlock}</div>

            <div className="hidden md:flex flex-wrap gap-2">
              <Link
                href={`/categoria/${event.category}`}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold", categoryColors[event.category])}
              >
                {categoryLabels[event.category] || event.category}
              </Link>
              {event.department && (
                <Link
                  href={`/ubicacion/${encodeURIComponent(event.department.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-foreground/30"
                >
                  {event.department}
                </Link>
              )}
            </div>
          </aside>

          {/* Columna derecha: datos del evento */}
          <section className="min-w-0 space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {event.is_premium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand-navy">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Destacado
                  </span>
                )}
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold md:hidden", categoryColors[event.category])}>
                  {categoryLabels[event.category] || event.category}
                </span>
                {eventDuration > 1 && (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                    {eventDuration} días
                  </span>
                )}
                {isOngoing && (
                  <span className="rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand-navy">En curso</span>
                )}
                {hasEnded && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Finalizado</span>
                )}
              </div>

              <h1 className="text-balance text-3xl font-extrabold leading-[1.1] md:text-5xl">{event.title}</h1>

              {/* Fecha y lugar en filas, como Luma */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-card text-center">
                    <div className="bg-muted py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground">{monthShort}</div>
                    <div className="py-1 text-lg font-extrabold leading-none">{startDay.getDate()}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {longDate}
                      {longEndDate ? ` — ${longEndDate}` : ""}
                      {showYear && `, ${startDay.getFullYear()}`}
                    </p>
                    {event.time && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time} hs
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    {event.maps_url ? (
                      <a
                        href={withProtocol(event.maps_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold hover:underline underline-offset-4"
                      >
                        {event.location}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="font-semibold">{event.location}</p>
                    )}
                    {placeLine && <p className="text-sm text-muted-foreground">{placeLine}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de participacion (equivale a "Inscripcion" en Luma) */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/60 px-5 py-2.5 text-sm font-semibold text-muted-foreground">
                {hasEnded ? "Evento pasado" : "Participá"}
              </div>
              <div className="space-y-4 p-5">
                {hasEnded ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <CalendarX className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Este evento ya terminó</p>
                      <p className="text-sm text-muted-foreground">
                        Finalizó hace {daysSinceEnd} {daysSinceEnd === 1 ? "día" : "días"}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {now && !isOngoing && (
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Faltan</p>
                        <CountdownTimer targetDate={eventStart} />
                      </div>
                    )}
                    <a
                      href={googleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-navy font-semibold text-white transition-colors hover:bg-brand-navy/90 dark:bg-brand-lime dark:text-brand-navy dark:hover:bg-brand-lime-dark"
                    >
                      <CalendarPlus className="h-5 w-5" />
                      Agregar a mi calendario
                    </a>
                  </>
                )}

                {/* Auspicios: van al WhatsApp de Eventos Agro; sin numero configurado, al formulario */}
                {SPONSOR_WHATSAPP ? (
                  <a
                    href={whatsappLink(
                      SPONSOR_WHATSAPP,
                      `Hola! Quiero auspiciar el evento "${event.title}" (https://eventosagropy.com/evento/${event.slug})`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border font-semibold transition-colors hover:bg-muted"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Quiero auspiciar este evento
                  </a>
                ) : (
                  allowContactForm && (
                    <button
                      onClick={() => openContact("sponsor")}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border font-semibold transition-colors hover:bg-muted"
                    >
                      <Star className="h-4 w-4" />
                      Quiero auspiciar este evento
                    </button>
                  )
                )}

                {!allowContactForm && (
                  hasDirectContact && (
                    <div className="grid grid-cols-2 gap-2">
                      {event.contact_email && (
                        <a
                          href={`mailto:${event.contact_email}`}
                          className="flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold hover:bg-muted"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </a>
                      )}
                      {event.contact_phone && (
                        <a
                          href={`tel:${event.contact_phone}`}
                          className="flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold hover:bg-muted"
                        >
                          <Phone className="h-4 w-4" />
                          Llamar
                        </a>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Organizador en mobile (en desktop va en la columna izquierda) */}
            <div className="md:hidden">{organizerBlock}</div>

            <div className="space-y-3">
              <SectionTitle>Acerca del evento</SectionTitle>
              <p className="whitespace-pre-line leading-relaxed text-foreground/85">
                {event.long_description || event.description}
              </p>
            </div>

            {event.internal_banner_url && (
              <img src={event.internal_banner_url} alt="Banner del evento" className="h-auto w-full rounded-2xl object-cover" />
            )}

            {event.speakers && event.speakers.length > 0 && (
              <div className="space-y-3">
                <SectionTitle icon={Users}>Disertantes</SectionTitle>
                <div className="grid gap-2 sm:grid-cols-2">
                  {event.speakers.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-lime font-bold text-brand-navy">
                        {speaker.charAt(0)}
                      </div>
                      <span className="font-medium">{speaker}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.important_links && event.important_links.length > 0 && (
              <div className="space-y-3">
                <SectionTitle icon={ExternalLink}>Links importantes</SectionTitle>
                <div className="grid gap-2">
                  {event.important_links.map((link, i) => (
                    <a
                      key={i}
                      href={withProtocol(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 font-medium hover:border-foreground/30"
                    >
                      {link.label}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="space-y-3">
                <SectionTitle icon={ImageIcon}>Galería de fotos</SectionTitle>
                <EventGallery images={galleryImages} />
              </div>
            )}

            {event.gacetilla_texto && (
              <GacetillaButton
                titulo={event.gacetilla_titulo || event.title}
                imagen={event.gacetilla_imagen}
                texto={event.gacetilla_texto}
              />
            )}

            {!virtual && event.location && (
              <div className="space-y-3">
                <SectionTitle>Ubicación</SectionTitle>
                <div>
                  <p className="font-semibold">{event.location}</p>
                  {placeLine && <p className="text-sm text-muted-foreground">{placeLine}</p>}
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                  <iframe
                    title={`Mapa de ${event.location}`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                    className="h-64 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: event.title, text: event.description, url: window.location.href })
                  } else {
                    navigator.clipboard?.writeText(window.location.href)
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir evento
              </Button>
              <Link
                href={`/categoria/${event.category}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3"
              >
                Más eventos de {categoryLabels[event.category] || event.category}
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Modal de contacto */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-brand-lime flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-brand-navy" />
                </div>
                <h3 className="text-2xl font-extrabold mb-2">¡Mensaje enviado!</h3>
                <p className="text-muted-foreground mb-6">Los organizadores se pondrán en contacto con vos pronto.</p>
                <Button
                  onClick={() => {
                    setShowContactForm(false)
                    setSubmitted(false)
                    setContactForm({ name: "", email: "", phone: "", message: "" })
                  }}
                  className="rounded-full"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold mb-1">
                  {contactType === "info" && "Solicitar información"}
                  {contactType === "sponsor" && "Auspiciar evento"}
                  {contactType === "stand" && "Solicitar stand"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{event.title}</p>

                <div className="space-y-4">
                  <FormField label="Nombre completo *">
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className={inputClass}
                      placeholder="Tu nombre"
                    />
                  </FormField>
                  <FormField label="Correo electrónico *">
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className={inputClass}
                      placeholder="tu@email.com"
                    />
                  </FormField>
                  <FormField label="Teléfono">
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className={inputClass}
                      placeholder="+595 xxx xxx xxx"
                    />
                  </FormField>
                  <FormField label="Mensaje">
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      className={cn(inputClass, "h-auto py-3 resize-none")}
                      placeholder="Escribí tu consulta..."
                    />
                  </FormField>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 h-12 rounded-full"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleContactSubmit}
                    className="flex-1 h-12 rounded-full"
                    disabled={submitting || !contactForm.name || !contactForm.email}
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-brand-lime/30 focus:border-brand-lime transition-all"

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof Users }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </h2>
  )
}
