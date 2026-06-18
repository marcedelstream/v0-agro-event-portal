-- Crear tabla de organizaciones (cada una puede cargar varios eventos bajo su nombre)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Lectura publica (para mostrar la fila de organizaciones en el home y su pagina publica)
CREATE POLICY "Lectura publica de organizaciones"
ON organizations FOR SELECT
TO public
USING (true);

-- Gestion publica (el panel propio de cada organizacion usa localStorage para la sesion,
-- igual que el admin general, no Supabase Auth - ver scripts/006_fix_admin_rls_policies.sql)
CREATE POLICY "Gestion publica de organizaciones"
ON organizations FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Vincular eventos a una organizacion (nullable: los eventos sin organizacion siguen funcionando igual)
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
