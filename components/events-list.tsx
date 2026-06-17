import { events } from "@/lib/events-data"
import { EventCard } from "./event-card"

export function EventsList() {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-xl font-semibold md:text-2xl">Próximos Eventos</h2>
          <p className="text-sm text-muted-foreground mt-1">{events.length} eventos disponibles</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
