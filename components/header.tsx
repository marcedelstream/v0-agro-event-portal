"use client"

import Link from "next/link"
import { Sprout, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur supports-[backdrop-filter]:bg-background/80 px-[0] py-2.5">
      <div className="container mx-auto flex h-10 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          
          <span className="font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text leading-7 text-xl">
            Eventos Agro
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1 p-1 rounded-full bg-gradient-to-r from-muted to-muted/50 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 shadow-inner"
          aria-label="Cambiar tema"
        >
          <div
            className={`p-1.5 rounded-full transition-all duration-300 ${theme === "light" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-110 shadow-lg shadow-amber-500/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sun className="h-3.5 w-3.5" />
          </div>
          <div
            className={`p-1.5 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 shadow-lg shadow-indigo-500/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Moon className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>
    </header>
  )
}
