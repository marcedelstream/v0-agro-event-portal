import { Header } from "@/components/header"
import { DateCarousel } from "@/components/date-carousel"
import { ContactButton } from "@/components/contact-button"
import { AgroconectaBanner, ProveedoresBanner } from "@/components/promo-banner"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 space-y-4 pb-8">
        {/* Carrusel de fechas */}
        <DateCarousel />

        {/* Banners promocionales */}
        <div className="space-y-3">
          <AgroconectaBanner />
          <ProveedoresBanner />
        </div>

        {/* Boton de contacto con modal */}
        <ContactButton />
      </main>
    </div>
  )
}
