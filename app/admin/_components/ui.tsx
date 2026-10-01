"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Check, Copy, ImagePlus, Loader2, Trash2, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { errorMessage, uploadImage } from "../_lib/utils"

export const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-brand-lime/30 focus:border-brand-lime transition-all disabled:opacity-50"
export const textareaClass = cn(inputClass, "h-auto py-2.5 resize-y min-h-[80px]")

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div>
        <h3 className="font-bold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-background p-3.5">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-olive dark:bg-brand-lime" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "md" | "lg"
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={cn(
          "flex max-h-[94vh] w-full flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  href,
  tone = "default",
  active = false,
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  href?: string
  tone?: "default" | "danger"
  active?: boolean
  disabled?: boolean
}) {
  const className = cn(
    "flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
    active
      ? "border-brand-lime bg-brand-lime text-brand-navy"
      : tone === "danger"
        ? "border-border bg-card text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={label} aria-label={label}>
        <Icon className="h-4 w-4" />
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} title={label} aria-label={label} disabled={disabled}>
      <Icon className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  )
}

export function CopyButton({ value, label = "Copiar", successMessage = "Copiado", compact = false }: { value: string; label?: string; successMessage?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(successMessage)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("No se pudo copiar")
    }
  }
  if (compact) {
    return <IconButton icon={copied ? Check : Copy} label={label} onClick={copy} />
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:border-foreground/30 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

export function ImageUpload({
  value,
  onChange,
  prefix,
  label = "Subir imagen",
  aspect = "wide",
}: {
  value: string | null | undefined
  onChange: (url: string | null) => void
  prefix: string
  label?: string
  aspect?: "wide" | "square" | "avatar" | "banner"
}) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      onChange(await uploadImage(file, prefix))
    } catch (error) {
      toast.error(`No se pudo subir la imagen: ${errorMessage(error)}`)
    } finally {
      setUploading(false)
    }
  }

  const previewClass =
    aspect === "avatar"
      ? "h-20 w-20 rounded-full object-cover"
      : aspect === "square"
        ? "h-28 w-28 rounded-xl object-cover"
        : aspect === "banner"
          ? "h-16 w-48 rounded-xl object-cover"
          : "h-24 w-40 rounded-xl object-cover"

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? (
        <img src={value} alt="" className={cn(previewClass, "border border-border bg-muted")} />
      ) : (
        <div className={cn(previewClass, "flex items-center justify-center border border-dashed border-border bg-muted text-muted-foreground")}>
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:border-foreground/30",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Subiendo..." : value ? "Cambiar" : label}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-4 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-border bg-card p-1" style={{ scrollbarWidth: "none" }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
            value === o.value
              ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cn("text-xs", value === o.value ? "opacity-70" : "")}>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 disabled:opacity-50 dark:bg-brand-lime dark:text-brand-navy dark:hover:bg-brand-lime-dark",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  tone = "default",
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: "default" | "danger"
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-5 text-sm font-semibold transition-colors disabled:opacity-50",
        tone === "danger"
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border bg-card hover:border-foreground/30",
        className,
      )}
    >
      {children}
    </button>
  )
}
