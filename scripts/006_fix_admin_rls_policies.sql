-- Actualizar políticas RLS para permitir lectura pública de solicitudes
-- (necesario porque el admin usa localStorage, no Supabase Auth)

-- Event submissions - permitir lectura pública
DROP POLICY IF EXISTS "Admins pueden ver todas las solicitudes de eventos" ON event_submissions;
CREATE POLICY "Lectura publica de solicitudes de eventos"
ON event_submissions FOR SELECT
TO public
USING (true);

-- Provider submissions - permitir lectura pública
DROP POLICY IF EXISTS "Admins pueden ver todas las solicitudes de proveedores" ON provider_submissions;
CREATE POLICY "Lectura publica de solicitudes de proveedores"
ON provider_submissions FOR SELECT
TO public
USING (true);

-- Event contact requests - permitir lectura pública
DROP POLICY IF EXISTS "Admins pueden ver todos los contactos de eventos" ON event_contact_requests;
CREATE POLICY "Lectura publica de contactos de eventos"
ON event_contact_requests FOR SELECT
TO public
USING (true);

-- General contacts - permitir lectura pública
DROP POLICY IF EXISTS "Admins pueden ver todos los contactos" ON general_contacts;
CREATE POLICY "Lectura publica de contactos generales"
ON general_contacts FOR SELECT
TO public
USING (true);

-- Events - permitir INSERT y UPDATE público (para el admin)
DROP POLICY IF EXISTS "Admins pueden ver todos los eventos" ON events;
CREATE POLICY "Gestion publica de eventos"
ON events FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Providers - permitir INSERT y UPDATE público (para el admin)
DROP POLICY IF EXISTS "Admins pueden ver todos los proveedores" ON providers;
CREATE POLICY "Gestion publica de proveedores"
ON providers FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Banners - permitir gestión pública
DROP POLICY IF EXISTS "Admins pueden gestionar banners" ON banners;
CREATE POLICY "Gestion publica de banners"
ON banners FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Event submissions - permitir UPDATE público (para aprobar/rechazar)
CREATE POLICY "Actualizar solicitudes de eventos"
ON event_submissions FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Provider submissions - permitir UPDATE público (para aprobar/rechazar)
CREATE POLICY "Actualizar solicitudes de proveedores"
ON provider_submissions FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
