-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  image_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  speakers TEXT[],
  is_premium BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de eventos (formulario público)
CREATE TABLE IF NOT EXISTS event_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  category TEXT NOT NULL,
  location TEXT,
  description TEXT,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de contacto de eventos individuales
CREATE TABLE IF NOT EXISTS event_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL, -- info, auspicio, stand
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, responded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de proveedores
CREATE TABLE IF NOT EXISTS provider_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contactos generales
CREATE TABLE IF NOT EXISTS general_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, responded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lectura pública de eventos aprobados
CREATE POLICY "Eventos aprobados son públicos" ON events
  FOR SELECT USING (is_approved = true);

-- Políticas RLS para lectura pública de proveedores aprobados
CREATE POLICY "Proveedores aprobados son públicos" ON providers
  FOR SELECT USING (is_approved = true);

-- Políticas RLS para lectura pública de banners activos
CREATE POLICY "Banners activos son públicos" ON banners
  FOR SELECT USING (is_active = true);

-- Políticas RLS para inserción pública (formularios)
CREATE POLICY "Cualquiera puede enviar solicitud de evento" ON event_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Cualquiera puede enviar contacto de evento" ON event_contact_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Cualquiera puede enviar solicitud de proveedor" ON provider_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Cualquiera puede enviar contacto general" ON general_contacts
  FOR INSERT WITH CHECK (true);

-- Políticas para admins autenticados (todas las operaciones)
CREATE POLICY "Admins pueden ver todos los eventos" ON events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden ver todas las solicitudes de eventos" ON event_submissions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden ver todos los contactos de eventos" ON event_contact_requests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden ver todos los proveedores" ON providers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden ver todas las solicitudes de proveedores" ON provider_submissions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden gestionar banners" ON banners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden ver todos los contactos" ON general_contacts
  FOR ALL USING (auth.role() = 'authenticated');
