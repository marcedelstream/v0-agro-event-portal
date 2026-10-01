"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import type {
  Banner,
  EventContactRequest,
  EventSubmission,
  GeneralContact,
  Organization,
  Provider,
  ProviderSubmission,
  PublishedEvent,
} from "./types"
import { errorMessage, generateEventSlug, generateSlug } from "./utils"
import { eventRowFromForm, type EventFormValues } from "../_components/event-form"

export function useAdminData() {
  const [loading, setLoading] = useState(true)
  const [eventSubmissions, setEventSubmissions] = useState<EventSubmission[]>([])
  const [providerSubmissions, setProviderSubmissions] = useState<ProviderSubmission[]>([])
  const [events, setEvents] = useState<PublishedEvent[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [generalContacts, setGeneralContacts] = useState<GeneralContact[]>([])
  const [eventContacts, setEventContacts] = useState<EventContactRequest[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  const load = useCallback(async () => {
    const supabase = createBrowserClient()
    const results = await Promise.all([
      supabase.from("event_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("provider_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("providers").select("*").order("created_at", { ascending: false }),
      supabase.from("general_contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("event_contact_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("banners").select("*").order("display_order"),
      supabase.from("organizations").select("*").order("name"),
    ])
    const failed = results.find((r) => r.error)
    if (failed?.error) toast.error(`Error cargando datos: ${failed.error.message}`)

    const [subs, provSubs, evs, provs, general, evContacts, bans, orgs] = results
    setEventSubmissions((subs.data as EventSubmission[]) || [])
    setProviderSubmissions((provSubs.data as ProviderSubmission[]) || [])
    setEvents((evs.data as PublishedEvent[]) || [])
    setProviders((provs.data as Provider[]) || [])
    setGeneralContacts((general.data as GeneralContact[]) || [])
    setEventContacts((evContacts.data as EventContactRequest[]) || [])
    setBanners((bans.data as Banner[]) || [])
    setOrganizations((orgs.data as Organization[]) || [])
    setLoading(false)
  }, [])

  // Ejecuta una escritura, avisa el resultado y recarga. Devuelve true si salio bien.
  const run = useCallback(
    async (action: () => PromiseLike<{ error: unknown } | void>, success?: string) => {
      try {
        const result = await action()
        if (result && result.error) throw result.error
        if (success) toast.success(success)
        await load()
        return true
      } catch (error) {
        toast.error(errorMessage(error))
        return false
      }
    },
    [load],
  )

  const db = () => createBrowserClient()

  // Un evento destacado aparece en "Eventos destacados" de la portada, que se arma con la tabla banners
  const ensureFeaturedBanner = async (event: { id: string; title: string; slug: string | null; image_url: string | null }) => {
    const supabase = db()
    const { data: existing, error } = await supabase.from("banners").select("id, is_active").eq("event_id", event.id)
    if (error) return { error }
    if (existing && existing.length > 0) {
      if (existing.some((b) => b.is_active)) return { error: null }
      return supabase.from("banners").update({ is_active: true }).eq("id", existing[0].id)
    }
    const { data: last } = await supabase.from("banners").select("display_order").order("display_order", { ascending: false }).limit(1)
    return supabase.from("banners").insert({
      title: event.title,
      image_url: event.image_url || "",
      link_url: event.slug ? `/evento/${event.slug}` : "",
      event_id: event.id,
      is_active: true,
      display_order: (last?.[0]?.display_order || 0) + 1,
    })
  }

  // ---------- Eventos ----------

  // Inserta el evento y, si es destacado, le crea su banner de portada
  const insertEvent = async (values: EventFormValues) => {
    const { data, error } = await db()
      .from("events")
      .insert({ ...eventRowFromForm(values), slug: generateEventSlug(values.title), is_approved: true })
      .select("id, title, slug, image_url")
      .single()
    if (error || !data) return { error: error || { message: "No se pudo crear el evento" } }
    if (values.is_premium) {
      const banner = await ensureFeaturedBanner(data)
      if (banner.error) return { error: { message: `Evento publicado, pero no se pudo crear el banner destacado: ${errorMessage(banner.error)}` } }
    }
    return { error: null }
  }

  const createEvent = (values: EventFormValues) => run(() => insertEvent(values), "Evento publicado")

  const updateEvent = (id: string, values: EventFormValues) =>
    run(async () => {
      const supabase = db()
      const { data: before } = await supabase.from("events").select("is_premium").eq("id", id).single()
      const { data, error } = await supabase.from("events").update(eventRowFromForm(values)).eq("id", id).select("id, title, slug, image_url").single()
      if (error || !data) return { error }
      // El banner de portada solo cambia cuando cambia el destacado
      if (values.is_premium && !before?.is_premium) return ensureFeaturedBanner(data)
      if (!values.is_premium && before?.is_premium) return supabase.from("banners").update({ is_active: false }).eq("event_id", id)
      return { error: null }
    }, "Cambios guardados")

  const deleteEvent = (id: string) => run(() => db().from("events").delete().eq("id", id), "Evento eliminado")

  // Destacar activa su banner en la portada; quitar el destacado lo oculta
  const togglePremium = (e: PublishedEvent) =>
    run(
      async () => {
        const supabase = db()
        const { error } = await supabase.from("events").update({ is_premium: !e.is_premium }).eq("id", e.id)
        if (error) return { error }
        if (e.is_premium) return supabase.from("banners").update({ is_active: false }).eq("event_id", e.id)
        return ensureFeaturedBanner(e)
      },
      e.is_premium ? "Ya no es destacado (banner oculto)" : "Destacado: ya aparece en la portada",
    )

  const fixMissingSlug = (e: PublishedEvent) =>
    run(() => db().from("events").update({ slug: generateEventSlug(e.title) }).eq("id", e.id), "Link generado")

  // Aprueba una solicitud: primero crea el evento y solo si salio bien marca la solicitud como aprobada
  const approveSubmission = (submission: EventSubmission, values: EventFormValues) =>
    run(async () => {
      const created = await insertEvent(values)
      if (created.error) return created
      return db().from("event_submissions").update({ status: "approved" }).eq("id", submission.id)
    }, values.is_premium ? "Aprobado y publicado como destacado" : "Solicitud aprobada y evento publicado")

  const rejectSubmission = (id: string) =>
    run(() => db().from("event_submissions").update({ status: "rejected" }).eq("id", id), "Solicitud rechazada")

  const restoreSubmission = (id: string) =>
    run(() => db().from("event_submissions").update({ status: "pending" }).eq("id", id), "Solicitud vuelta a pendiente")

  // ---------- Proveedores ----------

  const approveProvider = (s: ProviderSubmission) =>
    run(async () => {
      const supabase = db()
      const { error } = await supabase.from("providers").insert({
        name: s.business_name,
        slug: `${generateSlug(s.business_name)}-${Date.now().toString(36).slice(-4)}`,
        category: s.category,
        contact_email: s.contact_email,
        contact_phone: s.contact_phone,
        website: s.website,
        description: s.description,
        is_approved: true,
      })
      if (error) return { error }
      return supabase.from("provider_submissions").update({ status: "approved" }).eq("id", s.id)
    }, "Proveedor aprobado")

  const rejectProvider = (id: string) =>
    run(() => db().from("provider_submissions").update({ status: "rejected" }).eq("id", id), "Solicitud rechazada")

  const updateProvider = (p: Provider) =>
    run(
      () =>
        db()
          .from("providers")
          .update({
            name: p.name.trim(),
            slug: p.slug?.trim() || generateSlug(p.name),
            category: p.category,
            contact_email: p.contact_email,
            contact_phone: p.contact_phone,
            website: p.website || null,
            description: p.description || null,
            avatar_url: p.avatar_url || null,
          })
          .eq("id", p.id),
      "Proveedor actualizado",
    )

  const deleteProvider = (id: string) => run(() => db().from("providers").delete().eq("id", id), "Proveedor eliminado")

  // ---------- Mensajes ----------

  // RLS puede bloquear el UPDATE sin devolver error (0 filas): se verifica que realmente se actualizo
  const updateMessageStatus = (table: "event_contact_requests" | "general_contacts", id: string, status: "pending" | "responded") =>
    run(async () => {
      const { data, error } = await db().from(table).update({ status }).eq("id", id).select("id")
      if (error) return { error }
      if (!data || data.length === 0) {
        return { error: { message: "La base no permite cambiar el estado todavía. Falta aplicar scripts/018_allow_message_status_updates.sql" } }
      }
    }, status === "responded" ? "Marcado como respondido" : "Marcado como pendiente")

  const setEventContactStatus = (id: string, status: "pending" | "responded") => updateMessageStatus("event_contact_requests", id, status)

  const setGeneralContactStatus = (id: string, status: "pending" | "responded") => updateMessageStatus("general_contacts", id, status)

  // ---------- Banners ----------

  const createBanner = (b: { title: string; image_url: string; link_url: string; event_id: string }) =>
    run(
      () =>
        db()
          .from("banners")
          .insert({
            title: b.title,
            image_url: b.image_url,
            link_url: b.link_url,
            event_id: b.event_id || null,
            is_active: true,
            display_order: banners.reduce((max, x) => Math.max(max, x.display_order || 0), 0) + 1,
          }),
      "Banner creado",
    )

  const toggleBanner = (b: Banner) =>
    run(() => db().from("banners").update({ is_active: !b.is_active }).eq("id", b.id), b.is_active ? "Banner oculto" : "Banner activo")

  const deleteBanner = (id: string) => run(() => db().from("banners").delete().eq("id", id), "Banner eliminado")

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1
    if (swap < 0 || swap >= banners.length) return
    const a = banners[index]
    const b = banners[swap]
    // Si dos banners comparten orden (datos viejos), se usan las posiciones como orden
    const orderA = a.display_order === b.display_order ? index : a.display_order
    const orderB = a.display_order === b.display_order ? swap : b.display_order
    const updated = [...banners]
    updated[index] = { ...b, display_order: orderA }
    updated[swap] = { ...a, display_order: orderB }
    setBanners(updated)
    await run(async () => {
      const supabase = db()
      const [r1, r2] = await Promise.all([
        supabase.from("banners").update({ display_order: orderB }).eq("id", a.id),
        supabase.from("banners").update({ display_order: orderA }).eq("id", b.id),
      ])
      return { error: r1.error || r2.error }
    })
  }

  // ---------- Organizaciones ----------

  const createOrganization = (o: { name: string; slug: string; avatar_url: string; email: string; password_hash: string }) =>
    run(
      () =>
        db()
          .from("organizations")
          .insert({
            name: o.name.trim(),
            slug: o.slug.trim() || generateSlug(o.name),
            avatar_url: o.avatar_url || null,
            email: o.email.trim().toLowerCase(),
            password_hash: o.password_hash,
            is_active: true,
          }),
      "Organización creada",
    )

  const updateOrganization = (o: Organization) =>
    run(
      () =>
        db()
          .from("organizations")
          .update({
            name: o.name.trim(),
            slug: o.slug.trim() || generateSlug(o.name),
            avatar_url: o.avatar_url || null,
            email: o.email.trim().toLowerCase(),
            password_hash: o.password_hash,
          })
          .eq("id", o.id),
      "Organización actualizada",
    )

  const toggleOrganization = (o: Organization) =>
    run(() => db().from("organizations").update({ is_active: !o.is_active }).eq("id", o.id), o.is_active ? "Organización desactivada" : "Organización activada")

  const deleteOrganization = (id: string) => run(() => db().from("organizations").delete().eq("id", id), "Organización eliminada")

  return {
    loading,
    load,
    run,
    eventSubmissions,
    providerSubmissions,
    events,
    providers,
    generalContacts,
    eventContacts,
    banners,
    organizations,
    actions: {
      createEvent,
      updateEvent,
      deleteEvent,
      togglePremium,
      fixMissingSlug,
      approveSubmission,
      rejectSubmission,
      restoreSubmission,
      approveProvider,
      rejectProvider,
      updateProvider,
      deleteProvider,
      setEventContactStatus,
      setGeneralContactStatus,
      createBanner,
      toggleBanner,
      deleteBanner,
      moveBanner,
      createOrganization,
      updateOrganization,
      toggleOrganization,
      deleteOrganization,
    },
  }
}

export type AdminData = ReturnType<typeof useAdminData>
