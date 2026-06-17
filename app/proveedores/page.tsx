"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Phone, Mail, Globe, Search, Sun, Moon, MessageCircle, X, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { providerCategoryLabels, providerCategoryColors, type ProviderCategory } from "@/lib/providers-data"
import { SubmitProviderForm } from "@/components/submit-provider-form"
import { useTheme } from "@/components/theme-provider"
import { createBrowserClient } from "@/lib/supabase/client"

const categories: ProviderCategory[] = ["audiovisual", "catering", "decoracion", "stands", "logistica", "seguridad"]

interface Provider {
  id: string
  name: string
  category: ProviderCategory
  description: string
  contact_email: string
  contact_phone: string
  website: string | null
  is_approved: boolean
}

export default function ProveedoresPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()
  
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

  const filteredProviders = providers.filter((provider) => {
    const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (showSubmitForm) {
    return <SubmitProviderForm onClose={() => setShowSubmitForm(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 hover:bg-muted rounded-xl transition-all hover:scale-105 active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold">Proveedores para Eventos</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 p-1 rounded-full bg-gradient-to-r from-muted to-muted/50 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 shadow-inner"
            aria-label="Cambiar tema"
          >
            <div
              className={`p-1.5 rounded-full transition-all duration-300 ${theme === "light" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-110 shadow-lg shadow-amber-500/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sun className="h-3.5 w-3.5" />
            </div>
            <div
              className={`p-1.5 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 shadow-lg shadow-indigo-500/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Moon className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Encontra soluciones para tu evento: audiovisual, catering, stands y mas.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRequestForm(true)}
            className="rounded-xl text-xs shrink-0"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Buscar proveedor
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-muted text-muted-foreground hover:text-foreground hover:scale-105",
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:scale-105",
              )}
            >
              {providerCategoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Providers list */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No se encontraron proveedores</p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-2xl border-2 border-border bg-card hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-semibold",
                          providerCategoryColors[provider.category] || "bg-gray-500/20 text-gray-500",
                        )}
                      >
                        {providerCategoryLabels[provider.category] || provider.category}
                      </span>
                    </div>
                    <h3 className="font-bold">{provider.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{provider.description}</p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {provider.contact_phone && (
                    <a
                      href={`tel:${provider.contact_phone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      {provider.contact_phone}
                    </a>
                  )}
                  {provider.contact_email && (
                    <a
                      href={`mailto:${provider.contact_email}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </a>
                  )}
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      Web
                    </a>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Add provider button */}
          <button
            onClick={() => setShowSubmitForm(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-semibold hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            <span>Registrarme como proveedor</span>
          </button>
        </div>
      </main>

      {/* Modal solicitar proveedor */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-md p-6">
            {requestSubmitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Solicitud enviada</h3>
                <p className="text-muted-foreground mb-6">Te contactaremos para ayudarte a encontrar el proveedor ideal.</p>
                <Button
                  onClick={() => {
                    setShowRequestForm(false)
                    setRequestSubmitted(false)
                    setRequestForm({ name: "", phone: "", message: "" })
                  }}
                  className="rounded-xl"
                >
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Buscar proveedor</h3>
                  <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-muted rounded-xl">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Contanos que tipo de proveedor necesitas y te ayudamos a encontrarlo.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tu nombre *</label>
                    <input
                      type="text"
                      value={requestForm.name}
                      onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telefono *</label>
                    <input
                      type="tel"
                      value={requestForm.phone}
                      onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="+595 xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Que tipo de proveedor buscas?</label>
                    <textarea
                      value={requestForm.message}
                      onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                      placeholder="Ej: Necesito catering para 200 personas en Asuncion..."
                    />
                  </div>
                  <Button
                    onClick={handleRequestSubmit}
                    disabled={requestSubmitting || !requestForm.name || !requestForm.phone}
                    className="w-full h-12 rounded-xl font-semibold"
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
