// Datos de contacto y precios de Eventos Agro usados en todo el sitio.

// WhatsApp de Eventos Agro (auspicios y pagos de eventos destacados).
// Formato internacional sin "+" ni espacios.
export const EVENTOS_AGRO_WHATSAPP = "595981110806"

// WhatsApp al que llegan las consultas de auspicio de los eventos.
// Si queda vacio, el boton "Auspiciar" abre el formulario de contacto en su lugar.
export const SPONSOR_WHATSAPP = EVENTOS_AGRO_WHATSAPP

// Evento destacado: precio y lo que incluye (se muestra al publicar y en el panel)
export const PREMIUM_PRICE_GS = 550000
export const PREMIUM_PRICE_LABEL = `${PREMIUM_PRICE_GS.toLocaleString("es-PY")} Gs`
export const PREMIUM_BENEFITS = [
  "Aparece en \"Eventos destacados\" de la portada",
  "Insignia de destacado y diseño resaltado en la agenda",
  "Gacetilla de prensa en la página del evento",
  "Banner propio y links importantes (inscripción, web, redes)",
  "Galería de fotos del evento una vez realizado",
]

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
