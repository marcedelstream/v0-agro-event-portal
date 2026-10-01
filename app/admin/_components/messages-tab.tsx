"use client"

import { useMemo, useState } from "react"
import { Check, ExternalLink, Mail, MessageCircle, MessagesSquare, Phone, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventContactRequest, GeneralContact, PublishedEvent } from "../_lib/types"
import { eventPath, formatWhatsApp, timeAgo } from "../_lib/utils"
import { EmptyState, SegmentedControl } from "./ui"

const contactTypeLabels: Record<string, { label: string; className: string }> = {
  info: { label: "Más info", className: "bg-blue-500/12 text-blue-700 dark:text-blue-300" },
  sponsor: { label: "Auspicio", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  stand: { label: "Stand", className: "bg-green-500/12 text-green-700 dark:text-green-300" },
}

interface MessageItem {
  id: string
  kind: "event" | "general"
  name: string
  email: string
  phone: string | null
  message: string | null
  status: string
  created_at: string
  tag?: { label: string; className: string }
  context?: string
  contextHref?: string
}

export function MessagesTab({
  eventContacts,
  generalContacts,
  events,
  onSetEventStatus,
  onSetGeneralStatus,
}: {
  eventContacts: EventContactRequest[]
  generalContacts: GeneralContact[]
  events: PublishedEvent[]
  onSetEventStatus: (id: string, status: "pending" | "responded") => void
  onSetGeneralStatus: (id: string, status: "pending" | "responded") => void
}) {
  const [source, setSource] = useState<"all" | "event" | "general">("all")
  const [status, setStatus] = useState<"pending" | "responded">("pending")

  const items = useMemo<MessageItem[]>(() => {
    const byId = new Map(events.map((e) => [e.id, e]))
    const fromEvents: MessageItem[] = eventContacts.map((c) => {
      const ev = byId.get(c.event_id)
      return {
        id: c.id,
        kind: "event",
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: c.message,
        status: c.status || "pending",
        created_at: c.created_at,
        tag: contactTypeLabels[c.contact_type] || { label: c.contact_type, className: "bg-muted text-muted-foreground" },
        context: ev?.title || "Evento eliminado",
        contextHref: ev?.slug ? eventPath(ev.slug) : undefined,
      }
    })
    const fromGeneral: MessageItem[] = generalContacts.map((c) => {
      // Las solicitudes de proveedor se guardan como contacto general con este prefijo
      const isProviderRequest = c.message?.startsWith("[SOLICITUD DE PROVEEDOR]")
      return {
        id: c.id,
        kind: "general",
        name: c.name,
        email: c.email,
        phone: c.phone,
        message: isProviderRequest ? c.message.replace("[SOLICITUD DE PROVEEDOR]", "").trim() : c.message,
        status: c.status || "pending",
        created_at: c.created_at,
        tag: isProviderRequest
          ? { label: "Busca proveedor", className: "bg-purple-500/12 text-purple-700 dark:text-purple-300" }
          : { label: "Contacto", className: "bg-muted text-muted-foreground" },
        context: c.subject || undefined,
      }
    })
    return [...fromEvents, ...fromGeneral].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [eventContacts, generalContacts, events])

  const bySource = items.filter((i) => source === "all" || i.kind === source)
  const pendingCount = bySource.filter((i) => i.status !== "responded").length
  const visible = bySource.filter((i) => (status === "pending" ? i.status !== "responded" : i.status === "responded"))

  const setItemStatus = (item: MessageItem, value: "pending" | "responded") =>
    item.kind === "event" ? onSetEventStatus(item.id, value) : onSetGeneralStatus(item.id, value)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "pending", label: "Sin responder", count: pendingCount },
            { value: "responded", label: "Respondidos", count: bySource.length - pendingCount },
          ]}
        />
        <SegmentedControl
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "Todos" },
            { value: "event", label: "De eventos" },
            { value: "general", label: "Generales" },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={MessagesSquare} title={status === "pending" ? "No hay mensajes sin responder" : "Todavía no marcaste mensajes como respondidos"} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((item) => (
            <div key={`${item.kind}-${item.id}`} className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-4", item.status === "responded" && "opacity-75")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tag && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", item.tag.className)}>{item.tag.label}</span>}
                    <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                  </div>
                  <p className="mt-1 font-bold">{item.name}</p>
                  {item.context &&
                    (item.contextHref ? (
                      <a href={item.contextHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                        {item.context}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">{item.context}</p>
                    ))}
                </div>
              </div>
              {item.message && <p className="whitespace-pre-line text-sm">{item.message}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {item.email && (
                  <a href={`mailto:${item.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:border-foreground/30">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
                {item.phone && (
                  <>
                    <a
                      href={`https://wa.me/${formatWhatsApp(item.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:border-foreground/30"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <a href={`tel:${item.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:border-foreground/30">
                      <Phone className="h-3.5 w-3.5" />
                      {item.phone}
                    </a>
                  </>
                )}
                {item.status === "responded" ? (
                  <button onClick={() => setItemStatus(item, "pending")} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Marcar pendiente
                  </button>
                ) : (
                  <button
                    onClick={() => setItemStatus(item, "responded")}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-lime px-4 text-xs font-bold text-brand-navy hover:bg-brand-lime-dark"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Respondido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
