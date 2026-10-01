"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Mail, MessageCircle, Phone, Save, Star, User, XCircle } from "lucide-react"
import { PREMIUM_PRICE_LABEL } from "@/lib/site-config"
import { toast } from "sonner"
import type { EventSubmission, Organization } from "../_lib/types"
import { formatWhatsApp, submissionWantsPremium, timeAgo } from "../_lib/utils"
import { EventForm, validateEventForm, type EventFormValues } from "./event-form"
import { Modal, PrimaryButton, SecondaryButton } from "./ui"

export type EditorState =
  | { mode: "create"; values: EventFormValues }
  | { mode: "edit"; eventId: string; values: EventFormValues }
  | { mode: "approve"; submission: EventSubmission; values: EventFormValues }

export function EventEditor({
  state,
  organizations,
  onClose,
  onCreate,
  onUpdate,
  onApprove,
  onReject,
}: {
  state: EditorState | null
  organizations: Organization[]
  onClose: () => void
  onCreate: (values: EventFormValues) => Promise<boolean>
  onUpdate: (id: string, values: EventFormValues) => Promise<boolean>
  onApprove: (submission: EventSubmission, values: EventFormValues) => Promise<boolean>
  onReject: (id: string) => Promise<boolean>
}) {
  const [values, setValues] = useState<EventFormValues | null>(state?.values ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues(state?.values ?? null)
  }, [state])

  if (!state || !values) return null

  const submit = async () => {
    const problem = validateEventForm(values)
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    const ok =
      state.mode === "create"
        ? await onCreate(values)
        : state.mode === "edit"
          ? await onUpdate(state.eventId, values)
          : await onApprove(state.submission, values)
    setSaving(false)
    if (ok) onClose()
  }

  const reject = async () => {
    if (state.mode !== "approve") return
    if (!confirm("¿Rechazar esta solicitud? Podés volver a revisarla desde la pestaña Rechazadas.")) return
    setSaving(true)
    const ok = await onReject(state.submission.id)
    setSaving(false)
    if (ok) onClose()
  }

  const title = state.mode === "create" ? "Nuevo evento" : state.mode === "edit" ? "Editar evento" : "Revisar solicitud"

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={title}
      subtitle={
        state.mode === "approve"
          ? `Enviada ${timeAgo(state.submission.created_at)} · Corregí lo que haga falta antes de publicar`
          : state.mode === "edit"
            ? values.title
            : "Se publica de inmediato en el calendario"
      }
      footer={
        <>
          {state.mode === "approve" && (
            <SecondaryButton tone="danger" onClick={reject} disabled={saving}>
              <XCircle className="h-4 w-4" />
              Rechazar
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onClose} disabled={saving} className="ml-auto">
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={submit} disabled={saving}>
            {state.mode === "approve" ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Guardando..." : state.mode === "approve" ? "Aprobar y publicar" : state.mode === "edit" ? "Guardar cambios" : "Publicar evento"}
          </PrimaryButton>
        </>
      }
    >
      {state.mode === "approve" && (
        <div className="mb-4 rounded-2xl border border-brand-lime/50 bg-brand-lime/10 p-4">
          <p className="eyebrow mb-2">Enviado por</p>
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="flex items-center gap-1.5 font-semibold">
              <User className="h-4 w-4" />
              {state.submission.contact_name || "Sin nombre"}
            </span>
            {state.submission.contact_email && (
              <a href={`mailto:${state.submission.contact_email}`} className="flex items-center gap-1.5 hover:underline">
                <Mail className="h-4 w-4" />
                {state.submission.contact_email}
              </a>
            )}
            {state.submission.contact_phone && (
              <a href={`tel:${state.submission.contact_phone}`} className="flex items-center gap-1.5 hover:underline">
                <Phone className="h-4 w-4" />
                {state.submission.contact_phone}
              </a>
            )}
          </div>
        </div>
      )}
      {state.mode === "approve" && submissionWantsPremium(state.submission) && (
        <div className="mb-4 rounded-2xl border-2 border-brand-lime bg-card p-4">
          <p className="flex items-center gap-2 font-extrabold">
            <Star className="h-4 w-4 fill-current text-primary" />
            Pidió evento destacado · {PREMIUM_PRICE_LABEL}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirmá el pago antes de aprobar. Si todavía no pagó, aprobalo normal y destacalo después desde "Eventos publicados".
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setValues({ ...values, is_premium: !values.is_premium })}
              className={
                values.is_premium
                  ? "inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-lime px-4 text-sm font-bold text-brand-navy"
                  : "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-semibold hover:border-foreground/30"
              }
            >
              <CheckCircle className="h-4 w-4" />
              {values.is_premium ? "Pago confirmado: se publica destacado" : "Confirmar pago y destacar"}
            </button>
            {state.submission.contact_phone && (
              <a
                href={`https://wa.me/${formatWhatsApp(state.submission.contact_phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-semibold hover:border-foreground/30"
              >
                <MessageCircle className="h-4 w-4" />
                Escribirle por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
      <EventForm values={values} onChange={setValues} organizations={organizations} />
    </Modal>
  )
}
