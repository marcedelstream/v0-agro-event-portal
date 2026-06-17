-- Eliminar admin anterior y crear nuevo con credenciales correctas
DELETE FROM admins WHERE email = 'admin@eventosagro.com';

-- Insertar nuevo admin con mesolucioness@gmail.com y contraseña Diamela1.
INSERT INTO admins (email, password_hash, name)
VALUES ('mesolucioness@gmail.com', 'Diamela1.', 'Administrador')
ON CONFLICT (email) DO UPDATE SET password_hash = 'Diamela1.', name = 'Administrador';
