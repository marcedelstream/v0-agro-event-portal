"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  LogOut,
  Calendar,
  Mail,
  XCircle,
  ChevronRight,
  Store,
  ImageIcon,
  CheckCircle,
  Plus,
  Star,
  Upload,
  Trash2,
  Edit,
  MessageSquare,
  X,
  LinkIcon,
  Menu,
  Search,
  ArrowUpDown,
  Filter,
  SortAsc,
  SortDesc,
  LayoutDashboard,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image-utils"
import { categoryLabels } from "@/lib/events-data"
import { departmentsList, getCities, southAmericanCountries } from "@/lib/paraguay-data"

type Tab = "dashboard" | "events" | "approved-events" | "providers" | "contacts" | "event-contacts" | "banners" | "create-event" | "gallery" | "organizations"

interface EventSubmission {
  id: string
  event_name: string
  description: string
  event_date: string
  event_time: string
  location: string
  department?: string
  city?: string
  maps_url?: string
  category: string
  contact_email: string
  contact_phone: string
  contact_name: string
  status: string
  created_at: string
  image_url: string | null
  end_date?: string
}

interface ProviderSubmission {
  id: string
  business_name: string
  category: string
  contact_email: string
  contact_phone: string
  contact_name: string
  website: string | null
  description: string
  status: string
  created_at: string
}

interface ApprovedEvent {
  id: string
  title: string
  slug: string | null
  date: string
  end_date?: string
  time: string
  location: string
  department: string
  city: string
  maps_url: string | null
  category: string
  description: string
  long_description: string
  is_premium: boolean
  is_approved: boolean
  image_url: string | null
  contact_email: string
  contact_phone: string
  allow_contact_form: boolean
  important_links: { label: string; url: string }[]
  internal_banner_url: string | null
  gacetilla_titulo?: string
  gacetilla_imagen?: string
  gacetilla_texto?: string
}

interface ApprovedProvider {
  id: string
  name: string
  category: string
  contact_email: string
  contact_phone: string
  is_approved: boolean
}

interface GeneralContact {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  created_at: string
}

interface EventContactRequest {
  id: string
  event_id: string
  contact_type: string
  name: string
  email: string
  phone: string
  message: string
  status: string
  created_at: string
  event_title?: string
}

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string
  is_active: boolean
  display_order: number
  event_id?: string
}

interface Organization {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  email: string
  password_hash: string
  is_active: boolean
  created_at: string
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")

