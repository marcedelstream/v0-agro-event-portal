"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Star,
  Users,
  Mail,
  Building,
  Share2,
  ExternalLink,
  Phone,
  Navigation,
  ImageIcon,
} from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { GacetillaButton } from "@/components/gacetilla-button"
import { EventGallery } from "@/components/event-gallery"
import { Button } from "@/components/ui/button"
import { categoryLabels, categoryColors } from "@/lib/events-data"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"

interface Event {
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
  banner_image_url?: string
  slug: string
  contact_email?: string
  contact_phone?: string
  allow_contact_form?: boolean
  important_links?: { label: string; url: string }[]
  internal_banner_url?: string
  gacetilla_titulo?: string
  gacetilla_imagen?: string
  gacetilla_texto?: string
}

interface EventoClientPageProps {
  slug: string
}

export function EventoClientPage({ slug }: EventoClientPageProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactType, setContactType] = useState("")
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [galleryImages, setGalleryImages] = useState<{ id: string; image_url: string; caption?: string }[]>([])

  useEffect(() => {
    async function loadEvent() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("is_approved", true)
        .single()

      if (data) {
        const { data: bannerData } = await supabase
          .from("banners")
          .select("image_url")
          .eq("event_id", data.id)
          .eq("is_active", true)
          .single()

        if (bannerData?.image_url) {
          data.banner_image_url = bannerData.image_url
        }

        // Cargar galeria
        const { data: galleryData } = await supabase
          .from("event_gallery")
          .select("id, image_url, caption")
          .eq("event_id", data.id)
          .order("display_order", { ascending: true })
        if (galleryData) setGalleryImages(galleryData)
      }

      setEvent(data)
      setLoading(false)
    }
    loadEvent()
  }, [slug])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl mx-auto px-4">
          <div className="h-8 bg-muted rounded-xl w-1/3" />
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-4">El evento que buscas no existe o fue eliminado</p>
          <Button onClick={() => router.push("/")} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  // Construir la fecha con la hora real del evento para el countdown
  const eventTimeStr = event.time || "00:00"
  const eventDate = new Date(`${event.date}T${eventTimeStr}:00`)
  const endDate = event.end_date ? new Date(event.end_date + "T23:59:00") : null

  const formattedDate = eventDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedEndDate = endDate
    ? endDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const eventDuration = endDate ? Math.ceil((endDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      {event.image_url && (
        <div className="relative h-56 md:h-72 w-full">
          <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          {event.is_premium && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold shadow-lg shadow-yellow-500/30">
              <Star className="h-4 w-4 fill-current" />
              Evento Premium
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 rounded-xl bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!event.image_url && (
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4 rounded-xl -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}

        {/* Header del evento */}
        <div className={cn("space-y-4", event.image_url && "-mt-16 relative z-10")}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-4 py-1.5 rounded-full text-sm font-bold", categoryColors[event.category])}>
              {categoryLabels[event.category] || event.category}
            </span>
            {event.is_premium && !event.image_url && (
              <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-500 text-sm font-bold">
                <Star className="h-4 w-4 fill-current" />
                Premium
              </span>
            )}
            {eventDuration > 1 && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">
                {eventDuration} dias
              </span>
            )}
            {daysUntilEvent < 0 && (
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                Finalizado
              </span>
            )}
          </div>

          <h1
            className={cn(
              "text-3xl md:text-4xl font-bold leading-tight",
              event.is_premium &&
                "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500",
            )}
          >
            {event.title}
          </h1>

          {/* Cuenta regresiva */}
          {daysUntilEvent >= 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
              <CountdownTimer targetDate={eventDate} />
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Fecha</p>
                <p className="font-bold capitalize text-sm">{formattedDate}</p>
                {event.end_date && event.end_date !== event.date && formattedEndDate && (
                  <p className="text-xs text-muted-foreground">hasta {formattedEndDate}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Hora</p>
                <p className="font-bold text-sm">{event.time}</p>
              </div>
            </div>
            {event.maps_url ? (
              <a
                href={event.maps_url.startsWith("http") ? event.maps_url : `https://${event.maps_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20 hover:border-emerald-500/40 hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Ubicacion</p>
                  <p className="font-bold text-sm">{event.location}</p>
                  <p className="text-xs text-emerald-500 mt-0.5">Toca para ver en el mapa</p>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Ubicacion</p>
                  <p className="font-bold text-sm">{event.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Descripcion */}
        <div className="mt-8 p-6 rounded-2xl bg-card border-2 border-border">
          <h2 className="font-bold text-lg mb-3">Acerca del evento</h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {event.long_description || event.description}
          </p>
        </div>

        {/* Banner interno */}
        {event.internal_banner_url && (
          <div className="mt-6">
            <img
              src={event.internal_banner_url || "/placeholder.svg"}
              alt="Banner del evento"
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        )}

        {/* Links importantes */}
        {event.important_links && event.important_links.length > 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-card border-2 border-border">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Links importantes
            </h2>
            <div className="grid gap-2">
              {event.important_links.map((link, i) => {
                const url = link.url.startsWith("http://") || link.url.startsWith("https://") 
                  ? link.url 
                  : `https://${link.url}`
                return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors">{link.label}</span>
                </a>
              )})}
            </div>
          </div>
        )}

        {/* Ponentes */}
        {event.speakers && event.speakers.length > 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-card border-2 border-border">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ponentes
            </h2>
            <div className="grid gap-2">
              {event.speakers.map((speaker, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {speaker.charAt(0)}
                  </div>
                  <span className="font-medium">{speaker}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Galeria de fotos */}
        {galleryImages.length > 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-card border-2 border-border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Galeria de fotos
            </h2>
            <EventGallery images={galleryImages} />
          </div>
        )}

        {/* Gacetilla */}
        {event.gacetilla_texto && (
          <div className="mt-4">
            <GacetillaButton
              titulo={event.gacetilla_titulo || event.title}
              imagen={event.gacetilla_imagen}
              texto={event.gacetilla_texto}
            />
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Te interesa este evento?
          </h2>

          {/* Contacto directo si allow_contact_form es false */}
          {event.allow_contact_form === false && (event.contact_email || event.contact_phone) && (
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <h3 className="font-bold mb-4">Contacto directo del organizador</h3>
              <div className="grid gap-3">
                {event.contact_email && (
                  <a
                    href={`mailto:${event.contact_email}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border-2 border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Email</p>
                      <p className="text-sm text-muted-foreground">{event.contact_email}</p>
                    </div>
                  </a>
                )}
                {event.contact_phone && (
                  <a
                    href={`tel:${event.contact_phone}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border-2 border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Telefono</p>
                      <p className="text-sm text-muted-foreground">{event.contact_phone}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Tarjetas de contacto solo si allow_contact_form es true o undefined */}
            {event.allow_contact_form !== false && (
              <>
                {/* Tarjeta: Mas informacion */}
                <button
                  onClick={() => {
                    setContactType("info")
                    setShowContactForm(true)
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 hover:scale-[1.02] transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Solicitar info</p>
                    <p className="text-xs text-muted-foreground">Conoce mas</p>
                  </div>
                </button>

                {/* Tarjeta: Auspiciar */}
                <button
                  onClick={() => {
                    setContactType("sponsor")
                    setShowContactForm(true)
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/20 hover:border-amber-500/40 hover:scale-[1.02] transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Auspiciar</p>
                    <p className="text-xs text-muted-foreground">Ser patrocinador</p>
                  </div>
                </button>

                {/* Tarjeta: Stand */}
                <button
                  onClick={() => {
                    setContactType("stand")
                    setShowContactForm(true)
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20 hover:border-emerald-500/40 hover:scale-[1.02] transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Quiero stand</p>
                    <p className="text-xs text-muted-foreground">Exhibir productos</p>
                  </div>
                </button>
              </>
            )}

            {/* Tarjeta: Recordar evento */}
            {daysUntilEvent > 0 && (
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.date.replace(/-/g, "")}/${event.end_date ? event.end_date.replace(/-/g, "") : event.date.replace(/-/g, "")}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/20 hover:border-red-500/40 hover:scale-[1.02] transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Recordar evento</p>
                  <p className="text-xs text-muted-foreground">Desde Google Calendar</p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Compartir */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: event.description,
                  url: window.location.href,
                })
              }
            }}
            className="rounded-xl"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir evento
          </Button>
        </div>
      </div>

      {/* Modal de contacto */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Mensaje enviado!</h3>
                <p className="text-muted-foreground mb-6">Los organizadores se pondran en contacto contigo pronto.</p>
                <Button
                  onClick={() => {
                    setShowContactForm(false)
                    setSubmitted(false)
                    setContactForm({ name: "", email: "", phone: "", message: "" })
                  }}
                  className="rounded-xl"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">
                  {contactType === "info" && "Solicitar informacion"}
                  {contactType === "sponsor" && "Auspiciar evento"}
                  {contactType === "stand" && "Solicitar stand"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{event.title}</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nombre completo *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Correo electronico *</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telefono</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="+595 xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Mensaje</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all"
                      placeholder="Escribe tu consulta..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 h-12 rounded-xl"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleContactSubmit}
                    className="flex-1 h-12 rounded-xl"
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
