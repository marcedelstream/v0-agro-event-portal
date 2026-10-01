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
  otro: "Otro",
}

export const categoryColors: Record<string, string> = {
  agricultura: "bg-green-500/12 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  ganaderia: "bg-amber-500/12 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  forestal: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  sostenibilidad: "bg-teal-500/12 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  capacitaciones: "bg-blue-500/12 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  feria: "bg-orange-500/12 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  congreso: "bg-purple-500/12 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  workshop: "bg-cyan-500/12 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  webinar: "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  dia_de_campo: "bg-lime-500/12 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
  ambiental: "bg-sky-500/12 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  otro: "bg-muted text-muted-foreground",
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
  otro: "from-gray-500 to-gray-500/50",
}

export const events: AgroEvent[] = []
