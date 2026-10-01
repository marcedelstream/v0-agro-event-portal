-- Permitir marcar mensajes como respondidos desde el panel de admin.
-- Las tablas tenian SELECT e INSERT publicos pero no UPDATE, por lo que el cambio de estado
-- no tenia efecto (Supabase no devuelve error: simplemente actualiza 0 filas).
-- Mismo criterio que scripts/006_fix_admin_rls_policies.sql (el admin usa localStorage, no Supabase Auth).

DROP POLICY IF EXISTS "Actualizar contactos de eventos" ON event_contact_requests;
CREATE POLICY "Actualizar contactos de eventos"
ON event_contact_requests FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar contactos generales" ON general_contacts;
CREATE POLICY "Actualizar contactos generales"
ON general_contacts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