  const [eventSubmissions, setEventSubmissions] = useState<EventSubmission[]>([])
  const [providerSubmissions, setProviderSubmissions] = useState<ProviderSubmission[]>([])
  const [approvedEvents, setApprovedEvents] = useState<ApprovedEvent[]>([])
  const [approvedProviders, setApprovedProviders] = useState<ApprovedProvider[]>([])
  const [generalContacts, setGeneralContacts] = useState<GeneralContact[]>([])
  const [eventContacts, setEventContacts] = useState<EventContactRequest[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const [selectedEvent, setSelectedEvent] = useState<EventSubmission | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<ProviderSubmission | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  const [editingEvent, setEditingEvent] = useState<ApprovedEvent | null>(null)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [uploadingEditOrgAvatar, setUploadingEditOrgAvatar] = useState(false)

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filtros y busqueda para lista de eventos publicados
  const [eventsSearch, setEventsSearch] = useState("")
  const [eventsFilterCategory, setEventsFilterCategory] = useState("")
  const [eventsSortField, setEventsSortField] = useState<"date" | "title" | "created_at">("date")
  const [eventsSortDir, setEventsSortDir] = useState<"asc" | "desc">("desc")

  // Formulario para crear evento
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    long_description: "",
    date: "",
    end_date: "",
    time: "",
    location: "",
    department: "",
    city: "",
    maps_url: "",
    category: "agricultura",
    contact_email: "",
    contact_phone: "",
    is_premium: false,
    image_url: "",
    allow_contact_form: true,
    important_links: [] as { label: string; url: string }[],
    internal_banner_url: "",
  })
  const [newLinkLabel, setNewLinkLabel] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [editLinkLabel, setEditLinkLabel] = useState("")
  const [editLinkUrl, setEditLinkUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)

  const [newBanner, setNewBanner] = useState({
    title: "",
    image_url: "",
    link_url: "",
    event_id: "",
  })
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [savingBanner, setSavingBanner] = useState(false)

  const [newOrganization, setNewOrganization] = useState({
    name: "",
    slug: "",
    avatar_url: "",
    email: "",
    password_hash: "",
  })
  const [uploadingOrgAvatar, setUploadingOrgAvatar] = useState(false)
  const [savingOrganization, setSavingOrganization] = useState(false)

  // Galeria
  const [galleryEventId, setGalleryEventId] = useState("")
  const [galleryImages, setGalleryImages] = useState<{id: string; image_url: string; caption?: string}[]>([])
  const [galleryCaption, setGalleryCaption] = useState("")
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session")
    if (adminSession) {
      setIsAuthenticated(true)
      loadData()
    }
    setIsLoading(false)
  }, [])

  const loadData = async () => {
    const supabase = createBrowserClient()

    const [
      eventsRes,
      providersRes,
      approvedEventsRes,
      approvedProvidersRes,
      generalContactsRes,
      eventContactsRes,
      bannersRes,
      organizationsRes,
    ] = await Promise.all([
      supabase.from("event_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("provider_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("date", { ascending: false }),
      supabase.from("providers").select("*").order("created_at", { ascending: false }),
      supabase.from("general_contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("event_contact_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("banners").select("*").order("display_order"),
      supabase.from("organizations").select("*").order("name"),
    ])

    if (eventsRes.data) setEventSubmissions(eventsRes.data)
    if (providersRes.data) setProviderSubmissions(providersRes.data)
    if (approvedEventsRes.data) setApprovedEvents(approvedEventsRes.data)
    if (approvedProvidersRes.data) setApprovedProviders(approvedProvidersRes.data)
    if (generalContactsRes.data) setGeneralContacts(generalContactsRes.data)
    if (bannersRes.data) setBanners(bannersRes.data)
    if (organizationsRes.data) setOrganizations(organizationsRes.data)

    if (eventContactsRes.data && approvedEventsRes.data) {
      const contactsWithTitles = eventContactsRes.data.map((contact) => {
        const event = approvedEventsRes.data?.find((e) => e.id === contact.event_id)
        return { ...contact, event_title: event?.title || "Evento desconocido" }
      })
      setEventContacts(contactsWithTitles)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const supabase = createBrowserClient()
      const { data: admin, error } = await supabase
        .from("admins")
        .select("*")
        .eq("email", loginEmail.trim().toLowerCase())
        .single()

      if (error || !admin) {
        setLoginError("Credenciales incorrectas")
        return
      }

      if (admin.password_hash === loginPassword) {
        localStorage.setItem("admin_session", JSON.stringify({ email: admin.email }))
        setIsAuthenticated(true)
        loadData()
      } else {
        setLoginError("Credenciales incorrectas")
      }
    } catch {
      setLoginError("Error al iniciar sesion")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_session")
    setIsAuthenticated(false)
  }

  const handleImageUpload = async (file: File, type: "event" | "banner" | "edit-event" | "internal-banner" | "edit-internal-banner" | "edit-gacetilla" | "organization" | "edit-organization") => {
    if (type === "event" || type === "internal-banner") setUploadingImage(true)
    else if (type === "banner") setUploadingBanner(true)
    else if (type === "organization") setUploadingOrgAvatar(true)
    else if (type === "edit-organization") setUploadingEditOrgAvatar(true)

    try {
      // Comprimir imagen antes de subir (max 1200px, calidad 85%)
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      })
      
      const supabase = createBrowserClient()
      const fileName = `${type}-${Date.now()}.jpg`
      const bucketName = "event-images"

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, compressedFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName)

      if (type === "event") {
        setNewEvent((prev) => ({ ...prev, image_url: publicUrl }))
      } else if (type === "banner") {
        setNewBanner((prev) => ({ ...prev, image_url: publicUrl }))
      } else if (type === "edit-event" && editingEvent) {
        setEditingEvent((prev) => (prev ? { ...prev, image_url: publicUrl } : null))
      } else if (type === "internal-banner") {
        setNewEvent((prev) => ({ ...prev, internal_banner_url: publicUrl }))
  } else if (type === "edit-internal-banner" && editingEvent) {
    setEditingEvent((prev) => (prev ? { ...prev, internal_banner_url: publicUrl } : null))
  } else if (type === "edit-gacetilla" && editingEvent) {
    setEditingEvent((prev) => (prev ? { ...prev, gacetilla_imagen: publicUrl } : null))
  } else if (type === "organization") {
    setNewOrganization((prev) => ({ ...prev, avatar_url: publicUrl }))
  } else if (type === "edit-organization" && editingOrganization) {
    setEditingOrganization((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null))
  }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error al subir la imagen. Intenta de nuevo.")
    } finally {
      if (type === "event" || type === "internal-banner") setUploadingImage(false)
      else if (type === "banner") setUploadingBanner(false)
      else if (type === "organization") setUploadingOrgAvatar(false)
      else if (type === "edit-organization") setUploadingEditOrgAvatar(false)
    }
  }

  const approveEvent = async (submission: EventSubmission, markAsPremium: boolean) => {
    const supabase = createBrowserClient()
    const slug = generateSlug(submission.event_name) + "-" + Date.now().toString(36)

await supabase.from("events").insert({
        title: submission.event_name,
        slug: slug,
        description: submission.description,
        long_description: submission.description,
        date: submission.event_date,
        end_date: submission.end_date || null,
        time: submission.event_time,
        location: submission.location,
        department: submission.department || null,
        city: submission.city || null,
        maps_url: submission.maps_url || null,
        category: submission.category,
        contact_email: submission.contact_email,
        contact_phone: submission.contact_phone,
        image_url: submission.image_url,
        is_approved: true,
        is_premium: markAsPremium,
      })

    await supabase.from("event_submissions").update({ status: "approved" }).eq("id", submission.id)

    setSelectedEvent(null)
    setIsPremium(false)
    loadData()
  }

  const rejectEvent = async (id: string) => {
    const supabase = createBrowserClient()
    await supabase.from("event_submissions").update({ status: "rejected" }).eq("id", id)
    setSelectedEvent(null)
    loadData()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return
    const supabase = createBrowserClient()
    await supabase.from("events").delete().eq("id", id)
    loadData()
  }

  const updateEvent = async () => {
    if (!editingEvent) return
    const supabase = createBrowserClient()

  await supabase
    .from("events")
    .update({
      title: editingEvent.title,
      description: editingEvent.description,
      long_description: editingEvent.long_description,
      date: editingEvent.date,
      end_date: editingEvent.end_date || null,
      time: editingEvent.time,
      location: editingEvent.location,
      department: editingEvent.department,
      city: editingEvent.city,
      maps_url: editingEvent.maps_url || null,
      category: editingEvent.category,
      image_url: editingEvent.image_url,
      is_premium: editingEvent.is_premium,
      allow_contact_form: editingEvent.allow_contact_form,
      contact_email: editingEvent.contact_email,
      contact_phone: editingEvent.contact_phone,
      important_links: editingEvent.important_links || [],
      internal_banner_url: editingEvent.internal_banner_url || null,
      gacetilla_titulo: editingEvent.gacetilla_titulo || null,
      gacetilla_imagen: editingEvent.gacetilla_imagen || null,
      gacetilla_texto: editingEvent.gacetilla_texto || null,
    })
    .eq("id", editingEvent.id)

    setEditingEvent(null)
    setEditLinkLabel("")
    setEditLinkUrl("")
    loadData()
    alert("Evento actualizado")
  }

  const toggleEventPremium = async (id: string, currentPremium: boolean) => {
    const supabase = createBrowserClient()
    await supabase.from("events").update({ is_premium: !currentPremium }).eq("id", id)
    loadData()
  }

  const approveProvider = async (submission: ProviderSubmission) => {
    const supabase = createBrowserClient()

    await supabase.from("providers").insert({
      name: submission.business_name,
      category: submission.category,
      contact_email: submission.contact_email,
      contact_phone: submission.contact_phone,
      website: submission.website,
      description: submission.description,
      is_approved: true,
    })

    await supabase.from("provider_submissions").update({ status: "approved" }).eq("id", submission.id)

    setSelectedProvider(null)
    loadData()
  }

  const rejectProvider = async (id: string) => {
    const supabase = createBrowserClient()
    await supabase.from("provider_submissions").update({ status: "rejected" }).eq("id", id)
    setSelectedProvider(null)
    loadData()
  }

  const deleteProvider = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return
    const supabase = createBrowserClient()
    await supabase.from("providers").delete().eq("id", id)
    loadData()
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEvent(true)

    try {
      const supabase = createBrowserClient()
      const slug = generateSlug(newEvent.title) + "-" + Date.now().toString(36)

      await supabase.from("events").insert({
        title: newEvent.title,
        slug: slug,
        description: newEvent.description,
        long_description: newEvent.long_description || newEvent.description,
        date: newEvent.date,
        end_date: newEvent.end_date || null,
        time: newEvent.time,
        location: newEvent.location,
        department: newEvent.department || null,
        city: newEvent.city || null,
        maps_url: newEvent.maps_url || null,
        category: newEvent.category,
        contact_email: newEvent.contact_email,
        contact_phone: newEvent.contact_phone,
        is_approved: true,
        is_premium: newEvent.is_premium,
        image_url: newEvent.image_url || null,
        allow_contact_form: newEvent.allow_contact_form,
        important_links: newEvent.important_links,
        internal_banner_url: newEvent.internal_banner_url || null,
      })

      setNewEvent({
        title: "",
        description: "",
        long_description: "",
        date: "",
        end_date: "",
        time: "",
        location: "",
        department: "",
        city: "",
        maps_url: "",
        category: "agricultura",
        contact_email: "",
        contact_phone: "",
        is_premium: false,
        image_url: "",
        allow_contact_form: true,
        important_links: [],
        internal_banner_url: "",
      })
      setNewLinkLabel("")
      setNewLinkUrl("")
      alert("Evento creado exitosamente")
      setActiveTab("events")
      loadData()
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Error al crear el evento")
    } finally {
      setSavingEvent(false)
    }
  }

  const createBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBanner(true)

    try {
      const supabase = createBrowserClient()

      // Si hay un evento seleccionado, usar su info
      const bannerData = {
        title: newBanner.title,
        image_url: newBanner.image_url,
        link_url: newBanner.link_url,
        is_active: true,
        display_order: banners.length + 1,
        event_id: newBanner.event_id || null,
      }

      if (newBanner.event_id) {
        const selectedEvent = approvedEvents.find((e) => e.id === newBanner.event_id)
        if (selectedEvent) {
          bannerData.title = bannerData.title || selectedEvent.title
          bannerData.image_url = bannerData.image_url || selectedEvent.image_url || ""
          bannerData.link_url = bannerData.link_url || `/evento/${selectedEvent.slug}`
        }
      }

      await supabase.from("banners").insert(bannerData)

      setNewBanner({ title: "", image_url: "", link_url: "", event_id: "" })
      alert("Banner creado exitosamente")
      loadData()
    } catch (error) {
      console.error("Error creating banner:", error)
      alert("Error al crear el banner")
    } finally {
      setSavingBanner(false)
    }
  }

  const toggleBanner = async (id: string, isActive: boolean) => {
    const supabase = createBrowserClient()
    await supabase.from("banners").update({ is_active: !isActive }).eq("id", id)
    loadData()
  }

  const deleteBanner = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este banner?")) return
    const supabase = createBrowserClient()
    await supabase.from("banners").delete().eq("id", id)
    loadData()
  }

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= banners.length) return

    const supabase = createBrowserClient()
    const a = banners[index]
    const b = banners[swapIndex]

    // Actualizar estado local inmediatamente para UX fluida
    const updated = [...banners]
    updated[index] = { ...a, display_order: b.display_order }
    updated[swapIndex] = { ...b, display_order: a.display_order }
    updated.sort((x, y) => x.display_order - y.display_order)
    setBanners(updated)

    // Persistir en Supabase
    await Promise.all([
      supabase.from("banners").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("banners").update({ display_order: a.display_order }).eq("id", b.id),
    ])
  }

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingOrganization(true)

    try {
      const supabase = createBrowserClient()
      const slug = newOrganization.slug.trim() || generateSlug(newOrganization.name)

      await supabase.from("organizations").insert({
        name: newOrganization.name,
        slug,
        avatar_url: newOrganization.avatar_url || null,
        email: newOrganization.email.trim().toLowerCase(),
        password_hash: newOrganization.password_hash,
        is_active: true,
      })

      setNewOrganization({ name: "", slug: "", avatar_url: "", email: "", password_hash: "" })
      alert("Organizacion creada exitosamente")
      loadData()
    } catch (error) {
      console.error("Error creating organization:", error)
      alert("Error al crear la organizacion. Verifica que el email no este ya en uso.")
    } finally {
      setSavingOrganization(false)
    }
  }

  const updateOrganization = async () => {
    if (!editingOrganization) return
    const supabase = createBrowserClient()

    await supabase
      .from("organizations")
      .update({
        name: editingOrganization.name,
        slug: editingOrganization.slug,
        avatar_url: editingOrganization.avatar_url || null,
        email: editingOrganization.email.trim().toLowerCase(),
        password_hash: editingOrganization.password_hash,
      })
      .eq("id", editingOrganization.id)

    setEditingOrganization(null)
    loadData()
  }

  const toggleOrganization = async (id: string, isActive: boolean) => {
    const supabase = createBrowserClient()
    await supabase.from("organizations").update({ is_active: !isActive }).eq("id", id)
    loadData()
  }

  const deleteOrganization = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta organizacion? Sus eventos no se borraran, pero quedaran sin organizacion asociada.")) return
    const supabase = createBrowserClient()
    await supabase.from("organizations").delete().eq("id", id)
    loadData()
  }

  const loadGallery = async (eventId: string) => {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("event_gallery")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
    setGalleryImages(data || [])
  }

