-- Agregar columna gacetilla a la tabla events
-- La gacetilla es un mini-texto premium que se muestra en el card del evento
-- Contiene: titulo, imagen y texto de noticia

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gacetilla_titulo text,
  ADD COLUMN IF NOT EXISTS gacetilla_imagen text,
  ADD COLUMN IF NOT EXISTS gacetilla_texto text;
