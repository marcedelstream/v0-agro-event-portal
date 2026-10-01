import Link from "next/link"
import { ArrowRight, Gamepad2, Newspaper, Store } from "lucide-react"

export function PromoBanner() {
  return (
    <Link
      href="https://agrojuego.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-lg hover:shadow-black/5 group"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
        <Gamepad2 className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold flex items-center gap-2">
          Descubrí agrojuego.com
          <span className="eyebrow rounded-full bg-brand-lime/15 px-2 py-0.5">Nuevo</span>
        </p>
        <p className="text-sm text-muted-foreground">Desafiá tus conocimientos y ganá premios reales</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

// Banner oscuro con el aro lima, igual que el hero de agroconecta.com.py
export function AgroconectaBanner() {
  return (
    <Link
      href="https://www.instagram.com/agroconectapy"
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-brand-navy p-5 text-white group dark:border dark:border-border"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-16 h-40 w-40 rounded-full border-[14px] border-brand-lime/80"
      />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
        <Newspaper className="h-5 w-5" />
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-lime">Agroconecta Medios</p>
        <p className="font-bold text-lg leading-tight">Conocé Agroconecta Medios</p>
        <p className="text-sm text-white/70">El medio digital 100% streaming del agro</p>
      </div>
      <ArrowRight className="relative h-5 w-5 text-brand-lime transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function ProveedoresBanner() {
  return (
    <Link
      href="/proveedores"
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-lg hover:shadow-black/5 group"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-navy">
        <Store className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold">Directorio de Proveedores</p>
        <p className="text-sm text-muted-foreground">Audiovisual, catering, stands y más para tu evento</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
