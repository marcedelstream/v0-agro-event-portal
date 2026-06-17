import { Sprout } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sprout className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl text-balance">Calendario de Eventos</h1>
          <p className="max-w-2xl text-muted-foreground text-base md:text-lg text-pretty">
            Descubre ferias, conferencias, talleres y exposiciones del sector agrícola. Acceso gratuito a toda la
            información.
          </p>
        </div>
      </div>
    </section>
  )
}
