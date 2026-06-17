import Link from "next/link"
import { Gamepad2, Store, Sparkles } from "lucide-react"

export function PromoBanner() {
  return (
    <Link
      href="https://agrojuego.com"
      target="_blank"
      rel="noopener noreferrer"
      className="relative overflow-hidden flex items-center gap-3 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50 group"
    >
      {/* Decorative sparkles */}
      <Sparkles className="absolute top-2 right-2 h-4 w-4 text-accent/50 animate-pulse" />
      <Sparkles className="absolute bottom-2 right-8 h-3 w-3 text-primary/40 animate-pulse delay-300" />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/30">
        <Gamepad2 className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground flex items-center gap-2">
          Descubre agrojuego.com
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-medium">
            Nuevo
          </span>
        </p>
        <p className="text-sm text-muted-foreground">Desafia tus conocimientos y gana premios reales</p>
      </div>
    </Link>
  )
}

export function AgroconectaBanner() {
  return (
    <Link
      href="https://www.instagram.com/agroconectapy"
      target="_blank"
      rel="noopener noreferrer"
      className="relative overflow-hidden flex items-center gap-3 rounded-2xl border-2 border-accent/30 bg-gradient-to-r from-accent/20 via-accent/10 to-secondary/10 p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/20 hover:border-accent/50 group"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/60 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-accent/30">
        <svg
          className="h-6 w-6 text-accent-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground">Conoce Agroconecta Medios</p>
        <p className="text-sm text-muted-foreground">El medio digital 100% streaming del agro</p>
      </div>
    </Link>
  )
}

export function ProveedoresBanner() {
  return (
    <Link
      href="/proveedores"
      className="relative overflow-hidden flex items-center gap-3 rounded-2xl border-2 border-blue-400/40 bg-gradient-to-r from-blue-500/25 via-blue-400/15 to-cyan-400/20 p-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 hover:border-blue-400/60 group"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-blue-500/40">
        <Store className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground">Directorio de Proveedores</p>
        <p className="text-sm text-blue-300">Audiovisual, catering, stands y mas para tu evento</p>
      </div>
    </Link>
  )
}
