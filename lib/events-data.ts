export type EventCategory =
  | "agricultura"
  | "ganaderia"
  | "forestal"
  | "sostenibilidad"
  | "capacitaciones"
  | "feria"
  | "congreso"
  | "workshop"
  | "webinar"
  | "dia_de_campo"
  | "ambiental"

export interface AgroEvent {
  id: string
  title: string
  description: string
  long_description: string | null
  date: string
  event_date: string
  event_time: string
  end_date?: string
  location: string
  category: string
  speakers: string[] | null
  image_url: string | null
  is_premium: boolean
  status: string
  slug?: string
}

export const categoryLabels: Record<string, string> = {
  agricultura: "Agricultura",
  ganaderia: "Ganaderia",
  forestal: "Forestal",
  sostenibilidad: "Sostenibilidad",
  capacitaciones: "Capacitaciones",
  feria: "Feria",
  congreso: "Congreso",
  workshop: "Workshop",
  webinar: "Webinar",
  dia_de_campo: "Dia de Campo",
  ambiental: "Ambiental",
}

export const categoryColors: Record<string, string> = {
  agricultura: "bg-green-500/20 text-green-400",
  ganaderia: "bg-amber-500/20 text-amber-400",
  forestal: "bg-emerald-500/20 text-emerald-400",
  sostenibilidad: "bg-teal-500/20 text-teal-400",
  capacitaciones: "bg-blue-500/20 text-blue-400",
  feria: "bg-orange-500/20 text-orange-400",
  congreso: "bg-purple-500/20 text-purple-400",
  workshop: "bg-cyan-500/20 text-cyan-400",
  webinar: "bg-indigo-500/20 text-indigo-400",
  dia_de_campo: "bg-lime-500/20 text-lime-400",
  ambiental: "bg-sky-500/20 text-sky-400",
}

export const categoryGradients: Record<string, string> = {
  agricultura: "from-green-500 to-green-500/50",
  ganaderia: "from-amber-500 to-amber-500/50",
  forestal: "from-emerald-500 to-emerald-500/50",
  sostenibilidad: "from-teal-500 to-teal-500/50",
  capacitaciones: "from-blue-500 to-blue-500/50",
  feria: "from-orange-500 to-orange-500/50",
  congreso: "from-purple-500 to-purple-500/50",
  workshop: "from-cyan-500 to-cyan-500/50",
  webinar: "from-indigo-500 to-indigo-500/50",
  dia_de_campo: "from-lime-500 to-lime-500/50",
  ambiental: "from-sky-500 to-sky-500/50",
}

export const events: AgroEvent[] = []
