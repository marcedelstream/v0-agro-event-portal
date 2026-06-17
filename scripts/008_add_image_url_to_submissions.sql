-- Agregar columna image_url a event_submissions si no existe
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS image_url TEXT;
