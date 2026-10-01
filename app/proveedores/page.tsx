"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  LayoutGrid,
  MessageCircle,
  Palette,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Truck,
  UtensilsCrossed,
  Video,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { providerCategoryLabels, providerCategoryColors, type ProviderCategory } from "@/lib/providers-data"
import { SubmitProviderForm } from "@/components/submit-provider-form"
import { createBrowserClient } from "@/lib/supabase/client"

const categories: ProviderCategory[] = ["audiovisual", "catering", "decoracion", "stands", "logistica", "seguridad"]

const categoryIcons: Record<ProviderCategory, LucideIcon> = {
  audiovisual: Video,
  catering: UtensilsCrossed,
  decoracion: Palette,
  stands: Store,
  logistica: Truck,
  seguridad: ShieldCheck,
}

interface Provider {
  id: string
  name: string
  slug: string | null
  category: ProviderCategory
  description: string
  contact_email: string
  contact_phone: string
  website: string | null
  avatar_url: string | null
  is_approved: boolean
}

function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return "595" + digits.slice(1)
  if (digits.startsWith("595")) return digits
  return "595" + digits
}

const fieldClass =
  "w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-brand-lime/30 focus:border-brand-lime transition-all"

export default function ProveedoresPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para solicitar proveedor específico
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({ name: "", phone: "", message: "" })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)

  useEffect(() => {
    async function loadProviders() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("providers")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })

      setProviders(data || [])
      setLoading(false)
    }
    loadProviders()
  }, [])

  const handleRequestSubmit = async () => {
    if (!requestForm.name || !requestForm.phone) return
    setRequestSubmitting(true)
    const supabase = createBrowserClient()
    await supabase.from("general_contacts").insert({
      name: requestForm.name,
      phone: requestForm.phone,
      message: `[SOLICITUD DE PROVEEDOR] ${requestForm.message}`,
      email: "",
    })
    setRequestSubmitting(false)
    setRequestSubmitted(true)
  }

  const query = searchQuery.trim().toLowerCase()
  const filteredProviders = providers.filter((provider) => {
    const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory
    const matchesSearch =
      query === "" ||
      provider.name.toLowerCase().includes(query) ||
      (provider.description || "").toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  const countFor = (cat: ProviderCategory) => providers.filter((p) => p.category === cat).length

  if (showSubmitForm) {
    return <SubmitProviderForm onClose={() => setShowSubmitForm(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero con el estilo de agroconecta.com.py */}
      <section className="relative bg-brand-navy">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-36 -bottom-48 h-72 w-72 rounded-full border-[22px] border-brand-lime lg:-right-24 lg:-bottom-40 lg:h-96 lg:w-96 lg:border-[28px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-lime">Directorio de proveedores</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight text-white text-balance lg:text-5xl">
            Todo lo que necesitás para tu evento agro
          </h1>
          <p className="mt-3 max-w-xl text-white/70">Audiovisual, catering, stands, decoración, logística y seguridad.</p>
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar proveedores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-full border border-transparent bg-white pl-11 pr-4 text-brand-navy placeholder:text-[#5a5f55] focus:outline-none focus:ring-4 focus:ring-brand-lime/40"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        {/* Categorias */}
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <CategoryChip
            icon={LayoutGrid}
            label="Todos"
            count={providers.length}
            active={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              icon={categoryIcons[cat]}
              label={providerCategoryLabels[cat]}
              count={countFor(cat)}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Proveedores</p>
            <h2 className="text-2xl font-extrabold">
              {selectedCategory === "all" ? "Todos los rubros" : providerCategoryLabels[selectedCategory]}
            </h2>
          </div>
          {!loading && (
            <p className="text-sm text-muted-foreground shrink-0">
              {filteredProviders.length} {filteredProviders.length === 1 ? "resultado" : "resultados"}
            </p>
          )}
        </div>

        {/* Grilla de proveedores */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)
          ) : filteredProviders.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
              <Search className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="font-semibold">No se encontraron proveedores</p>
              <p className="mt-1 text-sm">Probá con otro rubro o pedinos ayuda para encontrarlo.</p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          )}
        </div>

        {/* Llamados a la accion */}
        <div className="mt-10 grid gap-3 lg:grid-cols-2">
          <button
            onClick={() => setShowSubmitForm(true)}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-brand-navy p-5 text-left text-white group dark:border dark:border-border"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -bottom-16 h-40 w-40 rounded-full border-[14px] border-brand-lime/80"
            />
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
              <Plus className="h-5 w-5" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-lime">¿Ofrecés servicios?</p>
              <p className="text-lg font-bold leading-tight">Registrate como proveedor</p>
              <p className="text-sm text-white/70">Aparecé frente a los organizadores de eventos del agro</p>
            </div>
            <ArrowRight className="relative h-5 w-5 text-brand-lime transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-lg hover:shadow-black/5 group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold leading-tight">¿No encontrás lo que buscás?</p>
              <p className="text-sm text-muted-foreground">Contanos qué necesitás y te ayudamos a conseguirlo</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>

      {/* Modal solicitar proveedor */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {requestSubmitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-lime">
                  <CheckCircle className="h-8 w-8 text-brand-navy" />
                </div>
                <h3 className="mb-2 text-2xl font-extrabold">Solicitud enviada</h3>
                <p className="mb-6 text-muted-foreground">Te contactamos para ayudarte a encontrar el proveedor ideal.</p>
                <Button
                  onClick={() => {
                    setShowRequestForm(false)
                    setRequestSubmitted(false)
                    setRequestForm({ name: "", phone: "", message: "" })
                  }}
                  className="rounded-full"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xl font-extrabold">Buscar proveedor</h3>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  Contanos qué tipo de proveedor necesitás y te ayudamos a encontrarlo.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Tu nombre *</label>
                    <input
                      type="text"
                      value={requestForm.name}
                      onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                      className={fieldClass}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      value={requestForm.phone}
                      onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                      className={fieldClass}
                      placeholder="+595 xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">¿Qué proveedor buscás?</label>
                    <textarea
                      value={requestForm.message}
                      onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                      rows={3}
                      className={cn(fieldClass, "h-auto resize-none py-3")}
                      placeholder="Ej: Necesito catering para 200 personas en Asunción..."
                    />
                  </div>
                  <Button
                    onClick={handleRequestSubmit}
                    disabled={requestSubmitting || !requestForm.name || !requestForm.phone}
                    className="h-12 w-full rounded-full font-semibold"
                  >
                    {requestSubmitting ? "Enviando..." : "Enviar solicitud"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-brand-navy bg-brand-navy text-white dark:border-brand-lime dark:bg-brand-lime dark:text-brand-navy"
          : "border-border bg-card hover:border-foreground/30",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span className={cn("text-xs", active ? "opacity-70" : "text-muted-foreground")}>{count}</span>
    </button>
  )
}

function ProviderCard({ provider }: { provider: Provider }) {
  const href = `/proveedores/${provider.slug || provider.id}`
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-black/5">
      <Link href={href} className="flex flex-1 items-start gap-4 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {provider.avatar_url ? (
            <img src={provider.avatar_url} alt={provider.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">{provider.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
              providerCategoryColors[provider.category] || "bg-muted text-muted-foreground",
            )}
          >
            {providerCategoryLabels[provider.category] || provider.category}
          </span>
          <h3 className="mt-1 font-bold leading-snug">{provider.name}</h3>
          {provider.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        {provider.contact_phone && (
          <a
            href={`https://wa.me/${formatWhatsApp(provider.contact_phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-lime px-4 text-sm font-semibold text-brand-navy hover:bg-brand-lime-dark"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
        <Link
          href={href}
          className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Ver perfil
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
