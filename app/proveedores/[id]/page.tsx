"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, Phone, Mail, Globe, MapPin, Sun, Moon, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { providerCategoryLabels, providerCategoryColors, type ProviderCategory } from "@/lib/providers-data"
import { createBrowserClient } from "@/lib/supabase/client"
import { useTheme } from "@/components/theme-provider"

interface Provider {
  id: string
  name: string
  slug: string | null
  category: ProviderCategory
  description: string | null
  contact_email: string
  contact_phone: string
  website: string | null
  avatar_url: string | null
  is_approved: boolean
}

function ensureHttps(url: string): string {
  if (!url) return url
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return "https://" + url
}

function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  // Si empieza con 0 (formato local paraguayo), reemplazar con 595
  if (digits.startsWith("0")) return "595" + digits.slice(1)
  // Si ya empieza con 595, está bien
  if (digits.startsWith("595")) return digits
  // Sino, asumir Paraguay y agregar 595
  return "595" + digits
}

export default function ProviderPage() {
  const params = useParams()
  const id = params?.id as string
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    async function loadProvider() {
      const supabase = createBrowserClient()
      // Buscar primero por slug, si no encuentra buscar por id
      let { data } = await supabase
        .from("providers")
        .select("*")
        .eq("slug", id)
        .eq("is_approved", true)
        .single()
      if (!data) {
        const res = await supabase
          .from("providers")
          .select("*")
          .eq("id", id)
          .eq("is_approved", true)
          .single()
        data = res.data
      }
      setProvider(data)
      setLoading(false)
    }
    if (id) loadProvider()
  }, [id])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/proveedores" className="p-1.5 hover:bg-muted rounded-xl transition-all hover:scale-105 active:scale-95">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-semibold">Proveedor</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 p-1 rounded-full bg-gradient-to-r from-muted to-muted/50 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 shadow-inner"
            aria-label="Cambiar tema"
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${theme === "light" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-110 shadow-lg shadow-amber-500/30" : "text-muted-foreground hover:text-foreground"}`}>
              <Sun className="h-3.5 w-3.5" />
            </div>
            <div className={`p-1.5 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 shadow-lg shadow-indigo-500/30" : "text-muted-foreground hover:text-foreground"}`}>
              <Moon className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-muted mx-auto" />
            <div className="h-6 bg-muted rounded-xl w-2/3 mx-auto" />
            <div className="h-4 bg-muted rounded-xl w-1/3 mx-auto" />
          </div>
        ) : !provider ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-semibold">Proveedor no encontrado</p>
            <Link href="/proveedores" className="text-primary text-sm mt-2 inline-block">Volver al directorio</Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center shadow-xl">
              {provider.avatar_url ? (
                <img src={provider.avatar_url} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-muted-foreground">{provider.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Name & category */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">{provider.name}</h1>
              <span className={cn("text-sm px-3 py-1 rounded-full font-semibold", providerCategoryColors[provider.category] || "bg-muted text-muted-foreground")}>
                {providerCategoryLabels[provider.category] || provider.category}
              </span>
            </div>

            {/* Description */}
            {provider.description && (
              <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-sm">{provider.description}</p>
            )}

            {/* Contact buttons */}
            <div className="w-full space-y-3 max-w-sm">
              {provider.contact_phone && (
                <a
                  href={`https://wa.me/${formatWhatsApp(provider.contact_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              )}
              {provider.contact_phone && (
                <a
                  href={`tel:${provider.contact_phone}`}
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border-2 border-border bg-card hover:bg-muted font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  Llamar · {provider.contact_phone}
                </a>
              )}
              {provider.contact_email && (
                <a
                  href={`mailto:${provider.contact_email}`}
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border-2 border-border bg-card hover:bg-muted font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </a>
              )}
              {provider.website && (
                <a
                  href={ensureHttps(provider.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border-2 border-border bg-card hover:bg-muted font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Globe className="h-5 w-5 text-primary" />
                  Sitio web
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
