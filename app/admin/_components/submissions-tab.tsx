"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Inbox, MapPin, RotateCcw, Star, User } from "lucide-react"
import { PREMIUM_PRICE_LABEL } from "@/lib/site-config"
import { categoryColors, categoryLabels } from "@/lib/events-data"
import { cn } from "@/lib/utils"
import type { EventSubmission, SubmissionStatus } from "../_lib/types"
import { formatDateRange, submissionWantsPremium, timeAgo } from "../_lib/utils"
import { EmptyState, PrimaryButton, SecondaryButton, SegmentedControl } from "./ui"

export function SubmissionsTab({
  submissions,
  onReview,
  onRestore,
}: {
  submissions: EventSubmission[]
  onReview: (s: EventSubmission) => void
  onRestore: (s: EventSubmission) => void
}) {
  const [status, setStatus] = useState<SubmissionStatus>("pending")
  const counts = useMemo(
    () => ({
      pending: submissions.filter((s) => s.status === "pending").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    }),
    [submissions],
  )
  const list = submissions.filter((s) => s.status === status)

  return (
    <div className="space-y-5">
      <SegmentedControl
        value={status}
        onChange={setStatus}
        options={[
          { value: "pending", label: "Pendientes", count: counts.pending },
          { value: "approved", label: "Aprobadas", count: counts.approved },
          { value: "rejected", label: "Rechazadas", count: counts.rejected },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === "pending" ? "No hay solicitudes pendientes" : "Nada por acá"}
          description={status === "pending" ? "Cuando alguien cargue un evento desde 'Publicar evento' va a aparecer acá." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((s) => (
            <div key={s.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
              {s.image_url ? (
                <img src={s.image_url} alt="" className="h-24 w-20 shrink-0 rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-muted text-[10px] text-muted-foreground">
                  Sin flyer
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", categoryColors[s.category] || "bg-muted text-muted-foreground")}>
                    {categoryLabels[s.category] || s.category}
                  </span>
                  {submissionWantsPremium(s) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime px-2 py-0.5 text-[11px] font-bold text-brand-navy">
                      <Star className="h-3 w-3 fill-current" />
                      Pidió destacado · {PREMIUM_PRICE_LABEL}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{timeAgo(s.created_at)}</span>
                </div>
                <p className="mt-1 font-bold leading-snug">{s.event_name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateRange(s.event_date, s.end_date)}
                  {s.event_time ? ` · ${s.event_time}` : ""}
                </p>
                <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{[s.location, s.city, s.department].filter(Boolean).join(", ")}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{[s.contact_name, s.contact_email].filter(Boolean).join(" · ")}</span>
                </p>
                <div className="mt-auto flex justify-end gap-2 pt-2">
                  {status === "pending" && <PrimaryButton onClick={() => onReview(s)}>Revisar y aprobar</PrimaryButton>}
                  {status === "rejected" && (
                    <SecondaryButton onClick={() => onRestore(s)}>
                      <RotateCcw className="h-4 w-4" />
                      Volver a pendiente
                    </SecondaryButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
