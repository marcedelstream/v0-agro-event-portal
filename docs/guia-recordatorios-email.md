# Guia para Personalizar Correos de Recordatorio de Eventos

Esta guia te ayudara a configurar los correos automaticos de recordatorio para los eventos en Eventos Agro.

## Tabla de Recordatorios

Los recordatorios se almacenan en la tabla `event_reminders` con la siguiente estructura:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | uuid | Identificador unico |
| event_id | uuid | ID del evento relacionado |
| email | text | Correo del usuario |
| is_sent | boolean | Si ya se envio el recordatorio |
| created_at | timestamp | Fecha de registro |

---

## Opcion 1: Email Templates de Supabase (Basico)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** > **Email Templates**
3. Personaliza los templates existentes con tu marca

> Nota: Esta opcion es limitada para recordatorios personalizados, ya que los templates de Supabase son principalmente para autenticacion.

---

## Opcion 2: Edge Function + Resend/SendGrid (Recomendado)

### Paso 1: Crear una Edge Function

```bash
supabase functions new send-event-reminder
```

### Paso 2: Codigo de la Edge Function

Crea el archivo `supabase/functions/send-event-reminder/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Obtener recordatorios pendientes de eventos proximos (ej: 1 dia antes)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  const { data: reminders } = await supabase
    .from("event_reminders")
    .select(`
      *,
      events (
        title,
        date,
        time,
        location,
        slug
      )
    `)
    .eq("is_sent", false)
    .eq("events.date", tomorrowStr)

  for (const reminder of reminders || []) {
    // Enviar email con Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Eventos Agro <recordatorios@tudominio.com>",
        to: reminder.email,
        subject: `Recordatorio: ${reminder.events.title} es manana!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Eventos Agro</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">¡Tu evento es manana!</h2>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #22c55e; margin-top: 0;">${reminder.events.title}</h3>
                <p><strong>Fecha:</strong> ${new Date(reminder.events.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                <p><strong>Hora:</strong> ${reminder.events.time}</p>
                <p><strong>Ubicacion:</strong> ${reminder.events.location}</p>
              </div>
              <a href="https://eventosagro.com/evento/${reminder.events.slug}" 
                 style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Ver detalles del evento
              </a>
            </div>
            <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
              <p>Eventos Agro - Tu portal de eventos agricolas</p>
            </div>
          </div>
        `,
      }),
    })

    // Marcar como enviado
    await supabase
      .from("event_reminders")
      .update({ is_sent: true })
      .eq("id", reminder.id)
  }

  return new Response(JSON.stringify({ sent: reminders?.length || 0 }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### Paso 3: Configurar Variables de Entorno

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
```

### Paso 4: Desplegar la Funcion

```bash
supabase functions deploy send-event-reminder
```

### Paso 5: Programar Ejecucion Diaria

Usa un cron job externo (como cron-job.org o Vercel Cron) para llamar a tu Edge Function diariamente:

```
URL: https://tu-proyecto.supabase.co/functions/v1/send-event-reminder
Metodo: POST
Headers: Authorization: Bearer tu_anon_key
Frecuencia: Diariamente a las 8:00 AM
```

---

## Opcion 3: Trigger de Base de Datos + pg_cron

Si tienes acceso a pg_cron en tu plan de Supabase:

```sql
-- Habilitar pg_cron (solo en planes Pro+)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear funcion para enviar recordatorios
CREATE OR REPLACE FUNCTION send_daily_reminders()
RETURNS void AS $$
BEGIN
  -- Llamar a tu Edge Function
  PERFORM net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/send-event-reminder',
    headers := '{"Authorization": "Bearer tu_service_role_key"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Programar ejecucion diaria a las 8:00 AM
SELECT cron.schedule('send-reminders', '0 8 * * *', 'SELECT send_daily_reminders()');
```

---

## Proveedores de Email Recomendados

| Proveedor | Plan Gratuito | Precio |
|-----------|---------------|--------|
| [Resend](https://resend.com) | 3,000 emails/mes | Desde $20/mes |
| [SendGrid](https://sendgrid.com) | 100 emails/dia | Desde $15/mes |
| [Mailgun](https://mailgun.com) | 5,000 emails/mes (3 meses) | Desde $35/mes |
| [Amazon SES](https://aws.amazon.com/ses/) | 62,000 emails/mes (con EC2) | $0.10/1000 emails |

---

## Soporte

Si necesitas ayuda configurando los recordatorios, contacta al equipo de desarrollo.
