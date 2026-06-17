-- Agregar soporte para eventos de múltiples días
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date date;

-- Crear tabla para recordatorios de eventos
CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  email text NOT NULL,
  confirmed boolean DEFAULT false,
  confirmation_token text,
  created_at timestamp with time zone DEFAULT now()
);

-- Políticas RLS para recordatorios
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede solicitar recordatorio" ON event_reminders;
CREATE POLICY "Cualquiera puede solicitar recordatorio" ON event_reminders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leer recordatorios propios" ON event_reminders;
CREATE POLICY "Leer recordatorios propios" ON event_reminders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Actualizar confirmacion" ON event_reminders;
CREATE POLICY "Actualizar confirmacion" ON event_reminders FOR UPDATE USING (true);

-- Agregar end_date a event_submissions también
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS end_date date;
