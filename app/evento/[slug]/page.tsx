import type { Metadata } from "next"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { EventoClientPage, type EventDetail, type EventOrganization, type GalleryImage } from "./evento-client"

// Se usa en generateMetadata y en la pagina; cache() evita consultar dos veces por request.
const getEvent = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .maybeSingle()

  if (!event) return null

  const [galleryRes, organizationRes] = await Promise.all([
    supabase
      .from("event_gallery")
      .select("id, image_url, caption")
      .eq("event_id", event.id)
      .order("display_order", { ascending: true }),
    event.organization_id
      ? supabase.from("organizations").select("name, slug, avatar_url").eq("id", event.organization_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    event: event as EventDetail,
    gallery: (galleryRes.data || []) as GalleryImage[],
    organization: (organizationRes.data || null) as EventOrganization | null,
  }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await getEvent(slug)

  if (!result) {
    return {
      title: "Evento no encontrado | Eventos Agro",
      description: "El evento que buscas no existe o fue eliminado",
    }
  }

  const { event } = result
  const eventDate = new Date(event.date + "T12:00:00")
  const formattedDate = eventDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const ogDescription = `${event.description} | ${formattedDate} - ${event.location}`

  return {
    title: `${event.title} | Eventos Agro`,
    description: ogDescription,
    openGraph: {
      title: event.title,
      description: ogDescription,
      type: "article",
      images: event.image_url
        ? [
            {
              url: event.image_url,
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ]
        : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: ogDescription,
      images: event.image_url ? [event.image_url] : ["/og-image.png"],
    },
  }
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getEvent(slug)

  return (
    <EventoClientPage
      event={result?.event ?? null}
      galleryImages={result?.gallery ?? []}
      organization={result?.organization ?? null}
    />
  )
}
