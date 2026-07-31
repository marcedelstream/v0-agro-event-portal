"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Calendar,
  MapPin,
  Tag,
  FileText,
  Mail,
  CheckCircle,
  Phone,
  ImageIcon,
  X,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { departmentsList, getCities, southAmericanCountries } from "@/lib/paraguay-data"
import { compressImage } from "@/lib/image-utils"

const DRAFT_KEY = "draft_publicar_evento"
const TOTAL_STEPS = 9

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
  contactEmail: string
  contactPhone: string
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
  contactEmail: "",
  contactPhone: "",
})

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

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed: DraftState = JSON.parse(saved)
        setDraft(parsed)
        setHasDraft(true)
      }
    } catch {}
  }, [])

  // Auto-save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftSaved(true)
      const t = setTimeout(() => setDraftSaved(false), 1500)
      return () => clearTimeout(t)
    } catch {}
  }, [draft])

  const update = (fields: Partial<DraftState>) => setDraft((prev) => ({ ...prev, ...fields }))

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
    }
  }

  const canProceed = () => {
    switch (draft.step) {
      case 1: return draft.eventName.trim().length >= 3
      case 2: return draft.eventDate !== "" && (!draft.isMultiDay || draft.eventEndDate !== "")
      case 3: return draft.eventCategory !== ""
      case 4: return draft.eventLocation.trim().length >= 3 && draft.eventDepartment !== "" && draft.eventCity !== ""
      case 5: return draft.eventDescription.trim().length >= 10
      case 6: return draft.contactEmail.includes("@")
      case 7: return draft.contactPhone.length >= 6
      case 8: return true
      case 9: return true
      default: return false
    }
  }

  const handleNext = () => { if (draft.step < TOTAL_STEPS) update({ step: draft.step + 1 }) }
  const handleBack = () => { if (draft.step > 1) update({ step: draft.step - 1 }) }

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
          const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      const { error: insertError } = await supabase.from("event_submissions").insert({
        event_name: draft.eventName,
        description: draft.eventDescription,
        event_date: draft.eventDate,
        end_date: draft.isMultiDay && draft.eventEndDate ? draft.eventEndDate : null,
        event_time: draft.eventTime,
        location: draft.eventLocation,
        department: draft.eventDepartment || null,
        city: draft.eventCity || null,
        maps_url: draft.eventMapsUrl || null,
        category: draft.eventCategory,
        contact_email: draft.contactEmail,
        contact_phone: draft.contactPhone,
        contact_name: draft.eventName,
        image_url: imageUrl,
        status: "pending",
      })

      if (insertError) throw new Error(insertError.message)

      localStorage.removeItem(DRAFT_KEY)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err?.message ?? "Hubo un error al enviar. Por favor intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Evento recibido</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Gracias por enviar tu evento. Nuestro equipo lo revisará y te notificaremos cuando esté aprobado.
        </p>
        <Button onClick={() => router.push("/")} className="w-full max-w-xs">
          Volver al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between shrink-0 sticky top-0 bg-background z-10">
        <button
          onClick={draft.step === 1 ? () => router.push("/") : handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">{draft.step === 1 ? "Cancelar" : "Atrás"}</span>
        </button>
        <span className="text-sm text-muted-foreground font-medium">Paso {draft.step} de {TOTAL_STEPS}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground h-5 w-20 justify-end">
          {draftSaved && (
            <span className="flex items-center gap-1 text-primary animate-in fade-in duration-200">
              <Save className="h-3 w-3" /> Guardado
            </span>
          )}
          {hasDraft && !draftSaved && (
            <button onClick={clearDraft} className="text-muted-foreground hover:text-red-500 underline underline-offset-2">
              Borrar
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-muted shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(draft.step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* Contenido del paso */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">

        {draft.step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nombre del evento</h2>
            <p className="text-muted-foreground text-sm mb-6">Escribe el nombre de tu evento agro</p>
            <Input
              autoFocus
              value={draft.eventName}
              onChange={(e) => update({ eventName: e.target.value })}
              placeholder="Ej: Feria Ganadera Regional"
              className="text-lg h-14"
            />
          </div>
        )}

        {draft.step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Fecha y hora</h2>
            <p className="text-muted-foreground text-sm mb-6">Seleccioná cuándo será el evento</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Fecha de inicio</label>
                <Input
                  type="date"
                  value={draft.eventDate}
                  onChange={(e) => update({ eventDate: e.target.value })}
                  className="h-12 text-base w-full"
                />
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={draft.isMultiDay}
                  onChange={(e) => update({ isMultiDay: e.target.checked, eventEndDate: e.target.checked ? draft.eventEndDate : "" })}
                  className="w-5 h-5 rounded border-2 border-border accent-primary"
                />
                <div>
                  <p className="font-medium">El evento dura más de un día</p>
                  <p className="text-xs text-muted-foreground">Para ferias o exposiciones de varios días</p>
                </div>
              </label>
              {draft.isMultiDay && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm text-muted-foreground mb-2 block">Fecha de finalización</label>
                  <Input
                    type="date"
                    value={draft.eventEndDate}
                    onChange={(e) => update({ eventEndDate: e.target.value })}
                    min={draft.eventDate}
                    className="h-12 text-base w-full"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Hora de inicio</label>
                <Input
                  type="time"
                  value={draft.eventTime}
                  onChange={(e) => update({ eventTime: e.target.value })}
                  className="h-12 text-base w-full"
                />
              </div>
            </div>
          </div>
        )}

        {draft.step === 3 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Categoría</h2>
            <p className="text-muted-foreground text-sm mb-6">Seleccioná el tipo de evento</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => update({ eventCategory: cat.value })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    draft.eventCategory === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {draft.step === 4 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ubicación</h2>
            <p className="text-muted-foreground text-sm mb-6">¿Dónde se realizará el evento?</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nombre del lugar</label>
                <Input
                  autoFocus
                  value={draft.eventLocation}
                  onChange={(e) => update({ eventLocation: e.target.value })}
                  placeholder="Ej: Centro de Convenciones Mariscal"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Departamento / País</label>
                <select
                  value={draft.eventDepartment}
                  onChange={(e) => update({ eventDepartment: e.target.value, eventCity: "" })}
                  className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
                >
                  <option value="">Seleccionar</option>
                  <optgroup label="Paraguay">
                    {departmentsList.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Internacional">
                    <option value="Internacional">Internacional</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {draft.eventDepartment === "Internacional" ? "País" : "Ciudad"}
                </label>
                {draft.eventDepartment === "Internacional" ? (
                  <select
                    value={draft.eventCity}
                    onChange={(e) => update({ eventCity: e.target.value })}
                    className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
                  >
                    <option value="">Seleccionar país</option>
                    {southAmericanCountries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={draft.eventCity}
                    onChange={(e) => update({ eventCity: e.target.value })}
                    className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
                    disabled={!draft.eventDepartment}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {draft.eventDepartment && getCities(draft.eventDepartment).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {draft.step === 5 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Descripción</h2>
            <p className="text-muted-foreground text-sm mb-6">Contanos de qué trata el evento</p>
            <Textarea
              autoFocus
              value={draft.eventDescription}
              onChange={(e) => update({ eventDescription: e.target.value })}
              placeholder="Describí brevemente el evento, sus actividades y a quién está dirigido..."
              className="flex-1 min-h-[150px] text-base resize-none"
            />
          </div>
        )}

        {draft.step === 6 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu correo</h2>
            <p className="text-muted-foreground text-sm mb-6">Te contactaremos cuando tu evento esté aprobado</p>
            <Input
              autoFocus
              type="email"
              value={draft.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
              placeholder="tu@email.com"
              className="text-lg h-14"
            />
          </div>
        )}

        {draft.step === 7 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu teléfono</h2>
            <p className="text-muted-foreground text-sm mb-6">Número de contacto para coordinar detalles</p>
            <Input
              autoFocus
              type="tel"
              value={draft.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder="+595 981 123456"
              className="text-lg h-14"
            />
          </div>
        )}

        {draft.step === 8 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Imagen del evento</h2>
            <p className="text-muted-foreground text-sm mb-2">Subí una imagen promocional (opcional)</p>
            <p className="text-xs text-primary mb-6">Medida recomendada: 1200 × 630 px</p>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button onClick={() => { setEventImage(null); setImagePreview(null) }} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors min-h-[200px]">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <span className="text-sm text-muted-foreground">Tocá para seleccionar imagen</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Si salís y volvés, la imagen deberá seleccionarse de nuevo.
            </p>
          </div>
        )}

        {draft.step === 9 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Link de Google Maps</h2>
            <p className="text-muted-foreground text-sm mb-6">Agregá un enlace al lugar del evento (opcional)</p>
            <Input
              autoFocus
              value={draft.eventMapsUrl}
              onChange={(e) => update({ eventMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="text-lg h-14"
            />
          </div>
        )}
      </div>

      {/* Footer con botón de acción */}
      <div className="border-t border-border p-4 shrink-0 sticky bottom-0 bg-background">
        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
        {draft.step < TOTAL_STEPS ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="w-full h-12 text-base">
            Continuar
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="w-full h-12 text-base">
            {isSubmitting ? "Enviando..." : (
              <>Enviar evento <Send className="h-5 w-5 ml-2" /></>
            )}
          </Button>
        )}
        <p className="text-xs text-muted-foreground text-center mt-3">Los eventos son revisados antes de publicarse</p>
      </div>
    </div>
  )
}
