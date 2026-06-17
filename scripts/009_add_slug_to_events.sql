-- Agregar columna slug a events
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text;

-- Crear índice único para el slug
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx ON events(slug);

-- Actualizar slugs existentes basados en el título
UPDATE events 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[áàäâ]', 'a', 'gi'),
      '[éèëê]', 'e', 'gi'
    ),
    '[^a-z0-9]+', '-', 'gi'
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Permitir INSERT y UPDATE con slug
DROP POLICY IF EXISTS "Gestion publica de eventos" ON events;
CREATE POLICY "Gestion publica de eventos" ON events FOR ALL USING (true) WITH CHECK (true);
