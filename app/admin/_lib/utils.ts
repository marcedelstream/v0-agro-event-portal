import { createBrowserClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-utils"

// Normalizacion mientras se escribe: no recorta guiones para poder tipear "mi-evento"
export function slugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Slug de evento con sufijo para que nunca choque con otro del mismo nombre
export function generateEventSlug(title: string): string {
  return `${generateSlug(title) || "evento"}-${Date.now().toString(36)}`
}

export function eventPath(slug: string) {
  return `/evento/${slug}`
}

export function eventUrl(slug: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://eventosagropy.com"
  return `${origin}${eventPath(slug)}`
}

// Las fechas de eventos vienen como "YYYY-MM-DD": se anclan al mediodia para que la zona horaria no corra el dia
export function parseDay(value: string) {
  return new Date(`${value}T12:00:00`)
}

export function formatDay(value?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return ""
  return parseDay(value).toLocaleDateString("es-ES", opts)
}

export function formatDateRange(start: string, end?: string | null) {
  if (!end || end === start) return formatDay(start, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
  return `${formatDay(start, { day: "numeric", month: "short" })} – ${formatDay(end, { day: "numeric", month: "short", year: "numeric" })}`
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "recién"
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function isPastEvent(e: { date: string; end_date?: string | null }) {
  return (e.end_date || e.date) < todayKey()
}

// Nota que agrega el formulario publico cuando la base todavia no tiene la columna wants_premium
const PREMIUM_NOTE = /^\[SOLICITA EVENTO DESTACADO[^\]]*\]\s*/

export function submissionWantsPremium(s: { wants_premium?: boolean | null; description?: string | null }) {
  return Boolean(s.wants_premium) || PREMIUM_NOTE.test(s.description || "")
}

export function stripPremiumNote(description: string) {
  return description.replace(PREMIUM_NOTE, "")
}

export function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return "595" + digits.slice(1)
  if (digits.startsWith("595")) return digits
  return "595" + digits
}

export function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Error desconocido"
}

// Comprime y sube una imagen al bucket publico; devuelve la URL publica o lanza error
export async function uploadImage(file: File, prefix: string): Promise<string> {
  const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 })
  const supabase = createBrowserClient()
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
  const { error } = await supabase.storage.from("event-images").upload(fileName, compressed)
  if (error) throw error
  return supabase.storage.from("event-images").getPublicUrl(fileName).data.publicUrl
}
