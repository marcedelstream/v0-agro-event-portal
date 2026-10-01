"use client"

import { useState } from "react"
import { Loader2, Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { extractFromFlyerUrl } from "@/lib/flyer-extract"
import { categoryLabels } from "@/lib/events-data"
import { departmentsList, getCities, southAmericanCountries } from "@/lib/paraguay-data"
import { cn } from "@/lib/utils"
import type { EventSubmission, ImportantLink, Organization, PublishedEvent } from "../_lib/types"
import { stripPremiumNote } from "../_lib/utils"
import { Field, FormSection, ImageUpload, Toggle, inputClass, textareaClass } from "./ui"

export interface EventFormValues {
  title: string
  category: string
  image_url: string | null
  date: string
  end_date: string
  time: string
  location: string
  department: string
  city: string
  maps_url: string
  description: string
  long_description: string
  contact_email: string
  contact_phone: string
  allow_contact_form: boolean
  is_premium: boolean
  organization_id: string
  important_links: ImportantLink[]
  internal_banner_url: string | null
  gacetilla_titulo: string
  gacetilla_texto: string
  gacetilla_imagen: string | null
}

export const emptyEventForm = (): EventFormValues => ({
  title: "",
  category: "agricultura",
  image_url: null,
  date: "",
  end_date: "",
  time: "09:00",
  location: "",
  department: "",
  city: "",
  maps_url: "",
  description: "",
  long_description: "",
  contact_email: "",
  contact_phone: "",
  allow_contact_form: true,
  is_premium: false,
  organization_id: "",
  important_links: [],
  internal_banner_url: null,
  gacetilla_titulo: "",
  gacetilla_texto: "",
  gacetilla_imagen: null,
})

export function formFromSubmission(s: EventSubmission): EventFormValues {
  return {
    ...emptyEventForm(),
    title: s.event_name || "",
    category: s.category || "agricultura",
    image_url: s.image_url,
    date: s.event_date || "",
    end_date: s.end_date || "",
    time: s.event_time || "",
    location: s.location || "",
    department: s.department || "",
    city: s.city || "",
    maps_url: s.maps_url || "",
    description: stripPremiumNote(s.description || ""),
    long_description: stripPremiumNote(s.description || ""),
    contact_email: s.contact_email || "",
    contact_phone: s.contact_phone || "",
  }
}

export function formFromEvent(e: PublishedEvent): EventFormValues {
  return {
    title: e.title || "",
    category: e.category || "agricultura",
    image_url: e.image_url,
    date: e.date || "",
    end_date: e.end_date || "",
    time: e.time || "",
    location: e.location || "",
    department: e.department || "",
    city: e.city || "",
    maps_url: e.maps_url || "",
    description: e.description || "",
    long_description: e.long_description || "",
    contact_email: e.contact_email || "",
    contact_phone: e.contact_phone || "",
    allow_contact_form: e.allow_contact_form !== false,
    is_premium: Boolean(e.is_premium),
    organization_id: e.organization_id || "",
    important_links: e.important_links || [],
    internal_banner_url: e.internal_banner_url,
    gacetilla_titulo: e.gacetilla_titulo || "",
    gacetilla_texto: e.gacetilla_texto || "",
    gacetilla_imagen: e.gacetilla_imagen || null,
  }
}

// Columnas de la tabla events (sin slug ni is_approved, que dependen de la accion)
export function eventRowFromForm(v: EventFormValues) {
  const nullIfEmpty = (s: string) => (s.trim() ? s.trim() : null)
  return {
    title: v.title.trim(),
    category: v.category.trim(),
    image_url: v.image_url || null,
    date: v.date,
    end_date: v.end_date && v.end_date !== v.date ? v.end_date : null,
    time: v.time,
    location: v.location.trim(),
    department: nullIfEmpty(v.department),
    city: nullIfEmpty(v.city),
    maps_url: nullIfEmpty(v.maps_url),
    description: v.description.trim(),
    long_description: nullIfEmpty(v.long_description) ?? v.description.trim(),
    contact_email: nullIfEmpty(v.contact_email),
    contact_phone: nullIfEmpty(v.contact_phone),
    allow_contact_form: v.allow_contact_form,
    is_premium: v.is_premium,
    organization_id: v.organization_id || null,
    important_links: v.important_links,
    internal_banner_url: v.internal_banner_url || null,
    gacetilla_titulo: nullIfEmpty(v.gacetilla_titulo),
    gacetilla_texto: nullIfEmpty(v.gacetilla_texto),
    gacetilla_imagen: v.gacetilla_imagen || null,
  }
}

export function validateEventForm(v: EventFormValues): string | null {
  if (v.title.trim().length < 3) return "Falta el título del evento"
  if (!v.category.trim()) return "Elegí una categoría"
  if (!v.date) return "Falta la fecha de inicio"
  if (v.end_date && v.end_date < v.date) return "La fecha de fin no puede ser anterior al inicio"
  if (!v.location.trim()) return "Falta el lugar del evento"
  if (!v.description.trim()) return "Falta la descripción corta"
  return null
}

const knownCategories = Object.keys(categoryLabels).filter((k) => k !== "otro")

export function EventForm({
  values,
  onChange,
  organizations,
}: {
  values: EventFormValues
  onChange: (values: EventFormValues) => void
  organizations: Organization[]
}) {
  const set = (fields: Partial<EventFormValues>) => onChange({ ...values, ...fields })
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const isCustomCategory = !knownCategories.includes(values.category)
  const isInternational = values.department === "Internacional"
  // Si el evento tiene una ciudad que no esta en la lista (dato viejo), se mantiene como opcion
  const cityOptions = isInternational ? southAmericanCountries : values.department ? getCities(values.department) : []
  const cityList = values.city && !cityOptions.includes(values.city) ? [values.city, ...cityOptions] : cityOptions

  const [readingFlyer, setReadingFlyer] = useState(false)

  // Completa el formulario leyendo el flyer subido; solo pisa campos con datos nuevos
  const fillFromFlyer = async () => {
    if (!values.image_url) return
    setReadingFlyer(true)
    try {
      const d = await extractFromFlyerUrl(values.image_url)
      const next: Partial<EventFormValues> = {}
      if (d.title) next.title = d.title
      if (d.category) next.category = d.category
      if (d.date) next.date = d.date
      if (d.end_date) next.end_date = d.end_date
      if (d.time) next.time = d.time
      if (d.location) next.location = d.location
      if (d.department) next.department = d.department
      if (d.city) next.city = d.city
      if (d.maps_url) next.maps_url = d.maps_url
      if (d.description) next.description = d.description
      if (d.long_description) next.long_description = d.long_description
      if (d.contact_phone) next.contact_phone = d.contact_phone
      if (d.contact_email) next.contact_email = d.contact_email
      const knownUrls = new Set(values.important_links.map((l) => l.url))
      const newLinks = d.links.filter((l) => !knownUrls.has(l.url))
      if (newLinks.length) next.important_links = [...values.important_links, ...newLinks]
      onChange({ ...values, ...next })
      const review = d.uncertain_fields.length ? ` Revisá: ${d.uncertain_fields.join(", ")}.` : ""
      toast.success(`Completamos ${Object.keys(next).length} campos desde el flyer.${review}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer el flyer")
    } finally {
      setReadingFlyer(false)
    }
  }

  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return
    set({ important_links: [...values.important_links, { label: linkLabel.trim(), url: linkUrl.trim() }] })
    setLinkLabel("")
    setLinkUrl("")
  }

  return (
    <div className="space-y-4">
      <FormSection title="Datos principales">
        <Field label="Título" required>
          <input value={values.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder="Nombre del evento" />
        </Field>

        <Field label="Categoría" required>
          <div className="flex flex-wrap gap-2">
            {knownCategories.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => set({ category: key })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  values.category === key
                    ? "border-brand-navy bg-brand-navy text-white dark:border-brand-lime dark:bg-brand-lime dark:text-brand-navy"
                    : "border-border bg-background hover:border-foreground/30",
                )}
              >
                {categoryLabels[key]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => set({ category: isCustomCategory ? values.category : "" })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                isCustomCategory
                  ? "border-brand-navy bg-brand-navy text-white dark:border-brand-lime dark:bg-brand-lime dark:text-brand-navy"
                  : "border-dashed border-border bg-background hover:border-foreground/30",
              )}
            >
              Otra…
            </button>
          </div>
          {isCustomCategory && (
            <input
              value={values.category}
              onChange={(e) => set({ category: e.target.value })}
              className={cn(inputClass, "mt-2")}
              placeholder="Nombre de la categoría personalizada"
              autoFocus
            />
          )}
        </Field>

        <Field label="Flyer / imagen principal">
          <ImageUpload value={values.image_url} onChange={(url) => set({ image_url: url })} prefix="event" label="Subir flyer" aspect="square" />
          {values.image_url && (
            <button
              type="button"
              onClick={fillFromFlyer}
              disabled={readingFlyer}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-lime px-4 text-sm font-bold text-brand-navy hover:bg-brand-lime-dark disabled:opacity-60"
            >
              {readingFlyer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {readingFlyer ? "Leyendo el flyer..." : "Completar con el flyer"}
            </button>
          )}
        </Field>

        {organizations.length > 0 && (
          <Field label="Organizado por" hint="Aparece en la página del evento y en el perfil de la organización.">
            <select value={values.organization_id} onChange={(e) => set({ organization_id: e.target.value })} className={inputClass}>
              <option value="">Sin organización</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </FormSection>

      <FormSection title="Fecha y lugar">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Fecha de inicio" required>
            <input type="date" value={values.date} onChange={(e) => set({ date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Fecha de fin" hint="Solo si dura varios días">
            <input type="date" value={values.end_date} min={values.date} onChange={(e) => set({ end_date: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hora">
            <input type="time" value={values.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <Field label="Lugar" required>
          <input value={values.location} onChange={(e) => set({ location: e.target.value })} className={inputClass} placeholder="Ej: Centro de Convenciones Mariscal" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Departamento">
            <select value={values.department} onChange={(e) => set({ department: e.target.value, city: "" })} className={inputClass}>
              <option value="">Seleccionar</option>
              <optgroup label="Paraguay">
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Fuera de Paraguay">
                <option value="Internacional">Internacional</option>
              </optgroup>
            </select>
          </Field>
          <Field label={isInternational ? "País" : "Ciudad"}>
            <select value={values.city} onChange={(e) => set({ city: e.target.value })} className={inputClass} disabled={!values.department}>
              <option value="">Seleccionar</option>
              {cityList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Link de Google Maps">
          <input value={values.maps_url} onChange={(e) => set({ maps_url: e.target.value })} className={inputClass} placeholder="https://maps.app.goo.gl/..." />
        </Field>
      </FormSection>

      <FormSection title="Descripción">
        <Field label="Descripción corta" required hint="Se usa en buscadores, listados y al compartir el link.">
          <textarea value={values.description} onChange={(e) => set({ description: e.target.value })} className={textareaClass} rows={2} />
        </Field>
        <Field label="Descripción completa" hint="Se muestra en 'Acerca del evento'. Si la dejás vacía se usa la corta.">
          <textarea value={values.long_description} onChange={(e) => set({ long_description: e.target.value })} className={textareaClass} rows={6} />
        </Field>
      </FormSection>

      <FormSection title="Contacto y visibilidad">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email de contacto">
            <input type="email" value={values.contact_email} onChange={(e) => set({ contact_email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Teléfono de contacto">
            <input value={values.contact_phone} onChange={(e) => set({ contact_phone: e.target.value })} className={inputClass} placeholder="+595 ..." />
          </Field>
        </div>
        <Toggle
          checked={values.allow_contact_form}
          onChange={(v) => set({ allow_contact_form: v })}
          label="Formulario de contacto (Más info / Auspiciar / Stand)"
          description="Si está apagado, la página muestra el email y teléfono directo del organizador."
        />
        <Toggle
          checked={values.is_premium}
          onChange={(v) => set({ is_premium: v })}
          label="Evento destacado"
          description="Se marca como destacado en el listado y en la página del evento."
        />
      </FormSection>

      <FormSection title="Extras" description="Opcionales">
        <Field label="Links importantes" hint="Web oficial, inscripción, transmisión, redes...">
          <div className="space-y-2">
            {values.important_links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <span className="font-semibold">{link.label}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{link.url}</span>
                <button
                  type="button"
                  onClick={() => set({ important_links: values.important_links.filter((_, j) => j !== i) })}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Quitar link"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className={cn(inputClass, "sm:w-40")} placeholder="Etiqueta" />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                className={inputClass}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={addLink}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:border-foreground/30"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>
        </Field>

        <Field label="Banner interno" hint="Se muestra debajo de la descripción. Medida sugerida: 1200 × 400 px.">
          <ImageUpload value={values.internal_banner_url} onChange={(url) => set({ internal_banner_url: url })} prefix="internal-banner" aspect="banner" />
        </Field>

        <div className="space-y-3 rounded-xl border border-border bg-background p-3.5">
          <p className="text-sm font-semibold">Gacetilla de prensa</p>
          <input value={values.gacetilla_titulo} onChange={(e) => set({ gacetilla_titulo: e.target.value })} className={inputClass} placeholder="Título del comunicado" />
          <textarea value={values.gacetilla_texto} onChange={(e) => set({ gacetilla_texto: e.target.value })} className={textareaClass} rows={4} placeholder="Cuerpo de la gacetilla" />
          <ImageUpload value={values.gacetilla_imagen} onChange={(url) => set({ gacetilla_imagen: url })} prefix="gacetilla" label="Imagen de la gacetilla" />
        </div>
      </FormSection>
    </div>
  )
}
