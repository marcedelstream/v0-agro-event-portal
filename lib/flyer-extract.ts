// Transcripcion de flyers: tipos compartidos y llamada desde el navegador a /api/flyer-extract.
import { compressImage } from "@/lib/image-utils"

export interface FlyerData {
  title: string
  category: string
  date: string // YYYY-MM-DD o ""
  end_date: string
  time: string // HH:MM o ""
  location: string
  department: string // uno de departmentsList, "Internacional" o ""
  city: string
  maps_url: string
  description: string // resumen corto
  long_description: string // texto completo para "Acerca del evento"
  contact_phone: string
  contact_email: string
  organizer: string
  links: { label: string; url: string }[]
  // Campos que el modelo no pudo leer con seguridad (nombres de las claves de arriba)
  uncertain_fields: string[]
}

async function postExtract(body: FormData | string, json: boolean): Promise<FlyerData> {
  const res = await fetch("/api/flyer-extract", {
    method: "POST",
    body,
    headers: json ? { "Content-Type": "application/json" } : undefined,
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) throw new Error(payload?.error || "No se pudo leer el flyer")
  return payload.data as FlyerData
}

// Desde un archivo local (formulario publico): se achica antes de enviar para que viaje rapido
export async function extractFromFlyerFile(file: File): Promise<FlyerData> {
  const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 })
  const form = new FormData()
  form.append("file", compressed, "flyer.jpg")
  return postExtract(form, false)
}

// Desde una imagen ya subida al storage (panel de admin)
export async function extractFromFlyerUrl(imageUrl: string): Promise<FlyerData> {
  return postExtract(JSON.stringify({ imageUrl }), true)
}
