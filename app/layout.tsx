import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins, DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SplashScreen } from "@/components/splash-screen"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Eventos Agro - El primer calendario agropecuario del Paraguay",
  description: "Descubre todos los eventos del sector agropecuario. Ferias, conferencias, talleres y más.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Eventos Agro - El primer calendario agropecuario del Paraguay",
    description: "Descubre todos los eventos del sector agropecuario. Ferias, conferencias, talleres y más.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos Agro - Calendario de Eventos Agrícolas",
    description: "Descubre todos los eventos del sector agrícola. Ferias, conferencias, talleres y más.",
    images: ["/og-image.png"],
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#22c55e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <body className={`${poppins.variable} ${dmSans.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SplashScreen>{children}</SplashScreen>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
