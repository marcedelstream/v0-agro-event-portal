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
  audiovisual: "bg-blue-500/20 text-blue-500",
  catering: "bg-orange-500/20 text-orange-500",
  decoracion: "bg-pink-500/20 text-pink-500",
  stands: "bg-purple-500/20 text-purple-500",
  logistica: "bg-cyan-500/20 text-cyan-500",
  seguridad: "bg-red-500/20 text-red-500",
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
