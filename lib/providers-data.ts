export interface Provider {
  id: string
  name: string
  category: ProviderCategory
  description: string
  location: string
  phone?: string
  email?: string
  website?: string
  isPremium?: boolean
}

export type ProviderCategory = "audiovisual" | "catering" | "decoracion" | "stands" | "logistica" | "seguridad"

export const providerCategoryLabels: Record<ProviderCategory, string> = {
  audiovisual: "Audiovisual",
  catering: "Catering",
  decoracion: "Decoración",
  stands: "Stands",
  logistica: "Logística",
  seguridad: "Seguridad",
}

export const providerCategoryColors: Record<ProviderCategory, string> = {
  audiovisual: "bg-blue-500/12 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  catering: "bg-orange-500/12 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  decoracion: "bg-pink-500/12 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  stands: "bg-purple-500/12 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  logistica: "bg-cyan-500/12 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  seguridad: "bg-red-500/12 text-red-700 dark:bg-red-500/15 dark:text-red-300",
}

export const providerCategoryIcons: Record<ProviderCategory, string> = {
  audiovisual: "🎬",
  catering: "🍽️",
  decoracion: "🎨",
  stands: "🏪",
  logistica: "🚚",
  seguridad: "🛡️",
}

export const providers: Provider[] = [
  {
    id: "1",
    name: "SonidoPro Paraguay",
    category: "audiovisual",
    description: "Equipos de sonido, pantallas LED, proyectores y streaming en vivo para eventos agro.",
    location: "Asunción, Paraguay",
    phone: "+595 21 555 1234",
    email: "ventas@sonidopro.com.py",
    isPremium: true,
  },
  {
    id: "2",
    name: "Catering del Campo",
    category: "catering",
    description: "Servicio de catering especializado en eventos rurales y ferias agrícolas. Menús personalizados.",
    location: "Ciudad del Este, Paraguay",
    phone: "+595 61 555 5678",
    website: "https://cateringdelcampo.com.py",
  },
  {
    id: "3",
    name: "Stands & Expo S.A.",
    category: "stands",
    description: "Diseño, fabricación y montaje de stands para exposiciones y ferias agropecuarias.",
    location: "Encarnación, Paraguay",
    email: "info@standsexpo.com.py",
    isPremium: true,
  },
  {
    id: "4",
    name: "LogiAgro Transportes",
    category: "logistica",
    description: "Transporte de maquinaria agrícola, montaje de carpas y logística integral para eventos.",
    location: "Asunción, Paraguay",
    phone: "+595 21 555 9999",
  },
]
