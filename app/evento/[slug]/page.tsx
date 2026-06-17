import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { EventoClientPage } from "./evento-client"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: event } = await supabase
    .from("events")
    .select("title, description, image_url, location, date")
    .eq("slug", slug)
    .eq("is_approved", true)
    .single()

  if (!event) {
    return {
      title: "Evento no encontrado | Eventos Agro",
      description: "El evento que buscas no existe o fue eliminado",
    }
  }

  const eventDate = new Date(event.date + "T00:00:00")
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
  return <EventoClientPage slug={slug} />
}
