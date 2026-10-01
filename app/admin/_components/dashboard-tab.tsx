"use client"

import { ArrowRight, CalendarCheck, CalendarDays, ExternalLink, Inbox, MessageSquare, Plus, Store } from "lucide-react"
import type { EventSubmission, PublishedEvent, Tab } from "../_lib/types"
import { eventPath, eventUrl, formatDateRange, isPastEvent, submissionWantsPremium, timeAgo } from "../_lib/utils"
import { CopyButton, PrimaryButton } from "./ui"

export function DashboardTab({
  events,
  pendingSubmissions,
  pendingProviders,
  pendingMessages,
  onNavigate,
  onReview,
  onCreate,
}: {
  events: PublishedEvent[]
  pendingSubmissions: EventSubmission[]
  pendingProviders: number
  pendingMessages: number
  onNavigate: (tab: Tab) => void
  onReview: (s: EventSubmission) => void
  onCreate: () => void
}) {
  const upcoming = events.filter((e) => !isPastEvent(e)).length
  const latest = [...events].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 6)

  const stats = [
    { label: "Solicitudes pendientes", value: pendingSubmissions.length, icon: Inbox, tab: "submissions" as Tab, highlight: pendingSubmissions.length > 0 },
    { label: "Eventos próximos", value: upcoming, icon: CalendarCheck, tab: "events" as Tab, highlight: false },
    { label: "Mensajes sin responder", value: pendingMessages, icon: MessageSquare, tab: "messages" as Tab, highlight: pendingMessages > 0 },
    { label: "Proveedores pendientes", value: pendingProviders, icon: Store, tab: "providers" as Tab, highlight: pendingProviders > 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tab, highlight }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="group rounded-2xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-lg hover:shadow-black/5"
          >
            <div className="flex items-center justify-between">
              <div className={highlight ? "flex h-9 w-9 items-center justify-center rounded-full bg-brand-lime text-brand-navy" : "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"}>
                <Icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-3 text-3xl font-extrabold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Solicitudes por revisar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Por revisar</h2>
            <button onClick={() => onNavigate("submissions")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              Ver todas
            </button>
          </div>
          {pendingSubmissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Todo al día: no hay solicitudes pendientes.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSubmissions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onReview(s)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-foreground/30"
                >
                  {s.image_url ? (
                    <img src={s.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.event_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateRange(s.event_date, s.end_date)} · enviada {timeAgo(s.created_at)}
                    </p>
                  </div>
                  {submissionWantsPremium(s) && (
                    <span className="hidden shrink-0 rounded-full border border-brand-lime px-2 py-0.5 text-[11px] font-bold text-primary sm:inline">Destacado</span>
                  )}
                  <span className="shrink-0 rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand-navy">Revisar</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Ultimos aprobados */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Últimos aprobados</h2>
            <PrimaryButton onClick={onCreate} className="h-9 px-4">
              <Plus className="h-4 w-4" />
              Nuevo
            </PrimaryButton>
          </div>
          <div className="space-y-2">
            {latest.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                {e.image_url ? (
                  <img src={e.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateRange(e.date, e.end_date)} · aprobado {timeAgo(e.created_at)}
                  </p>
                </div>
                {e.slug && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <CopyButton compact value={eventUrl(e.slug)} label="Copiar link" successMessage="Link copiado" />
                    <a
                      href={eventPath(e.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
                      title="Ver evento"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate("events")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Ver todos los eventos →
          </button>
        </section>
      </div>
    </div>
  )
}
