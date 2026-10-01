"use client"

import { useState } from "react"
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Organization, PublishedEvent } from "../_lib/types"
import { generateSlug, slugInput } from "../_lib/utils"
import { CopyButton, EmptyState, Field, FormSection, IconButton, ImageUpload, Modal, PrimaryButton, SecondaryButton, inputClass } from "./ui"

const emptyOrg = { name: "", slug: "", avatar_url: "", email: "", password_hash: "" }

export function OrganizationsTab({
  organizations,
  events,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
}: {
  organizations: Organization[]
  events: PublishedEvent[]
  onCreate: (o: typeof emptyOrg) => Promise<boolean>
  onUpdate: (o: Organization) => Promise<boolean>
  onToggle: (o: Organization) => void
  onDelete: (o: Organization) => void
}) {
  const [form, setForm] = useState(emptyOrg)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [saving, setSaving] = useState(false)
  const eventCount = (id: string) => events.filter((e) => e.organization_id === id).length

  const create = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password_hash) {
      toast.error("Completá nombre, email y contraseña")
      return
    }
    setSaving(true)
    const ok = await onCreate(form)
    setSaving(false)
    if (ok) setForm(emptyOrg)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const ok = await onUpdate(editing)
    setSaving(false)
    if (ok) setEditing(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Organizaciones</h2>
        <p className="text-sm text-muted-foreground">Cada una tiene su página pública y un panel propio para cargar eventos.</p>
        {organizations.length === 0 ? (
          <EmptyState icon={Users} title="Todavía no hay organizaciones" />
        ) : (
          <div className="space-y-2.5">
            {organizations.map((o) => {
              const path = `/organizador/${o.slug}`
              return (
                <div key={o.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3", !o.is_active && "opacity-60")}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {o.avatar_url ? <img src={o.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="font-bold text-muted-foreground">{o.name.charAt(0)}</span>}
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <p className="truncate font-bold">{o.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {eventCount(o.id)} eventos · {o.email}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <CopyButton compact value={`${window.location.origin}${path}`} label="Copiar link" successMessage="Link copiado" />
                    <IconButton icon={ExternalLink} label="Ver página" href={path} />
                    <IconButton icon={Pencil} label="Editar" onClick={() => setEditing(o)} />
                    <IconButton icon={o.is_active ? Eye : EyeOff} label={o.is_active ? "Desactivar" : "Activar"} onClick={() => onToggle(o)} />
                    <IconButton icon={Trash2} label="Eliminar" onClick={() => onDelete(o)} tone="danger" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <FormSection title="Nueva organización">
        <Field label="Nombre" required>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ej: Agroexpo Paraguay" />
        </Field>
        <Field label="Slug (URL)" hint={`/organizador/${form.slug || generateSlug(form.name) || "..."}`}>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugInput(e.target.value) })} className={inputClass} placeholder={generateSlug(form.name)} />
        </Field>
        <Field label="Logo">
          <ImageUpload value={form.avatar_url} onChange={(url) => setForm({ ...form, avatar_url: url || "" })} prefix="organization" aspect="avatar" label="Subir logo" />
        </Field>
        <Field label="Email de acceso" required>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Contraseña de acceso" required>
          <input value={form.password_hash} onChange={(e) => setForm({ ...form, password_hash: e.target.value })} className={inputClass} />
        </Field>
        <PrimaryButton onClick={create} disabled={saving} className="w-full">
          <Plus className="h-4 w-4" />
          {saving ? "Guardando..." : "Crear organización"}
        </PrimaryButton>
      </FormSection>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title="Editar organización"
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
            <Field label="Logo">
              <ImageUpload value={editing.avatar_url} onChange={(url) => setEditing({ ...editing, avatar_url: url })} prefix="organization" aspect="avatar" />
            </Field>
            <Field label="Nombre" required>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Slug (URL)" hint="Si lo cambiás, el link anterior deja de funcionar.">
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugInput(e.target.value) })} className={inputClass} />
            </Field>
            <Field label="Email de acceso">
              <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Contraseña de acceso">
              <input value={editing.password_hash} onChange={(e) => setEditing({ ...editing, password_hash: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}
