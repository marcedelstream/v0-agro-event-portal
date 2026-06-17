"use client"

import { useState } from "react"
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  CheckCircle,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@/lib/supabase/client"

interface SubmitProviderFormProps {
  onClose: () => void
}

const steps = [
  { id: 1, title: "Nombre", icon: Building2 },
  { id: 2, title: "Categoría", icon: Tag },
  { id: 3, title: "Ubicación", icon: MapPin },
  { id: 4, title: "Contacto", icon: Phone },
  { id: 5, title: "Descripción", icon: FileText },
  { id: 6, title: "Confirmación", icon: CheckCircle },
]

const providerCategories = [
  { value: "audiovisual", label: "Audiovisual" },
  { value: "catering", label: "Catering" },
  { value: "decoracion", label: "Decoración" },
  { value: "stands", label: "Stands" },
  { value: "logistica", label: "Logística" },
  { value: "seguridad", label: "Seguridad" },
]

export function SubmitProviderForm({ onClose }: SubmitProviderFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  })

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 3
      case 2:
        return formData.category !== ""
      case 3:
        return formData.location.trim().length >= 3
      case 4:
        return formData.email.includes("@") && formData.phone.length >= 6
      case 5:
        return formData.description.trim().length >= 10
      default:
        return true
    }
  }

  const submitForm = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { error: insertError } = await supabase.from("provider_submissions").insert({
        business_name: formData.name,
        category: formData.category,
        contact_email: formData.email,
        contact_phone: formData.phone,
        contact_name: formData.name,
        website: formData.website || null,
        description: formData.description,
        status: "pending",
      })

      if (insertError) throw insertError

      setCurrentStep(6) // Success step
    } catch (err) {
      console.error("Error submitting provider:", err)
      setError("Hubo un error al enviar. Por favor intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 5 && canProceed()) {
      submitForm()
    } else if (currentStep < steps.length && canProceed()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">Registrar Proveedor</span>
        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Paso {currentStep} de {steps.length}
          </span>
          <span className="text-xs text-muted-foreground">{steps[currentStep - 1].title}</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">Nombre del negocio o empresa</h2>
            <p className="text-sm text-muted-foreground text-center">Ingresa el nombre de tu empresa o negocio</p>
            <Input
              placeholder="Ej: AudioPro Eventos"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className="text-lg py-6"
              autoFocus
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <Tag className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">Categoría del proveedor</h2>
            <p className="text-sm text-muted-foreground text-center">Selecciona la categoría principal</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {providerCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => updateFormData("category", cat.value)}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    formData.category === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">Ubicación</h2>
            <p className="text-sm text-muted-foreground text-center">Ciudad o zona donde operas</p>
            <Input
              placeholder="Ej: Asunción, Paraguay"
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
              className="text-lg py-6"
              autoFocus
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">Datos de contacto</h2>
            <p className="text-sm text-muted-foreground text-center">Email y teléfono son obligatorios</p>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Teléfono *"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sitio web (opcional)"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-center">Descripción del negocio</h2>
            <p className="text-sm text-muted-foreground text-center">Cuéntanos qué servicios ofreces para eventos</p>
            <Textarea
              placeholder="Describe brevemente tu negocio y servicios para eventos..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Solicitud recibida</h2>
            <p className="text-sm text-muted-foreground">
              Hemos recibido tu solicitud para registrar <strong>{formData.name}</strong> como proveedor.
            </p>
            <p className="text-sm text-muted-foreground">
              Nuestro equipo revisará la información y te notificaremos cuando esté aprobado.
            </p>
            <Button onClick={onClose} className="mt-6 w-full">
              Volver al inicio
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep < 6 && (
        <div className="p-4 border-t border-border flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} className="flex-1 bg-transparent">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          <Button onClick={nextStep} disabled={!canProceed() || isSubmitting} className="flex-1">
            {isSubmitting ? "Enviando..." : currentStep === 5 ? "Enviar" : "Siguiente"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