const uploadGalleryImage = async (file: File) => {
  if (!galleryEventId) { alert("Selecciona un evento"); return }
  setUploadingGallery(true)
  try {
    // Comprimir imagen antes de subir
    const compressedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
    const supabase = createBrowserClient()
    const fileName = `gallery-${Date.now()}.jpg`
    const { data: uploadData } = await supabase.storage.from("event-images").upload(fileName, compressedFile)
    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName)
      await supabase.from("event_gallery").insert({
        event_id: galleryEventId,
        image_url: publicUrl,
        caption: galleryCaption || null,
        display_order: galleryImages.length,
      })
      setGalleryCaption("")
    loadGallery(galleryEventId)
  }
  } catch (error) {
    console.error("Error uploading gallery image:", error)
    alert("Error al subir la imagen")
  }
  setUploadingGallery(false)
  }

  const deleteGalleryImage = async (id: string) => {
    const supabase = createBrowserClient()
    await supabase.from("event_gallery").delete().eq("id", id)
    if (galleryEventId) loadGallery(galleryEventId)
  }

  const pendingEvents = eventSubmissions.filter((e) => e.status === "pending").length
  const pendingProviders = providerSubmissions.filter((p) => p.status === "pending").length
  const pendingEventContacts = eventContacts.filter((c) => c.status === "pending").length

  // Eventos filtrados y ordenados
  const filteredApprovedEvents = useMemo(() => {
    let list = [...approvedEvents]
    if (eventsSearch.trim()) {
      const q = eventsSearch.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          (e.department || "").toLowerCase().includes(q) ||
          (e.city || "").toLowerCase().includes(q),
      )
    }
    if (eventsFilterCategory) {
      list = list.filter((e) => e.category === eventsFilterCategory)
    }
    list.sort((a, b) => {
      let valA: string = ""
      let valB: string = ""
      if (eventsSortField === "date") { valA = a.date; valB = b.date }
      else if (eventsSortField === "title") { valA = a.title.toLowerCase(); valB = b.title.toLowerCase() }
      if (eventsSortDir === "asc") return valA < valB ? -1 : valA > valB ? 1 : 0
      return valA > valB ? -1 : valA < valB ? 1 : 0
    })
    return list
  }, [approvedEvents, eventsSearch, eventsFilterCategory, eventsSortField, eventsSortDir])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <h1 className="text-xl font-bold">Panel de Admin</h1>
              <p className="text-sm text-muted-foreground">Eventos Agro</p>
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
    <div className="min-h-screen bg-background flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300",
          "md:translate-x-0 md:static md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Eventos Agro</p>
              <p className="text-xs text-muted-foreground">Panel Admin</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Resumen", badge: 0 },
            { id: "events", icon: Calendar, label: "Solicitudes", badge: pendingEvents },
            { id: "create-event", icon: Plus, label: "Crear Evento", badge: 0 },
            { id: "approved-events", icon: CheckCircle, label: "Eventos Publicados", badge: 0 },
            { id: "providers", icon: Store, label: "Proveedores", badge: pendingProviders },
            { id: "event-contacts", icon: MessageSquare, label: "Consultas", badge: pendingEventContacts },
            { id: "contacts", icon: Mail, label: "Contacto General", badge: 0 },
            { id: "banners", icon: ImageIcon, label: "Banners", badge: 0 },
            { id: "gallery", icon: ImageIcon, label: "Galeria", badge: 0 },
            { id: "organizations", icon: Users, label: "Organizaciones", badge: 0 },
          ].map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as Tab); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
              {badge > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-bold",
                  activeTab === id ? "bg-white/20 text-white" : "bg-red-500 text-white"
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-base truncate">
            {activeTab === "dashboard" && "Resumen"}
            {activeTab === "events" && "Solicitudes de Eventos"}
            {activeTab === "create-event" && "Crear Evento"}
            {activeTab === "approved-events" && "Eventos Publicados"}
            {activeTab === "providers" && "Proveedores"}
            {activeTab === "event-contacts" && "Consultas"}
            {activeTab === "contacts" && "Contacto General"}
            {activeTab === "banners" && "Banners Destacados"}
            {activeTab === "gallery" && "Galeria de Fotos"}
            {activeTab === "organizations" && "Organizaciones"}
          </h1>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Dashboard resumen */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Solicitudes pendientes", value: pendingEvents, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { label: "Eventos publicados", value: approvedEvents.length, color: "text-green-500", bg: "bg-green-500/10" },
                  { label: "Consultas nuevas", value: pendingEventContacts, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Proveedores pendientes", value: pendingProviders, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={cn("rounded-2xl p-4 border border-border", bg)}>
                    <p className={cn("text-2xl font-bold", color)}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Selecciona una seccion del menu lateral para gestionar el contenido.</p>
            </div>
          )}

          {/* Solicitudes de Eventos */}
          {activeTab === "events" && (
            <div className="space-y-3">
              {eventSubmissions.filter((e) => e.status === "pending").length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              ) : (
                eventSubmissions.filter((e) => e.status === "pending").map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedEvent(submission)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-all text-left"
                  >
                    <div>
                      <p className="font-bold">{submission.event_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {submission.event_date} — {submission.location}
                      </p>
                      <p className="text-xs text-muted-foreground">{submission.contact_email}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Eventos Publicados con filtros */}
          {activeTab === "approved-events" && (
            <div className="space-y-4">
              {/* Barra de filtros */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={eventsSearch}
                    onChange={(e) => setEventsSearch(e.target.value)}
                    placeholder="Buscar por titulo, ciudad, departamento..."
                    className="pl-9 h-10"
                  />
                </div>
                <select
                  value={eventsFilterCategory}
                  onChange={(e) => setEventsFilterCategory(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[150px]"
                >
                  <option value="">Todas las categorias</option>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={eventsSortField}
                    onChange={(e) => setEventsSortField(e.target.value as any)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="date">Ordenar por fecha</option>
                    <option value="title">Ordenar por titulo</option>
                  </select>
                  <button
                    onClick={() => setEventsSortDir((d) => d === "asc" ? "desc" : "asc")}
                    className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition-colors"
                    title={eventsSortDir === "asc" ? "Ascendente" : "Descendente"}
                  >
                    {eventsSortDir === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{filteredApprovedEvents.length} evento(s)</p>

              {filteredApprovedEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Sin resultados para los filtros aplicados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredApprovedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border-2 border-border"
                    >
                      {event.image_url && (
                        <img src={event.image_url} alt={event.title} className="w-14 h-14 rounded-lg object-cover shrink-0 hidden sm:block" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold truncate">{event.title}</p>
                          {event.is_premium && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {categoryLabels[event.category] || event.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.date}{event.end_date ? ` al ${event.end_date}` : ""} — {event.location}
                        </p>
                        {event.city && <p className="text-xs text-muted-foreground">{event.city}, {event.department}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleEventPremium(event.id, event.is_premium)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            event.is_premium ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground hover:text-yellow-500",
                          )}
                          title={event.is_premium ? "Quitar destacado" : "Destacar"}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Tab: Crear Evento */}
        {activeTab === "create-event" && (
          <div>
            <h2 className="font-bold text-lg mb-4">Crear Nuevo Evento</h2>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título del evento *</label>
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
                  <p className="text-xs text-muted-foreground mt-1">Para eventos de varios días</p>
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
                  <label className="text-sm font-medium mb-1.5 block">Categoría *</label>
                  <select
                    value={Object.keys(categoryLabels).includes(newEvent.category) ? newEvent.category : "otro"}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value === "otro" ? "" : e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {(newEvent.category === "" || !Object.keys(categoryLabels).filter(k => k !== "otro").includes(newEvent.category)) && (
                    <Input
                      className="mt-2"
                      value={newEvent.category === "otro" ? "" : newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      placeholder="Nombre de la categoría personalizada"
                    />
                  )}
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
                  <label className="text-sm font-medium mb-1.5 block">Departamento / País *</label>
                  <select
                    value={newEvent.department}
                    onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value, city: "" })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <optgroup label="Paraguay">
                      {departmentsList.map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Internacional">
                      <option value="Internacional">Internacional</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {newEvent.department === "Internacional" ? "País *" : "Ciudad *"}
                  </label>
                  {newEvent.department === "Internacional" ? (
                    <>
                      <select
                        value={newEvent.city}
                        onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        required
                      >
                        <option value="">Seleccionar país</option>
                        {southAmericanCountries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </>
                  ) : (
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
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Link de Google Maps (opcional)</label>
                <Input
                  value={newEvent.maps_url}
                  onChange={(e) => setNewEvent({ ...newEvent, maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">Pega el link de Google Maps para que los usuarios puedan abrir la ubicacion directamente.</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción corta *</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                  rows={2}
                  placeholder="Breve descripción"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción completa</label>
                <textarea
                  value={newEvent.long_description}
                  onChange={(e) => setNewEvent({ ...newEvent, long_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                  rows={4}
                  placeholder="Descripción detallada del evento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email contacto</label>
                  <Input
                    type="email"
                    value={newEvent.contact_email}
                    onChange={(e) => setNewEvent({ ...newEvent, contact_email: e.target.value })}
                    placeholder="contacto@evento.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Teléfono contacto</label>
                  <Input
                    value={newEvent.contact_phone}
                    onChange={(e) => setNewEvent({ ...newEvent, contact_phone: e.target.value })}
                    placeholder="+595 xxx xxx"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Imagen del evento</label>
                <p className="text-xs text-muted-foreground mb-2">Medida recomendada: 1200x630px</p>
                <div className="flex items-center gap-4">
                  {newEvent.image_url && (
                    <img
                      src={newEvent.image_url || "/placeholder.svg"}
                      alt="Preview"
                      className="w-24 h-16 object-cover rounded-lg"
                    />
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
                        if (file) handleImageUpload(file, "event")
                      }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30">
                <input
                  type="checkbox"
                  id="is_premium"
                  checked={newEvent.is_premium}
                  onChange={(e) => setNewEvent({ ...newEvent, is_premium: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_premium" className="flex items-center gap-2 cursor-pointer">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Evento destacado / Premium</span>
                </label>
              </div>

              {/* Opcion de formulario de contacto */}
              <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allow_contact_form"
                    checked={newEvent.allow_contact_form}
                    onChange={(e) => setNewEvent({ ...newEvent, allow_contact_form: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="allow_contact_form" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Permitir formulario de contacto</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si está desactivado, se mostrarán el email y teléfono de contacto directo en la página del evento.
                </p>
              </div>

              {/* Links importantes */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links importantes (web, meet, redes, etc.)
                </label>
                {newEvent.important_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{link.label}: {link.url}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = newEvent.important_links.filter((_, i) => i !== index)
                        setNewEvent({ ...newEvent, important_links: updated })
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiqueta (ej: Sitio web)"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newLinkLabel && newLinkUrl) {
                        setNewEvent({
                          ...newEvent,
                          important_links: [...newEvent.important_links, { label: newLinkLabel, url: newLinkUrl }]
                        })
                        setNewLinkLabel("")
                        setNewLinkUrl("")
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Banner interno del evento */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Banner interno del evento (opcional)
                </label>
                <p className="text-xs text-muted-foreground mb-2">Se mostrará debajo de la descripción. Medida: 1200x400px</p>
                <div className="flex items-center gap-4">
                  {newEvent.internal_banner_url && (
                    <img
                      src={newEvent.internal_banner_url || "/placeholder.svg"}
                      alt="Banner preview"
                      className="w-32 h-12 object-cover rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                    <Upload className="h-4 w-4" />
                    Subir banner interno
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, "internal-banner")
                      }}
                    />
                  </label>
                  {newEvent.internal_banner_url && (
                    <button
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, internal_banner_url: "" })}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={savingEvent}>
                {savingEvent ? "Guardando..." : "Crear Evento"}
              </Button>
            </form>
          </div>
        )}

        {/* Tab: Proveedores */}
        {activeTab === "providers" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-3">Solicitudes de Proveedores</h2>
              {providerSubmissions.filter((p) => p.status === "pending").length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay solicitudes pendientes</p>
              ) : (
                <div className="space-y-2">
                  {providerSubmissions
                    .filter((p) => p.status === "pending")
                    .map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => setSelectedProvider(submission)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-all text-left"
                      >
                        <div>
                          <p className="font-bold">{submission.business_name}</p>
                          <p className="text-sm text-muted-foreground">{submission.category}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-bold text-lg mb-3">Proveedores Aprobados</h2>
              {approvedProviders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay proveedores aprobados</p>
              ) : (
                <div className="space-y-2">
                  {approvedProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border-2 border-border"
                    >
                      <div>
                        <p className="font-bold">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.category}</p>
                      </div>
                      <button
                        onClick={() => deleteProvider(provider.id)}
                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Consultas de Eventos */}
        {activeTab === "event-contacts" && (
          <div>
            <h2 className="font-bold text-lg mb-3">Consultas de Eventos</h2>
            {eventContacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay consultas</p>
            ) : (
              <div className="space-y-3">
                {eventContacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-xl bg-card border-2 border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-1 rounded-full",
                            contact.contact_type === "info" && "bg-blue-500/20 text-blue-500",
                            contact.contact_type === "sponsor" && "bg-yellow-500/20 text-yellow-500",
                            contact.contact_type === "stand" && "bg-green-500/20 text-green-500",
                          )}
                        >
                          {contact.contact_type === "info" && "Información"}
                          {contact.contact_type === "sponsor" && "Auspicio"}
                          {contact.contact_type === "stand" && "Stand"}
                        </span>
                        <p className="font-bold mt-2">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.event_title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{contact.message || "Sin mensaje"}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{contact.email}</span>
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Contacto General */}
        {activeTab === "contacts" && (
          <div>
            <h2 className="font-bold text-lg mb-3">Mensajes de Contacto General</h2>
            {generalContacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay mensajes</p>
            ) : (
              <div className="space-y-3">
                {generalContacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-xl bg-card border-2 border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{contact.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{contact.email}</span>
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Banners */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-4">Crear Banner</h2>
              <form onSubmit={createBanner} className="space-y-4 p-4 rounded-xl bg-card border-2 border-border">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Vincular a un evento (opcional)
                  </label>
                  <select
                    value={newBanner.event_id}
                    onChange={(e) => {
                      const eventId = e.target.value
                      setNewBanner({ ...newBanner, event_id: eventId })

                      // Auto-rellenar datos del evento seleccionado
                      if (eventId) {
                        const selected = approvedEvents.find((ev) => ev.id === eventId)
                        if (selected) {
                          setNewBanner((prev) => ({
                            ...prev,
                            event_id: eventId,
                            title: selected.title,
                            link_url: `/evento/${selected.slug}`,
                            image_url: selected.image_url || prev.image_url,
                          }))
                        }
                      }
                    }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">-- Sin vincular (banner personalizado) --</option>
                    {approvedEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {event.date}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si seleccionas un evento, se usará su título, imagen y link automáticamente
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Título del banner *</label>
                  <Input
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="Título promocional"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">URL destino *</label>
                  <Input
                    value={newBanner.link_url}
                    onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Imagen</label>
                  <p className="text-xs text-muted-foreground mb-2">Medida recomendada: 1200x400px</p>
                  <div className="flex items-center gap-4">
                    {newBanner.image_url && (
                      <img
                        src={newBanner.image_url || "/placeholder.svg"}
                        alt="Preview"
                        className="w-32 h-12 object-cover rounded-lg"
                      />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                      <Upload className="h-4 w-4" />
                      {uploadingBanner ? "Subiendo..." : "Subir imagen"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "banner")
                        }}
                        disabled={uploadingBanner}
                      />
                    </label>
                  </div>
                </div>
                <Button type="submit" disabled={savingBanner}>
                  {savingBanner ? "Guardando..." : "Crear Banner"}
                </Button>
              </form>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-3">Banners Existentes</h2>
              {banners.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay banners</p>
              ) : (
                <div className="space-y-3">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        banner.is_active ? "bg-card border-primary/50" : "bg-muted/50 border-border opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Botones de orden */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => moveBanner(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            title="Subir"
                          >
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => moveBanner(index, "down")}
                            disabled={index === banners.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            title="Bajar"
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>

                        {banner.image_url && (
                          <img
                            src={banner.image_url || "/placeholder.svg"}
                            alt={banner.title}
                            className="w-24 h-12 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{banner.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{banner.link_url}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">Posición {index + 1}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleBanner(banner.id, banner.is_active)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              banner.is_active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground",
                            )}
                            title={banner.is_active ? "Desactivar" : "Activar"}
                          >
                            {banner.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Galeria de fotos */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-card border-2 border-border space-y-4">
              <h2 className="font-bold text-base">Subir fotos a un evento</h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Seleccionar evento</label>
                <select
                  value={galleryEventId}
                  onChange={(e) => { setGalleryEventId(e.target.value); if (e.target.value) loadGallery(e.target.value) }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">-- Elige un evento --</option>
                  {approvedEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
                  ))}
                </select>
              </div>
              {galleryEventId && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Descripcion (opcional)</label>
                    <Input
                      value={galleryCaption}
                      onChange={(e) => setGalleryCaption(e.target.value)}
                      placeholder="Descripcion de la foto..."
                    />
                  </div>
                  <label className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 cursor-pointer hover:border-primary transition-colors",
                    uploadingGallery && "opacity-50 pointer-events-none"
                  )}>
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">{uploadingGallery ? "Subiendo..." : "Subir foto"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGalleryImage(f) }}
                    />
                  </label>
                </>
              )}
            </div>

            {galleryImages.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 text-sm text-muted-foreground">{galleryImages.length} foto(s) en la galeria</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video bg-muted">
                      <img src={img.image_url} alt={img.caption || "Foto"} className="w-full h-full object-cover" />
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-1.5 truncate">
                          {img.caption}
                        </div>
                      )}
                      <button
                        onClick={() => deleteGalleryImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "organizations" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-4">Crear Organizacion</h2>
              <form onSubmit={createOrganization} className="space-y-4 p-4 rounded-xl bg-card border-2 border-border">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nombre *</label>
                  <Input
                    value={newOrganization.name}
                    onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                    placeholder="Ej: Agroexpo Paraguay"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">URL (slug)</label>
                  <Input
                    value={newOrganization.slug}
                    onChange={(e) => setNewOrganization({ ...newOrganization, slug: e.target.value })}
                    placeholder={newOrganization.name ? generateSlug(newOrganization.name) : "agroexpo-paraguay"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si lo dejas vacio se genera automaticamente a partir del nombre. Define la URL /organizador/[slug]
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Foto de perfil</label>
                  <div className="flex items-center gap-4">
                    {newOrganization.avatar_url && (
                      <img
                        src={newOrganization.avatar_url || "/placeholder.svg"}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border-2 border-border"
                      />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                      <Upload className="h-4 w-4" />
                      {uploadingOrgAvatar ? "Subiendo..." : "Subir foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "organization")
                        }}
                        disabled={uploadingOrgAvatar}
                      />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email de acceso *</label>
                    <Input
                      type="email"
                      value={newOrganization.email}
                      onChange={(e) => setNewOrganization({ ...newOrganization, email: e.target.value })}
                      placeholder="organizacion@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Contraseña de acceso *</label>
                    <Input
                      type="text"
                      value={newOrganization.password_hash}
                      onChange={(e) => setNewOrganization({ ...newOrganization, password_hash: e.target.value })}
                      placeholder="Contraseña para su panel"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingOrganization}>
                  {savingOrganization ? "Guardando..." : "Crear Organizacion"}
                </Button>
              </form>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-3">Organizaciones Existentes</h2>
              {organizations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay organizaciones todavia</p>
              ) : (
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        org.is_active ? "bg-card border-primary/50" : "bg-muted/50 border-border opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shrink-0">
                          {org.avatar_url ? (
                            <img src={org.avatar_url} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">{org.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground truncate">/organizador/{org.slug} · {org.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingOrganization(org)}
                            className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleOrganization(org.id, org.is_active)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              org.is_active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground",
                            )}
                            title={org.is_active ? "Desactivar" : "Activar"}
                          >
                            {org.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => deleteOrganization(org.id)}
                            className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500 transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Modal: Detalle de solicitud de evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Solicitud de Evento</h3>
              <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{selectedEvent.event_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedEvent.event_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{selectedEvent.event_time}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{selectedEvent.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium">{categoryLabels[selectedEvent.category] || selectedEvent.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-sm">{selectedEvent.description}</p>
              </div>
              {selectedEvent.image_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Imagen</p>
                  <img
                    src={selectedEvent.image_url || "/placeholder.svg"}
                    alt="Evento"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">
                  {selectedEvent.contact_name} - {selectedEvent.contact_email}
                </p>
                {selectedEvent.contact_phone && (
                  <p className="text-sm text-muted-foreground">{selectedEvent.contact_phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 mt-4">
              <input
                type="checkbox"
                id="approve_premium"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="approve_premium" className="flex items-center gap-2 cursor-pointer">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Aprobar como evento destacado</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => rejectEvent(selectedEvent.id)}
                className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button onClick={() => approveEvent(selectedEvent, isPremium)} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle de solicitud de proveedor */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Solicitud de Proveedor</h3>
              <button onClick={() => setSelectedProvider(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{selectedProvider.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoría</p>
                <p className="font-medium">{selectedProvider.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-sm">{selectedProvider.description}</p>
              </div>
              {selectedProvider.website && (
                <div>
                  <p className="text-sm text-muted-foreground">Sitio web</p>
                  <p className="text-sm text-primary">{selectedProvider.website}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                <p className="font-medium">
                  {selectedProvider.contact_name} - {selectedProvider.contact_email}
                </p>
                {selectedProvider.contact_phone && (
                  <p className="text-sm text-muted-foreground">{selectedProvider.contact_phone}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => rejectProvider(selectedProvider.id)}
                className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button onClick={() => approveProvider(selectedProvider)} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar evento */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Editar Evento</h3>
              <button onClick={() => setEditingEvent(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Título</label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fecha inicio</label>
                  <Input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fecha fin</label>
                  <Input
                    type="date"
                    value={editingEvent.end_date || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Hora</label>
                  <Input
                    type="time"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Categoría</label>
                  <select
                    value={Object.keys(categoryLabels).includes(editingEvent.category) ? editingEvent.category : "otro"}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value === "otro" ? "" : e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {(editingEvent.category === "" || !Object.keys(categoryLabels).filter(k => k !== "otro").includes(editingEvent.category)) && (
                    <Input
                      className="mt-2"
                      value={editingEvent.category === "otro" ? "" : editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                      placeholder="Nombre de la categoría personalizada"
                    />
                  )}
                </div>
              </div>
<div>
  <label className="text-sm font-medium mb-1.5 block">Ubicacion (nombre del lugar)</label>
  <Input
  value={editingEvent.location}
  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm font-medium mb-1.5 block">Departamento</label>
      <select
        value={editingEvent.department || ""}
        onChange={(e) => setEditingEvent({ ...editingEvent, department: e.target.value, city: "" })}
        className="w-full h-10 px-3 rounded-md border border-input bg-background"
      >
        <option value="">Seleccionar</option>
        {departmentsList.map((dep) => (
          <option key={dep} value={dep}>{dep}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-sm font-medium mb-1.5 block">Ciudad</label>
      <select
        value={editingEvent.city || ""}
        onChange={(e) => setEditingEvent({ ...editingEvent, city: e.target.value })}
        className="w-full h-10 px-3 rounded-md border border-input bg-background"
        disabled={!editingEvent.department}
      >
        <option value="">Seleccionar</option>
        {editingEvent.department && getCities(editingEvent.department).map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>
  </div>
  <div>
    <label className="text-sm font-medium mb-1.5 block">Link de Google Maps</label>
    <Input
      value={editingEvent.maps_url || ""}
      onChange={(e) => setEditingEvent({ ...editingEvent, maps_url: e.target.value })}
      placeholder="https://maps.google.com/..."
    />
  </div>
  <div>
  <label className="text-sm font-medium mb-1.5 block">Descripción corta</label>
                <textarea
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descripción completa</label>
                <textarea
                  value={editingEvent.long_description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, long_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Imagen</label>
                <div className="flex items-center gap-4">
                  {editingEvent.image_url && (
                    <img
                      src={editingEvent.image_url || "/placeholder.svg"}
                      alt="Preview"
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                    <Upload className="h-4 w-4" />
                    Cambiar imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, "edit-event")
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30">
                <input
                  type="checkbox"
                  id="edit_premium"
                  checked={editingEvent.is_premium}
                  onChange={(e) => setEditingEvent({ ...editingEvent, is_premium: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="edit_premium" className="flex items-center gap-2 cursor-pointer">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Evento destacado / Premium</span>
                </label>
              </div>

              {/* Opcion formulario contacto */}
              <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit_allow_contact_form"
                    checked={editingEvent.allow_contact_form}
                    onChange={(e) => setEditingEvent({ ...editingEvent, allow_contact_form: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="edit_allow_contact_form" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Permitir formulario de contacto</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si desactivado, se mostraran email/telefono directo.
                </p>
              </div>

              {/* Contacto directo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email contacto</label>
                  <Input
                    type="email"
                    value={editingEvent.contact_email}
                    onChange={(e) => setEditingEvent({ ...editingEvent, contact_email: e.target.value })}
                    placeholder="contacto@evento.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Telefono contacto</label>
                  <Input
                    value={editingEvent.contact_phone}
                    onChange={(e) => setEditingEvent({ ...editingEvent, contact_phone: e.target.value })}
                    placeholder="+595 xxx xxx"
                  />
                </div>
              </div>

              {/* Links importantes */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links importantes
                </label>
                {(editingEvent.important_links || []).map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{link.label}: {link.url}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (editingEvent.important_links || []).filter((_, i) => i !== index)
                        setEditingEvent({ ...editingEvent, important_links: updated })
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiqueta"
                    value={editLinkLabel}
                    onChange={(e) => setEditLinkLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editLinkLabel && editLinkUrl) {
                        setEditingEvent({
                          ...editingEvent,
                          important_links: [...(editingEvent.important_links || []), { label: editLinkLabel, url: editLinkUrl }]
                        })
                        setEditLinkLabel("")
                        setEditLinkUrl("")
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Banner interno */}
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Banner interno del evento
                </label>
                <div className="flex items-center gap-4">
                  {editingEvent.internal_banner_url && (
                    <img
                      src={editingEvent.internal_banner_url || "/placeholder.svg"}
                      alt="Banner"
                      className="w-32 h-12 object-cover rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                    <Upload className="h-4 w-4" />
                    {editingEvent.internal_banner_url ? "Cambiar" : "Subir"} banner
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, "edit-internal-banner")
                      }}
                    />
                  </label>
                  {editingEvent.internal_banner_url && (
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, internal_banner_url: null })}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Gacetilla de prensa (premium) */}
              <div className="p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 space-y-3">
                <p className="text-sm font-bold flex items-center gap-2 text-blue-400">
                  <ImageIcon className="h-4 w-4" />
                  Gacetilla de prensa (funcion premium)
                </p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Titulo de la gacetilla</label>
                  <Input
                    value={editingEvent.gacetilla_titulo || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, gacetilla_titulo: e.target.value })}
                    placeholder="Titulo del comunicado..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Texto / cuerpo de la noticia</label>
                  <textarea
                    value={editingEvent.gacetilla_texto || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, gacetilla_texto: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none text-sm"
                    rows={5}
                    placeholder="Escribe aqui el contenido de la gacetilla..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Imagen de la gacetilla (opcional)</label>
                  <div className="flex items-center gap-3">
                    {editingEvent.gacetilla_imagen && (
                      <img src={editingEvent.gacetilla_imagen} alt="Gacetilla" className="w-20 h-14 object-cover rounded-lg" />
                    )}
                    <label className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 text-sm">
                      <Upload className="h-4 w-4" />
                      {editingEvent.gacetilla_imagen ? "Cambiar" : "Subir"} imagen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "edit-gacetilla")
                        }}
                      />
                    </label>
                    {editingEvent.gacetilla_imagen && (
                      <button
                        type="button"
                        onClick={() => setEditingEvent({ ...editingEvent, gacetilla_imagen: undefined })}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingEvent(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={updateEvent} className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingOrganization && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Editar Organizacion</h3>
              <button onClick={() => setEditingOrganization(null)} className="p-2 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nombre</label>
                <Input
                  value={editingOrganization.name}
                  onChange={(e) => setEditingOrganization({ ...editingOrganization, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">URL (slug)</label>
                <Input
                  value={editingOrganization.slug}
                  onChange={(e) => setEditingOrganization({ ...editingOrganization, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cuidado: si lo cambias, la URL /organizador/{editingOrganization.slug} dejara de funcionar y la nueva sera /organizador/[nuevo-slug]
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shrink-0">
                    {editingOrganization.avatar_url ? (
                      <img src={editingOrganization.avatar_url} alt={editingOrganization.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">{editingOrganization.name.charAt(0)}</span>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                    <Upload className="h-4 w-4" />
                    {uploadingEditOrgAvatar ? "Subiendo..." : "Cambiar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, "edit-organization")
                      }}
                      disabled={uploadingEditOrgAvatar}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email de acceso</label>
                <Input
                  type="email"
                  value={editingOrganization.email}
                  onChange={(e) => setEditingOrganization({ ...editingOrganization, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Contraseña de acceso</label>
                <Input
                  type="text"
                  value={editingOrganization.password_hash}
                  onChange={(e) => setEditingOrganization({ ...editingOrganization, password_hash: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingOrganization(null)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={updateOrganization} className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
