import { NextResponse } from "next/server"
import { z } from "zod"
import { categoryLabels } from "@/lib/events-data"
import { departmentsList, getCities, southAmericanCountries } from "@/lib/paraguay-data"
import type { FlyerData } from "@/lib/flyer-extract"

export const runtime = "nodejs"
export const maxDuration = 60

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna"
const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const CATEGORIES = Object.keys(categoryLabels).filter((k) => k !== "otro")
const DEPARTMENTS = [...departmentsList, "Internacional"]

// Limite simple por IP para que el formulario publico no consuma el saldo de OpenAI.
// Vive en memoria de cada instancia: alcanza como freno basico, no como garantia estricta.
const RATE_LIMIT = 8
const RATE_WINDOW_MS = 60 * 60 * 1000
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

const resultSchema = z.object({
  title: z.string(),
  category: z.string(),
  date: z.string(),
  end_date: z.string(),
  time: z.string(),
  location: z.string(),
  department: z.string(),
  city: z.string(),
  maps_url: z.string(),
  description: z.string(),
  long_description: z.string(),
  contact_phone: z.string(),
  contact_email: z.string(),
  organizer: z.string(),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
  uncertain_fields: z.array(z.string()),
})

// Campos que el modelo puede marcar como dudosos
const FIELD_NAMES = ["title", "category", "date", "end_date", "time", "location", "department", "city", "description", "contact_phone", "contact_email"]

// Esquema para Structured Outputs de OpenAI: todos los campos obligatorios, "" cuando no hay dato
const str = { type: "string" }
const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(resultSchema.shape),
  properties: {
    title: str,
    category: { type: "string", enum: [...CATEGORIES, ""] },
    date: str,
    end_date: str,
    time: str,
    location: str,
    department: { type: "string", enum: [...DEPARTMENTS, ""] },
    city: str,
    maps_url: str,
    description: str,
    long_description: str,
    contact_phone: str,
    contact_email: str,
    organizer: str,
    links: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["label", "url"], properties: { label: str, url: str } },
    },
    uncertain_fields: { type: "array", items: { type: "string", enum: FIELD_NAMES } },
  },
}

function systemPrompt(today: string) {
  return `Sos un asistente que transcribe flyers de eventos del sector agropecuario de Paraguay para cargarlos en un calendario.
Hoy es ${today}. Extraé SOLO lo que está en el flyer; nunca inventes datos. Si un dato no aparece, devolvé "".

Reglas:
- title: nombre del evento tal como aparece, con mayúsculas normales (no todo en mayúsculas).
- category: la que mejor encaje entre: ${CATEGORIES.join(", ")}. "dia_de_campo" = día de campo; "capacitaciones" = cursos, charlas técnicas, jornadas de formación.
- date / end_date: formato YYYY-MM-DD. Si el flyer no dice el año, usá el próximo que haga que la fecha no esté en el pasado. end_date solo si dura más de un día.
- time: hora de inicio en formato 24 h HH:MM ("8 hs" = "08:00", "15:30 hs" = "15:30").
- location: nombre del lugar (estancia, local, salón, predio). department: departamento de Paraguay (${departmentsList.join(", ")}) o "Internacional". city: ciudad (si es internacional, el país).
- description: resumen de 1 o 2 oraciones (máx. 200 caracteres) en español neutro.
- long_description: todo el contenido útil del flyer en texto ordenado: temario, agenda con horarios, disertantes, costo, requisitos, organizadores y auspiciantes. Usá saltos de línea y viñetas "• ".
- contact_phone: teléfono o WhatsApp de contacto/inscripción. contact_email: email si aparece.
- organizer: quién organiza. links: webs, formularios de inscripción o redes que aparezcan (url completa con https://).
- maps_url: solo si el flyer trae un link de Google Maps.
- uncertain_fields: claves de los campos que no pudiste leer con seguridad (texto borroso, año supuesto, departamento o ciudad inferidos del lugar, etc.).`
}

// Normaliza para comparar nombres sin tildes ni mayusculas
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()

function matchFrom(list: string[], value: string) {
  return list.find((x) => norm(x) === norm(value)) || ""
}

