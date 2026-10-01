"use client"

import Link from "next/link"
import { Sun, Moon, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center">
          <img
            src={theme === "dark" ? "/logo.png" : "/logo-claro.png"}
            alt="Eventos Agro"
            className="h-9 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/proveedores"
            className="hidden sm:inline-flex h-10 items-center px-4 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Proveedores
          </Link>
          <Link
            href="/publicar-evento"
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-navy/90 dark:bg-brand-lime dark:text-brand-navy dark:hover:bg-brand-lime-dark"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Publicar</span>
            <span className="hidden sm:inline">Publicar evento</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:text-foreground"
            aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
