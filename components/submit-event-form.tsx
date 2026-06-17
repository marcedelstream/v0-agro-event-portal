"use client"
import { useState } from "react"
import type React from "react"

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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { departmentsList, getCities } from "@/lib/paraguay-data"
import { compressImage } from "@/lib/image-utils"

interface SubmitEventFormProps {
  onClose: () => void
  selectedDate: Date
}

const TOTAL_STEPS = 9

const categories = [
  { value: "agricultura", label: "Agricultura" },
  { value: "ganaderia", label: "Ganaderia" },
  { value: "forestal", label: "Forestal" },
  { value: "sostenibilidad", label: "Sostenibilidad" },
  { value: "capacitaciones", label: "Capacitaciones" },
  { value: "feria", label: "Feria" },
  { value: "congreso", label: "Congreso" },
  { value: "workshop", label: "Workshop" },
  { value: "webinar", label: "Webinar" },
  { value: "dia_de_campo", label: "Dia de Campo" },
  { value: "ambiental", label: "Ambiental" },
]

export function SubmitEventForm({ onClose, selectedDate }: SubmitEventFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState(selectedDate.toISOString().split("T")[0])
  const [eventTime, setEventTime] = useState("09:00")
  const [eventCategory, setEventCategory] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [eventDepartment, setEventDepartment] = useState("")
  const [eventCity, setEventCity] = useState("")
  const [eventMapsUrl, setEventMapsUrl] = useState("")
  const [eventImage, setEventImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [eventEndDate, setEventEndDate] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEventImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setEventImage(null)
    setImagePreview(null)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return eventName.trim().length >= 3
      case 2: return eventDate !== "" && (!isMultiDay || eventEndDate !== "")
      case 3: return eventCategory !== ""
      case 4: return eventLocation.trim().length >= 3 && eventDepartment !== "" && eventCity !== ""
      case 5: return eventDescription.trim().length >= 10
      case 6: return contactEmail.includes("@")
      case 7: return contactPhone.length >= 6
      case 8: return true
      case 9: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createBrowserClient()
      let imageUrl = null

      if (eventImage) {
        // Comprimir imagen antes de subir (max 1200px, calidad 85%)
        const compressedImage = await compressImage(eventImage, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        })
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

        const { error: uploadError } = await supabase.storage.from("event-images").upload(fileName, compressedImage)

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      const { error: insertError } = await supabase.from("event_submissions").insert({
        event_name: eventName,
        description: eventDescription,
        event_date: eventDate,
        end_date: isMultiDay && eventEndDate ? eventEndDate : null,
        event_time: eventTime,
        location: eventLocation,
        department: eventDepartment || null,
        city: eventCity || null,
        maps_url: eventMapsUrl || null,
        category: eventCategory,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_name: eventName,
        image_url: imageUrl,
        status: "pending",
      })

      if (insertError) throw new Error(insertError.message)

      setIsSubmitted(true)
    } catch (err: any) {
      console.error("Error submitting event:", err)
      setError(err?.message ?? "Hubo un error al enviar. Por favor intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Evento recibido</h2>
          <p className="text-muted-foreground mb-8 max-w-xs">
            Gracias por enviar tu evento. Nuestro equipo lo revisará y te notificaremos cuando esté aprobado.
          </p>
          <Button onClick={onClose} className="w-full max-w-xs">
            Volver al calendario
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="border-b border-border p-4 flex items-center justify-between shrink-0">
        <button
          onClick={step === 1 ? onClose : handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">{step === 1 ? "Cancelar" : "Atrás"}</span>
        </button>
        <span className="text-sm text-muted-foreground">
          Paso {step} de {TOTAL_STEPS}
        </span>
      </div>

      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nombre del evento</h2>
            <p className="text-muted-foreground text-sm mb-6">Escribe el nombre de tu evento agro</p>
            <Input
              autoFocus
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ej: Feria Ganadera Regional"
              className="text-lg h-14"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Fecha y hora</h2>
            <p className="text-muted-foreground text-sm mb-6">Selecciona cuando sera el evento</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Fecha de inicio</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-12 text-base w-full"
                />
              </div>

              {/* Checkbox para evento de mas de un dia */}
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={(e) => {
                    setIsMultiDay(e.target.checked)
                    if (!e.target.checked) setEventEndDate("")
                  }}
                  className="w-5 h-5 rounded border-2 border-border accent-primary"
                />
                <div>
                  <p className="font-medium">El evento dura mas de un dia</p>
                  <p className="text-xs text-muted-foreground">Marca esta opcion si es una feria o exposicion de varios dias</p>
                </div>
              </label>

              {/* Fecha fin - solo visible si isMultiDay */}
              {isMultiDay && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm text-muted-foreground mb-2 block">Fecha de finalizacion</label>
                  <Input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    min={eventDate}
                    className="h-12 text-base w-full"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Hora de inicio</label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="h-12 text-base w-full"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Categoría</h2>
            <p className="text-muted-foreground text-sm mb-6">Selecciona el tipo de evento</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setEventCategory(cat.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    eventCategory === cat.value
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

        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ubicación</h2>
            <p className="text-muted-foreground text-sm mb-6">Dónde se realizará el evento</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nombre del lugar</label>
                <Input
                  autoFocus
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ej: Centro de Convenciones Mariscal"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Departamento</label>
                <select
                  value={eventDepartment}
                  onChange={(e) => { setEventDepartment(e.target.value); setEventCity("") }}
                  className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
                >
                  <option value="">Seleccionar departamento</option>
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Ciudad</label>
                <select
                  value={eventCity}
                  onChange={(e) => setEventCity(e.target.value)}
                  className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
                  disabled={!eventDepartment}
                >
                  <option value="">Seleccionar ciudad</option>
                  {eventDepartment && getCities(eventDepartment).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Descripción</h2>
            <p className="text-muted-foreground text-sm mb-6">Cuéntanos de qué trata el evento</p>
            <Textarea
              autoFocus
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Describe brevemente el evento, sus actividades principales y a quién está dirigido..."
              className="flex-1 min-h-[150px] text-base resize-none"
            />
          </div>
        )}

        {step === 6 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu correo</h2>
            <p className="text-muted-foreground text-sm mb-6">Te contactaremos cuando tu evento esté aprobado</p>
            <Input
              autoFocus
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="tu@email.com"
              className="text-lg h-14"
            />
          </div>
        )}

        {step === 7 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu teléfono</h2>
            <p className="text-muted-foreground text-sm mb-6">Número de contacto para coordinar detalles</p>
            <Input
              autoFocus
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+595 981 123456"
              className="text-lg h-14"
            />
          </div>
        )}

        {step === 8 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Imagen del evento</h2>
            <p className="text-muted-foreground text-sm mb-2">Sube una imagen promocional (opcional)</p>
            <p className="text-xs text-primary mb-6">Medida recomendada: 1200 x 630 px</p>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors min-h-[200px]">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <span className="text-sm text-muted-foreground">Toca para seleccionar imagen</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        )}

        {step === 9 && (
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Link de Google Maps</h2>
            <p className="text-muted-foreground text-sm mb-6">Agrega un enlace al lugar del evento (opcional)</p>
            <Input
              autoFocus
              value={eventMapsUrl}
              onChange={(e) => setEventMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="text-lg h-14"
            />
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 shrink-0">
        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
        {step < TOTAL_STEPS ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="w-full h-12 text-base">
            Continuar
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="w-full h-12 text-base">
            {isSubmitting ? "Enviando..." : (
              <>
                Enviar evento
                <Send className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        )}
        <p className="text-xs text-muted-foreground text-center mt-3">Los eventos son revisados antes de publicarse</p>
      </div>
    </div>
  )
}
