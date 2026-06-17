-- Habilitar RLS pero permitir lectura para login
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera pueda verificar credenciales (solo SELECT)
DROP POLICY IF EXISTS "Permitir verificar credenciales" ON admins;
CREATE POLICY "Permitir verificar credenciales" ON admins
  FOR SELECT USING (true);
