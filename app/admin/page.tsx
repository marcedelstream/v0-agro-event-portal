"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  ExternalLink,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Store,
  Sun,
  Users,
  X,
  GalleryHorizontal,
  type LucideIcon,
} from "lucide-react"
import { Toaster } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import type { EventSubmission, PublishedEvent, Tab } from "./_lib/types"
import { useAdminData } from "./_lib/use-admin-data"
import { emptyEventForm, formFromEvent, formFromSubmission } from "./_components/event-form"
import { EventEditor, type EditorState } from "./_components/event-editor"
import { DashboardTab } from "./_components/dashboard-tab"
import { SubmissionsTab } from "./_components/submissions-tab"
import { EventsTab } from "./_components/events-tab"
import { ProvidersTab } from "./_components/providers-tab"
import { MessagesTab } from "./_components/messages-tab"
import { BannersTab } from "./_components/banners-tab"
import { GalleryTab } from "./_components/gallery-tab"
import { OrganizationsTab } from "./_components/organizations-tab"
import { PrimaryButton, inputClass } from "./_components/ui"

const SESSION_KEY = "admin_session"

const tabTitles: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: "Resumen", subtitle: "Lo que necesita tu atención hoy" },
  submissions: { title: "Solicitudes", subtitle: "Eventos enviados desde 'Publicar evento'" },
  events: { title: "Eventos publicados", subtitle: "Todo lo que está en el calendario" },
  providers: { title: "Proveedores", subtitle: "Solicitudes y directorio" },
  messages: { title: "Mensajes", subtitle: "Consultas de eventos y contacto general" },
  banners: { title: "Banners", subtitle: "Eventos destacados de la home" },
  gallery: { title: "Galería de fotos", subtitle: "Fotos de eventos realizados" },
  organizations: { title: "Organizaciones", subtitle: "Convenios con página y panel propio" },
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tab, setTab] = useState<Tab>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const data = useAdminData()
  const { actions } = data
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (localStorage.getItem(SESSION_KEY)) {
      setIsAuthenticated(true)
      data.load()
    }
    setCheckingSession(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pendingSubmissions = data.eventSubmissions.filter((s) => s.status === "pending")
  const pendingProviders = data.providerSubmissions.filter((s) => s.status === "pending").length
  const pendingMessages =
    data.eventContacts.filter((c) => c.status !== "responded").length + data.generalContacts.filter((c) => (c.status || "pending") !== "responded").length

  const navItems: { id: Tab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    { id: "submissions", label: "Solicitudes", icon: Inbox, badge: pendingSubmissions.length },
    { id: "events", label: "Eventos publicados", icon: CalendarCheck },
    { id: "messages", label: "Mensajes", icon: MessageSquare, badge: pendingMessages },
    { id: "providers", label: "Proveedores", icon: Store, badge: pendingProviders },
    { id: "banners", label: "Banners", icon: GalleryHorizontal },
    { id: "gallery", label: "Galería", icon: Images },
    { id: "organizations", label: "Organizaciones", icon: Users },
  ]

  const go = (t: Tab) => {
    setTab(t)
    setSidebarOpen(false)
    window.scrollTo({ top: 0 })
  }

  const openCreate = () => setEditor({ mode: "create", values: emptyEventForm() })
  const openEdit = (e: PublishedEvent) => setEditor({ mode: "edit", eventId: e.id, values: formFromEvent(e) })
  const openReview = (s: EventSubmission) => setEditor({ mode: "approve", submission: s, values: formFromSubmission(s) })

  const refresh = async () => {
    setRefreshing(true)
    await data.load()
    setRefreshing(false)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-lime border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onSuccess={() => {
          setIsAuthenticated(true)
          data.load()
        }}
      />
    )
  }

  const { title, subtitle } = tabTitles[tab]

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-center" richColors closeButton theme={theme} />

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Barra lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-navy text-white transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" target="_blank" className="flex items-center gap-2">
            <img src="/logo.png" alt="Eventos Agro" className="h-7 w-auto" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 md:hidden" aria-label="Cerrar menú">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              openCreate()
              setSidebarOpen(false)
            }}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-brand-lime text-sm font-bold text-brand-navy hover:bg-brand-lime-dark"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                tab === id ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4 shrink-0", tab === id && "text-brand-lime")} />
                {label}
              </span>
              {!!badge && <span className="rounded-full bg-brand-lime px-2 py-0.5 text-[11px] font-bold text-brand-navy">{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-white/10 p-3">
          <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-4 w-4" />
            Ver sitio
          </Link>
          <button onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="rounded-full p-2 hover:bg-muted md:hidden" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold leading-tight">{title}</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
            </div>
            <button
              onClick={refresh}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          {data.loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {tab === "dashboard" && (
                <DashboardTab
                  events={data.events}
                  pendingSubmissions={pendingSubmissions}
                  pendingProviders={pendingProviders}
                  pendingMessages={pendingMessages}
                  onNavigate={go}
                  onReview={openReview}
                  onCreate={openCreate}
                />
              )}
              {tab === "submissions" && (
                <SubmissionsTab submissions={data.eventSubmissions} onReview={openReview} onRestore={(s) => actions.restoreSubmission(s.id)} />
              )}
              {tab === "events" && (
                <EventsTab
                  events={data.events}
                  onCreate={openCreate}
                  onEdit={openEdit}
                  onDelete={(e) => confirm(`¿Eliminar "${e.title}"? No se puede deshacer.`) && actions.deleteEvent(e.id)}
                  onTogglePremium={actions.togglePremium}
                  onFixSlug={actions.fixMissingSlug}
                />
              )}
              {tab === "messages" && (
                <MessagesTab
                  eventContacts={data.eventContacts}
                  generalContacts={data.generalContacts}
                  events={data.events}
                  onSetEventStatus={actions.setEventContactStatus}
                  onSetGeneralStatus={actions.setGeneralContactStatus}
                />
              )}
              {tab === "providers" && (
                <ProvidersTab
                  submissions={data.providerSubmissions}
                  providers={data.providers}
                  onApprove={actions.approveProvider}
                  onReject={actions.rejectProvider}
                  onUpdate={actions.updateProvider}
                  onDelete={(p) => confirm(`¿Eliminar a ${p.name} del directorio?`) && actions.deleteProvider(p.id)}
                />
              )}
              {tab === "banners" && (
                <BannersTab
                  banners={data.banners}
                  events={data.events}
                  onCreate={actions.createBanner}
                  onToggle={actions.toggleBanner}
                  onDelete={(b) => confirm("¿Eliminar este banner?") && actions.deleteBanner(b.id)}
                  onMove={actions.moveBanner}
                />
              )}
              {tab === "gallery" && <GalleryTab events={data.events} />}
              {tab === "organizations" && (
                <OrganizationsTab
                  organizations={data.organizations}
                  events={data.events}
                  onCreate={actions.createOrganization}
                  onUpdate={actions.updateOrganization}
                  onToggle={actions.toggleOrganization}
                  onDelete={(o) =>
                    confirm(`¿Eliminar ${o.name}? Sus eventos no se borran, pero quedan sin organización.`) && actions.deleteOrganization(o.id)
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      <EventEditor
        state={editor}
        organizations={data.organizations}
        onClose={() => setEditor(null)}
        onCreate={async (values) => {
          const ok = await actions.createEvent(values)
          if (ok) setTab("events")
          return ok
        }}
        onUpdate={actions.updateEvent}
        onApprove={actions.approveSubmission}
        onReject={actions.rejectSubmission}
      />
    </div>
  )
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const { data: admin, error: dbError } = await createBrowserClient()
        .from("admins")
        .select("email, password_hash")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle()
      if (dbError || !admin || admin.password_hash !== password) {
        setError("Email o contraseña incorrectos")
        return
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: admin.email }))
      onSuccess()
    } catch {
      setError("No se pudo iniciar sesión. Revisá tu conexión.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy p-4">
      <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-32 h-96 w-96 rounded-full border-[28px] border-brand-lime" />
      <div className="relative w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
        <img src="/logo-claro.png" alt="Eventos Agro" className="h-9 w-auto dark:hidden" />
        <img src="/logo.png" alt="Eventos Agro" className="hidden h-9 w-auto dark:block" />
        <p className="eyebrow mt-6">Panel de administración</p>
        <h1 className="text-2xl font-extrabold">Ingresá</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="username" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" required />
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <PrimaryButton type="submit" disabled={submitting} className="w-full">
            {submitting ? "Ingresando..." : "Ingresar"}
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
