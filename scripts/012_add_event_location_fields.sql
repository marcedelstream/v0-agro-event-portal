-- Agregar campos de departamento, ciudad y link de Google Maps
ALTER TABLE events ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS maps_url text;

COMMENT ON COLUMN events.department IS 'Departamento de Paraguay donde se realiza el evento';
COMMENT ON COLUMN events.city IS 'Ciudad donde se realiza el evento';
COMMENT ON COLUMN events.maps_url IS 'URL de Google Maps con la ubicacion exacta del evento';