function cleanResult(raw: z.infer<typeof resultSchema>): FlyerData {
  const uncertain = new Set(raw.uncertain_fields.filter((f) => FIELD_NAMES.includes(f)))
  const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  const date = isDate(raw.date) ? raw.date : ""
  let endDate = isDate(raw.end_date) && raw.end_date > date ? raw.end_date : ""
  if (!date) endDate = ""
  const time = /^\d{2}:\d{2}$/.test(raw.time) ? raw.time : ""

  let department = matchFrom(DEPARTMENTS, raw.department)
  let city = ""
  if (department === "Internacional") {
    city = matchFrom(southAmericanCountries, raw.city)
  } else if (department) {
    city = matchFrom(getCities(department), raw.city)
  } else if (raw.city) {
    // Si solo vino la ciudad, se busca a que departamento pertenece
    const owner = departmentsList.find((d) => matchFrom(getCities(d), raw.city))
    if (owner) {
      department = owner
      city = matchFrom(getCities(owner), raw.city)
      uncertain.add("department")
    }
  }
  if (raw.city && !city) uncertain.add("city")

  return {
    title: raw.title.trim(),
    category: CATEGORIES.includes(raw.category) ? raw.category : "",
    date,
    end_date: endDate,
    time,
    location: raw.location.trim(),
    department,
    city,
    maps_url: /^https?:\/\//.test(raw.maps_url) ? raw.maps_url : "",
    description: raw.description.trim().slice(0, 300),
    long_description: raw.long_description.trim(),
    contact_phone: raw.contact_phone.trim(),
    contact_email: raw.contact_email.trim(),
    organizer: raw.organizer.trim(),
    links: raw.links.filter((l) => /^https?:\/\//.test(l.url)).slice(0, 6),
    uncertain_fields: [...uncertain],
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "La transcripción de flyers no está configurada (falta OPENAI_API_KEY)." }, { status: 503 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Llegaste al límite de flyers por hora. Probá más tarde o completá los datos a mano." }, { status: 429 })
  }

  // La imagen llega como archivo (formulario publico) o como URL del storage propio (panel de admin)
  let imageUrl: string
  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const { imageUrl: url } = (await request.json()) as { imageUrl?: string }
      const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url || !storageBase || !url.startsWith(`${storageBase}/storage/v1/object/public/`)) {
        return NextResponse.json({ error: "Imagen no válida" }, { status: 400 })
      }
      imageUrl = url
    } else {
      const form = await request.formData()
      const file = form.get("file")
      if (!(file instanceof File) || !file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Subí una imagen (JPG o PNG)" }, { status: 400 })
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "La imagen es demasiado pesada (máx. 6 MB)" }, { status: 413 })
      }
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64")
      imageUrl = `data:${file.type};base64,${base64}`
    }
  } catch {
    return NextResponse.json({ error: "No se pudo leer la imagen enviada" }, { status: 400 })
  }

  const today = new Date().toLocaleDateString("es-PY", {
    timeZone: "America/Asuncion",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt(today) },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribí este flyer de evento." },
              { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_schema", json_schema: { name: "evento_flyer", strict: true, schema: jsonSchema } },
      }),
    })

    const payload = await res.json()
    if (!res.ok) {
      console.error("flyer-extract OpenAI error", res.status, payload?.error?.message)
      return NextResponse.json({ error: "El servicio de lectura de flyers no respondió. Probá de nuevo." }, { status: 502 })
    }

    const message = payload.choices?.[0]?.message
    if (message?.refusal || !message?.content) {
      return NextResponse.json({ error: "No pudimos leer este flyer. Completá los datos a mano." }, { status: 422 })
    }

    const parsed = resultSchema.safeParse(JSON.parse(message.content))
    if (!parsed.success) {
      return NextResponse.json({ error: "La lectura del flyer vino incompleta. Probá de nuevo." }, { status: 502 })
    }

    return NextResponse.json({ data: cleanResult(parsed.data) })
  } catch (error) {
    console.error("flyer-extract", error)
    return NextResponse.json({ error: "No se pudo leer el flyer. Probá de nuevo." }, { status: 500 })
  }
}
