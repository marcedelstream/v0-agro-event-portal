-- Crear tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Insertar admin con credenciales solicitadas
-- Contraseña: Diamela1.
INSERT INTO admins (email, password_hash, name)
VALUES ('mesolucioness@gmail.com', 'Diamela1.', 'Administrador')
ON CONFLICT (email) DO UPDATE SET password_hash = 'Diamela1.';
