"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, LogOut, Plus, Trash2, Calendar, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-utils"
import { categoryLabels } from "@/lib/events-data"
import { departmentsList, getCities } from "@/lib/paraguay-data"

interface Organization {
  id: string
  name: string
  slug: string
  email: string
  password_hash: string
}

interface OrgEvent {
  id: string
  title: string
  date: string
  end_date?: string
  time: string
  location: string
  category: string
  is_approved: boolean
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function OrganizadorPanelPage() {
  const params = useParams()
  const slug = params.slug as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loadingOrg, setLoadingOrg] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  const [events, setEvents] = useState<OrgEvent[]>([])
  const [savingEvent, setSavingEvent] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    end_date: "",
    time: "",
    location: "",
    department: "",
    city: "",
    category: "agricultura",
    image_url: "",
  })

  useEffect(() => {
    async function loadOrg() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, email, password_hash")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()
      setOrganization(data || null)
      setLoadingOrg(false)

      if (data) {
        const session = localStorage.getItem(`org_session_${data.id}`)
        if (session) {
          setIsAuthenticated(true)
          loadEvents(data.id)
        }
      }
    }
    loadOrg()
  }, [slug])

  const loadEvents = async (organizationId: string) => {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("events")
      .select("id, title, date, end_date, time, location, category, is_approved")
      .eq("organization_id", organizationId)
      .order("date", { ascending: false })
    setEvents(data || [])
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    if (!organization) return

    if (
      loginEmail.trim().toLowerCase() === organization.email.toLowerCase() &&
      loginPassword.trim() === organization.password_hash.trim()
    ) {
      localStorage.setItem(`org_session_${organization.id}`, JSON.stringify({ email: organization.email }))
      setIsAuthenticated(true)
      loadEvents(organization.id)
    } else {
      setLoginError("Credenciales incorrectas")
    }
  }

  const handleLogout = () => {
    if (organization) localStorage.removeItem(`org_session_${organization.id}`)
    setIsAuthenticated(false)
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const compressedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
      const supabase = createBrowserClient()
      const fileName = `org-event-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage.from("event-images").upload(fileName, compressedFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName)
      setNewEvent((prev) => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error al subir la imagen. Intenta de nuevo.")
    } finally {
      setUploadingImage(false)
    }
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return
    setSavingEvent(true)
    try {
      const supabase = createBrowserClient()
      const eventSlug = generateSlug(newEvent.title) + "-" + Date.now().toString(36)

      await supabase.from("events").insert({
        title: newEvent.title,
        slug: eventSlug,
        description: newEvent.description,
        long_description: newEvent.description,
        date: newEvent.date,
        end_date: newEvent.end_date || null,
        time: newEvent.time,
        location: newEvent.location,
        department: newEvent.department || null,
        city: newEvent.city || null,
        category: newEvent.category,
        contact_email: organization.email,
        image_url: newEvent.image_url || null,
        is_approved: true,
        is_premium: false,
        organization_id: organization.id,
      })

      setNewEvent({
        title: "",
        description: "",
        date: "",
        end_date: "",
        time: "",
        location: "",
        department: "",
        city: "",
        category: "agricultura",
        image_url: "",
      })
      loadEvents(organization.id)
      alert("Evento creado exitosamente")
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Error al crear el evento")
    } finally {
      setSavingEvent(false)
    }
  }

  const deleteEvent = async (id: string) => {
    if (!organization || !confirm("¿Seguro que deseas eliminar este evento?")) return
    const supabase = createBrowserClient()
    await supabase.from("events").delete().eq("id", id)
    loadEvents(organization.id)
  }

  if (loadingOrg) {
    return <div className="min-h-screen flex items-center justify-center" />
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Organizacion no encontrada</h1>
        <Link href="/">
          <Button className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-sm">
          <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Panel de {organization.name}</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus eventos</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Contraseña</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}
              <Button type="submit" className="w-full">
                Ingresar
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center justify-between px-4">
        <Link href={`/organizador/${slug}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {organization.name}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h2 className="font-bold text-lg mb-4">Crear evento</h2>
          <form onSubmit={createEvent} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titulo del evento *</label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Nombre del evento"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fecha inicio *</label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fecha fin (opcional)</label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Hora *</label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Categoria *</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ubicacion (nombre del lugar) *</label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Ej: Centro de Convenciones Mariscal"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Departamento *</label>
                <select
                  value={newEvent.department}
                  onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value, city: "" })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ciudad *</label>
                <select
                  value={newEvent.city}
                  onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                  disabled={!newEvent.department}
                >
                  <option value="">Seleccionar ciudad</option>
                  {newEvent.department && getCities(newEvent.department).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripcion *</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                rows={3}
                placeholder="Descripcion del evento"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Imagen del evento</label>
              <div className="flex items-center gap-4">
                {newEvent.image_url && (
                  <img src={newEvent.image_url} alt="Preview" className="w-24 h-16 object-cover rounded-lg" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                  <Upload className="h-4 w-4" />
                  {uploadingImage ? "Subiendo..." : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={savingEvent}>
              {savingEvent ? "Guardando..." : "Crear evento"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Tus eventos</h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Todavia no creaste ningun evento</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border-2 border-border">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.date}{event.end_date ? ` al ${event.end_date}` : ""} — {event.location}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500 transition-all shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
