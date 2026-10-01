"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Send, CheckCircle, ImagePlus, MapPin, X, Save, Check, Clock, Loader2, Sparkles, RotateCcw, Star, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { departmentsList, getCities, southAmericanCountries } from "@/lib/paraguay-data"
import { categoryColors } from "@/lib/events-data"
import { compressImage } from "@/lib/image-utils"
import { extractFromFlyerFile, type FlyerData } from "@/lib/flyer-extract"
import { EVENTOS_AGRO_WHATSAPP, PREMIUM_BENEFITS, PREMIUM_PRICE_LABEL, whatsappLink } from "@/lib/site-config"

const DRAFT_KEY = "draft_publicar_evento"

const STEPS = [
  { title: "Tu evento", subtitle: "Flyer, nombre y categoría" },
  { title: "Cuándo y dónde", subtitle: "Fecha, hora y lugar" },
  { title: "Detalles y contacto", subtitle: "Descripción y tus datos" },
] as const
const TOTAL_STEPS = STEPS.length

const categories = [
  { value: "agricultura", label: "Agricultura" },
  { value: "ganaderia", label: "Ganadería" },
  { value: "forestal", label: "Forestal" },
  { value: "sostenibilidad", label: "Sostenibilidad" },
  { value: "capacitaciones", label: "Capacitaciones" },
  { value: "feria", label: "Feria" },
  { value: "congreso", label: "Congreso" },
  { value: "workshop", label: "Workshop" },
  { value: "webinar", label: "Webinar" },
  { value: "dia_de_campo", label: "Día de Campo" },
  { value: "ambiental", label: "Ambiental" },
]

interface DraftState {
  step: number
  eventName: string
  eventDate: string
  eventEndDate: string
  isMultiDay: boolean
  eventTime: string
  eventCategory: string
  eventLocation: string
  eventDepartment: string
  eventCity: string
  eventMapsUrl: string
  eventDescription: string
  contactName: string
  contactEmail: string
  contactPhone: string
  wantsPremium: boolean
}

const emptyDraft = (): DraftState => ({
  step: 1,
  eventName: "",
  eventDate: new Date().toISOString().split("T")[0],
  eventEndDate: "",
  isMultiDay: false,
  eventTime: "09:00",
  eventCategory: "",
  eventLocation: "",
  eventDepartment: "",
  eventCity: "",
  eventMapsUrl: "",
  eventDescription: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  wantsPremium: false,
})

// Campos del flyer -> campos del borrador (para marcar lo completado y lo que hay que revisar)
const flyerToDraft: Partial<Record<keyof FlyerData, (keyof DraftState)[]>> = {
  title: ["eventName"],
  category: ["eventCategory"],
  date: ["eventDate"],
  end_date: ["eventEndDate"],
  time: ["eventTime"],
  location: ["eventLocation"],
  department: ["eventDepartment"],
  city: ["eventCity"],
  maps_url: ["eventMapsUrl"],
  description: ["eventDescription"],
  long_description: ["eventDescription"],
  contact_phone: ["contactPhone"],
  contact_email: ["contactEmail"],
}

