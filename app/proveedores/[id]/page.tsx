"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Globe, Mail, MessageCircle, Phone, Share2 } from "lucide-react"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { providerCategoryLabels, providerCategoryColors, type ProviderCategory } from "@/lib/providers-data"
import { createBrowserClient } from "@/lib/supabase/client"

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
      <Header />

      {/* Portada con el aro lima */}
      <div className="relative h-36 overflow-hidden bg-brand-navy lg:h-48">
        <div aria-hidden className="absolute -right-16 -bottom-32 h-72 w-72 rounded-full border-[22px] border-brand-lime" />
        <div aria-hidden className="absolute -left-10 -top-20 h-48 w-48 rounded-full bg-white/5" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 pb-16 lg:px-8">
        {loading ? (
          <div className="-mt-14 space-y-4 animate-pulse">
            <div className="h-28 w-28 rounded-full border-4 border-background bg-muted" />
            <div className="h-7 w-2/3 rounded-xl bg-muted" />
            <div className="h-4 w-1/3 rounded-xl bg-muted" />
          </div>
        ) : !provider ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="font-semibold">Proveedor no encontrado</p>
            <Link href="/proveedores" className="mt-2 inline-block text-sm font-semibold text-primary">
              Volver al directorio
            </Link>
          </div>
        ) : (
          <>
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-xl lg:h-32 lg:w-32">
                  {provider.avatar_url ? (
                    <img src={provider.avatar_url} alt={provider.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-muted-foreground">{provider.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 sm:pt-[72px]">
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                      providerCategoryColors[provider.category] || "bg-muted text-muted-foreground",
                    )}
                  >
                    {providerCategoryLabels[provider.category] || provider.category}
                  </span>
                  <h1 className="mt-2 text-3xl font-extrabold leading-tight lg:text-4xl">{provider.name}</h1>
                </div>
              </div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: provider.name, url: window.location.href })
                  } else {
                    navigator.clipboard?.writeText(window.location.href)
                  }
                }}
                className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-muted sm:mt-[76px]"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <h2 className="border-b border-border pb-2 text-sm font-semibold text-muted-foreground">Sobre el proveedor</h2>
                <p className="whitespace-pre-line leading-relaxed text-foreground/85">
                  {provider.description || "Este proveedor todavía no agregó una descripción."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="border-b border-border pb-2 text-sm font-semibold text-muted-foreground">Contacto</h2>
                {provider.contact_phone && (
                  <a
                    href={`https://wa.me/${formatWhatsApp(provider.contact_phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-lime font-semibold text-brand-navy transition-colors hover:bg-brand-lime-dark"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Escribir por WhatsApp
                  </a>
                )}
                {provider.contact_phone && (
                  <ContactRow href={`tel:${provider.contact_phone}`} icon={Phone} label={provider.contact_phone} />
                )}
                {provider.contact_email && (
                  <ContactRow href={`mailto:${provider.contact_email}`} icon={Mail} label={provider.contact_email} />
                )}
                {provider.website && (
                  <ContactRow
                    href={ensureHttps(provider.website)}
                    icon={Globe}
                    label={provider.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    external
                  />
                )}
              </div>
            </div>

            <Link
              href="/proveedores"
              className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al directorio
            </Link>
          </>
        )}
      </main>
    </div>
  )
}

function ContactRow({
  href,
  icon: Icon,
  label,
  external = false,
}: {
  href: string
  icon: typeof Phone
  label: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-foreground/30"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {external && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
    </a>
  )
}
