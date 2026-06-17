-- Agregar campos para opciones de contacto y banner interno
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_contact_form boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS important_links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS internal_banner_url text;

-- Comentarios descriptivos
COMMENT ON COLUMN events.allow_contact_form IS 'Si es true, muestra formulario de contacto. Si es false, muestra email/telefono directo';
COMMENT ON COLUMN events.important_links IS 'Array de objetos {label, url} para links importantes';
COMMENT ON COLUMN events.internal_banner_url IS 'URL del banner interno personalizado del evento';
