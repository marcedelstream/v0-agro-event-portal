import type React from "react"
import type { Metadata, Viewport } from "next"
import { Figtree } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SplashScreen } from "@/components/splash-screen"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
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
  themeColor: "#0b1620",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className={`${figtree.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SplashScreen>{children}</SplashScreen>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
