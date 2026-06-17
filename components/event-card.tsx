import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Clock } from "lucide-react"
import { type AgroEvent, categoryLabels, categoryColors } from "@/lib/events-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface EventCardProps {
  event: AgroEvent
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = new Date(event.date).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Link href={`/evento/${event.id}`}>
      <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:bg-card/80">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className={`absolute top-3 left-3 ${categoryColors[event.category]}`}>
            {categoryLabels[event.category]}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
