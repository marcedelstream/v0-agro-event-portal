"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Send, CheckCircle, Loader2, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function ContactButton() {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("general_contacts").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message,
      })

      if (error) throw error
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      alert("Error al enviar el mensaje. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    if (isSubmitted) {
      setIsSubmitted(false)
      setFormData({ name: "", email: "", phone: "", message: "" })
    }
  }

  return (
    <>
      {/* Botón de contacto */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 hover:border-primary hover:bg-primary/15 transition-all duration-200 group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:scale-110 transition-transform">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="font-bold text-foreground">Contactanos</p>
          <p className="text-xs text-muted-foreground">Estamos para ayudarte</p>
        </div>
      </button>

      {/* Modal del formulario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={cn(
              "w-full max-w-md rounded-2xl border-2 border-border bg-card p-6 shadow-2xl",
              "animate-in fade-in zoom-in-95 duration-200",
            )}
          >
            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Mensaje enviado</h3>
                <p className="text-muted-foreground text-sm mb-6">Te responderemos a la brevedad posible.</p>
                <Button onClick={closeModal} className="rounded-xl">
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <Mail className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Contactanos</h3>
                      <p className="text-xs text-muted-foreground">Estamos para ayudarte</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl bg-background/50"
                  />
                  <Input
                    type="email"
                    placeholder="Tu correo electronico"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="rounded-xl bg-background/50"
                  />
                  <Input
                    type="tel"
                    placeholder="Tu telefono (opcional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl bg-background/50"
                  />
                  <Textarea
                    placeholder="Tu mensaje o consulta..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="rounded-xl bg-background/50 resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