const fieldClass =
  "w-full h-12 px-4 rounded-xl border border-border bg-card text-base placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-brand-lime/30 focus:border-brand-lime transition-all disabled:opacity-50"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function PublicarEventoPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<DraftState>(emptyDraft())
  const [hasDraft, setHasDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventImage, setEventImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // Lectura automatica del flyer
  const [readingFlyer, setReadingFlyer] = useState(false)
  const [flyerError, setFlyerError] = useState<string | null>(null)
  const [filledFields, setFilledFields] = useState<Set<keyof DraftState>>(new Set())
  const [reviewFields, setReviewFields] = useState<Set<keyof DraftState>>(new Set())

  // Restaurar borrador. Los borradores del formulario viejo (9 pasos) se adaptan a los 3 pasos nuevos.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DraftState>
        setDraft({ ...emptyDraft(), ...parsed, step: Math.min(Math.max(parsed.step ?? 1, 1), TOTAL_STEPS) })
        setHasDraft(true)
      }
    } catch {}
  }, [])

  // Autoguardado del borrador en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftSaved(true)
      const t = setTimeout(() => setDraftSaved(false), 1500)
      return () => clearTimeout(t)
    } catch {}
  }, [draft])

  const update = (fields: Partial<DraftState>) => {
    setDraft((prev) => ({ ...prev, ...fields }))
    const keys = Object.keys(fields) as (keyof DraftState)[]
    if (keys.some((k) => filledFields.has(k) || reviewFields.has(k))) {
      setFilledFields((prev) => new Set([...prev].filter((k) => !keys.includes(k))))
      setReviewFields((prev) => new Set([...prev].filter((k) => !keys.includes(k))))
    }
  }

  // Marca de cada campo: "Del flyer" o "Revisar"
  const flag = (key: keyof DraftState): "ai" | "review" | undefined =>
    reviewFields.has(key) ? "review" : filledFields.has(key) ? "ai" : undefined

  const readFlyer = async (file: File) => {
    setReadingFlyer(true)
    setFlyerError(null)
    try {
      const data = await extractFromFlyerFile(file)
      const fields: Partial<DraftState> = {}
      if (data.title) fields.eventName = data.title
      if (data.category) fields.eventCategory = data.category
      if (data.date) fields.eventDate = data.date
      if (data.end_date) {
        fields.isMultiDay = true
        fields.eventEndDate = data.end_date
      }
      if (data.time) fields.eventTime = data.time
      if (data.location) fields.eventLocation = data.location
      if (data.department) fields.eventDepartment = data.department
      if (data.city) fields.eventCity = data.city
      if (data.maps_url) fields.eventMapsUrl = data.maps_url
      const description = data.long_description || data.description
      if (description) fields.eventDescription = description
      if (data.contact_phone) fields.contactPhone = data.contact_phone
      if (data.contact_email) fields.contactEmail = data.contact_email

      const filled = Object.keys(fields).filter((k) => k !== "isMultiDay") as (keyof DraftState)[]
      if (filled.length === 0) {
        setFlyerError("No encontramos datos del evento en esta imagen. Completalos a mano.")
        return
      }
      const review = new Set<keyof DraftState>()
      for (const f of data.uncertain_fields) for (const k of flyerToDraft[f as keyof FlyerData] || []) review.add(k)
      // Lo obligatorio que el flyer no trae tambien queda para revisar
      if (!data.date) review.add("eventDate")
      if (!data.location) review.add("eventLocation")
      if (!data.department) review.add("eventDepartment")
      if (!data.city) review.add("eventCity")

      setDraft((prev) => ({ ...prev, ...fields }))
      setFilledFields(new Set(filled))
      setReviewFields(review)
    } catch (err: any) {
      setFlyerError(err?.message ?? "No se pudo leer el flyer. Completá los datos a mano.")
    } finally {
      setReadingFlyer(false)
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setDraft(emptyDraft())
    setEventImage(null)
    setImagePreview(null)
    setHasDraft(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
      readFlyer(file)
    }
  }

  const stepIsValid = (step: number) => {
    switch (step) {
      case 1:
        return draft.eventName.trim().length >= 3 && draft.eventCategory !== ""
      case 2:
        return (
          draft.eventDate !== "" &&
          (!draft.isMultiDay || (draft.eventEndDate !== "" && draft.eventEndDate >= draft.eventDate)) &&
          draft.eventLocation.trim().length >= 3 &&
          draft.eventDepartment !== "" &&
          draft.eventCity !== ""
        )
      case 3:
        return (
          draft.eventDescription.trim().length >= 10 &&
          draft.contactName.trim().length >= 2 &&
          isValidEmail(draft.contactEmail) &&
          draft.contactPhone.replace(/\D/g, "").length >= 6
        )
      default:
        return false
    }
  }

  const goToStep = (step: number) => {
    update({ step })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const handleNext = () => {
    if (draft.step < TOTAL_STEPS) goToStep(draft.step + 1)
  }
  const handleBack = () => {
    if (draft.step > 1) goToStep(draft.step - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createBrowserClient()
      let imageUrl = null

      if (eventImage) {
        const compressed = await compressImage(eventImage, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
        const { error: uploadError } = await supabase.storage.from("event-images").upload(fileName, compressed)
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("event-images").getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      const row = {
        event_name: draft.eventName.trim(),
        description: draft.eventDescription.trim(),
        event_date: draft.eventDate,
        end_date: draft.isMultiDay && draft.eventEndDate ? draft.eventEndDate : null,
        event_time: draft.eventTime,
        location: draft.eventLocation.trim(),
        department: draft.eventDepartment || null,
        city: draft.eventCity || null,
        maps_url: draft.eventMapsUrl.trim() || null,
        category: draft.eventCategory,
        contact_email: draft.contactEmail.trim(),
        contact_phone: draft.contactPhone.trim(),
        contact_name: draft.contactName.trim(),
        image_url: imageUrl,
        status: "pending",
      }

      let { error: insertError } = await supabase.from("event_submissions").insert({ ...row, wants_premium: draft.wantsPremium })
      if (insertError && /wants_premium/.test(insertError.message)) {
        // Base sin scripts/019 aplicado: se guarda igual y el pedido de destacado queda en la descripcion
        const note = draft.wantsPremium ? `[SOLICITA EVENTO DESTACADO - ${PREMIUM_PRICE_LABEL}]\n\n` : ""
        ;({ error: insertError } = await supabase.from("event_submissions").insert({ ...row, description: note + row.description }))
      }

      if (insertError) throw new Error(insertError.message)

      localStorage.removeItem(DRAFT_KEY)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message ?? "Hubo un error al enviar. Por favor intentá de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-brand-lime rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-brand-navy" />
        </div>
        <p className="eyebrow mb-2">¡Listo!</p>
        <h2 className="text-3xl font-extrabold mb-3">Recibimos tu evento</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Nuestro equipo lo va a revisar y te avisamos a {draft.contactEmail || "tu correo"} cuando esté publicado.
        </p>
        {draft.wantsPremium && (
          <div className="mb-6 w-full max-w-sm rounded-2xl border border-brand-lime/60 bg-brand-lime/10 p-5 text-left">
            <p className="flex items-center gap-2 font-bold">
              <Star className="h-4 w-4 fill-current text-primary" />
              Pediste el evento destacado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escribinos por WhatsApp para coordinar el pago de {PREMIUM_PRICE_LABEL}. Apenas lo confirmemos, lo publicamos como destacado.
            </p>
            <a
              href={whatsappLink(
                EVENTOS_AGRO_WHATSAPP,
                `Hola! Cargué el evento "${draft.eventName.trim()}" en Eventos Agro y quiero publicarlo como destacado (${PREMIUM_PRICE_LABEL}). ¿Cómo hago el pago?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-lime font-bold text-brand-navy hover:bg-brand-lime-dark"
            >
              <MessageCircle className="h-5 w-5" />
              Coordinar pago por WhatsApp
            </a>
          </div>
        )}
        <Button onClick={() => router.push("/")} variant={draft.wantsPremium ? "outline" : "default"} className="w-full max-w-xs h-12 rounded-full">
          Volver al inicio
        </Button>
      </div>
    )
  }

  const step = draft.step
  const canProceed = stepIsValid(step)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="flex items-center">
            <img src="/logo-claro.png" alt="Eventos Agro" className="h-8 w-auto dark:hidden" />
            <img src="/logo.png" alt="Eventos Agro" className="h-8 w-auto hidden dark:block" />
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {draftSaved ? (
              <span className="flex items-center gap-1 text-primary">
                <Save className="h-3.5 w-3.5" /> Borrador guardado
              </span>
            ) : (
              hasDraft && (
                <button onClick={clearDraft} className="underline underline-offset-2 hover:text-destructive">
                  Empezar de cero
                </button>
              )
            )}
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:text-foreground"
              aria-label="Salir"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0">
            <p className="eyebrow mb-2">Publicar evento · gratis</p>
            <h1 className="text-3xl font-extrabold lg:text-4xl">Sumá tu evento al calendario del agro</h1>

            {/* Stepper */}
            <ol className="mt-6 grid grid-cols-3 gap-2">
              {STEPS.map((s, i) => {
                const n = i + 1
                const done = n < step
                const current = n === step
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => done && goToStep(n)}
                      disabled={!done}
                      className="w-full text-left disabled:cursor-default"
                    >
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-colors",
                          done || current ? "bg-brand-lime" : "bg-border",
                        )}
                      />
                      <div className="mt-2 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            done
                              ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                              : current
                                ? "bg-brand-lime text-brand-navy"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="h-3 w-3" /> : n}
                        </span>
                        <span
                          className={cn(
                            "truncate text-xs font-semibold sm:text-sm",
                            current ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {s.title}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* Contenido del paso */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-extrabold">{STEPS[step - 1].title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{STEPS[step - 1].subtitle}</p>

              {step === 1 && (
                <div className="space-y-6">
                  <Field label="Flyer del evento" hint="Opcional, pero te ahorra tipear: completamos fecha, lugar y descripción desde la imagen.">
                    {imagePreview ? (
                      <div className="relative overflow-hidden rounded-xl border border-border">
                        <img src={imagePreview} alt="Flyer" className="max-h-80 w-full object-contain bg-muted" />
                        <button
                          type="button"
                          onClick={() => {
                            setEventImage(null)
                            setImagePreview(null)
                          }}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy/80 text-white hover:bg-brand-navy"
                          aria-label="Quitar flyer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/20 bg-background px-4 text-center transition-colors hover:border-brand-lime">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                        <span className="font-semibold">Subí el flyer</span>
                        <span className="text-xs text-muted-foreground">Leemos el flyer y completamos el resto por vos</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                    <FlyerStatus
                      reading={readingFlyer}
                      error={flyerError}
                      filled={filledFields.size + reviewFields.size}
                      review={reviewFields.size}
                      onRetry={eventImage ? () => readFlyer(eventImage) : undefined}
                    />
                  </Field>

                  <Field label="Nombre del evento" flag={flag("eventName")}>
                    <input
                      autoFocus
                      value={draft.eventName}
                      onChange={(e) => update({ eventName: e.target.value })}
                      placeholder="Ej: Feria Ganadera Regional"
                      className={fieldClass}
                    />
                  </Field>

                  <Field label="Categoría" flag={flag("eventCategory")}>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const active = draft.eventCategory === cat.value
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => update({ eventCategory: cat.value })}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                              active
                                ? "border-brand-navy bg-brand-navy text-white dark:border-brand-lime dark:bg-brand-lime dark:text-brand-navy"
                                : "border-border bg-background hover:border-foreground/30",
                            )}
                          >
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={draft.isMultiDay ? "Fecha de inicio" : "Fecha"} flag={flag("eventDate")}>
                      <input
                        type="date"
                        value={draft.eventDate}
                        onChange={(e) => update({ eventDate: e.target.value })}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Hora de inicio" flag={flag("eventTime")}>
                      <input
                        type="time"
                        value={draft.eventTime}
                        onChange={(e) => update({ eventTime: e.target.value })}
                        className={fieldClass}
                      />
                    </Field>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
                    <div>
                      <p className="font-semibold">Dura más de un día</p>
                      <p className="text-xs text-muted-foreground">Ferias, exposiciones o congresos</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft.isMultiDay}
                      onChange={(e) =>
                        update({ isMultiDay: e.target.checked, eventEndDate: e.target.checked ? draft.eventEndDate : "" })
                      }
                      className="h-5 w-5 accent-[var(--brand-olive)]"
                    />
                  </label>

                  {draft.isMultiDay && (
                    <Field label="Fecha de finalización" flag={flag("eventEndDate")}>
                      <input
                        type="date"
                        value={draft.eventEndDate}
                        onChange={(e) => update({ eventEndDate: e.target.value })}
                        min={draft.eventDate}
                        className={fieldClass}
                      />
                    </Field>
                  )}

                  <Field label="Lugar" flag={flag("eventLocation")}>
                    <input
                      value={draft.eventLocation}
                      onChange={(e) => update({ eventLocation: e.target.value })}
                      placeholder="Ej: Centro de Convenciones Mariscal"
                      className={fieldClass}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Departamento" flag={flag("eventDepartment")}>
                      <select
                        value={draft.eventDepartment}
                        onChange={(e) => update({ eventDepartment: e.target.value, eventCity: "" })}
                        className={fieldClass}
                      >
                        <option value="">Seleccionar</option>
                        <optgroup label="Paraguay">
                          {departmentsList.map((dep) => (
                            <option key={dep} value={dep}>
                              {dep}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Fuera de Paraguay">
                          <option value="Internacional">Internacional</option>
                        </optgroup>
                      </select>
                    </Field>
                    <Field label={draft.eventDepartment === "Internacional" ? "País" : "Ciudad"} flag={flag("eventCity")}>
                      <select
                        value={draft.eventCity}
                        onChange={(e) => update({ eventCity: e.target.value })}
                        className={fieldClass}
                        disabled={!draft.eventDepartment}
                      >
                        <option value="">{draft.eventDepartment === "Internacional" ? "Seleccionar país" : "Seleccionar ciudad"}</option>
                        {draft.eventDepartment === "Internacional"
                          ? southAmericanCountries.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))
                          : draft.eventDepartment &&
                            getCities(draft.eventDepartment).map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Link de Google Maps" hint="Opcional" flag={flag("eventMapsUrl")}>
                    <input
                      value={draft.eventMapsUrl}
                      onChange={(e) => update({ eventMapsUrl: e.target.value })}
                      placeholder="https://maps.app.goo.gl/..."
                      className={fieldClass}
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <Field label="Descripción" hint="Contá de qué trata, las actividades y a quién está dirigido." flag={flag("eventDescription")}>
                    <textarea
                      value={draft.eventDescription}
                      onChange={(e) => update({ eventDescription: e.target.value })}
                      rows={6}
                      placeholder="Ej: Jornada de campo con demostraciones de maquinaria, charlas técnicas y almuerzo de camaradería..."
                      className={cn(fieldClass, "h-auto resize-none py-3")}
                    />
                  </Field>

                  <div className="border-t border-border pt-6">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Tus datos de contacto. Los usamos para avisarte cuando el evento esté publicado.
                    </p>
                    <div className="space-y-4">
                      <Field label="Tu nombre">
                        <input
                          value={draft.contactName}
                          onChange={(e) => update({ contactName: e.target.value })}
                          placeholder="Nombre y apellido"
                          autoComplete="name"
                          className={fieldClass}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email" flag={flag("contactEmail")}>
                          <input
                            type="email"
                            value={draft.contactEmail}
                            onChange={(e) => update({ contactEmail: e.target.value })}
                            placeholder="tu@email.com"
                            autoComplete="email"
                            className={fieldClass}
                          />
                        </Field>
                        <Field label="Teléfono / WhatsApp" flag={flag("contactPhone")}>
                          <input
                            type="tel"
                            value={draft.contactPhone}
                            onChange={(e) => update({ contactPhone: e.target.value })}
                            placeholder="+595 981 123456"
                            autoComplete="tel"
                            className={fieldClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <PremiumOption checked={draft.wantsPremium} onChange={(v) => update({ wantsPremium: v })} />

                  {/* Resumen en mobile (en desktop se ve la vista previa al costado) */}
                  <div className="lg:hidden">
                    <EventPreview draft={draft} imagePreview={imagePreview} compact />
                  </div>
                </div>
              )}
            </div>

            {/* Acciones (fijas abajo en mobile) */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
              {error && <p className="mb-3 text-center text-sm text-destructive">{error}</p>}
              <div className="mx-auto flex max-w-6xl gap-3">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack} className="h-12 rounded-full px-5">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Atrás
                  </Button>
                )}
                {step < TOTAL_STEPS ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="h-12 flex-1 rounded-full bg-brand-navy text-base text-white hover:bg-brand-navy/90 dark:bg-brand-lime dark:text-brand-navy dark:hover:bg-brand-lime-dark lg:flex-none lg:px-8"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed || isSubmitting}
                    className="h-12 flex-1 rounded-full bg-brand-navy text-base text-white hover:bg-brand-navy/90 dark:bg-brand-lime dark:text-brand-navy dark:hover:bg-brand-lime-dark lg:flex-none lg:px-8"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar evento <Send className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground lg:text-left">
                Los eventos se revisan antes de publicarse.
              </p>
            </div>
          </div>

          {/* Vista previa en vivo (solo desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="eyebrow mb-3">Vista previa</p>
              <EventPreview draft={draft} imagePreview={imagePreview} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  hint,
  flag,
  children,
}: {
  label: string
  hint?: string
  flag?: "ai" | "review"
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        {label}
        {flag === "ai" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" />
            Del flyer
          </span>
        )}
        {flag === "review" && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Revisar
          </span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function PremiumOption({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border-2 p-5 text-left transition-colors",
        checked ? "border-brand-lime bg-brand-lime/10" : "border-border bg-background hover:border-brand-lime/60",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            checked ? "border-brand-lime bg-brand-lime text-brand-navy" : "border-foreground/30",
          )}
        >
          {checked && <Check className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-extrabold">
              <Star className="h-4 w-4 fill-current text-primary" />
              Quiero que mi evento sea destacado
            </p>
            <span className="rounded-full bg-brand-navy px-3 py-1 text-sm font-bold text-white dark:bg-brand-lime dark:text-brand-navy">
              {PREMIUM_PRICE_LABEL}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {PREMIUM_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Opcional. Coordinamos el pago por WhatsApp y lo activamos apenas lo confirmamos.
          </p>
        </div>
      </div>
    </button>
  )
}

function FlyerStatus({
  reading,
  error,
  filled,
  review,
  onRetry,
}: {
  reading: boolean
  error: string | null
  filled: number
  review: number
  onRetry?: () => void
}) {
  if (reading) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-lime/50 bg-brand-lime/10 p-3 text-sm">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        <span className="font-semibold">Leyendo el flyer y completando los datos...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <span className="flex-1">{error}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2">
            <RotateCcw className="h-3 w-3" />
            Reintentar
          </button>
        )}
      </div>
    )
  }
  if (filled === 0) return null
  return (
    <div className="mt-3 flex flex-wrap items-start gap-2 rounded-xl border border-brand-lime/50 bg-brand-lime/10 p-3 text-sm">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1">
        <strong>Listo, completamos los datos desde el flyer.</strong>{" "}
        {review > 0 ? 'Revisá los marcados con "Revisar" en los próximos pasos.' : "Revisalos antes de enviar."}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Volver a leer
        </button>
      )}
    </div>
  )
}

// Tarjeta con el estilo de la pagina de evento, para que quien carga vea como va a quedar
function EventPreview({
  draft,
  imagePreview,
  compact = false,
}: {
  draft: DraftState
  imagePreview: string | null
  compact?: boolean
}) {
  const category = categories.find((c) => c.value === draft.eventCategory)
  const start = draft.eventDate ? new Date(`${draft.eventDate}T12:00:00`) : null
  const end = draft.isMultiDay && draft.eventEndDate ? new Date(`${draft.eventEndDate}T12:00:00`) : null
  const fmt = (d: Date) =>
    d
      .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
      .replace(/^./, (c) => c.toUpperCase())
  const place = [...new Set([draft.eventCity, draft.eventDepartment].filter(Boolean))].join(", ")

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
      {!compact &&
        (imagePreview ? (
          <img src={imagePreview} alt="" className="block max-h-[380px] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-brand-navy text-white/60">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">Acá va tu flyer</span>
          </div>
        ))}
      <div className="space-y-3 p-5">
        {category && (
          <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", categoryColors[category.value])}>
            {category.label}
          </span>
        )}
        <p className={cn("font-extrabold leading-tight", compact ? "text-lg" : "text-2xl")}>
          {draft.eventName.trim() || "Nombre del evento"}
        </p>
        {start && (
          <div className="flex items-center gap-3">
            <div className="w-11 shrink-0 overflow-hidden rounded-lg border border-border text-center">
              <div className="bg-muted py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground">
                {start.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase()}
              </div>
              <div className="py-0.5 text-base font-extrabold leading-none">{start.getDate()}</div>
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">
                {fmt(start)}
                {end ? ` — ${fmt(end)}` : ""}
              </p>
              {draft.eventTime && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {draft.eventTime} hs
                </p>
              )}
            </div>
          </div>
        )}
        {(draft.eventLocation || place) && (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold truncate">{draft.eventLocation || "Lugar"}</p>
              {place && <p className="text-muted-foreground">{place}</p>}
            </div>
          </div>
        )}
        {!compact && draft.eventDescription.trim() && (
          <p className="line-clamp-4 border-t border-border pt-3 text-sm text-muted-foreground whitespace-pre-line">
            {draft.eventDescription}
          </p>
        )}
      </div>
    </div>
  )
}
