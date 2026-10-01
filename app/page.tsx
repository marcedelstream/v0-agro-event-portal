import { Header } from "@/components/header"
import { DateCarousel } from "@/components/date-carousel"
import { ContactButton } from "@/components/contact-button"
import { EventSearch } from "@/components/event-search"
import { AgroconectaBanner, ProveedoresBanner } from "@/components/promo-banner"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero solo en pantallas grandes, con el estilo del hero de agroconecta.com.py */}
      <section className="relative z-10 hidden bg-brand-navy lg:block">
        {/* Decoracion recortada aparte para que el desplegable del buscador no quede cortado */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -bottom-40 h-96 w-96 rounded-full border-[28px] border-brand-lime" />
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-lime">
            Eventos Agro · Calendario agropecuario del Paraguay
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight text-white text-balance">
            ¿Qué evento del agro estás buscando?
          </h1>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <EventSearch />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-8 lg:max-w-7xl lg:space-y-6 lg:px-8 lg:pb-16">
        {/* Carrusel de fechas (en desktop arma su propio layout de dos columnas) */}
        <DateCarousel />

        {/* Banners promocionales */}
        <div className="grid gap-3 lg:grid-cols-2">
          <AgroconectaBanner />
          <ProveedoresBanner />
        </div>

        {/* Boton de contacto con modal */}
        <ContactButton />
      </main>
    </div>
  )
}
