"use client"

import { useState } from "react"
import { CheckCircle, ExternalLink, Globe, Mail, Pencil, Phone, Store, Trash2, XCircle } from "lucide-react"
import { providerCategoryColors, providerCategoryLabels, type ProviderCategory } from "@/lib/providers-data"
import { cn } from "@/lib/utils"
import type { Provider, ProviderSubmission } from "../_lib/types"
import { generateSlug, slugInput, timeAgo } from "../_lib/utils"
import { CopyButton, EmptyState, Field, IconButton, ImageUpload, Modal, PrimaryButton, SecondaryButton, SegmentedControl, inputClass, textareaClass } from "./ui"

const categories = Object.keys(providerCategoryLabels) as ProviderCategory[]
const label = (c: string) => providerCategoryLabels[c as ProviderCategory] || c

export function ProvidersTab({
  submissions,
  providers,
  onApprove,
  onReject,
  onUpdate,
  onDelete,
}: {
  submissions: ProviderSubmission[]
  providers: Provider[]
  onApprove: (s: ProviderSubmission) => Promise<boolean>
  onReject: (id: string) => Promise<boolean>
  onUpdate: (p: Provider) => Promise<boolean>
  onDelete: (p: Provider) => void
}) {
  const pending = submissions.filter((s) => s.status === "pending")
  const [view, setView] = useState<"pending" | "approved">(pending.length > 0 ? "pending" : "approved")
  const [editing, setEditing] = useState<Provider | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim()) return
    setSaving(true)
    const ok = await onUpdate(editing)
    setSaving(false)
    if (ok) setEditing(null)
  }

  return (
    <div className="space-y-5">
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: "pending", label: "Solicitudes", count: pending.length },
          { value: "approved", label: "Publicados", count: providers.length },
        ]}
      />

      {view === "pending" &&
        (pending.length === 0 ? (
          <EmptyState icon={Store} title="No hay solicitudes de proveedores" />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pending.map((s) => (
              <div key={s.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", providerCategoryColors[s.category as ProviderCategory] || "bg-muted")}>
                      {label(s.category)}
                    </span>
                    <p className="mt-1 font-bold">{s.business_name}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(s.created_at)}</span>
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{s.contact_name}</p>
                  {s.contact_email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {s.contact_email}
                    </p>
                  )}
                  {s.contact_phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {s.contact_phone}
                    </p>
                  )}
                  {s.website && (
                    <p className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {s.website}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <SecondaryButton tone="danger" onClick={() => confirm(`¿Rechazar a ${s.business_name}?`) && onReject(s.id)}>
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </SecondaryButton>
                  <PrimaryButton onClick={() => onApprove(s)}>
                    <CheckCircle className="h-4 w-4" />
                    Aprobar
                  </PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        ))}

      {view === "approved" &&
        (providers.length === 0 ? (
          <EmptyState icon={Store} title="Todavía no hay proveedores publicados" />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {providers.map((p) => {
              const path = `/proveedores/${p.slug || p.id}`
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold text-muted-foreground">{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {label(p.category)} · {path}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <CopyButton compact value={`${window.location.origin}${path}`} label="Copiar link" successMessage="Link copiado" />
                    <IconButton icon={ExternalLink} label="Ver perfil" href={path} />
                    <IconButton icon={Pencil} label="Editar" onClick={() => setEditing(p)} />
                    <IconButton icon={Trash2} label="Eliminar" onClick={() => onDelete(p)} tone="danger" />
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title="Editar proveedor"
          footer={
            <>
              <SecondaryButton onClick={() => setEditing(null)} className="ml-auto">
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={save} disabled={saving || !editing.name.trim()}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Foto de perfil">
              <ImageUpload value={editing.avatar_url} onChange={(url) => setEditing({ ...editing, avatar_url: url })} prefix="provider" aspect="avatar" label="Subir foto" />
            </Field>
            <Field label="Nombre" required>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Slug (URL)" hint={`/proveedores/${editing.slug || generateSlug(editing.name)}`}>
              <input
                value={editing.slug || ""}
                onChange={(e) => setEditing({ ...editing, slug: slugInput(e.target.value) })}
                className={inputClass}
                placeholder={generateSlug(editing.name)}
              />
            </Field>
            <Field label="Rubro">
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputClass}>
                {!categories.includes(editing.category as ProviderCategory) && <option value={editing.category}>{editing.category}</option>}
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {label(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descripción">
              <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={textareaClass} rows={3} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input type="email" value={editing.contact_email || ""} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Teléfono / WhatsApp">
                <input value={editing.contact_phone || ""} onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="Sitio web">
              <input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} className={inputClass} placeholder="https://..." />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
